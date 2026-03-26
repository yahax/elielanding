"use client";

import { Phone, MessageCircle, X, History, Tag, MapPin, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CUSTOMER_SEGMENT_LABELS,
  NEXT_ACTION_LABELS,
  RELATIONSHIP_LABELS,
  getCustomerMainSegment,
} from "@/lib/os/crm/helpers";
import type { Customer } from "@/lib/os/crm/types";
import { CustomerValueBadge } from "@/components/os/clients/CustomerValueBadge";
import { RepurchaseScoreBadge } from "@/components/os/clients/RepurchaseScoreBadge";
import { DrawerHeader } from "@/components/ui/DrawerPrimitives";

interface ClientDetailDrawerProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onAddNote: (customer: Customer, note: string) => Promise<void> | void;
  noteMutationPending?: boolean;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function safePhoneHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

function safeWhatsappHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "#";
  const normalized = digits.startsWith("0") ? `212${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

export function ClientDetailDrawer({ open, customer, onClose, onAddNote, noteMutationPending = false }: ClientDetailDrawerProps) {
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const orderHistory = useMemo(() => customer?.orderHistory ?? [], [customer]);

  const latestOrder = useMemo(() => orderHistory[0] ?? null, [orderHistory]);
  const latestNotes = useMemo(
    () =>
      orderHistory
        .flatMap((order) =>
          order.notes.map((note, index) => ({
            id: `${order.id}-${index}-${note}`,
            orderId: order.id,
            createdAt: order.createdAt,
            note,
          }))
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    [orderHistory]
  );

  useEffect(() => {
    if (!open || !customer) return;
    setNoteDraft("");
    setNoteSaving(false);
  }, [customer, open]);

  if (!open || !customer) return null;

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="os-drawer-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          border: "none",
          background: "rgba(30, 26, 23, 0.24)",
          backdropFilter: "blur(2px)",
          zIndex: 92,
        }}
      />

      <aside
        className="os-drawer os-client-drawer"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(100vw, 540px)",
          zIndex: 93,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DrawerHeader
          title={customer.name}
          subtitle={
            <>
              <span style={{ fontSize: 13, color: "var(--text-dim)", fontWeight: 700 }}>{customer.phone}</span>
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="os-chip is-active">{CUSTOMER_SEGMENT_LABELS[getCustomerMainSegment(customer)]}</span>
                <span className="os-chip">{RELATIONSHIP_LABELS[customer.relationshipStatus]}</span>
              </div>
            </>
          }
          actions={
            <button type="button" className="btn-ghost btn-sm" onClick={onClose} style={{ width: 34, height: 34, padding: 0, borderRadius: 10 }}>
              <X size={16} />
            </button>
          }
        />

        <div className="os-client-drawer-kpis" style={{ padding: 14, borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <div className="luxury-card os-drawer-section" style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase" }}>Total dépensé</div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900 }}>{customer.totalSpent} MAD</div>
          </div>
          <div className="luxury-card os-drawer-section" style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase" }}>Commandes</div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900 }}>{customer.totalOrders}</div>
          </div>
          <div className="luxury-card os-drawer-section" style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase" }}>Panier moyen</div>
            <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900 }}>{customer.avgBasket} MAD</div>
          </div>
          <div className="luxury-card os-drawer-section" style={{ padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase" }}>Dernière commande</div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800 }}>
              {customer.daysSinceLastOrder == null ? "-" : `${customer.daysSinceLastOrder}j`}
            </div>
          </div>
        </div>

        <div className="os-client-drawer-badges" style={{ padding: 14, borderBottom: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 8 }}>
          <CustomerValueBadge score={customer.valueScore} totalSpent={customer.totalSpent} />
          <RepurchaseScoreBadge score={customer.repurchaseScore} probability={customer.repurchaseProbability} />
          <span className="os-chip" style={{ background: "var(--danger-soft)", color: "var(--danger)", borderColor: "rgba(201, 106, 106, 0.25)" }}>
            Risque {customer.riskScore}/100
          </span>
          <span className="os-chip">
            RFM {customer.rfmScore}/100
          </span>
        </div>

        <div className="os-client-drawer-next" style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 900, letterSpacing: "0.08em" }}>
            Next Best Action
          </div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 900, color: "var(--text)" }}>{NEXT_ACTION_LABELS[customer.nextAction]}</div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="os-chip">
              <MapPin size={11} />
              {customer.city || "Ville inconnue"}
            </span>
            {customer.preferredProducts.slice(0, 3).map((product) => (
              <span key={product} className="os-chip">
                <Tag size={11} />
                {product}
              </span>
            ))}
          </div>
        </div>

        <div className="os-client-drawer-body" style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <History size={14} style={{ color: "var(--text-dim)" }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Historique commandes
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {customer.orderHistory.slice(0, 24).map((order) => (
              <div key={order.id} className="luxury-card os-drawer-section" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>#{order.id.slice(-6).toUpperCase()}</span>
                  <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>{formatDateTime(order.createdAt)}</span>
                </div>
                <div style={{ marginTop: 5, fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>{order.city || "-"}</div>
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span className={`badge badge-${order.status}`}>{order.status}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{order.value} MAD</span>
                </div>
                {order.notes.length > 0 ? (
                  <div style={{ marginTop: 8, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-elevated)", padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Dernière note
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--text)", fontWeight: 700 }}>{order.notes[order.notes.length - 1]}</div>
                  </div>
                ) : null}
                {order.products.length > 0 ? (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {order.products.slice(0, 4).map((product) => (
                      <span key={`${order.id}-${product}`} className="os-chip" style={{ minHeight: 24, fontSize: 10, padding: "0 8px" }}>
                        {product}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="os-client-drawer-notes" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Notes client récentes
            </div>
            {latestNotes.length === 0 ? (
              <div style={{ borderRadius: 12, border: "1px dashed var(--border)", padding: 12, fontSize: 12, fontWeight: 700, color: "var(--text-dim)" }}>
                Aucune note enregistrée pour ce client.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {latestNotes.map((item) => (
                  <div key={item.id} className="luxury-card os-drawer-section" style={{ padding: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{item.note}</div>
                    <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>
                      #{item.orderId.slice(-6).toUpperCase()} · {formatDateTime(item.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="os-drawer-footer os-client-drawer-footer" style={{ display: "grid", gap: 10 }}>
          <div className="os-client-drawer-primary-actions" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
            <a href={safeWhatsappHref(customer.phone)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ textDecoration: "none", justifyContent: "center" }}>
              <MessageCircle size={14} />
              WhatsApp
            </a>
            <a href={safePhoneHref(customer.phone)} className="btn-ghost btn-sm" style={{ textDecoration: "none", display: "inline-flex", justifyContent: "center" }}>
              <Phone size={14} />
              Appeler
            </a>
            <a href="/os-admin/orders" className="btn-ghost btn-sm" style={{ textDecoration: "none", display: "inline-flex", justifyContent: "center" }}>
              <ShoppingBag size={13} />
              Commandes
            </a>
          </div>

          <div className="os-drawer-section" style={{ padding: 10, display: "grid", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Ajouter note client
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>
              {latestOrder ? `Note enregistrée sur la commande #${latestOrder.id.slice(-6).toUpperCase()}` : "Aucune commande cible disponible."}
            </div>
            <div className="os-client-drawer-note-form" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="filter-input os-client-drawer-note-input"
                type="text"
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Ex: Cliente préfère livraison matin"
                style={{ height: 38, flex: 1, minWidth: 0 }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm os-client-drawer-note-submit"
                disabled={noteSaving || noteMutationPending || noteDraft.trim() === "" || latestOrder == null}
                onClick={async () => {
                  const normalized = noteDraft.trim();
                  if (normalized === "" || latestOrder == null) return;
                  setNoteSaving(true);
                  try {
                    await Promise.resolve(onAddNote(customer, normalized));
                    setNoteDraft("");
                  } finally {
                    setNoteSaving(false);
                  }
                }}
              >
                {noteSaving || noteMutationPending ? "Ajout..." : "Ajouter note"}
              </button>
            </div>
          </div>
        </footer>
      </aside>
    </>
  );
}
