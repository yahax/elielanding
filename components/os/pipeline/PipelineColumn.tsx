"use client";

import { useDroppable } from "@dnd-kit/core";
import { Clock3, Flame, TimerReset } from "lucide-react";
import { formatElapsedMinutes } from "@/lib/os/orders/helpers/format";
import type { PipelineColumnType } from "@/lib/os/orders/types";
import { STATUS_LABELS } from "@/lib/types";
import type { ReactNode } from "react";

export function PipelineColumn({
  status,
  count,
  urgentCount,
  avgElapsedMinutes,
  stagnationCount,
  children,
}: {
  status: PipelineColumnType;
  count: number;
  urgentCount: number;
  avgElapsedMinutes: number;
  stagnationCount: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      style={{
        width: 320,
        minWidth: 320,
        borderRadius: 20,
        border: isOver ? "1px dashed var(--gold)" : "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        transition: "all .2s ease",
        boxShadow: isOver ? "0 10px 24px rgba(201,168,106,0.16)" : "none",
      }}
    >
      <div style={{ borderBottom: "1px solid var(--border)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 12, fontWeight: 900, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--text)" }}>
            {STATUS_LABELS[status]}
          </h3>
          <span style={{ fontSize: 11, fontWeight: 900, borderRadius: 999, padding: "3px 10px", background: "var(--gold-glow)", border: "1px solid var(--gold-border)", color: "var(--gold)" }}>
            {count}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
            <Flame size={11} />
            {urgentCount}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
            <Clock3 size={11} />
            {formatElapsedMinutes(avgElapsedMinutes)}
          </div>
          <div style={{ fontSize: 10, color: stagnationCount > 0 ? "var(--danger)" : "var(--text-dim)", fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
            <TimerReset size={11} />
            {stagnationCount}
          </div>
        </div>
      </div>

      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 10, minHeight: 120, flex: 1, overflowY: "auto" }}>{children}</div>
    </section>
  );
}
