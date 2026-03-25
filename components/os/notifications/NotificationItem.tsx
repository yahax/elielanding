"use client";

import Link from "next/link";
import type { NotificationItem as NotificationItemType } from "@/lib/os/live/types";
import { formatNotificationTime } from "@/lib/os/live/helpers";
import { SeverityPill } from "@/components/os/live/SeverityPill";
import { Check } from "lucide-react";

export function NotificationItem({
  item,
  onRead,
}: {
  item: NotificationItemType;
  onRead: (id: string) => void;
}) {
  return (
    <article
      className={`os-interactive-card os-notification-item ${item.read ? "is-read" : "is-unread"}`}
    >
      <div className="os-notification-item-top">
        <SeverityPill severity={item.severity} compact />
        <div className="os-notification-item-meta">
          {!item.read ? <span className="os-notification-item-dot" /> : null}
          <span className="os-notification-item-time">{formatNotificationTime(item.createdAt)}</span>
        </div>
      </div>

      <div className="os-notification-item-title">{item.title}</div>
      <div className="os-notification-item-message">{item.message}</div>

      <div className="os-notification-item-actions">
        <Link
          href={item.link}
          onClick={() => onRead(item.id)}
          className="os-notification-open"
          aria-label={`Ouvrir ${item.title}`}
        >
          Ouvrir
        </Link>
        {!item.read ? (
          <button type="button" className="btn-ghost btn-sm os-notification-mark-read" onClick={() => onRead(item.id)}>
            <Check size={13} />
            Marquer lu
          </button>
        ) : null}
      </div>
    </article>
  );
}
