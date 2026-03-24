"use client";

import type { EnrichedOrder } from "@/lib/os/orders/types";
import { formatCurrencyMAD, formatDateTime } from "@/lib/os/orders/helpers/format";
import { PriorityScoreBadge } from "@/components/os/orders/PriorityScoreBadge";
import { RiskScoreBadge } from "@/components/os/orders/RiskScoreBadge";
import { SlaTimer } from "@/components/os/orders/SlaTimer";

export function MobileOrdersQueue({
  title,
  orders,
  onOpenOrder,
}: {
  title: string;
  orders: EnrichedOrder[];
  onOpenOrder: (orderId: string) => void;
}) {
  return (
    <section className="luxury-card" style={{ padding: 12, borderRadius: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {orders.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 700, padding: "10px 4px" }}>Aucune commande dans cette file.</div>
        ) : (
          orders.map((order) => (
            <button
              type="button"
              key={order.id}
              onClick={() => onOpenOrder(order.id)}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 10,
                background: "var(--surface)",
                padding: "9px 10px",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>
                  {order.customer_name || "Client inconnu"}
                </span>
                <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>{formatCurrencyMAD(order.estimatedValue)}</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>
                #{order.id.slice(-7).toUpperCase()} · {order.city || "-"} · {formatDateTime(order.created_at)}
              </div>
              <div style={{ marginTop: 7, display: "flex", flexWrap: "wrap", gap: 6 }}>
                <PriorityScoreBadge priority={order.priority} score={order.priorityScore} compact />
                <RiskScoreBadge risk={order.risk} score={order.riskScore} compact />
                <SlaTimer elapsedMinutes={order.elapsedMinutes} slaMinutes={order.slaMinutes} level={order.slaLevel} compact />
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
