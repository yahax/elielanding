"use client";

import { BarChart3, Clock3, Crown, Repeat2, UserPlus, Users } from "lucide-react";
import type { CustomerKpis } from "@/lib/os/crm/types";

interface ClientsKpiStripProps {
  kpis: CustomerKpis;
  onSelect?: (key: "vip" | "recurring" | "dormant" | "to_relaunch" | "all") => void;
}

export function ClientsKpiStrip({ kpis, onSelect }: ClientsKpiStripProps) {
  const items = [
    { id: "all", label: "Total clients", value: kpis.totalCustomers, icon: Users, toneClass: "os-kpi-tone-neutral" },
    { id: "vip", label: "VIP", value: kpis.vipCustomers, icon: Crown, toneClass: "os-kpi-tone-warning" },
    { id: "recurring", label: "Récurrents", value: kpis.recurringCustomers, icon: Repeat2, toneClass: "os-kpi-tone-success" },
    { id: "dormant", label: "Dormants", value: kpis.dormantCustomers, icon: Clock3, toneClass: "os-kpi-tone-warning" },
    { id: "to_relaunch", label: "À relancer", value: kpis.relaunchCandidates, icon: UserPlus, toneClass: "os-kpi-tone-danger" },
    { id: "all-value", label: "LTV moyen", value: `${kpis.avgLtv} MAD`, icon: BarChart3, toneClass: "os-kpi-tone-neutral" },
  ] as const;

  return (
    <section className="os-kpi-grid">
      {items.map((item) => {
        const canClick = item.id === "vip" || item.id === "recurring" || item.id === "dormant" || item.id === "to_relaunch" || item.id === "all";
        return (
          <button
            key={item.id}
            type="button"
            className={`os-kpi-card ${item.toneClass}`}
            onClick={() => {
              if (!onSelect || !canClick) return;
              onSelect(item.id as "vip" | "recurring" | "dormant" | "to_relaunch" | "all");
            }}
            style={{
              textAlign: "left",
              cursor: canClick ? "pointer" : "default",
            }}
          >
            <div className="os-kpi-head" style={{ justifyContent: "space-between" }}>
              <span>{item.label}</span>
              <item.icon size={14} />
            </div>
            <div className="os-kpi-value">{item.value}</div>
          </button>
        );
      })}
    </section>
  );
}
