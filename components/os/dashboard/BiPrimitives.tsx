"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, TrendingUp } from "lucide-react";

const fmt = new Intl.NumberFormat("fr-MA");

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ segments, size = 160 }: { segments: DonutSegment[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="bi-empty-chart" style={{ width: size, height: size }}>
        <span>Aucune donnée</span>
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const circumference = 2 * Math.PI * r;
  const arcSegments = segments.map((seg, index) => {
    const pct = seg.value / total;
    const dash = circumference * pct;
    const gap = circumference - dash;
    const previousDash = segments
      .slice(0, index)
      .reduce((sum, previous) => sum + (circumference * previous.value) / total, 0);

    return {
      seg,
      dash,
      gap,
      offset: previousDash,
    };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcSegments.map(({ seg, dash, gap, offset }) => {
          return (
            <circle
              key={seg.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={size * 0.12}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease" }}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text)" fontSize={size * 0.14} fontWeight={800}>
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-dim)" fontSize={size * 0.075} fontWeight={700}>
          commandes
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {segments.filter((s) => s.value > 0).map((seg) => (
          <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>
              {seg.label}: <strong style={{ color: "var(--text)" }}>{seg.value}</strong>
              <span style={{ opacity: 0.6, marginLeft: 4 }}>({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {steps.map((step) => {
        const pct = Math.max(4, (step.value / max) * 100);
        return (
          <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", width: 90, textAlign: "right", flexShrink: 0 }}>
              {step.label}
            </span>
            <div style={{ flex: 1, height: 22, background: "var(--surface)", borderRadius: 6, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: step.color,
                  borderRadius: 6,
                  transition: "width 0.6s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 8,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 900, color: "#fff" }}>{step.value}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BiRankingList({ title, items, emptyMessage }: { title: string; items: { label: string; value: number; suffix?: string }[]; emptyMessage: string }) {
  return (
    <div className="bi-ranking-card">
      <div className="bi-ranking-title">{title}</div>
      {items.length === 0 ? (
        <div className="bi-empty-small">{emptyMessage}</div>
      ) : (
        <div className="bi-ranking-list">
          {items.slice(0, 5).map((item, i) => (
            <div key={item.label} className="bi-ranking-row">
              <span className="bi-ranking-rank">#{i + 1}</span>
              <span className="bi-ranking-label">{item.label}</span>
              <span className="bi-ranking-value">{fmt.format(item.value)}{item.suffix || ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface BiKpiProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  tone?: "gold" | "success" | "warning" | "danger" | "info" | "neutral";
  sub?: string;
  href?: string;
}

export function BiKpiCard({ label, value, unit, icon, tone = "neutral", sub, href }: BiKpiProps) {
  const content = (
    <div className={`bi-kpi-card bi-kpi-${tone}`}>
      <div className="bi-kpi-icon">{icon}</div>
      <div className="bi-kpi-body">
        <div className="bi-kpi-label">{label}</div>
        <div className="bi-kpi-value">
          {value}
          {unit && <span className="bi-kpi-unit"> {unit}</span>}
        </div>
        {sub && <div className="bi-kpi-sub">{sub}</div>}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>{content}</Link>;
  }
  return content;
}

export function UrgentTable({ alerts }: { alerts: { id: string; label: string; count: number; tone: string; href: string }[] }) {
  const hasUrgent = alerts.some((a) => a.count > 0);

  return (
    <div className="bi-urgent-card">
      <div className="bi-section-title">
        <AlertTriangle size={14} style={{ color: "var(--warning)" }} />
        À traiter maintenant
      </div>
      {!hasUrgent ? (
        <div className="bi-empty-state">
          <CheckCircle2 size={20} style={{ color: "var(--success)", opacity: 0.7 }} />
          <span>Aucune urgence — tout est sous contrôle</span>
        </div>
      ) : (
        <div className="bi-urgent-list">
          {alerts.filter((a) => a.count > 0).map((alert) => (
            <Link key={alert.id} href={alert.href} className={`bi-urgent-row bi-urgent-${alert.tone}`}>
              <span className="bi-urgent-label">{alert.label}</span>
              <span className="bi-urgent-count">{alert.count}</span>
              <ArrowRight size={12} style={{ opacity: 0.5 }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function RealActivityFeed({ items }: { items: { id: string; label: string; meta?: string; time: string; isNew?: boolean }[] }) {
  return (
    <div className="bi-activity-card">
      <div className="bi-section-title">
        <TrendingUp size={14} style={{ color: "var(--gold)" }} />
        Activité récente
      </div>
      {items.length === 0 ? (
        <div className="bi-empty-state">
          <Clock size={18} style={{ color: "var(--text-dim)", opacity: 0.5 }} />
          <span>Aucune activité récente</span>
        </div>
      ) : (
        <div className="bi-activity-list">
          {items.slice(0, 6).map((item) => (
            <div key={item.id} className={`bi-activity-row ${item.isNew ? "bi-activity-new" : ""}`}>
              <div className="bi-activity-dot" />
              <div style={{ flex: 1 }}>
                <div className="bi-activity-label">{item.label}</div>
                {item.meta && <div className="bi-activity-meta">{item.meta}</div>}
              </div>
              <div className="bi-activity-time">{item.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
