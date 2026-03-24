"use client";

import type { LiveEvent } from "@/lib/os/live/types";
import { formatNotificationTime } from "@/lib/os/live/helpers";
import { SeverityPill } from "@/components/os/live/SeverityPill";
import Link from "next/link";

export function RealtimeFeedCard({ event }: { event: LiveEvent }) {
  return (
    <article
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--surface)",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <SeverityPill severity={event.severity} compact />
        <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 700 }}>{formatNotificationTime(event.createdAt)}</span>
      </div>

      <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>{event.title}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{event.message}</div>

      {event.link ? (
        <Link href={event.link} style={{ fontSize: 11, fontWeight: 800, color: "var(--gold)", textDecoration: "none" }}>
          Ouvrir
        </Link>
      ) : null}
    </article>
  );
}
