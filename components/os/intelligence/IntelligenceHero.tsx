"use client";

import { Brain, Lightbulb, ShieldAlert, Siren, TrendingUp } from "lucide-react";
import type { IntelligenceSummary } from "@/lib/os/intelligence/types";

interface IntelligenceHeroProps {
  summary: IntelligenceSummary;
}

export function IntelligenceHero({ summary }: IntelligenceHeroProps) {
  const cards = [
    { label: "Urgents", value: summary.urgentCount, icon: Siren, tone: "var(--danger)" },
    { label: "Opportunités", value: summary.opportunityCount, icon: Lightbulb, tone: "var(--gold)" },
    { label: "Risques", value: summary.riskCount, icon: ShieldAlert, tone: "var(--warning)" },
    { label: "Croissance", value: summary.growthCount, icon: TrendingUp, tone: "var(--success)" },
  ];

  return (
    <section className="luxury-card" style={{ padding: 18, borderRadius: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Brain size={16} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", fontWeight: 900 }}>
              Intelligence Layer
            </span>
          </div>
          <h2 style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 900, color: "var(--text)" }}>
            {summary.totalInsights} insights décisionnels actifs
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-dim)", fontWeight: 700 }}>{summary.headline}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, minWidth: 260, flex: "1 1 320px" }}>
          {cards.map((card) => (
            <div key={card.label} style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-elevated)", padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {card.label}
                </span>
                <card.icon size={13} style={{ color: card.tone }} />
              </div>
              <div style={{ marginTop: 4, fontSize: 20, fontWeight: 900, color: "var(--text)" }}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

