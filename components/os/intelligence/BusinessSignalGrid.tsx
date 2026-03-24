"use client";

import type { BusinessSignal } from "@/lib/os/intelligence/types";

interface BusinessSignalGridProps {
  signals: BusinessSignal[];
}

function toneColor(tone: BusinessSignal["tone"]): string {
  switch (tone) {
    case "success":
      return "var(--success)";
    case "warning":
      return "var(--warning)";
    case "danger":
      return "var(--danger)";
    case "gold":
      return "var(--gold)";
    case "neutral":
    default:
      return "var(--text)";
  }
}

export function BusinessSignalGrid({ signals }: BusinessSignalGridProps) {
  return (
    <section className="luxury-card" style={{ padding: 16, borderRadius: 18 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", fontWeight: 900, marginBottom: 12 }}>
        Business Signals
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        {signals.map((signal) => (
          <div key={signal.id} style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-elevated)", padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 800 }}>{signal.label}</div>
            <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900, color: toneColor(signal.tone) }}>{signal.value}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>{signal.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

