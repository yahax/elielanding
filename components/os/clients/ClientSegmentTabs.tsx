"use client";

import { CUSTOMER_SEGMENT_LABELS } from "@/lib/os/crm/helpers";
import type { CustomerSegment } from "@/lib/os/crm/types";

type SegmentTab = "all" | CustomerSegment;
type SegmentCounts = Record<SegmentTab, number>;

interface ClientSegmentTabsProps {
  active: SegmentTab;
  counts: SegmentCounts;
  onChange: (value: SegmentTab) => void;
}

const ORDERED_SEGMENTS: SegmentTab[] = [
  "all",
  "vip",
  "recurring",
  "new",
  "dormant",
  "to_relaunch",
  "at_risk",
  "cancel_prone",
  "high_value",
];

function getLabel(segment: SegmentTab): string {
  if (segment === "all") return "Tous";
  return CUSTOMER_SEGMENT_LABELS[segment];
}

export function ClientSegmentTabs({ active, counts, onChange }: ClientSegmentTabsProps) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
      {ORDERED_SEGMENTS.map((segment) => {
        const selected = active === segment;
        return (
          <button
            type="button"
            key={segment}
            onClick={() => onChange(segment)}
            style={{
              borderRadius: 999,
              border: selected ? "1px solid var(--gold-border)" : "1px solid var(--border)",
              background: selected ? "var(--gold-glow)" : "var(--surface)",
              color: selected ? "var(--gold)" : "var(--text-dim)",
              padding: "7px 11px",
              fontSize: 12,
              fontWeight: 900,
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            <span>{getLabel(segment)}</span>
            <span
              style={{
                borderRadius: 999,
                padding: "1px 7px",
                fontSize: 10,
                background: selected ? "rgba(201, 168, 106, 0.18)" : "var(--bg-elevated)",
                color: selected ? "var(--gold)" : "var(--text-dim)",
                border: "1px solid var(--border)",
              }}
            >
              {counts[segment] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

