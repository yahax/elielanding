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
    <div className="os-page os-notifications-page">
      <OsToaster />
      <PageHeader
        title="Notifications"
        subtitle="Suivi temps réel des alertes commandes, stock et signaux business."
      />

      <NotificationCenter />

      <section className="luxury-card os-surface-card os-notifications-preferences">
        <div className="os-notifications-preferences-title">
          Préférences notifications
        </div>

        <div className="os-notifications-preferences-grid">
          <label className="os-notifications-checkbox-row">
            <input
              type="checkbox"
              checked={settings.toastsEnabled}
              onChange={() => updateSettings({ toastsEnabled: !settings.toastsEnabled })}
            />
            Toasts live activés
          </label>

          <label className="os-notifications-checkbox-row">
            <input
              type="checkbox"
              checked={settings.soundsEnabled}
              onChange={() => updateSettings({ soundsEnabled: !settings.soundsEnabled })}
            />
            Sons notifications
          </label>

          <label className="os-notifications-input-row">
            <span className="os-notifications-input-label">Fréquence polling (sec)</span>
            <input
              className="filter-input os-notifications-input"
              type="number"
              min={30}
              max={300}
              value={localInterval}
              onChange={(event) => setLocalInterval(Math.min(300, Math.max(30, Number(event.target.value) || 30)))}
              onBlur={() => updateSettings({ refreshIntervalSec: Math.min(300, Math.max(30, localInterval)) })}
            />
          </label>

          <label className="os-notifications-input-row">
            <span className="os-notifications-input-label">Seuil SLA (min)</span>
            <input
              className="filter-input os-notifications-input"
              type="number"
              min={15}
              max={240}
              value={settings.slaWarningMinutes}
              onChange={(event) => updateSettings({ slaWarningMinutes: Math.max(15, Number(event.target.value)) })}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
