"use client";

import type { PipelineHealth } from "@/lib/os/orders/types";
import { AlertTriangle, Gauge, Layers, TrendingUp, Zap } from "lucide-react";
import { STATUS_LABELS } from "@/lib/types";
import type { CSSProperties, ReactNode } from "react";

interface HealthPill {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone: "neutral" | "danger" | "warning" | "success";
}

function toneStyles(tone: HealthPill["tone"]): CSSProperties {
  switch (tone) {
    case "danger":
      return {
        border: "1px solid rgba(201, 106, 106, 0.3)",
        background: "var(--danger-soft)",
        color: "var(--danger)",
      };
    case "warning":
      return {
        border: "1px solid rgba(213, 161, 62, 0.3)",
        background: "var(--warning-soft)",
        color: "var(--warning)",
      };
    case "success":
      return {
        border: "1px solid rgba(47, 143, 99, 0.3)",
        background: "var(--success-soft)",
        color: "var(--success)",
      };
    case "neutral":
    default:
      return {
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text)",
      };
  }
}

export function PipelineHealthHeader({
  health,
  onShowUrgent,
}: {
  health: PipelineHealth;
  onShowUrgent: () => void;
}) {
  const pills: HealthPill[] = [
    { label: "Total en cours", value: health.totalInProgress, icon: <Layers size={14} />, tone: "neutral" },
    { label: "Stagnantes", value: health.stagnating, icon: <AlertTriangle size={14} />, tone: health.stagnating > 0 ? "danger" : "neutral" },
    { label: "Urgentes", value: health.urgent, icon: <Zap size={14} />, tone: health.urgent > 0 ? "warning" : "neutral" },
    { label: "Taux progression", value: `${health.progressionRate}%`, icon: <TrendingUp size={14} />, tone: "success" },
    {
      label: "Colonne bloquée",
      value: health.blockedColumn ? `${STATUS_LABELS[health.blockedColumn]} (${health.blockedColumnCount})` : "Aucune",
      icon: <Gauge size={14} />,
      tone: health.blockedColumn ? "danger" : "neutral",
    },
  ];

  return (
    <div className="luxury-card" style={{ borderRadius: 20, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.09em" }}>Pipeline Health</div>
          <div style={{ marginTop: 2, fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>Lecture instantanée des blocages et urgences</div>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={onShowUrgent}>
          Voir urgentes
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        {pills.map((pill) => (
          <div
            key={pill.label}
            style={{
              borderRadius: 12,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              ...toneStyles(pill.tone),
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>{pill.label}</div>
              <div style={{ marginTop: 4, fontSize: 15, fontWeight: 900, color: "var(--text)" }}>{pill.value}</div>
            </div>
            <div style={{ opacity: 0.8 }}>{pill.icon}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
