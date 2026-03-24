"use client";

import { BarChart3, Clock3, Crown, Repeat2, UserPlus, Users } from "lucide-react";
import type { CustomerKpis } from "@/lib/os/crm/types";

interface ClientsKpiStripProps {
  kpis: CustomerKpis;
  onSelect?: (key: "vip" | "recurring" | "dormant" | "to_relaunch" | "all") => void;
}

export function ClientsKpiStrip({ kpis, onSelect }: ClientsKpiStripProps) {
  const items = [
    { id: "all", label: "Total clients", value: kpis.totalCustomers, icon: Users, tone: "var(--text)" },
    { id: "vip", label: "VIP", value: kpis.vipCustomers, icon: Crown, tone: "var(--gold)" },
    { id: "recurring", label: "Récurrents", value: kpis.recurringCustomers, icon: Repeat2, tone: "var(--success)" },
    { id: "dormant", label: "Dormants", value: kpis.dormantCustomers, icon: Clock3, tone: "var(--warning)" },
    { id: "to_relaunch", label: "À relancer", value: kpis.relaunchCandidates, icon: UserPlus, tone: "var(--danger)" },
    { id: "all-value", label: "LTV moyen", value: `${kpis.avgLtv} MAD`, icon: BarChart3, tone: "var(--text)" },
  ] as const;

  return (
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
      {items.map((item) => {
        const canClick = item.id === "vip" || item.id === "recurring" || item.id === "dormant" || item.id === "to_relaunch" || item.id === "all";
        return (
          <button
            key={item.id}
            type="button"
            className="luxury-card"
            onClick={() => {
              if (!onSelect || !canClick) return;
              onSelect(item.id as "vip" | "recurring" | "dormant" | "to_relaunch" | "all");
            }}
            style={{
              padding: "14px 14px",
              borderRadius: 16,
              textAlign: "left",
              cursor: canClick ? "pointer" : "default",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: "var(--text-dim)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.label}
              </span>
              <item.icon size={14} style={{ color: item.tone }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{item.value}</div>
          </button>
        );
      })}
    </section>
  );
}

