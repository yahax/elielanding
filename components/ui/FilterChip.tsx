"use client";

import type { ReactNode } from "react";

interface FilterChipProps {
  label: ReactNode;
  active?: boolean;
  onClick?: () => void;
  count?: number;
  className?: string;
  title?: string;
}

export function FilterChip({ label, active = false, onClick, count, className = "", title }: FilterChipProps) {
  const classes = `os-chip ${active ? "is-active" : ""} ${className}`.trim();

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} title={title} aria-pressed={active}>
        <span>{label}</span>
        {count != null ? <span className="os-chip-count">{count}</span> : null}
      </button>
    );
  }

  return (
    <span className={classes} title={title}>
      <span>{label}</span>
      {count != null ? <span className="os-chip-count">{count}</span> : null}
    </span>
  );
}
