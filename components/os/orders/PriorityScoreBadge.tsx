"use client";

import type { OrderPriority } from "@/lib/os/orders/types";
import { PRIORITY_LABELS } from "@/lib/os/orders/helpers/status";
import type { CSSProperties } from "react";

const PRIORITY_STYLE: Record<OrderPriority, CSSProperties> = {
  low: {
    background: "var(--surface-2)",
    color: "var(--text-dim)",
    border: "1px solid var(--border)",
  },
  medium: {
    background: "var(--info-soft)",
    color: "var(--info)",
    border: "1px solid rgba(124, 140, 160, 0.35)",
  },
  high: {
    background: "var(--warning-soft)",
    color: "var(--warning)",
    border: "1px solid rgba(213, 161, 62, 0.35)",
  },
  critical: {
    background: "var(--danger-soft)",
    color: "var(--danger)",
    border: "1px solid rgba(201, 106, 106, 0.4)",
  },
};

export function PriorityScoreBadge({
  priority,
  score,
  compact = false,
}: {
  priority: OrderPriority;
  score: number;
  compact?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 4 : 6,
        borderRadius: 999,
        padding: compact ? "3px 8px" : "4px 10px",
        fontSize: compact ? 10 : 11,
        fontWeight: 800,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        ...PRIORITY_STYLE[priority],
      }}
    >
      <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.8 }}>{Math.round(score)}</span>
      <span>{PRIORITY_LABELS[priority]}</span>
    </span>
  );
}
