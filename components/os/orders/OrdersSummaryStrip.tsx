"use client";

import { formatCompactCurrencyMAD } from "@/lib/os/orders/helpers/format";
import type { OrdersSummaryStats, SummaryMetricKey } from "@/lib/os/orders/types";
import { AlertTriangle, CheckCheck, Clock3, PhoneCall, ShoppingBag, XCircle } from "lucide-react";
import type { ReactNode } from "react";

interface MetricCard {
  key: SummaryMetricKey;
  label: string;
  value: number;
  icon: ReactNode;
  tone: "neutral" | "danger" | "warning" | "success";
}

export function OrdersSummaryStrip({
  stats,
  activeMetric,
  onMetricClick,
}: {
  stats: OrdersSummaryStats;
  activeMetric: SummaryMetricKey | null;
  onMetricClick: (metric: SummaryMetricKey) => void;
}) {
  const metrics: MetricCard[] = [
    {
      key: "new_orders",
      label: "Nouvelles",
      value: stats.newOrders,
      icon: <ShoppingBag size={14} />,
      tone: "neutral",
    },
    {
      key: "to_confirm",
      label: "À confirmer",
      value: stats.toConfirm,
      icon: <Clock3 size={14} />,
      tone: "warning",
    },
    {
      key: "callbacks",
      label: "Callbacks",
      value: stats.callbacks,
      icon: <PhoneCall size={14} />,
      tone: "warning",
    },
    {
      key: "urgent",
      label: "Urgentes",
      value: stats.urgent,
      icon: <AlertTriangle size={14} />,
      tone: "danger",
    },
    {
      key: "confirmed_today",
      label: "Confirmées aujourd'hui",
      value: stats.confirmedToday,
      icon: <CheckCheck size={14} />,
      tone: "success",
    },
    {
      key: "canceled_today",
      label: "Annulées aujourd'hui",
      value: stats.canceledToday,
      icon: <XCircle size={14} />,
      tone: "danger",
    },
  ];

  return (
    <div className="os-kpi-grid">
      {metrics.map((metric) => {
        const active = activeMetric === metric.key;

        return (
          <button
            type="button"
            key={metric.key}
            onClick={() => onMetricClick(metric.key)}
            className={`os-kpi-card os-kpi-tone-${metric.tone} ${active ? "is-active" : ""}`}
          >
            <span className="os-kpi-head">
              {metric.icon}
              {metric.label}
            </span>
            <span className="os-kpi-value">{metric.value}</span>
          </button>
        );
      })}

      <div className="os-kpi-card os-kpi-tone-neutral">
        <span className="os-kpi-head">Panier moyen estimé</span>
        <span className="os-kpi-value" style={{ fontSize: 20 }}>{formatCompactCurrencyMAD(stats.avgBasket)}</span>
      </div>
    </div>
  );
}
