"use client";

interface CustomerValueBadgeProps {
  score: number;
  totalSpent: number;
}

function resolveTone(score: number): { bg: string; border: string; color: string; label: string } {
  if (score >= 80) {
    return {
      bg: "var(--gold-glow)",
      border: "var(--gold-border)",
      color: "var(--gold)",
      label: "Valeur élevée",
    };
  }

  if (score >= 55) {
    return {
      bg: "var(--success-soft)",
      border: "rgba(47, 143, 99, 0.22)",
      color: "var(--success)",
      label: "Valeur solide",
    };
  }

  return {
    bg: "var(--bg-elevated)",
    border: "var(--border)",
    color: "var(--text-dim)",
    label: "Valeur standard",
  };
}

export function CustomerValueBadge({ score, totalSpent }: CustomerValueBadgeProps) {
  const tone = resolveTone(score);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        padding: "5px 10px",
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        color: tone.color,
        fontSize: 11,
        fontWeight: 900,
      }}
      title={`${tone.label} · ${totalSpent} MAD`}
    >
      {score}/100
    </span>
  );
}

