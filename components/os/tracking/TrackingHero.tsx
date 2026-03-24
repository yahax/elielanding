"use client";

import { CalendarDays, RefreshCw } from "lucide-react";
import type { TrackingMetric } from "@/lib/os/tracking/types";

interface TrackingHeroProps {
  periodDays: 7 | 30;
  onPeriodChange: (period: 7 | 30) => void;
  onRefresh: () => void;
  refreshing?: boolean;
  metrics: TrackingMetric[];
}

export function TrackingHero({ periodDays, onPeriodChange, onRefresh, refreshing = false, metrics }: TrackingHeroProps) {
  const keyMetrics = metrics.slice(0, 4);

  return (
    <section className="luxury-card" style={{ padding: 18, borderRadius: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarDays size={15} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)" }}>
              Tracking Direction
            </span>
          </div>
          <h2 style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 900, color: "var(--text)" }}>Performance business en 20 secondes</h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-dim)", fontWeight: 700 }}>
            Vue directionnelle: conversion, annulation, revenu et vitesse opérationnelle.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="day-range-tabs">
            {[7, 30].map((value) => (
              <button
                key={value}
                type="button"
                className={value === periodDays ? "btn btn-primary btn-sm" : "btn-ghost btn-sm"}
                onClick={() => onPeriodChange(value as 7 | 30)}
              >
                {value}j
              </button>
            ))}
          </div>
          <button type="button" className="btn-ghost btn-sm btn-icon" onClick={onRefresh}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
        {keyMetrics.map((metric) => (
          <div key={metric.id} style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-elevated)", padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 900, textTransform: "uppercase" }}>{metric.label}</div>
            <div style={{ marginTop: 6, fontSize: 22, fontWeight: 900, color: "var(--text)" }}>{metric.valueLabel}</div>
            <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>{metric.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

