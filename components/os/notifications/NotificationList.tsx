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
      <div className="os-empty-inline os-notification-empty">
        Aucune notification dans cette catégorie.
      </div>
    );
  }

  return (
    <div className="os-notification-list">
      {items.map((item) => (
        <NotificationItem key={item.id} item={item} onRead={onRead} />
      ))}
    </div>
  );
}
