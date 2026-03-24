"use client";

import { formatCompactCurrencyMAD } from "@/lib/os/orders/helpers/format";
import type { OrdersSummaryStats, SummaryMetricKey } from "@/lib/os/orders/types";
import { AlertTriangle, CheckCheck, Clock3, PhoneCall, ShoppingBag, XCircle } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

interface MetricCard {
  key: SummaryMetricKey;
  label: string;
  value: number;
  icon: ReactNode;
  tone: "neutral" | "danger" | "warning" | "success";
}

const TONE_STYLE: Record<MetricCard["tone"], CSSProperties> = {
  neutral: {
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
  },
  danger: {
    border: "1px solid rgba(201, 106, 106, 0.32)",
    background: "var(--danger-soft)",
    color: "var(--danger)",
  },
  warning: {
    border: "1px solid rgba(213, 161, 62, 0.3)",
    background: "var(--warning-soft)",
    color: "var(--warning)",
  },
  success: {
    border: "1px solid rgba(47, 143, 99, 0.3)",
    background: "var(--success-soft)",
    color: "var(--success)",
  },
};

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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 10,
      }}
    >
      {metrics.map((metric) => {
        const active = activeMetric === metric.key;

        return (
          <button
            type="button"
            key={metric.key}
            onClick={() => onMetricClick(metric.key)}
            style={{
              textAlign: "left",
              borderRadius: 14,
              padding: "12px 14px",
              cursor: "pointer",
              transition: "all .2s ease",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              ...TONE_STYLE[metric.tone],
              boxShadow: active ? "0 8px 20px rgba(30,26,23,0.08)" : "none",
              transform: active ? "translateY(-1px)" : "none",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: "0.05em" }}>
              {metric.icon}
              {metric.label}
            </span>
            <span style={{ fontSize: 24, fontWeight: 900, lineHeight: 1, color: "var(--text)" }}>{metric.value}</span>
          </button>
        );
      })}

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "12px 14px",
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", letterSpacing: "0.05em" }}>Panier moyen estimé</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>{formatCompactCurrencyMAD(stats.avgBasket)}</span>
      </div>
    </div>
  );
}
