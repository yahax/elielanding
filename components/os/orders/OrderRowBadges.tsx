"use client";

import type { EnrichedOrder } from "@/lib/os/orders/types";
import type { CSSProperties } from "react";

function Badge({ label, tone }: { label: string; tone: "gold" | "danger" | "warning" | "info" | "muted" | "success" }) {
  const styleByTone: Record<typeof tone, CSSProperties> = {
    gold: {
      background: "var(--gold-glow)",
      color: "var(--gold)",
      border: "1px solid var(--gold-border)",
    },
    danger: {
      background: "var(--danger-soft)",
      color: "var(--danger)",
      border: "1px solid rgba(201, 106, 106, 0.35)",
    },
    warning: {
      background: "var(--warning-soft)",
      color: "var(--warning)",
      border: "1px solid rgba(213, 161, 62, 0.35)",
    },
    info: {
      background: "var(--info-soft)",
      color: "var(--info)",
      border: "1px solid rgba(124, 140, 160, 0.35)",
    },
    muted: {
      background: "var(--surface-2)",
      color: "var(--text-dim)",
      border: "1px solid var(--border)",
    },
    success: {
      background: "var(--success-soft)",
      color: "var(--success)",
      border: "1px solid rgba(47, 143, 99, 0.3)",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "2px 8px",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        ...styleByTone[tone],
      }}
    >
      {label}
    </span>
  );
}

function buildFlags(order: EnrichedOrder): Array<{ label: string; tone: Parameters<typeof Badge>[0]["tone"] }> {
  const flags: Array<{ label: string; tone: Parameters<typeof Badge>[0]["tone"] }> = [];

  if (order.isUrgent) flags.push({ label: "Urgent", tone: "danger" });
  if ((order.status === "new" || order.status === "to_confirm") && (order.priority === "high" || order.priority === "critical")) {
    flags.push({ label: "Hot Lead", tone: "warning" });
  }
  if (order.customerLifetimeValue >= 2400) flags.push({ label: "VIP", tone: "gold" });
  if (order.isReturningCustomer) flags.push({ label: "Récurrent", tone: "success" });
  if (order.risk === "high") flags.push({ label: "Risque", tone: "danger" });
  if (order.slaLevel === "critical") flags.push({ label: "Retard", tone: "warning" });
  if (order.isHighValue) flags.push({ label: "Forte valeur", tone: "gold" });

  return flags;
}

export function OrderRowBadges({
  order,
  max = 3,
}: {
  order: EnrichedOrder;
  max?: number;
}) {
  const flags = buildFlags(order);
  const displayed = flags.slice(0, max);
  const overflow = Math.max(0, flags.length - displayed.length);

  if (displayed.length === 0) return <Badge label="Standard" tone="muted" />;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {displayed.map((flag) => (
        <Badge key={flag.label} label={flag.label} tone={flag.tone} />
      ))}
      {overflow > 0 ? <Badge label={`+${overflow}`} tone="muted" /> : null}
    </div>
  );
}
