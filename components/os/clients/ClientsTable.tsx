"use client";

import { ChevronRight } from "lucide-react";
import { CUSTOMER_SEGMENT_LABELS, NEXT_ACTION_LABELS, RELATIONSHIP_LABELS, getCustomerMainSegment } from "@/lib/os/crm/helpers";
import type { Customer } from "@/lib/os/crm/types";
import { CustomerValueBadge } from "@/components/os/clients/CustomerValueBadge";
import { RepurchaseScoreBadge } from "@/components/os/clients/RepurchaseScoreBadge";

interface ClientsTableProps {
  customers: Customer[];
  onOpenCustomer: (customer: Customer) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function ClientsTable({ customers, onOpenCustomer }: ClientsTableProps) {
  return (
    <div className="table-wrap os-table-shell os-clients-table-shell">
      <table className="data-table os-clients-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Ville</th>
            <th>Commandes</th>
            <th>Total Dépensé</th>
            <th>Dernière Commande</th>
            <th>Segment</th>
            <th>Relation</th>
            <th>Valeur</th>
            <th>Réachat</th>
            <th>Action suivante</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="os-table-row-interactive os-clients-row" onClick={() => onOpenCustomer(customer)} style={{ cursor: "pointer" }}>
              <td>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{customer.name}</span>
                  <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>{customer.phone}</span>
                </div>
              </td>
              <td>{customer.city || "-"}</td>
              <td>{customer.totalOrders}</td>
              <td>{customer.totalSpent} MAD</td>
              <td>{formatDate(customer.lastOrderAt)}</td>
              <td>
                  <span className="os-chip is-active" style={{ minHeight: 24 }}>
                    {CUSTOMER_SEGMENT_LABELS[getCustomerMainSegment(customer)]}
                  </span>
                </td>
              <td>{RELATIONSHIP_LABELS[customer.relationshipStatus]}</td>
              <td>
                <CustomerValueBadge score={customer.valueScore} totalSpent={customer.totalSpent} />
              </td>
              <td>
                <RepurchaseScoreBadge score={customer.repurchaseScore} probability={customer.repurchaseProbability} />
              </td>
              <td>{NEXT_ACTION_LABELS[customer.nextAction]}</td>
              <td>
                <ChevronRight size={14} className="os-clients-row-chevron" style={{ color: "var(--text-dim)" }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
