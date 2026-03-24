"use client";

interface RepurchaseScoreBadgeProps {
  score: number;
  probability: number;
}

function resolveTone(score: number): { bg: string; border: string; color: string } {
  if (score >= 70) {
    return {
      bg: "var(--success-soft)",
      border: "rgba(47, 143, 99, 0.28)",
      color: "var(--success)",
    };
  }

  if (score >= 45) {
    return {
      bg: "var(--warning-soft)",
      border: "rgba(213, 161, 62, 0.28)",
      color: "var(--warning)",
    };
  }

  return {
    bg: "var(--danger-soft)",
    border: "rgba(201, 106, 106, 0.28)",
    color: "var(--danger)",
  };
}

export function RepurchaseScoreBadge({ score, probability }: RepurchaseScoreBadgeProps) {
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
      title={`Probabilité de réachat ${probability}%`}
    >
      {probability}%
    </span>
  );
}

