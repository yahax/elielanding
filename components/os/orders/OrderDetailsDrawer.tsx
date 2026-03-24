"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ClipboardPenLine,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Ship,
  UserRoundCog,
  X,
  XCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/os/StatusBadge";
import { NextBestActionChip } from "@/components/os/orders/NextBestActionChip";
import { PriorityScoreBadge } from "@/components/os/orders/PriorityScoreBadge";
import { RiskScoreBadge } from "@/components/os/orders/RiskScoreBadge";
import { SlaTimer } from "@/components/os/orders/SlaTimer";
import {
  formatCurrencyMAD,
  formatDateTime,
  formatElapsedMinutes,
  phoneHref,
  whatsappHref,
} from "@/lib/os/orders/helpers/format";
import type { EnrichedOrder } from "@/lib/os/orders/types";
import type { OrderStatus } from "@/lib/types";
import type { CSSProperties, ReactNode } from "react";

function ActionButton({
  label,
  icon,
  onClick,
  tone = "neutral",
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  const toneStyle: Record<NonNullable<typeof tone>, CSSProperties> = {
    neutral: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      color: "var(--text)",
    },
    success: {
      background: "var(--success-soft)",
      border: "1px solid rgba(47, 143, 99, 0.35)",
      color: "var(--success)",
    },
    warning: {
      background: "var(--warning-soft)",
      border: "1px solid rgba(213, 161, 62, 0.35)",
      color: "var(--warning)",
    },
    danger: {
      background: "var(--danger-soft)",
      border: "1px solid rgba(201, 106, 106, 0.35)",
      color: "var(--danger)",
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 12,
        padding: "10px 12px",
        fontSize: 12,
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        cursor: "pointer",
        ...toneStyle[tone],
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export function OrderDetailsDrawer({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onAssignOperator,
  onAddNote,
  customerHistory,
  availableOperators,
  auditTimeline = [],
}: {
  order: EnrichedOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void> | void;
  onAssignOperator: (orderId: string, operator: string) => void;
  onAddNote: (orderId: string, note: string) => void;
  customerHistory: EnrichedOrder[];
  availableOperators: string[];
  auditTimeline?: Array<{ id: string; at: string; label: string; description?: string }>;
}) {
  if (order == null) return null;

  const waLink = whatsappHref(order.phone);
  const callLink = phoneHref(order.phone);
  const timeline = [...order.timeline, ...auditTimeline.map((item) => ({ ...item, kind: "system" as const }))].sort((a, b) => {
    const aDate = new Date(a.at).getTime();
    const bDate = new Date(b.at).getTime();
    return bDate - aDate;
  });

  return (
    <AnimatePresence mode="wait">
      {isOpen ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 90 }}>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "absolute", inset: 0, background: "rgba(20,20,20,0.42)", border: "none", backdropFilter: "blur(6px)" }}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 330, damping: 34 }}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "min(96vw, 560px)",
              background: "var(--bg)",
              borderLeft: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "18px 18px 14px",
                borderBottom: "1px solid var(--border)",
                background: "var(--surface)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Commande #{order.id.slice(-8).toUpperCase()}
                </div>
                <h3 style={{ margin: "4px 0 0", fontSize: 23, lineHeight: 1.1, fontWeight: 900, color: "var(--text)" }}>{order.customer_name || "Client inconnu"}</h3>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <StatusBadge status={order.status} />
                  <PriorityScoreBadge priority={order.priority} score={order.priorityScore} compact />
                  <RiskScoreBadge risk={order.risk} score={order.riskScore} compact />
                </div>
              </div>

              <button type="button" className="btn-ghost btn-sm" onClick={onClose} style={{ width: 34, height: 34, padding: 0 }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="luxury-card" style={{ padding: 14, borderRadius: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", marginBottom: 4 }}>Téléphone</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{order.phone || "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", marginBottom: 4 }}>Ville</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{order.city || "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", marginBottom: 4 }}>Valeur</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{formatCurrencyMAD(order.estimatedValue)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", marginBottom: 4 }}>Source</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{order.source}</div>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12, fontWeight: 700 }}>
                  <MapPin size={13} />
                  {order.address || "Adresse non renseignée"}
                </div>
                <div style={{ marginTop: 8, color: "var(--text-dim)", fontSize: 11, fontWeight: 700 }}>{formatDateTime(order.created_at)}</div>
              </div>

              <div className="luxury-card" style={{ padding: 14, borderRadius: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Smart Intelligence</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <NextBestActionChip action={order.nextBestAction} />
                  <SlaTimer elapsedMinutes={order.elapsedMinutes} slaMinutes={order.slaMinutes} level={order.slaLevel} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 800, textTransform: "uppercase" }}>Historique client</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>{order.customerOrderCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 800, textTransform: "uppercase" }}>Valeur client</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>{formatCurrencyMAD(order.customerLifetimeValue)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 800, textTransform: "uppercase" }}>Tentatives</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>{order.attemptCount}</div>
                  </div>
                </div>
              </div>

              <div className="luxury-card" style={{ padding: 14, borderRadius: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Produits / Pack</div>
                <div style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 999, border: "1px solid var(--gold-border)", background: "var(--gold-glow)", color: "var(--gold)", fontWeight: 900, fontSize: 10, textTransform: "uppercase", marginBottom: 8 }}>
                  Pack {order.pack_type}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {order.perfumes.map((perfume) => (
                    <div key={perfume} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
                      {perfume}
                    </div>
                  ))}
                </div>
              </div>

              <div className="luxury-card" style={{ padding: 14, borderRadius: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Timeline</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {timeline.map((item) => (
                    <div key={item.id} style={{ borderLeft: "2px solid var(--border)", paddingLeft: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>{formatDateTime(item.at)}</div>
                      {item.description ? <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{item.description}</div> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="luxury-card" style={{ padding: 14, borderRadius: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Historique commandes client</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {customerHistory.slice(0, 6).map((historyOrder) => (
                    <div key={historyOrder.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>#{historyOrder.id.slice(-6).toUpperCase()}</div>
                        <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>{formatDateTime(historyOrder.created_at)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>{formatCurrencyMAD(historyOrder.estimatedValue)}</div>
                        <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{historyOrder.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface)", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                <ActionButton label="Confirmer" icon={<Check size={13} />} tone="success" onClick={() => onUpdateStatus(order.id, "confirmed")} />
                <ActionButton label="Callback" icon={<RotateCcw size={13} />} tone="warning" onClick={() => onUpdateStatus(order.id, "callback")} />
                <ActionButton label="Expédiée" icon={<Ship size={13} />} onClick={() => onUpdateStatus(order.id, "shipped")} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                <ActionButton label="Annuler" icon={<XCircle size={13} />} tone="danger" onClick={() => onUpdateStatus(order.id, "canceled")} />
                <ActionButton
                  label="WhatsApp"
                  icon={<MessageCircle size={13} />}
                  onClick={() => {
                    if (waLink) window.open(waLink, "_blank", "noopener,noreferrer");
                  }}
                />
                <ActionButton
                  label="Appeler"
                  icon={<Phone size={13} />}
                  onClick={() => {
                    if (callLink) window.location.href = callLink;
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                <ActionButton
                  label="Ajouter note"
                  icon={<ClipboardPenLine size={13} />}
                  onClick={() => {
                    const note = window.prompt("Ajouter une note interne");
                    if (note && note.trim() !== "") onAddNote(order.id, note.trim());
                  }}
                />
                <ActionButton
                  label="Réassigner"
                  icon={<UserRoundCog size={13} />}
                  onClick={() => {
                    const current = order.operator || "";
                    const suggestion = availableOperators.filter((value) => value !== current).slice(0, 5).join(", ");
                    const operator = window.prompt(`Choisir opérateur (${suggestion})`, current);
                    if (operator && operator.trim() !== "") onAssignOperator(order.id, operator.trim());
                  }}
                />
                <div
                  style={{
                    borderRadius: 12,
                    border: "1px dashed var(--border)",
                    padding: "8px 10px",
                    fontSize: 11,
                    color: "var(--text-dim)",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  SLA {formatElapsedMinutes(order.slaMinutes)}
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
