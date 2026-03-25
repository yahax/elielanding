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
      className={`os-pipeline-card ${isOverlay ? "is-overlay" : ""}`}
      style={{
        textAlign: "left",
        transition,
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.45 : 1,
      }}
    >
      <div className="os-pipeline-card-head">
        <div className="os-pipeline-card-ident">
          <div className="os-pipeline-card-order-id">
            #{order.id.slice(-6).toUpperCase()}
          </div>
          <div className="os-pipeline-card-customer">
            {order.customer_name || "Client inconnu"}
          </div>
        </div>
        <MoreHorizontal size={14} className="os-pipeline-card-more" />
      </div>

      <div className="os-pipeline-card-row">
        <span className="os-pipeline-card-city">
          <MapPin size={12} />
          {order.city || "-"}
        </span>
        <span className="os-pipeline-card-value">{formatCurrencyMAD(order.estimatedValue)}</span>
      </div>

      <div className="os-pipeline-card-badges">
        <StatusBadge status={order.status} />
        <PriorityScoreBadge priority={order.priority} score={order.priorityScore} compact />
        <RiskScoreBadge risk={order.risk} score={order.riskScore} compact />
      </div>

      <div className="os-pipeline-card-sla">
        <SlaTimer elapsedMinutes={order.elapsedMinutes} slaMinutes={order.slaMinutes} level={order.slaLevel} compact />
      </div>

      <div className="os-pipeline-card-flags">
        <OrderRowBadges order={order} max={2} />
      </div>

      <div className="os-pipeline-card-next">
        <NextBestActionChip action={order.nextBestAction} compact />
      </div>

      <div className="os-pipeline-card-foot">{formatDateTime(order.created_at)} · {order.source}</div>
    </button>
  );
}
