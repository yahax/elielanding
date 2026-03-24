"use client";

import { getInsightCategoryLabel } from "@/lib/os/intelligence/helpers";
import type { InsightCategory } from "@/lib/os/intelligence/types";

interface InsightCategoryTabsProps {
  active: InsightCategory | "all";
  counts: Record<InsightCategory | "all", number>;
  onChange: (value: InsightCategory | "all") => void;
}

const TABS: Array<InsightCategory | "all"> = ["all", "urgent", "opportunity", "risk", "growth", "retention"];

function label(category: InsightCategory | "all"): string {
  if (category === "all") return "Tous";
  return getInsightCategoryLabel(category);
}

export function InsightCategoryTabs({ active, counts, onChange }: InsightCategoryTabsProps) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
      {TABS.map((tab) => {
        const selected = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
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
            <span>{label(tab)}</span>
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
              {counts[tab] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

