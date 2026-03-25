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
    <div className="os-segmented" style={{ overflowX: "auto", width: "fit-content", maxWidth: "100%" }}>
      {ORDERED_SEGMENTS.map((segment) => {
        const selected = active === segment;
        return (
          <button
            type="button"
            key={segment}
            onClick={() => onChange(segment)}
            className={`os-segmented-btn ${selected ? "is-active" : ""}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}
          >
            <span>{getLabel(segment)}</span>
            <span className="os-chip-count">
              {counts[segment] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
