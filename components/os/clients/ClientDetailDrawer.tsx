"use client";

import { Phone, MessageCircle, X, History, Tag, MapPin, ShoppingBag } from "lucide-react";
import {
  CUSTOMER_SEGMENT_LABELS,
  NEXT_ACTION_LABELS,
  RELATIONSHIP_LABELS,
  getCustomerMainSegment,
} from "@/lib/os/crm/helpers";
import type { Customer } from "@/lib/os/crm/types";
import { CustomerValueBadge } from "@/components/os/clients/CustomerValueBadge";
import { RepurchaseScoreBadge } from "@/components/os/clients/RepurchaseScoreBadge";

interface ClientDetailDrawerProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
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

export function ClientDetailDrawer({ open, customer, onClose }: ClientDetailDrawerProps) {
  if (!open || !customer) return null;

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
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
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(100vw, 540px)",
          zIndex: 93,
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <header
          style={{
            padding: "16px 16px 12px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>{customer.name}</div>
            <div style={{ marginTop: 4, fontSize: 13, color: "var(--text-dim)", fontWeight: 700 }}>{customer.phone}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="badge" style={{ background: "var(--gold-glow)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}>
                {CUSTOMER_SEGMENT_LABELS[getCustomerMainSegment(customer)]}
              </span>
              <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>
                {RELATIONSHIP_LABELS[customer.relationshipStatus]}
              </span>
            </div>
          </div>

          <button type="button" className="btn-ghost btn-sm" onClick={onClose} style={{ width: 34, height: 34, padding: 0, borderRadius: 10 }}>
            <X size={16} />
          </button>
        </header>

        <div style={{ padding: 14, borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <div className="luxury-card" style={{ padding: 10, borderRadius: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase" }}>Total dépensé</div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900 }}>{customer.totalSpent} MAD</div>
          </div>
          <div className="luxury-card" style={{ padding: 10, borderRadius: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase" }}>Commandes</div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900 }}>{customer.totalOrders}</div>
          </div>
          <div className="luxury-card" style={{ padding: 10, borderRadius: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase" }}>Panier moyen</div>
            <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900 }}>{customer.avgBasket} MAD</div>
          </div>
          <div className="luxury-card" style={{ padding: 10, borderRadius: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase" }}>Dernière commande</div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800 }}>
              {customer.daysSinceLastOrder == null ? "-" : `${customer.daysSinceLastOrder}j`}
            </div>
          </div>
        </div>

        <div style={{ padding: 14, borderBottom: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 8 }}>
          <CustomerValueBadge score={customer.valueScore} totalSpent={customer.totalSpent} />
          <RepurchaseScoreBadge score={customer.repurchaseScore} probability={customer.repurchaseProbability} />
          <span className="badge" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid rgba(201, 106, 106, 0.25)" }}>
            Risque {customer.riskScore}/100
          </span>
          <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>
            RFM {customer.rfmScore}/100
          </span>
        </div>

        <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 900, letterSpacing: "0.08em" }}>
            Next Best Action
          </div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 900, color: "var(--text)" }}>{NEXT_ACTION_LABELS[customer.nextAction]}</div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>
              <MapPin size={11} />
              {customer.city || "Ville inconnue"}
            </span>
            {customer.preferredProducts.slice(0, 3).map((product) => (
              <span key={product} className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>
                <Tag size={11} />
                {product}
              </span>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <History size={14} style={{ color: "var(--text-dim)" }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Historique commandes
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {customer.orderHistory.slice(0, 24).map((order) => (
              <div key={order.id} className="luxury-card" style={{ padding: 12, borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>#{order.id.slice(-6).toUpperCase()}</span>
                  <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>{formatDateTime(order.createdAt)}</span>
                </div>
                <div style={{ marginTop: 5, fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>{order.city || "-"}</div>
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span className={`badge badge-${order.status}`}>{order.status}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{order.value} MAD</span>
                </div>
                {order.products.length > 0 ? (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {order.products.slice(0, 4).map((product) => (
                      <span
                        key={`${order.id}-${product}`}
                        style={{
                          borderRadius: 999,
                          border: "1px solid var(--border)",
                          background: "var(--bg-elevated)",
                          color: "var(--text-dim)",
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "3px 8px",
                        }}
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <footer style={{ padding: 14, borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 }}>
          <a href={safeWhatsappHref(customer.phone)} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: "none" }}>
            <MessageCircle size={14} />
            WhatsApp
          </a>
          <a href={safePhoneHref(customer.phone)} className="btn-ghost" style={{ textDecoration: "none", display: "inline-flex", justifyContent: "center" }}>
            <Phone size={14} />
            Appeler
          </a>
          <a href="/os/orders" className="btn-ghost btn-sm" style={{ textDecoration: "none", display: "inline-flex", justifyContent: "center" }}>
            <ShoppingBag size={13} />
            Ouvrir commandes
          </a>
          <button type="button" className="btn-ghost btn-sm">
            Ajouter note
          </button>
        </footer>
      </aside>
    </>
  );
}

