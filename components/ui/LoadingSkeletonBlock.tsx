"use client";

interface LoadingSkeletonBlockProps {
  lines?: number;
  height?: number;
  compact?: boolean;
}

export function LoadingSkeletonBlock({ lines = 4, height = 14, compact = false }: LoadingSkeletonBlockProps) {
  return (
    <div
      className="luxury-card"
      role="status"
      aria-live="polite"
      style={{
        padding: compact ? 12 : 16,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 8 : 10,
      }}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={`skeleton-line-${index}`}
          className="os-skeleton-line"
          style={{
            height: index === 0 ? height + 2 : height,
            width: `${Math.max(42, 100 - index * 11)}%`,
          }}
        />
      ))}
    </div>
  );
}

