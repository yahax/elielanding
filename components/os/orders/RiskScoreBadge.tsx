"use client";

import { RISK_LABELS } from "@/lib/os/orders/helpers/status";
import type { OrderRisk } from "@/lib/os/orders/types";

export function RiskScoreBadge({
  risk,
  score,
  compact = false,
}: {
  risk: OrderRisk;
  score: number;
  compact?: boolean;
}) {
  const tone = risk === "high" ? "danger" : risk === "medium" ? "warning" : "success";

  return (
    <span
      className={`os-chip os-risk-chip os-risk-${tone}`}
      style={{
        gap: compact ? 4 : 6,
        padding: compact ? "3px 8px" : "4px 10px",
        fontSize: compact ? 10 : 11,
        textTransform: "uppercase",
      }}
    >
      <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.82 }}>{Math.round(score)}</span>
      <span>{RISK_LABELS[risk]}</span>
    </span>
  );
}
