"use client";

import type { OrderPriority } from "@/lib/os/orders/types";
import { PRIORITY_LABELS } from "@/lib/os/orders/helpers/status";

const COLOR: Record<OrderPriority, string> = {
  low: "var(--text-dim)",
  medium: "var(--info)",
  high: "var(--warning)",
  critical: "var(--danger)",
};

export function MobileInlinePriorityPill({
  priority,
  score,
}: {
  priority: OrderPriority;
  score: number;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        borderRadius: 999,
        padding: "2px 7px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        fontSize: 10,
        fontWeight: 800,
        color: COLOR[priority],
      }}
    >
      {PRIORITY_LABELS[priority]} {Math.round(score)}
    </span>
  );
}
