"use client";

import type { RealtimeStatus } from "@/lib/os/live/types";

function tone(status: RealtimeStatus): string {
  switch (status) {
    case "live":
      return "var(--success)";
    case "polling":
      return "var(--warning)";
    case "error":
      return "var(--danger)";
    case "disconnected":
    default:
      return "var(--text-dim)";
  }
}

function label(status: RealtimeStatus): string {
  switch (status) {
    case "live":
      return "Live";
    case "polling":
      return "Sync";
    case "error":
      return "Erreur";
    case "disconnected":
    default:
      return "Offline";
  }
}

export function LiveStatusDot({ status, compact = false }: { status: RealtimeStatus; compact?: boolean }) {
  const color = tone(status);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: compact ? 10 : 11,
        fontWeight: 800,
        color: "var(--text-dim)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: compact ? 6 : 7,
          height: compact ? 6 : 7,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 0 4px color-mix(in srgb, ${color} 16%, transparent)`,
          animation: status === "live" ? "pulse-dot 1.9s infinite" : undefined,
        }}
      />
      {label(status)}
    </span>
  );
}
