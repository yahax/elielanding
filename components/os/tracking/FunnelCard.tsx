"use client";

import type { FunnelStage } from "@/lib/os/tracking/types";

interface FunnelCardProps {
  stages: FunnelStage[];
}

function toneColor(tone: FunnelStage["tone"]): string {
  switch (tone) {
    case "success":
      return "var(--success)";
    case "warning":
      return "var(--warning)";
    case "danger":
      return "var(--danger)";
    case "neutral":
    default:
      return "var(--text-dim)";
  }
}

export function FunnelCard({ stages }: FunnelCardProps) {
  return (
    <section className="luxury-card" style={{ padding: 16, borderRadius: 18 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", fontWeight: 900, marginBottom: 12 }}>
        Funnel Business
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {stages.map((stage) => (
          <div key={stage.id} className="funnel-step" style={{ marginBottom: 0 }}>
            <span className="funnel-label">{stage.label}</span>
            <div className="funnel-bar-wrap">
              <div
                className="funnel-bar-fill"
                style={{
                  width: `${Math.max(3, stage.rate)}%`,
                  background: toneColor(stage.tone),
                }}
              />
            </div>
            <span className="funnel-value">
              {stage.count} · {stage.rate}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

