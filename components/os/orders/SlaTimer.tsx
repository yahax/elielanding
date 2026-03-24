"use client";

import { Clock3 } from "lucide-react";
import type { SlaLevel } from "@/lib/os/orders/types";
import { formatElapsedMinutes } from "@/lib/os/orders/helpers/format";
import { SLA_LABELS } from "@/lib/os/orders/helpers/status";
import type { CSSProperties } from "react";

const SLA_STYLE: Record<SlaLevel, CSSProperties> = {
  normal: {
    color: "var(--text-muted)",
  },
  attention: {
    color: "var(--warning)",
  },
  critical: {
    color: "var(--danger)",
  },
};

export function SlaTimer({
  elapsedMinutes,
  slaMinutes,
  level,
  compact = false,
}: {
  elapsedMinutes: number;
  slaMinutes: number;
  level: SlaLevel;
  compact?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontWeight: 700,
        fontSize: compact ? 11 : 12,
        fontVariantNumeric: "tabular-nums",
        ...SLA_STYLE[level],
      }}
      title={`${SLA_LABELS[level]} · SLA ${formatElapsedMinutes(slaMinutes)}`}
    >
      <Clock3 size={compact ? 12 : 13} />
      {formatElapsedMinutes(elapsedMinutes)}
    </span>
  );
}
