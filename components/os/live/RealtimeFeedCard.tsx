"use client";

import type { LiveEvent } from "@/lib/os/live/types";
import { formatNotificationTime } from "@/lib/os/live/helpers";
import { SeverityPill } from "@/components/os/live/SeverityPill";
import Link from "next/link";

export function RealtimeFeedCard({ event }: { event: LiveEvent }) {
  return (
    <article className="os-realtime-feed-card">
      <div className="os-realtime-feed-card-top">
        <SeverityPill severity={event.severity} compact />
        <span className="os-realtime-feed-card-time">{formatNotificationTime(event.createdAt)}</span>
      </div>

      <div className="os-realtime-feed-card-title">{event.title}</div>
      <div className="os-realtime-feed-card-message">{event.message}</div>

      {event.link ? (
        <Link href={event.link} className="os-realtime-feed-card-link">
          Ouvrir
        </Link>
      ) : null}
    </article>
  );
}
