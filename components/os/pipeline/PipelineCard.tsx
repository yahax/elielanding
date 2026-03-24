"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { MapPin, MoreHorizontal } from "lucide-react";
import type { EnrichedOrder } from "@/lib/os/orders/types";
import { formatCurrencyMAD, formatDateTime } from "@/lib/os/orders/helpers/format";
import { PriorityScoreBadge } from "@/components/os/orders/PriorityScoreBadge";
import { RiskScoreBadge } from "@/components/os/orders/RiskScoreBadge";
import { SlaTimer } from "@/components/os/orders/SlaTimer";
import { NextBestActionChip } from "@/components/os/orders/NextBestActionChip";
import { OrderRowBadges } from "@/components/os/orders/OrderRowBadges";
import { StatusBadge } from "@/components/os/StatusBadge";

export function PipelineCard({
  order,
  onOpenDetails,
  isOverlay = false,
}: {
  order: EnrichedOrder;
  onOpenDetails: (order: EnrichedOrder) => void;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: order.id });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={() => onOpenDetails(order)}
      style={{
        textAlign: "left",
        borderRadius: 14,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        padding: 10,
        cursor: isOverlay ? "grabbing" : "grab",
        transition,
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.45 : 1,
        boxShadow: isOverlay ? "0 16px 24px rgba(30,26,23,0.2)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            #{order.id.slice(-6).toUpperCase()}
          </div>
          <div style={{ marginTop: 2, fontSize: 13, fontWeight: 900, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {order.customer_name || "Client inconnu"}
          </div>
        </div>
        <MoreHorizontal size={14} style={{ color: "var(--text-dim)" }} />
      </div>

      <div style={{ marginTop: 7, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: 11, fontWeight: 700 }}>
          <MapPin size={12} />
          {order.city || "-"}
        </span>
        <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{formatCurrencyMAD(order.estimatedValue)}</span>
      </div>

      <div style={{ marginTop: 7, display: "flex", flexWrap: "wrap", gap: 6 }}>
        <StatusBadge status={order.status} />
        <PriorityScoreBadge priority={order.priority} score={order.priorityScore} compact />
        <RiskScoreBadge risk={order.risk} score={order.riskScore} compact />
      </div>

      <div style={{ marginTop: 7 }}>
        <SlaTimer elapsedMinutes={order.elapsedMinutes} slaMinutes={order.slaMinutes} level={order.slaLevel} compact />
      </div>

      <div style={{ marginTop: 7 }}>
        <OrderRowBadges order={order} max={2} />
      </div>

      <div style={{ marginTop: 7 }}>
        <NextBestActionChip action={order.nextBestAction} compact />
      </div>

      <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-dim)", fontWeight: 700 }}>{formatDateTime(order.created_at)} · {order.source}</div>
    </button>
  );
}
