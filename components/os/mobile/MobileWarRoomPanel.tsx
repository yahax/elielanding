"use client";

import { useWarRoomMode } from "@/hooks/useWarRoomMode";
import type { ReactNode } from "react";

export function MobileWarRoomPanel({
  urgentCountHint,
  children,
}: {
  urgentCountHint: number;
  children: ReactNode;
}) {
  const { isWarRoomMode, preference, setWarRoomPreference } = useWarRoomMode({
    isMobile: true,
    urgentCountHint,
  });

  return (
    <section
      className="os-mobile-war-room"
      style={{
        borderRadius: 16,
        border: isWarRoomMode ? "1px solid rgba(201,106,106,0.38)" : "1px solid var(--border)",
        background: isWarRoomMode ? "color-mix(in srgb, var(--danger-soft) 35%, var(--surface))" : "var(--surface)",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: isWarRoomMode ? "var(--danger)" : "var(--text)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            War Room Mode
          </div>
          <div style={{ marginTop: 2, fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>
            {isWarRoomMode ? "Priorité exécution rapide" : "Mode standard premium"}
          </div>
        </div>

        <select
          className="filter-select"
          value={preference}
          onChange={(event) => setWarRoomPreference(event.target.value as typeof preference)}
          style={{ height: 32, fontSize: 11, minWidth: 110 }}
        >
          <option value="auto">Auto</option>
          <option value="on">Forcé ON</option>
          <option value="off">Forcé OFF</option>
        </select>
      </div>

      {children}
    </section>
  );
}
