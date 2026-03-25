"use client";

import type { PipelineHealth } from "@/lib/os/orders/types";
import { AlertTriangle, Gauge, Layers, TrendingUp, Zap } from "lucide-react";
import { STATUS_LABELS } from "@/lib/types";
import type { ReactNode } from "react";

interface HealthPill {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone: "neutral" | "danger" | "warning" | "success";
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
    <div className="luxury-card os-card-subtle os-pipeline-health">
      <div className="os-pipeline-health-head">
        <div>
          <div className="os-pipeline-health-title">Pipeline Health</div>
          <div className="os-pipeline-health-sub">Lecture instantanée des blocages et urgences</div>
        </div>
        <button type="button" className="btn btn-primary btn-sm os-pipeline-health-cta" onClick={onShowUrgent}>
          Voir urgentes
        </button>
      </div>

      <div className="os-kpi-grid">
        {pills.map((pill) => (
          <div
            key={pill.label}
            className={`os-kpi-card os-kpi-tone-${pill.tone} os-pipeline-health-pill`}
          >
            <div>
              <div className="os-kpi-head">{pill.label}</div>
              <div className="os-kpi-value os-pipeline-health-value">{pill.value}</div>
            </div>
            <div className="os-pipeline-health-icon">{pill.icon}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
