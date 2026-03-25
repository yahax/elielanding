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
    <div className="os-notification-tabs">
      {(Object.keys(LABELS) as NotificationCategory[]).map((category) => {
        const isActive = category === active;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={isActive ? "btn btn-primary btn-sm os-notification-tab is-active" : "btn-ghost btn-sm os-notification-tab"}
          >
            {LABELS[category]} ({counts[category] || 0})
          </button>
        );
      })}
    </div>
  );
}
