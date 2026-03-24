"use client";

import type { NotificationSeverity } from "@/lib/os/live/types";
import type { CSSProperties } from "react";

const STYLE: Record<NotificationSeverity, CSSProperties> = {
  info: {
    background: "var(--info-soft)",
    border: "1px solid rgba(124, 140, 160, 0.35)",
    color: "var(--info)",
  },
  success: {
    background: "var(--success-soft)",
    border: "1px solid rgba(47, 143, 99, 0.35)",
    color: "var(--success)",
  },
  warning: {
    background: "var(--warning-soft)",
    border: "1px solid rgba(213, 161, 62, 0.35)",
    color: "var(--warning)",
  },
  critical: {
    background: "var(--danger-soft)",
    border: "1px solid rgba(201, 106, 106, 0.42)",
    color: "var(--danger)",
  },
};

const LABEL: Record<NotificationSeverity, string> = {
  info: "Info",
  success: "Succès",
  warning: "Alerte",
  critical: "Critique",
};

export function SeverityPill({ severity, compact = false }: { severity: NotificationSeverity; compact?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: compact ? "2px 8px" : "3px 9px",
        fontSize: compact ? 10 : 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        ...STYLE[severity],
      }}
    >
      {LABEL[severity]}
    </span>
  );
}
