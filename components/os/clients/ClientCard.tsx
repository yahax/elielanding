"use client";

import { ChevronRight, MessageCircle, Phone } from "lucide-react";
import { CUSTOMER_SEGMENT_LABELS, NEXT_ACTION_LABELS, getCustomerMainSegment } from "@/lib/os/crm/helpers";
import type { Customer } from "@/lib/os/crm/types";
import { CustomerValueBadge } from "@/components/os/clients/CustomerValueBadge";
import { RepurchaseScoreBadge } from "@/components/os/clients/RepurchaseScoreBadge";

interface ClientCardProps {
  customer: Customer;
  onOpen: () => void;
}

export function ClientCard({ customer, onOpen }: ClientCardProps) {
  const phoneDigits = customer.phone.replace(/\D/g, "");
  const waPhone = phoneDigits.startsWith("0") ? `212${phoneDigits.slice(1)}` : phoneDigits;

  return (
    <article className="luxury-card os-card-subtle os-card-interactive os-client-card" style={{ padding: 14, borderRadius: 16 }}>
      <button
        type="button"
        onClick={onOpen}
        className="os-client-card-hit"
        style={{
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)" }}>{customer.name}</div>
            <div style={{ marginTop: 2, fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>
              {customer.phone} · {customer.city || "Ville n/a"}
            </div>
          </div>
          <ChevronRight size={16} className="os-client-card-chevron" style={{ color: "var(--text-dim)" }} />
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="os-chip is-active">
            {CUSTOMER_SEGMENT_LABELS[getCustomerMainSegment(customer)]}
          </span>
          <span className="os-chip">
            {customer.totalOrders} cmd
          </span>
          <span className="os-chip">
            {customer.totalSpent} MAD
          </span>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <CustomerValueBadge score={customer.valueScore} totalSpent={customer.totalSpent} />
          <RepurchaseScoreBadge score={customer.repurchaseScore} probability={customer.repurchaseProbability} />
        </div>
      </button>

      <div className="os-client-card-actions" style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary os-client-card-cta" style={{ flex: 1, textDecoration: "none" }}>
          <MessageCircle size={13} />
          WhatsApp
        </a>
        <a href={`tel:${customer.phone}`} className="btn-ghost btn-sm os-client-card-cta" style={{ flex: 1, textDecoration: "none", display: "inline-flex", justifyContent: "center" }}>
          <Phone size={13} />
          Appeler
        </a>
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>{NEXT_ACTION_LABELS[customer.nextAction]}</div>
    </article>
  );
}
