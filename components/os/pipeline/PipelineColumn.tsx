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
      className={`os-pipeline-column ${isOver ? "is-over" : ""}`}
      style={{
        borderStyle: isOver ? "dashed" : "solid",
      }}
    >
      <div className="os-pipeline-column-head">
        <div className="os-pipeline-column-title-row">
          <h3 className="os-pipeline-column-title">
            {STATUS_LABELS[status]}
          </h3>
          <span className="os-pipeline-column-count">
            {count}
          </span>
        </div>

        <div className="os-pipeline-column-stats">
          <div className="os-pipeline-column-stat">
            <Flame size={11} />
            {urgentCount}
          </div>
          <div className="os-pipeline-column-stat">
            <Clock3 size={11} />
            {formatElapsedMinutes(avgElapsedMinutes)}
          </div>
          <div className={`os-pipeline-column-stat ${stagnationCount > 0 ? "is-danger" : ""}`}>
            <TimerReset size={11} />
            {stagnationCount}
          </div>
        </div>
      </div>

      <div className="os-pipeline-column-body">{children}</div>
    </section>
  );
}
