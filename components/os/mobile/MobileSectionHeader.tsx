"use client";

export function MobileSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "var(--text)" }}>{title}</h3>
      {actionLabel && onAction ? (
        <button type="button" className="btn-ghost btn-sm" style={{ height: 30 }} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
