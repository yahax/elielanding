"use client";

import { useEffect, useRef } from "react";
import { Sidebar } from "@/components/os/Sidebar";
import { TopBar } from "@/components/os/TopBar";
import { MobilePageShell } from "@/components/os/mobile/MobilePageShell";
import { useIsMobile } from "@/hooks/useIsMobile";
import { OsRealtimeBridge } from "@/components/os/live/OsRealtimeBridge";
import { LiveToaster } from "@/components/ui/LiveToaster";
import { fetchUserPreferences, saveUserPreferences } from "@/lib/os/api";
import { useOsLiveStore } from "@/store/useOsLiveStore";

export function OsAdminLayoutClient({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile(1024);
  const settings = useOsLiveStore((state) => state.settings);
  const warRoomPreference = useOsLiveStore((state) => state.warRoomPreference);
  const updateSettings = useOsLiveStore((state) => state.updateSettings);
  const setWarRoomPreference = useOsLiveStore((state) => state.setWarRoomPreference);
  const prefsHydratedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    void fetchUserPreferences()
      .then(({ preferences }) => {
        if (!mounted) return;

        updateSettings({
          toastsEnabled: preferences.notifications.toastsEnabled,
          soundsEnabled: preferences.notifications.soundsEnabled,
          categoriesEnabled: preferences.notifications.categoriesEnabled,
          refreshIntervalSec: preferences.notifications.refreshIntervalSec,
          slaWarningMinutes: preferences.notifications.slaWarningMinutes,
          warRoomPreference: preferences.warRoomMode,
        });
        setWarRoomPreference(preferences.warRoomMode);
      })
      .catch((error) => {
        console.warn("[PREFERENCES] Failed to hydrate preferences, keeping local defaults.", error);
      })
      .finally(() => {
        prefsHydratedRef.current = true;
      });

    return () => {
      mounted = false;
    };
  }, [setWarRoomPreference, updateSettings]);

  useEffect(() => {
    if (!prefsHydratedRef.current) return;

    const timer = window.setTimeout(() => {
      void saveUserPreferences({
        warRoomMode: warRoomPreference,
        notifications: {
          toastsEnabled: settings.toastsEnabled,
          soundsEnabled: settings.soundsEnabled,
          categoriesEnabled: settings.categoriesEnabled,
          refreshIntervalSec: settings.refreshIntervalSec,
          slaWarningMinutes: settings.slaWarningMinutes,
        },
      }).catch((error) => {
        console.warn("[PREFERENCES] Failed to persist preferences to server.", error);
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [settings, warRoomPreference]);

  if (isMobile) {
    return (
      <div className="dashboard-body" dir="ltr">
        <OsRealtimeBridge />
        <LiveToaster />
        <MobilePageShell>{children}</MobilePageShell>
      </div>
    );
  }

  return (
    <div className="dashboard-body" dir="ltr">
      <OsRealtimeBridge />
      <LiveToaster />
      <div className="dashboard-shell">
        <Sidebar />
        <div className="dashboard-main">
          <TopBar />
          <main className="dashboard-content">
            <div className="dashboard-content-inner">
              <div className="animate-fade-in os-content-transition">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
