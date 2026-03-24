"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NarrativeInsight } from "@/lib/os/tracking/types";

interface NarrativeInsightCardProps {
  item: NarrativeInsight;
}

function borderForTone(tone: NarrativeInsight["tone"]): string {
  switch (tone) {
    case "success":
      return "rgba(47, 143, 99, 0.3)";
    case "warning":
      return "rgba(213, 161, 62, 0.3)";
    case "danger":
      return "rgba(201, 106, 106, 0.3)";
    case "gold":
      return "var(--gold-border)";
    case "neutral":
    default:
      return "var(--border)";
  }
}

export function NarrativeInsightCard({ item }: NarrativeInsightCardProps) {
  return (
    <article className="luxury-card" style={{ padding: 16, borderRadius: 16, borderColor: borderForTone(item.tone) }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)" }}>{item.title}</div>
      <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-dim)", fontWeight: 700, lineHeight: 1.6 }}>{item.body}</p>
      <div style={{ marginTop: 10 }}>
        <Link href={item.ctaHref} className="btn-ghost btn-sm" style={{ textDecoration: "none" }}>
          {item.ctaLabel}
          <ArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
}

