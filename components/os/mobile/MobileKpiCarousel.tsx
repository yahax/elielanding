"use client";

import type { CSSProperties } from "react";

interface MobileKpi {
  id: string;
  label: string;
  value: string | number;
  tone?: "neutral" | "gold" | "success" | "warning" | "danger";
}

function cardTone(tone: MobileKpi["tone"]): CSSProperties {
  switch (tone) {
    case "danger":
      return { border: "1px solid rgba(201,106,106,0.32)", background: "var(--danger-soft)" };
    case "warning":
      return { border: "1px solid rgba(213,161,62,0.3)", background: "var(--warning-soft)" };
    case "success":
      return { border: "1px solid rgba(47,143,99,0.3)", background: "var(--success-soft)" };
    case "gold":
      return { border: "1px solid var(--gold-border)", background: "var(--gold-glow)" };
    case "neutral":
    default:
      return { border: "1px solid var(--border)", background: "var(--surface)" };
  }
}

export function MobileKpiCarousel({ items }: { items: MobileKpi[] }) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
      {items.map((item) => (
        <article
          key={item.id}
          style={{
            minWidth: 138,
            borderRadius: 12,
            padding: "10px 11px",
            ...cardTone(item.tone),
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-dim)", letterSpacing: "0.07em", textTransform: "uppercase" }}>{item.label}</div>
          <div style={{ marginTop: 6, fontSize: 22, lineHeight: 1, fontWeight: 900, color: "var(--text)" }}>{item.value}</div>
        </article>
      ))}
    </div>
  );
}
