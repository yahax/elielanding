"use client";

import { formatCurrencyMAD, formatDateTime } from "@/lib/os/orders/helpers/format";
import type { EnrichedOrder, OrderSortField, SortDirection } from "@/lib/os/orders/types";
import { NextBestActionChip } from "@/components/os/orders/NextBestActionChip";
import { OrderRowBadges } from "@/components/os/orders/OrderRowBadges";
import { PriorityScoreBadge } from "@/components/os/orders/PriorityScoreBadge";
import { RiskScoreBadge } from "@/components/os/orders/RiskScoreBadge";
import { SlaTimer } from "@/components/os/orders/SlaTimer";
import { StatusBadge } from "@/components/os/StatusBadge";
import { ArrowDown, ArrowUp, Check, Copy, MessageCircle, Phone, RotateCcw, Ship, XCircle } from "lucide-react";
import type { CSSProperties } from "react";

export type RowAction = "confirm" | "callback" | "shipped" | "cancel" | "whatsapp" | "call" | "details" | "copy_phone";

function SortLabel({
  label,
  active,
  direction,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {label}
      {active ? direction === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : null}
    </span>
  );
}

export function OrdersTable({
  orders,
  selectedIds,
  allSelected,
  onToggleSelect,
  onToggleSelectAll,
  onSortChange,
  sortField,
  sortDirection,
  onAction,
  isOrderUpdating,
}: {
  orders: EnrichedOrder[];
  selectedIds: Set<string>;
  allSelected: boolean;
  onToggleSelect: (orderId: string) => void;
  onToggleSelectAll: () => void;
  onSortChange: (field: OrderSortField) => void;
  sortField: OrderSortField;
  sortDirection: SortDirection;
  onAction: (order: EnrichedOrder, action: RowAction) => void;
  isOrderUpdating: (orderId: string) => boolean;
}) {
  if (orders.length === 0) {
    return (
      <div className="luxury-card" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
        Aucune commande ne correspond aux filtres actifs.
      </div>
    );
  }

  const sortButtonStyle: CSSProperties = {
    border: "none",
    background: "transparent",
    color: "inherit",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    padding: 0,
  };

  return (
    <div className="table-wrap" style={{ overflowX: "auto", borderRadius: 20 }}>
      <table className="data-table" style={{ minWidth: 1420 }}>
        <thead>
          <tr>
            <th style={{ width: 42 }}>
              <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} aria-label="Sélectionner tout" />
            </th>
            <th>
              <button type="button" style={sortButtonStyle} onClick={() => onSortChange("created_at")}>
                <SortLabel label="Commande" active={sortField === "created_at"} direction={sortDirection} />
              </button>
            </th>
            <th>Client</th>
            <th>Ville</th>
            <th>Pack / Produits</th>
            <th>
              <button type="button" style={sortButtonStyle} onClick={() => onSortChange("value")}>
                <SortLabel label="Valeur" active={sortField === "value"} direction={sortDirection} />
              </button>
            </th>
            <th>Statut</th>
            <th>
              <button type="button" style={sortButtonStyle} onClick={() => onSortChange("priority")}>
                <SortLabel label="Priorité" active={sortField === "priority"} direction={sortDirection} />
              </button>
            </th>
            <th>
              <button type="button" style={sortButtonStyle} onClick={() => onSortChange("risk")}>
                <SortLabel label="Risque" active={sortField === "risk"} direction={sortDirection} />
              </button>
            </th>
            <th>Opérateur</th>
            <th>
              <button type="button" style={sortButtonStyle} onClick={() => onSortChange("elapsed")}>
                <SortLabel label="Temps écoulé" active={sortField === "elapsed"} direction={sortDirection} />
              </button>
            </th>
            <th>Prochaine action</th>
            <th style={{ textAlign: "right", paddingRight: 20 }}>Actions rapides</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
            const updating = isOrderUpdating(order.id);
            return (
              <tr key={order.id} style={{ opacity: updating ? 0.6 : 1 }}>
                <td>
                  <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => onToggleSelect(order.id)} aria-label={`Sélectionner commande ${order.id}`} />
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontWeight: 900, color: "var(--text)", fontSize: 12 }}>#{order.id.slice(-8).toUpperCase()}</span>
                    <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>{formatDateTime(order.created_at)}</span>
                    <span style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 800 }}>{order.source}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontWeight: 800, color: "var(--text)", fontSize: 13 }}>{order.customer_name || "Client inconnu"}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 700 }}>{order.phone || "Téléphone indisponible"}</span>
                    <OrderRowBadges order={order} max={2} />
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: "var(--text-muted)" }}>{order.city || "-"}</span>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 900,
                        color: "var(--gold)",
                        background: "var(--gold-glow)",
                        border: "1px solid var(--gold-border)",
                        borderRadius: 999,
                        width: "fit-content",
                        padding: "2px 8px",
                        textTransform: "uppercase",
                      }}
                    >
                      Pack {order.pack_type}
                    </span>
                    <span style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-muted)", fontSize: 12 }}>
                      {order.perfumes.join(" + ")}
                    </span>
                  </div>
                </td>
                <td style={{ fontWeight: 900, color: "var(--text)" }}>{formatCurrencyMAD(order.estimatedValue)}</td>
                <td>
                  <StatusBadge status={order.status} />
                </td>
                <td>
                  <PriorityScoreBadge priority={order.priority} score={order.priorityScore} />
                </td>
                <td>
                  <RiskScoreBadge risk={order.risk} score={order.riskScore} />
                </td>
                <td>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{order.operator || "Non assigné"}</span>
                </td>
                <td>
                  <SlaTimer elapsedMinutes={order.elapsedMinutes} slaMinutes={order.slaMinutes} level={order.slaLevel} />
                </td>
                <td>
                  <NextBestActionChip action={order.nextBestAction} />
                </td>
                <td style={{ paddingRight: 16 }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                    <button type="button" className="btn-ghost btn-sm" style={{ padding: 0, width: 34, height: 34 }} onClick={() => onAction(order, "confirm")} title="Confirmer">
                      <Check size={15} />
                    </button>
                    <button type="button" className="btn-ghost btn-sm" style={{ padding: 0, width: 34, height: 34 }} onClick={() => onAction(order, "callback")} title="Callback">
                      <RotateCcw size={15} />
                    </button>
                    <button type="button" className="btn-ghost btn-sm" style={{ padding: 0, width: 34, height: 34 }} onClick={() => onAction(order, "shipped")} title="Expédiée">
                      <Ship size={15} />
                    </button>
                    <button type="button" className="btn-ghost btn-sm" style={{ padding: 0, width: 34, height: 34 }} onClick={() => onAction(order, "cancel")} title="Annuler">
                      <XCircle size={15} />
                    </button>
                    <button type="button" className="btn-ghost btn-sm" style={{ padding: 0, width: 34, height: 34 }} onClick={() => onAction(order, "whatsapp")} title="WhatsApp">
                      <MessageCircle size={15} />
                    </button>
                    <button type="button" className="btn-ghost btn-sm" style={{ padding: 0, width: 34, height: 34 }} onClick={() => onAction(order, "call")} title="Appeler">
                      <Phone size={15} />
                    </button>
                    <button type="button" className="btn-ghost btn-sm" style={{ padding: 0, width: 34, height: 34 }} onClick={() => onAction(order, "copy_phone")} title="Copier téléphone">
                      <Copy size={15} />
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" style={{ height: 34 }} onClick={() => onAction(order, "details")} title="Détails">
                      Ouvrir
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
