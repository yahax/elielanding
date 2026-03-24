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
      className="os-interactive-card"
      style={{
        border: "1px solid var(--border)",
        borderRadius: 14,
        background: item.read ? "var(--surface)" : "color-mix(in srgb, var(--gold-glow) 35%, var(--surface))",
        padding: "12px 13px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <SeverityPill severity={item.severity} compact />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!item.read ? <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)" }} /> : null}
          <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 700 }}>{formatNotificationTime(item.createdAt)}</span>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{item.title}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{item.message}</div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Link
          href={item.link}
          onClick={() => onRead(item.id)}
          style={{ fontSize: 11, fontWeight: 800, color: "var(--gold)", textDecoration: "none" }}
          aria-label={`Ouvrir ${item.title}`}
        >
          Ouvrir
        </Link>
        {!item.read ? (
          <button type="button" className="btn-ghost btn-sm" style={{ height: 30 }} onClick={() => onRead(item.id)}>
            <Check size={13} />
            Marquer lu
          </button>
        ) : null}
      </div>
    </article>
  );
}
