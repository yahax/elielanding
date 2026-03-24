"use client";

import Link from "next/link";
import { ArrowRight, CircleAlert, ShieldAlert, Sparkles, TrendingUp, Zap } from "lucide-react";
import type { BusinessInsight } from "@/lib/os/intelligence/types";

interface DecisionInsightCardProps {
  insight: BusinessInsight;
}

function priorityTone(priority: BusinessInsight["priority"]): { bg: string; border: string; color: string } {
  switch (priority) {
    case "critical":
      return { bg: "var(--danger-soft)", border: "rgba(201, 106, 106, 0.3)", color: "var(--danger)" };
    case "high":
      return { bg: "var(--warning-soft)", border: "rgba(213, 161, 62, 0.3)", color: "var(--warning)" };
    case "medium":
      return { bg: "var(--gold-glow)", border: "var(--gold-border)", color: "var(--gold)" };
    case "low":
    default:
      return { bg: "var(--bg-elevated)", border: "var(--border)", color: "var(--text-dim)" };
  }
}

const CATEGORY_ICONS = {
  urgent: Zap,
  risk: ShieldAlert,
  growth: TrendingUp,
  retention: CircleAlert,
  opportunity: Sparkles,
} as const;

export function DecisionInsightCard({ insight }: DecisionInsightCardProps) {
  const tone = priorityTone(insight.priority);
  const Icon = CATEGORY_ICONS[insight.category];

  return (
    <article className="luxury-card" style={{ padding: 16, borderRadius: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              border: `1px solid ${tone.border}`,
              background: tone.bg,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={14} style={{ color: tone.color }} />
          </span>
          <span style={{ fontSize: 11, fontWeight: 900, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {insight.category}
          </span>
        </div>
        <span
          style={{
            borderRadius: 999,
            border: `1px solid ${tone.border}`,
            background: tone.bg,
            color: tone.color,
            fontSize: 10,
            fontWeight: 900,
            padding: "4px 9px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {insight.priority}
        </span>
      </div>

      <h3 style={{ margin: "10px 0 0", fontSize: 16, fontWeight: 900, color: "var(--text)", lineHeight: 1.35 }}>{insight.title}</h3>
      <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-dim)", fontWeight: 700, lineHeight: 1.6 }}>{insight.explanation}</p>

      <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>
            {insight.impactLabel}
          </span>
          <span className="badge" style={{ background: "var(--gold-glow)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}>
            {insight.impactValue}/100
          </span>
          {insight.metricLabel && insight.metricValue ? (
            <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>
              {insight.metricLabel}: {insight.metricValue}
            </span>
          ) : null}
        </div>

        <Link href={insight.ctaHref} className="btn-ghost btn-sm" style={{ textDecoration: "none" }}>
          {insight.ctaLabel}
          <ArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
}
