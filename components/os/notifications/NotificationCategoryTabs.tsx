"use client";

import type { NotificationCategory } from "@/lib/os/live/types";

const LABELS: Record<NotificationCategory, string> = {
  all: "Toutes",
  orders: "Commandes",
  stock: "Stock",
  business: "Business",
  operators: "Opérateurs",
  system: "Système",
};

export function NotificationCategoryTabs({
  active,
  onChange,
  counts,
}: {
  active: NotificationCategory;
  onChange: (category: NotificationCategory) => void;
  counts: Record<NotificationCategory, number>;
}) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
      {(Object.keys(LABELS) as NotificationCategory[]).map((category) => {
        const isActive = category === active;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={isActive ? "btn btn-primary btn-sm" : "btn-ghost btn-sm"}
            style={{ borderRadius: 999, whiteSpace: "nowrap", height: 34 }}
          >
            {LABELS[category]} ({counts[category] || 0})
          </button>
        );
      })}
    </div>
  );
}
