"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Gauge,
  RefreshCw,
  Save,
  Shield,
  Store,
  Users,
  MessageSquareMore,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchSettings, fetchUserPreferences, saveSettings, saveUserPreferences } from "@/lib/os/api";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useOsLiveStore } from "@/store/useOsLiveStore";
import { OsToaster } from "@/components/ui/OsToaster";
import { DataStateWrapper } from "@/components/ui/DataStateWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsSection } from "@/components/os/settings/SettingsSection";
import { SettingsInputRow } from "@/components/os/settings/SettingsInputRow";
import { SettingsToggleRow } from "@/components/os/settings/SettingsToggleRow";
import { TemplateEditorCard } from "@/components/os/settings/TemplateEditorCard";
import {
  DEFAULT_SHOP_SETTINGS,
  createDefaultOsSettingsModel,
  loadPersistedOsSettings,
  mapModelToLiveSettings,
  mapModelToShopPayload,
  mapShopAndLiveToSettingsModel,
  persistOsSettings,
} from "@/lib/os/settings/helpers";
import type { OsSettingsModel, TeamRolePreset, WhatsAppTemplate } from "@/lib/os/settings/types";

export default function SettingsPage() {
  const isMobile = useIsMobile(1024);
  const liveSettings = useOsLiveStore((state) => state.settings);
  const updateLiveSettings = useOsLiveStore((state) => state.updateSettings);

  const [model, setModel] = useState<OsSettingsModel>(() => createDefaultOsSettingsModel(DEFAULT_SHOP_SETTINGS));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(true);
  const [bootstrapMessage, setBootstrapMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [response, preferencesResponse] = await Promise.all([
        fetchSettings(),
        fetchUserPreferences().catch(() => null),
      ]);
      const persisted = loadPersistedOsSettings() ?? undefined;
      const next = mapShopAndLiveToSettingsModel(response.settings || DEFAULT_SHOP_SETTINGS, liveSettings, persisted);

      if (preferencesResponse?.preferences) {
        const prefs = preferencesResponse.preferences;
        next.warRoom.preference = prefs.warRoomMode;
        next.warRoom.mobileDensity = prefs.mobile.density;
        next.dashboard.defaultPeriodDays = prefs.dashboard.defaultPeriodDays;
        next.dashboard.widgets = prefs.dashboard.widgets;
        next.operations.highValueThreshold = prefs.operations.highValueThreshold;
        next.operations.slaTargetMinutes = prefs.operations.slaTargetMinutes;
        next.notificationPreferences = next.notificationPreferences.map((item) => ({
          ...item,
          enabled: prefs.notifications.categoriesEnabled[item.category],
        }));
        next.toastsEnabled = prefs.notifications.toastsEnabled;
        next.soundsEnabled = prefs.notifications.soundsEnabled;
        next.refreshIntervalSec = prefs.notifications.refreshIntervalSec;
        next.warRoom.slaThresholdMinutes = prefs.notifications.slaWarningMinutes;
      }

      setModel(next);
      setConfigured(response.configured);
      setBootstrapMessage(response.message || "");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur de chargement settings";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [liveSettings]);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveSettings(mapModelToShopPayload(model));
      await saveUserPreferences({
        warRoomMode: model.warRoom.preference,
        notifications: {
          toastsEnabled: model.toastsEnabled,
          soundsEnabled: model.soundsEnabled,
          refreshIntervalSec: model.refreshIntervalSec,
          slaWarningMinutes: model.warRoom.slaThresholdMinutes,
          categoriesEnabled: {
            orders: model.notificationPreferences.find((pref) => pref.category === "orders")?.enabled ?? true,
            stock: model.notificationPreferences.find((pref) => pref.category === "stock")?.enabled ?? true,
            business: model.notificationPreferences.find((pref) => pref.category === "business")?.enabled ?? true,
            operators: model.notificationPreferences.find((pref) => pref.category === "operators")?.enabled ?? true,
            system: model.notificationPreferences.find((pref) => pref.category === "system")?.enabled ?? true,
          },
        },
        dashboard: {
          defaultPeriodDays: model.dashboard.defaultPeriodDays as 7 | 30,
          widgets: model.dashboard.widgets,
          savedViews: [],
        },
        mobile: {
          density: model.warRoom.mobileDensity,
        },
        operations: {
          highValueThreshold: model.operations.highValueThreshold,
          slaTargetMinutes: model.operations.slaTargetMinutes,
        },
        metadata: {
          shop: mapModelToShopPayload(model),
          whatsappTemplates: model.whatsappTemplates,
          teamRoles: model.teamRoles,
          operationsRules: model.operations,
        },
      });
      updateLiveSettings(mapModelToLiveSettings(model));
      persistOsSettings(model);
      toast.success("Settings enregistrés");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  }, [model, updateLiveSettings]);

  const updateTemplate = (id: WhatsAppTemplate["id"], updater: (template: WhatsAppTemplate) => WhatsAppTemplate) => {
    setModel((prev) => ({
      ...prev,
      whatsappTemplates: prev.whatsappTemplates.map((template) => (template.id === id ? updater(template) : template)),
    }));
  };

  const updateRole = (id: TeamRolePreset["id"], updater: (role: TeamRolePreset) => TeamRolePreset) => {
    setModel((prev) => ({
      ...prev,
      teamRoles: prev.teamRoles.map((role) => (role.id === id ? updater(role) : role)),
    }));
  };

  const hasUnsaved = useMemo(() => saving, [saving]);

  return (
    <div className="os-page animate-fade-in" style={{ paddingBottom: 96, gap: 12 }}>
      <OsToaster />

      <PageHeader
        title="Settings System"
        subtitle="Centre de contrôle opérations, notifications, règles métier et préférences dashboard."
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn-ghost btn-sm btn-icon" onClick={load} aria-label="Rafraîchir">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={onSave} disabled={saving || !configured}>
              <Save size={14} />
              {saving ? "Sauvegarde..." : "Enregistrer"}
            </button>
          </div>
        }
      />

      {!configured ? (
        <section className="luxury-card" style={{ padding: 14, borderRadius: 14, border: "1px solid rgba(201, 106, 106, 0.3)", background: "var(--danger-soft)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <AlertTriangle size={16} style={{ color: "var(--danger)" }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--danger)" }}>Configuration backend incomplète</div>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>
                {bootstrapMessage || "La table settings doit être initialisée pour persister les données serveur."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <DataStateWrapper
        loading={loading}
        error={error}
        empty={false}
        emptyTitle=""
        emptyCopy=""
        onRetry={load}
        useSkeleton
      >
        <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <SettingsSection title="Shop Settings" description="Identité boutique et paramètres globaux." icon={Store}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              <SettingsInputRow label="Nom boutique" value={model.shop.shop_name} onChange={(value) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, shop_name: value } }))} />
              <SettingsInputRow label="Email support" type="email" value={model.shop.support_email} onChange={(value) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, support_email: value } }))} />
              <SettingsInputRow label="WhatsApp" value={model.shop.whatsapp} onChange={(value) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, whatsapp: value } }))} />
              <SettingsInputRow label="Devise" value={model.shop.currency} onChange={(value) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, currency: value } }))} />
              <SettingsInputRow label="Timezone" value={model.shop.timezone} onChange={(value) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, timezone: value } }))} />
              <SettingsInputRow label="Heures équipe" value={model.shop.teamHours} onChange={(value) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, teamHours: value } }))} />
            </div>
            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
              <SettingsToggleRow
                label="Auto validation"
                description="Valider automatiquement les commandes selon règles existantes."
                checked={model.shop.auto_validate}
                onChange={(checked) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, auto_validate: checked } }))}
              />
              <SettingsToggleRow
                label="Alerte stock faible"
                description="Activer les alertes critiques d'inventaire."
                checked={model.shop.low_stock_alert}
                onChange={(checked) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, low_stock_alert: checked } }))}
              />
            </div>
          </SettingsSection>

          <SettingsSection title="Notifications Settings" description="Toasts, sons, catégories et fréquence live." icon={Bell}>
            <div style={{ display: "grid", gap: 8 }}>
              <SettingsToggleRow
                label="Toasts live"
                description="Afficher les notifications contextuelles sur action/event."
                checked={model.toastsEnabled}
                onChange={(checked) => setModel((prev) => ({ ...prev, toastsEnabled: checked }))}
              />
              <SettingsToggleRow
                label="Sons notifications"
                description="Jouer un son sur alertes critiques."
                checked={model.soundsEnabled}
                onChange={(checked) => setModel((prev) => ({ ...prev, soundsEnabled: checked }))}
              />
            </div>

            <div style={{ marginTop: 8 }}>
              <SettingsInputRow
                label="Refresh polling"
                type="number"
                min={10}
                max={120}
                value={model.refreshIntervalSec}
                suffix="sec"
                onChange={(value) => setModel((prev) => ({ ...prev, refreshIntervalSec: Math.max(10, Number(value) || 10) }))}
              />
            </div>

            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              {model.notificationPreferences.map((pref) => (
                <SettingsToggleRow
                  key={pref.category}
                  label={pref.category}
                  description="Activer cette catégorie de notifications."
                  checked={pref.enabled}
                  onChange={(checked) =>
                    setModel((prev) => ({
                      ...prev,
                      notificationPreferences: prev.notificationPreferences.map((item) =>
                        item.category === pref.category ? { ...item, enabled: checked } : item
                      ),
                    }))
                  }
                />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="War Room Settings" description="Densité mobile, seuil urgence et SLA." icon={Gauge}>
            <div style={{ display: "grid", gap: 8 }}>
              <SettingsToggleRow
                label="War Room activé"
                description="Mode intensif pour flux opérateurs mobile."
                checked={model.warRoom.enabled}
                onChange={(checked) => setModel((prev) => ({ ...prev, warRoom: { ...prev.warRoom, enabled: checked } }))}
              />
            </div>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Préférence mode
                </span>
                <select
                  className="filter-select"
                  value={model.warRoom.preference}
                  onChange={(event) => setModel((prev) => ({ ...prev, warRoom: { ...prev.warRoom, preference: event.target.value as OsSettingsModel["warRoom"]["preference"] } }))}
                  style={{ height: 42, borderRadius: 12 }}
                >
                  <option value="auto">Auto</option>
                  <option value="on">Forcer ON</option>
                  <option value="off">Forcer OFF</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Densité mobile
                </span>
                <select
                  className="filter-select"
                  value={model.warRoom.mobileDensity}
                  onChange={(event) => setModel((prev) => ({ ...prev, warRoom: { ...prev.warRoom, mobileDensity: event.target.value as OsSettingsModel["warRoom"]["mobileDensity"] } }))}
                  style={{ height: 42, borderRadius: 12 }}
                >
                  <option value="comfortable">Confort</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
              <SettingsInputRow
                label="Seuil urgence"
                type="number"
                value={model.warRoom.urgencyThreshold}
                onChange={(value) => setModel((prev) => ({ ...prev, warRoom: { ...prev.warRoom, urgencyThreshold: Math.max(1, Number(value) || 1) } }))}
              />
              <SettingsInputRow
                label="Seuil SLA"
                type="number"
                suffix="min"
                value={model.warRoom.slaThresholdMinutes}
                onChange={(value) =>
                  setModel((prev) => ({ ...prev, warRoom: { ...prev.warRoom, slaThresholdMinutes: Math.max(15, Number(value) || 15) } }))
                }
              />
            </div>
          </SettingsSection>

          <SettingsSection title="Operations Rules" description="Poids de scoring, flags automatiques et SLA cible." icon={SlidersHorizontal}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              <SettingsInputRow
                label="Seuil haute valeur"
                type="number"
                suffix="MAD"
                value={model.operations.highValueThreshold}
                onChange={(value) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, highValueThreshold: Math.max(100, Number(value) || 100) } }))}
              />
              <SettingsInputRow
                label="Seuil VIP client"
                type="number"
                suffix="MAD"
                value={model.operations.vipCustomerThreshold}
                onChange={(value) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, vipCustomerThreshold: Math.max(300, Number(value) || 300) } }))}
              />
              <SettingsInputRow
                label="Poids priorité âge"
                type="number"
                value={model.operations.priorityWeightAge}
                onChange={(value) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, priorityWeightAge: Math.max(1, Number(value) || 1) } }))}
              />
              <SettingsInputRow
                label="Poids priorité valeur"
                type="number"
                value={model.operations.priorityWeightValue}
                onChange={(value) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, priorityWeightValue: Math.max(1, Number(value) || 1) } }))}
              />
              <SettingsInputRow
                label="Poids risque délai"
                type="number"
                value={model.operations.riskWeightDelay}
                onChange={(value) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, riskWeightDelay: Math.max(1, Number(value) || 1) } }))}
              />
              <SettingsInputRow
                label="Poids risque callbacks"
                type="number"
                value={model.operations.riskWeightCallbacks}
                onChange={(value) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, riskWeightCallbacks: Math.max(1, Number(value) || 1) } }))}
              />
              <SettingsInputRow
                label="SLA target"
                type="number"
                suffix="min"
                value={model.operations.slaTargetMinutes}
                onChange={(value) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, slaTargetMinutes: Math.max(10, Number(value) || 10) } }))}
              />
            </div>

            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
              <SettingsToggleRow
                label="Auto flag high risk"
                description="Marquer automatiquement les commandes à risque élevé."
                checked={model.operations.autoFlagHighRisk}
                onChange={(checked) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, autoFlagHighRisk: checked } }))}
              />
              <SettingsToggleRow
                label="Auto flag high value"
                description="Marquer automatiquement les commandes haute valeur."
                checked={model.operations.autoFlagHighValue}
                onChange={(checked) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, autoFlagHighValue: checked } }))}
              />
            </div>
          </SettingsSection>

          <SettingsSection title="WhatsApp Templates" description="Messages confirmation, callback, relance, livraison et offre." icon={MessageSquareMore}>
            <div style={{ display: "grid", gap: 8 }}>
              {model.whatsappTemplates.map((template) => (
                <TemplateEditorCard
                  key={template.id}
                  template={template}
                  onToggleActive={(active) => updateTemplate(template.id, (current) => ({ ...current, active }))}
                  onChangeMessage={(message) => updateTemplate(template.id, (current) => ({ ...current, message }))}
                />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Team & Access" description="Préparation des rôles, visibilité et permissions." icon={Users}>
            <div style={{ display: "grid", gap: 8 }}>
              {model.teamRoles.map((role) => (
                <article key={role.id} className="luxury-card" style={{ padding: 12, borderRadius: 14 }}>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{role.label}</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <SettingsToggleRow
                      label="Voir revenue"
                      description="Accès métriques chiffre d'affaires."
                      checked={role.canViewRevenue}
                      onChange={(checked) => updateRole(role.id, (current) => ({ ...current, canViewRevenue: checked }))}
                    />
                    <SettingsToggleRow
                      label="Éditer settings"
                      description="Modifier les règles système."
                      checked={role.canEditSettings}
                      onChange={(checked) => updateRole(role.id, (current) => ({ ...current, canEditSettings: checked }))}
                    />
                    <SettingsToggleRow
                      label="Gérer équipe"
                      description="Créer/modifier accès opérateurs."
                      checked={role.canManageTeam}
                      onChange={(checked) => updateRole(role.id, (current) => ({ ...current, canManageTeam: checked }))}
                    />
                  </div>
                </article>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Dashboard Preferences" description="Widgets visibles, ordre sections et période par défaut." icon={Shield}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Période par défaut
                </span>
                <select
                  className="filter-select"
                  value={model.dashboard.defaultPeriodDays}
                  onChange={(event) => setModel((prev) => ({ ...prev, dashboard: { ...prev.dashboard, defaultPeriodDays: Number(event.target.value) as 7 | 30 } }))}
                  style={{ height: 42, borderRadius: 12 }}
                >
                  <option value={7}>7 jours</option>
                  <option value={30}>30 jours</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Densité opérateur
                </span>
                <select
                  className="filter-select"
                  value={model.dashboard.operatorDensity}
                  onChange={(event) =>
                    setModel((prev) => ({ ...prev, dashboard: { ...prev.dashboard, operatorDensity: event.target.value as OsSettingsModel["dashboard"]["operatorDensity"] } }))
                  }
                  style={{ height: 42, borderRadius: 12 }}
                >
                  <option value="comfortable">Confort</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {[
                { id: "kpi", label: "Widget KPI" },
                { id: "alerts", label: "Widget Alertes" },
                { id: "urgent_queue", label: "Widget Urgent Queue" },
                { id: "stock_health", label: "Widget Stock Health" },
                { id: "live_feed", label: "Widget Live Feed" },
              ].map((widget) => (
                <SettingsToggleRow
                  key={widget.id}
                  label={widget.label}
                  description="Afficher ce widget dans le dashboard principal."
                  checked={model.dashboard.widgets.includes(widget.id)}
                  onChange={(checked) =>
                    setModel((prev) => ({
                      ...prev,
                      dashboard: {
                        ...prev.dashboard,
                        widgets: checked
                          ? [...new Set([...prev.dashboard.widgets, widget.id])]
                          : prev.dashboard.widgets.filter((item) => item !== widget.id),
                      },
                    }))
                  }
                />
              ))}
            </div>
          </SettingsSection>
        </section>
      </DataStateWrapper>

      {hasUnsaved ? (
        <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700, textAlign: "right" }}>Sauvegarde en cours...</div>
      ) : null}
    </div>
  );
}
