"use client";

import Link from "next/link";
import type { EnrichedOrder } from "@/lib/os/orders/types";
import { formatCurrencyMAD } from "@/lib/os/orders/helpers/format";
import { SlaTimer } from "@/components/os/orders/SlaTimer";

export function MobileUrgentQueue({
  orders,
}: {
  orders: EnrichedOrder[];
}) {
  const queue = orders.slice(0, 8);

  return (
    <section className="luxury-card" style={{ padding: 12, borderRadius: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>Mobile Urgent Queue</div>
        <Link href="/os/orders?status=to_confirm" style={{ fontSize: 11, fontWeight: 800, color: "var(--gold)", textDecoration: "none" }}>
          Voir tout
        </Link>
      </div>

      {queue.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 700, padding: "10px 4px" }}>Aucune urgence active.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {queue.map((order) => (
            <Link
              key={order.id}
              href={`/os/orders?status=${order.status}`}
              style={{
                border: "1px solid rgba(201,106,106,0.28)",
                borderRadius: 10,
                background: "var(--danger-soft)",
                textDecoration: "none",
                color: "inherit",
                padding: "9px 10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>{order.customer_name || "Client inconnu"}</div>
                <div style={{ marginTop: 2, fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>
                  {order.city || "-"} · {formatCurrencyMAD(order.estimatedValue)}
                </div>
              </div>
              <SlaTimer elapsedMinutes={order.elapsedMinutes} slaMinutes={order.slaMinutes} level={order.slaLevel} compact />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
