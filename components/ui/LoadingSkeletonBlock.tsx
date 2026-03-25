"use client";

interface LoadingSkeletonBlockProps {
  lines?: number;
  height?: number;
  compact?: boolean;
}

export function LoadingSkeletonBlock({ lines = 4, height = 14, compact = false }: LoadingSkeletonBlockProps) {
  const widthSteps = [96, 88, 80, 72, 64, 56];

  return (
    <div
      className="luxury-card os-skeleton-card os-skeleton-card-premium"
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
          className="os-skeleton-line os-skeleton-line-premium"
          style={{
            height: index === 0 ? height + 2 : height,
            width: `${widthSteps[index % widthSteps.length]}%`,
          }}
        />
      ))}
    </div>
  );
}
