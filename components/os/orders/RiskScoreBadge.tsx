"use client";

import { RISK_LABELS } from "@/lib/os/orders/helpers/status";
import type { OrderRisk } from "@/lib/os/orders/types";
import type { CSSProperties } from "react";

const RISK_STYLE: Record<OrderRisk, CSSProperties> = {
  low: {
    background: "rgba(47, 143, 99, 0.08)",
    color: "var(--success)",
    border: "1px solid rgba(47, 143, 99, 0.32)",
  },
  medium: {
    background: "var(--warning-soft)",
    color: "var(--warning)",
    border: "1px solid rgba(213, 161, 62, 0.38)",
  },
  high: {
    background: "var(--danger-soft)",
    color: "var(--danger)",
    border: "1px solid rgba(201, 106, 106, 0.42)",
  },
};

export function RiskScoreBadge({
  risk,
  score,
  compact = false,
}: {
  risk: OrderRisk;
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
        ...RISK_STYLE[risk],
      }}
    >
      <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.82 }}>{Math.round(score)}</span>
      <span>{RISK_LABELS[risk]}</span>
    </span>
  );
}
