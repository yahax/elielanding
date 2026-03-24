"use client";

import type { NotificationItem as NotificationItemType } from "@/lib/os/live/types";
import { NotificationItem } from "@/components/os/notifications/NotificationItem";

export function NotificationList({
  items,
  onRead,
}: {
  items: NotificationItemType[];
  onRead: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div
        className="os-empty-inline"
        style={{
          border: "1px dashed var(--border)",
          borderRadius: 14,
          padding: "28px 16px",
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-dim)",
          fontWeight: 700,
          background: "var(--surface)",
        }}
      >
        Aucune notification dans cette catégorie.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => (
        <NotificationItem key={item.id} item={item} onRead={onRead} />
      ))}
    </div>
  );
}
