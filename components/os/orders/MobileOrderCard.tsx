"use client";

import { NextBestActionChip } from "@/components/os/orders/NextBestActionChip";
import { OrderRowBadges } from "@/components/os/orders/OrderRowBadges";
import { PriorityScoreBadge } from "@/components/os/orders/PriorityScoreBadge";
import { RiskScoreBadge } from "@/components/os/orders/RiskScoreBadge";
import { SlaTimer } from "@/components/os/orders/SlaTimer";
import { StatusBadge } from "@/components/os/StatusBadge";
import { formatCurrencyMAD, formatDateTime } from "@/lib/os/orders/helpers/format";
import type { EnrichedOrder } from "@/lib/os/orders/types";
import { Check, Copy, MessageCircle, Phone, RotateCcw, XCircle } from "lucide-react";

export type MobileOrderAction = "confirm" | "callback" | "cancel" | "whatsapp" | "call" | "copy_phone" | "details";

export function MobileOrderCard({
  order,
  selected,
  onSelect,
  onAction,
}: {
  order: EnrichedOrder;
  selected: boolean;
  onSelect: (orderId: string) => void;
  onAction: (order: EnrichedOrder, action: MobileOrderAction) => void;
}) {
  return (
    <div className="luxury-card" style={{ padding: 14, borderRadius: 16, borderColor: selected ? "var(--gold-border)" : "var(--border)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <input type="checkbox" checked={selected} onChange={() => onSelect(order.id)} aria-label={`Sélectionner ${order.id}`} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: "var(--text-dim)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                #{order.id.slice(-8).toUpperCase()}
              </div>
              <div style={{ fontWeight: 900, color: "var(--text)", fontSize: 14 }}>{order.customer_name || "Client inconnu"}</div>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 700 }}>{order.city || "Ville -"} · {order.source}</div>
            <div style={{ fontWeight: 900, color: "var(--text)" }}>{formatCurrencyMAD(order.estimatedValue)}</div>
          </div>

          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
            <PriorityScoreBadge priority={order.priority} score={order.priorityScore} compact />
            <RiskScoreBadge risk={order.risk} score={order.riskScore} compact />
            <SlaTimer elapsedMinutes={order.elapsedMinutes} slaMinutes={order.slaMinutes} level={order.slaLevel} compact />
          </div>

          <div style={{ marginTop: 8 }}>
            <OrderRowBadges order={order} max={3} />
          </div>

          <div style={{ marginTop: 8 }}>
            <NextBestActionChip action={order.nextBestAction} compact />
          </div>

          <div style={{ marginTop: 10, color: "var(--text-dim)", fontSize: 11, fontWeight: 700 }}>
            {formatDateTime(order.created_at)} · {order.operator || "Non assigné"}
          </div>

          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 6 }}>
            <button type="button" className="btn-ghost btn-sm" style={{ padding: 0, height: 32 }} onClick={() => onAction(order, "confirm")} title="Confirmer">
              <Check size={14} />
            </button>
            <button type="button" className="btn-ghost btn-sm" style={{ padding: 0, height: 32 }} onClick={() => onAction(order, "callback")} title="Callback">
              <RotateCcw size={14} />
            </button>
            <button type="button" className="btn-ghost btn-sm" style={{ padding: 0, height: 32 }} onClick={() => onAction(order, "cancel")} title="Annuler">
              <XCircle size={14} />
            </button>
            <button type="button" className="btn-ghost btn-sm" style={{ padding: 0, height: 32 }} onClick={() => onAction(order, "whatsapp")} title="WhatsApp">
              <MessageCircle size={14} />
            </button>
            <button type="button" className="btn-ghost btn-sm" style={{ padding: 0, height: 32 }} onClick={() => onAction(order, "call")} title="Appeler">
              <Phone size={14} />
            </button>
            <button type="button" className="btn-ghost btn-sm" style={{ padding: 0, height: 32 }} onClick={() => onAction(order, "copy_phone")} title="Copier">
              <Copy size={14} />
            </button>
          </div>

          <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 10, width: "100%" }} onClick={() => onAction(order, "details")}>
            Ouvrir détail
          </button>
        </div>
      </div>
    </div>
  );
}
