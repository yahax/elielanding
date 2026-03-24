"use client";

import type { TrackingBreakdown } from "@/lib/os/tracking/types";

interface PerformanceBreakdownCardProps {
  breakdown: TrackingBreakdown;
}

export function PerformanceBreakdownCard({ breakdown }: PerformanceBreakdownCardProps) {
  const top = breakdown.rows[0]?.orders ?? 1;

  return (
    <section className="luxury-card" style={{ padding: 16, borderRadius: 18 }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", fontWeight: 900 }}>{breakdown.title}</div>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>{breakdown.description}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {breakdown.rows.map((row) => (
          <div key={row.id} style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-elevated)", padding: "8px 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>{row.label}</span>
              <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 800 }}>{row.orders} cmd</span>
            </div>
            <div style={{ marginTop: 6, height: 7, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(4, Math.round((row.orders / top) * 100))}%`, height: "100%", background: "var(--gold)" }} />
            </div>
            <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>
              <span>Conf {row.confirmationRate}%</span>
              <span>Annulées {row.canceled}</span>
              <span>{row.revenue} MAD</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

