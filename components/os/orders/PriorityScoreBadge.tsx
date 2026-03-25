"use client";

import type { OrderPriority } from "@/lib/os/orders/types";
import { PRIORITY_LABELS } from "@/lib/os/orders/helpers/status";

export function PriorityScoreBadge({
  priority,
  score,
  compact = false,
}: {
  priority: OrderPriority;
  score: number;
  compact?: boolean;
}) {
  const tone =
    priority === "critical" ? "danger" : priority === "high" ? "warning" : priority === "medium" ? "warning" : "neutral";

  return (
    <span
      className={`os-chip os-priority-chip os-priority-${tone}`}
      style={{
        gap: compact ? 4 : 6,
        padding: compact ? "3px 8px" : "4px 10px",
        fontSize: compact ? 10 : 11,
        textTransform: "uppercase",
      }}
    >
      <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.8 }}>{Math.round(score)}</span>
      <span>{PRIORITY_LABELS[priority]}</span>
    </span>
  );
}
