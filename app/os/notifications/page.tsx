"use client";

import { NotificationCenter } from "@/components/os/notifications/NotificationCenter";
import { OsToaster } from "@/components/ui/OsToaster";
import { PageHeader } from "@/components/ui/PageHeader";
import { useOsLiveStore } from "@/store/useOsLiveStore";
import { useState } from "react";

export default function NotificationsPage() {
  const settings = useOsLiveStore((state) => state.settings);
  const updateSettings = useOsLiveStore((state) => state.updateSettings);
  const [localInterval, setLocalInterval] = useState<number>(settings.refreshIntervalSec);

  return (
    <div className="os-page" style={{ paddingBottom: 36 }}>
      <OsToaster />
      <PageHeader
        title="Notifications"
        subtitle="Suivi temps réel des alertes commandes, stock et signaux business."
      />

      <NotificationCenter />

      <section className="luxury-card os-surface-card" style={{ borderRadius: 18, padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Préférences notifications
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
            <input
              type="checkbox"
              checked={settings.toastsEnabled}
              onChange={() => updateSettings({ toastsEnabled: !settings.toastsEnabled })}
            />
            Toasts live activés
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
            <input
              type="checkbox"
              checked={settings.soundsEnabled}
              onChange={() => updateSettings({ soundsEnabled: !settings.soundsEnabled })}
            />
            Sons notifications
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 800 }}>Fréquence polling (sec)</span>
            <input
              className="filter-input"
              type="number"
              min={10}
              max={120}
              value={localInterval}
              onChange={(event) => setLocalInterval(Math.max(10, Number(event.target.value)))}
              onBlur={() => updateSettings({ refreshIntervalSec: Math.max(10, localInterval) })}
              style={{ height: 38 }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 800 }}>Seuil SLA (min)</span>
            <input
              className="filter-input"
              type="number"
              min={15}
              max={240}
              value={settings.slaWarningMinutes}
              onChange={(event) => updateSettings({ slaWarningMinutes: Math.max(15, Number(event.target.value)) })}
              style={{ height: 38 }}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
