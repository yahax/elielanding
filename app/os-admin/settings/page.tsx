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

function toRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function mergeModelWithMetadata(model: OsSettingsModel, metadata: Record<string, unknown> | null): OsSettingsModel {
  if (!metadata) return model;
  const next: OsSettingsModel = { ...model };

  if (Array.isArray(metadata.whatsappTemplates)) {
    const templates = metadata.whatsappTemplates as Array<Record<string, unknown>>;
    next.whatsappTemplates = next.whatsappTemplates.map((template) => {
      const candidate = templates.find((item) => item?.id === template.id);
      if (!candidate) return template;
      return {
        ...template,
        active: candidate.active === true,
        message: typeof candidate.message === "string" && candidate.message.trim().length > 0 ? candidate.message : template.message,
      };
    });
  }

  if (Array.isArray(metadata.teamRoles)) {
    const roles = metadata.teamRoles as Array<Record<string, unknown>>;
    next.teamRoles = next.teamRoles.map((role) => {
      const candidate = roles.find((item) => item?.id === role.id);
      if (!candidate) return role;
      return {
        ...role,
        canViewRevenue: candidate.canViewRevenue === true,
        canEditSettings: candidate.canEditSettings === true,
        canManageTeam: candidate.canManageTeam === true,
      };
    });
  }

  const opsRules = toRecord(metadata.operationsRules);
  if (opsRules) {
    if (typeof opsRules.highValueThreshold === "number") next.operations.highValueThreshold = Math.max(100, Math.round(opsRules.highValueThreshold));
    if (typeof opsRules.vipCustomerThreshold === "number") next.operations.vipCustomerThreshold = Math.max(300, Math.round(opsRules.vipCustomerThreshold));
    if (typeof opsRules.priorityWeightAge === "number") next.operations.priorityWeightAge = Math.max(1, Math.round(opsRules.priorityWeightAge));
    if (typeof opsRules.priorityWeightValue === "number") next.operations.priorityWeightValue = Math.max(1, Math.round(opsRules.priorityWeightValue));
    if (typeof opsRules.riskWeightDelay === "number") next.operations.riskWeightDelay = Math.max(1, Math.round(opsRules.riskWeightDelay));
    if (typeof opsRules.riskWeightCallbacks === "number") next.operations.riskWeightCallbacks = Math.max(1, Math.round(opsRules.riskWeightCallbacks));
    if (typeof opsRules.autoFlagHighRisk === "boolean") next.operations.autoFlagHighRisk = opsRules.autoFlagHighRisk;
    if (typeof opsRules.autoFlagHighValue === "boolean") next.operations.autoFlagHighValue = opsRules.autoFlagHighValue;
    if (typeof opsRules.slaTargetMinutes === "number") next.operations.slaTargetMinutes = Math.max(10, Math.round(opsRules.slaTargetMinutes));
  }

  const warRoom = toRecord(metadata.warRoomSettings);
  if (warRoom) {
    if (typeof warRoom.enabled === "boolean") next.warRoom.enabled = warRoom.enabled;
    if (warRoom.preference === "auto" || warRoom.preference === "on" || warRoom.preference === "off") next.warRoom.preference = warRoom.preference;
    if (warRoom.mobileDensity === "comfortable" || warRoom.mobileDensity === "compact") next.warRoom.mobileDensity = warRoom.mobileDensity;
    if (typeof warRoom.urgencyThreshold === "number") next.warRoom.urgencyThreshold = Math.max(1, Math.round(warRoom.urgencyThreshold));
    if (typeof warRoom.slaThresholdMinutes === "number") next.warRoom.slaThresholdMinutes = Math.max(15, Math.round(warRoom.slaThresholdMinutes));
  }

  const dashboard = toRecord(metadata.dashboardPreferences);
  if (dashboard) {
    if (dashboard.defaultPeriodDays === 7 || dashboard.defaultPeriodDays === 30) next.dashboard.defaultPeriodDays = dashboard.defaultPeriodDays;
    if (dashboard.operatorDensity === "comfortable" || dashboard.operatorDensity === "compact") next.dashboard.operatorDensity = dashboard.operatorDensity;
    if (Array.isArray(dashboard.widgets)) {
      next.dashboard.widgets = dashboard.widgets.map((item) => String(item).trim()).filter((item) => item.length > 0);
    }
    if (Array.isArray(dashboard.sectionOrder)) {
      next.dashboard.sectionOrder = dashboard.sectionOrder.map((item) => String(item).trim()).filter((item) => item.length > 0);
    }
  }

  return next;
}

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
  const [baselineSignature, setBaselineSignature] = useState<string>("");

  const WAR_ROOM_ADVANCED_ENABLED = false;
  const OPERATIONS_ADVANCED_ENABLED = false;
  const TEMPLATES_RUNTIME_ENABLED = false;
  const TEAM_ACCESS_RUNTIME_ENABLED = false;
  const DASHBOARD_DENSITY_RUNTIME_ENABLED = false;

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
        next.refreshIntervalSec = Math.min(300, Math.max(30, prefs.notifications.refreshIntervalSec));
        next.warRoom.slaThresholdMinutes = prefs.notifications.slaWarningMinutes;
        const metadata = toRecord(prefs.metadata);
        const mergedWithMetadata = mergeModelWithMetadata(next, metadata);
        setModel(mergedWithMetadata);
        setBaselineSignature(JSON.stringify(mergedWithMetadata));
      } else {
        setModel(next);
        setBaselineSignature(JSON.stringify(next));
      }
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
          warRoomSettings: model.warRoom,
          dashboardPreferences: model.dashboard,
        },
      });
      updateLiveSettings(mapModelToLiveSettings(model));
      persistOsSettings(model);
      setBaselineSignature(JSON.stringify(model));
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

  const modelSignature = useMemo(() => JSON.stringify(model), [model]);
  const hasUnsaved = useMemo(() => !loading && modelSignature !== baselineSignature, [baselineSignature, loading, modelSignature]);

  return (
    <div className="os-page animate-fade-in os-settings-page">
      <OsToaster />

      <PageHeader
        title="Settings System"
        subtitle="Centre de contrôle opérations, notifications, règles métier et préférences dashboard."
        actions={
          <div className="os-settings-head-actions">
            <button type="button" className="btn-ghost btn-sm btn-icon" onClick={load} aria-label="Rafraîchir">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={onSave} disabled={saving || !configured || !hasUnsaved}>
              <Save size={14} />
              {saving ? "Sauvegarde..." : "Enregistrer"}
            </button>
          </div>
        }
      />

      {!configured ? (
        <section className="luxury-card os-settings-alert">
          <div className="os-settings-alert-inner">
            <AlertTriangle size={16} className="os-settings-alert-icon" />
            <div>
              <div className="os-settings-alert-title">Configuration backend incomplète</div>
              <p className="os-settings-alert-copy">
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
        <section className="os-settings-grid" style={{ gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          <SettingsSection title="Shop Settings" description="Identité boutique et paramètres globaux." icon={Store} badgeLabel="Branché" badgeTone="success">
            <div className="os-settings-two-col">
              <SettingsInputRow label="Nom boutique" value={model.shop.shop_name} onChange={(value) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, shop_name: value } }))} />
              <SettingsInputRow label="Email support" type="email" value={model.shop.support_email} onChange={(value) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, support_email: value } }))} />
              <SettingsInputRow label="WhatsApp" value={model.shop.whatsapp} onChange={(value) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, whatsapp: value } }))} />
              <SettingsInputRow label="Devise" value={model.shop.currency} onChange={(value) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, currency: value } }))} />
              <SettingsInputRow label="Timezone" value={model.shop.timezone} onChange={(value) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, timezone: value } }))} />
              <SettingsInputRow label="Heures équipe" value={model.shop.teamHours} onChange={(value) => setModel((prev) => ({ ...prev, shop: { ...prev.shop, teamHours: value } }))} />
            </div>
            <div className="os-settings-stack os-settings-block">
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

          <SettingsSection title="Notifications Settings" description="Toasts, sons, catégories et fréquence live." icon={Bell} badgeLabel="Branché" badgeTone="success">
            <div className="os-settings-stack">
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

            <div className="os-settings-block">
              <SettingsInputRow
                label="Refresh polling"
                type="number"
                min={30}
                max={300}
                value={model.refreshIntervalSec}
                suffix="sec"
                onChange={(value) => setModel((prev) => ({ ...prev, refreshIntervalSec: Math.min(300, Math.max(30, Number(value) || 30)) }))}
              />
            </div>

            <div className="os-settings-two-col os-settings-block">
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

          <SettingsSection title="War Room Settings" description="Densité mobile, seuil urgence et SLA." icon={Gauge} badgeLabel="Partiel" badgeTone="warning">
            <div className="os-settings-stack">
              <SettingsToggleRow
                label="War Room activé"
                description="Mode intensif global. Pilotage runtime direct à venir."
                checked={model.warRoom.enabled}
                onChange={(checked) => setModel((prev) => ({ ...prev, warRoom: { ...prev.warRoom, enabled: checked } }))}
                disabled={!WAR_ROOM_ADVANCED_ENABLED}
              />
            </div>
            <div className="os-settings-two-col os-settings-block">
              <label className="os-settings-input-row">
                <span className="os-settings-input-label">
                  Préférence mode
                </span>
                <select
                  className="filter-select os-settings-select"
                  value={model.warRoom.preference}
                  onChange={(event) => setModel((prev) => ({ ...prev, warRoom: { ...prev.warRoom, preference: event.target.value as OsSettingsModel["warRoom"]["preference"] } }))}
                >
                  <option value="auto">Auto</option>
                  <option value="on">Forcer ON</option>
                  <option value="off">Forcer OFF</option>
                </select>
              </label>
              <label className="os-settings-input-row">
                <span className="os-settings-input-label">
                  Densité mobile
                </span>
                <select
                  className="filter-select os-settings-select"
                  value={model.warRoom.mobileDensity}
                  onChange={(event) => setModel((prev) => ({ ...prev, warRoom: { ...prev.warRoom, mobileDensity: event.target.value as OsSettingsModel["warRoom"]["mobileDensity"] } }))}
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
                disabled={!WAR_ROOM_ADVANCED_ENABLED}
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

          <SettingsSection title="Operations Rules" description="Poids de scoring, flags automatiques et SLA cible." icon={SlidersHorizontal} badgeLabel="Partiel" badgeTone="warning">
            <div className="os-settings-two-col">
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
                disabled={!OPERATIONS_ADVANCED_ENABLED}
              />
              <SettingsInputRow
                label="Poids priorité âge"
                type="number"
                value={model.operations.priorityWeightAge}
                onChange={(value) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, priorityWeightAge: Math.max(1, Number(value) || 1) } }))}
                disabled={!OPERATIONS_ADVANCED_ENABLED}
              />
              <SettingsInputRow
                label="Poids priorité valeur"
                type="number"
                value={model.operations.priorityWeightValue}
                onChange={(value) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, priorityWeightValue: Math.max(1, Number(value) || 1) } }))}
                disabled={!OPERATIONS_ADVANCED_ENABLED}
              />
              <SettingsInputRow
                label="Poids risque délai"
                type="number"
                value={model.operations.riskWeightDelay}
                onChange={(value) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, riskWeightDelay: Math.max(1, Number(value) || 1) } }))}
                disabled={!OPERATIONS_ADVANCED_ENABLED}
              />
              <SettingsInputRow
                label="Poids risque callbacks"
                type="number"
                value={model.operations.riskWeightCallbacks}
                onChange={(value) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, riskWeightCallbacks: Math.max(1, Number(value) || 1) } }))}
                disabled={!OPERATIONS_ADVANCED_ENABLED}
              />
              <SettingsInputRow
                label="SLA target"
                type="number"
                suffix="min"
                value={model.operations.slaTargetMinutes}
                onChange={(value) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, slaTargetMinutes: Math.max(10, Number(value) || 10) } }))}
              />
            </div>

            <div className="os-settings-stack os-settings-block">
              <SettingsToggleRow
                label="Auto flag high risk"
                description="Marquage auto high-risk runtime à venir."
                checked={model.operations.autoFlagHighRisk}
                onChange={(checked) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, autoFlagHighRisk: checked } }))}
                disabled={!OPERATIONS_ADVANCED_ENABLED}
              />
              <SettingsToggleRow
                label="Auto flag high value"
                description="Marquage auto high-value runtime à venir."
                checked={model.operations.autoFlagHighValue}
                onChange={(checked) => setModel((prev) => ({ ...prev, operations: { ...prev.operations, autoFlagHighValue: checked } }))}
                disabled={!OPERATIONS_ADVANCED_ENABLED}
              />
            </div>
          </SettingsSection>

          <SettingsSection title="WhatsApp Templates" description="Messages confirmation, callback, relance, livraison et offre." icon={MessageSquareMore} badgeLabel="À venir" badgeTone="warning">
            <div className="os-settings-stack">
              {model.whatsappTemplates.map((template) => (
                <TemplateEditorCard
                  key={template.id}
                  template={template}
                  onToggleActive={(active) => updateTemplate(template.id, (current) => ({ ...current, active }))}
                  onChangeMessage={(message) => updateTemplate(template.id, (current) => ({ ...current, message }))}
                  disabled={!TEMPLATES_RUNTIME_ENABLED}
                />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Team & Access" description="Préparation des rôles, visibilité et permissions." icon={Users} badgeLabel="À venir" badgeTone="warning">
            <div className="os-settings-stack">
              {model.teamRoles.map((role) => (
                <article key={role.id} className="luxury-card os-settings-role-card">
                  <div className="os-settings-role-title">{role.label}</div>
                  <div className="os-settings-stack">
                    <SettingsToggleRow
                      label="Voir revenue"
                      description="Accès métriques chiffre d'affaires."
                      checked={role.canViewRevenue}
                      onChange={(checked) => updateRole(role.id, (current) => ({ ...current, canViewRevenue: checked }))}
                      disabled={!TEAM_ACCESS_RUNTIME_ENABLED}
                    />
                    <SettingsToggleRow
                      label="Éditer settings"
                      description="Modifier les règles système."
                      checked={role.canEditSettings}
                      onChange={(checked) => updateRole(role.id, (current) => ({ ...current, canEditSettings: checked }))}
                      disabled={!TEAM_ACCESS_RUNTIME_ENABLED}
                    />
                    <SettingsToggleRow
                      label="Gérer équipe"
                      description="Créer/modifier accès opérateurs."
                      checked={role.canManageTeam}
                      onChange={(checked) => updateRole(role.id, (current) => ({ ...current, canManageTeam: checked }))}
                      disabled={!TEAM_ACCESS_RUNTIME_ENABLED}
                    />
                  </div>
                </article>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Dashboard Preferences" description="Widgets visibles, ordre sections et période par défaut." icon={Shield} badgeLabel="Partiel" badgeTone="warning">
            <div className="os-settings-two-col">
              <label className="os-settings-input-row">
                <span className="os-settings-input-label">
                  Période par défaut
                </span>
                <select
                  className="filter-select os-settings-select"
                  value={model.dashboard.defaultPeriodDays}
                  onChange={(event) => setModel((prev) => ({ ...prev, dashboard: { ...prev.dashboard, defaultPeriodDays: Number(event.target.value) as 7 | 30 } }))}
                >
                  <option value={7}>7 jours</option>
                  <option value={30}>30 jours</option>
                </select>
              </label>
              <label className="os-settings-input-row">
                <span className="os-settings-input-label">
                  Densité opérateur
                </span>
                <select
                  className="filter-select os-settings-select"
                  value={model.dashboard.operatorDensity}
                  onChange={(event) =>
                    setModel((prev) => ({ ...prev, dashboard: { ...prev.dashboard, operatorDensity: event.target.value as OsSettingsModel["dashboard"]["operatorDensity"] } }))
                  }
                  disabled={!DASHBOARD_DENSITY_RUNTIME_ENABLED}
                >
                  <option value="comfortable">Confort</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
            </div>

            <div className="os-settings-stack os-settings-block">
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

      {saving ? (
        <div className="os-settings-sync-status is-saving">Sauvegarde en cours...</div>
      ) : hasUnsaved ? (
        <div className="os-settings-sync-status is-dirty">Modifications non enregistrées</div>
      ) : (
        <div className="os-settings-sync-status is-clean">Configuration synchronisée</div>
      )}
    </div>
  );
}
