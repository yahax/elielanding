"use client";

import type { ReactNode } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { LoadingSkeletonBlock } from "@/components/ui/LoadingSkeletonBlock";

interface DataStateWrapperProps {
  loading: boolean;
  error?: string | null;
  empty: boolean;
  emptyTitle: string;
  emptyCopy: string;
  loadingLabel?: string;
  onRetry?: () => void;
  useSkeleton?: boolean;
  children: ReactNode;
}

export function DataStateWrapper({
  loading,
  error,
  empty,
  emptyTitle,
  emptyCopy,
  loadingLabel,
  onRetry,
  useSkeleton = false,
  children,
}: DataStateWrapperProps) {
  if (loading) {
    if (useSkeleton) return <LoadingSkeletonBlock lines={5} />;
    return <LoadingState label={loadingLabel} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (empty) {
    return <EmptyState title={emptyTitle} copy={emptyCopy} />;
  }

  return <>{children}</>;
}

