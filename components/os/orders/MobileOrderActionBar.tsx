"use client";

import { Filter, Layers, RefreshCw } from "lucide-react";

export function MobileOrderActionBar({
  selectedCount,
  onOpenFilters,
  onOpenViews,
  onRefresh,
  refreshing,
}: {
  selectedCount: number;
  onOpenFilters: () => void;
  onOpenViews: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(12px + var(--safe-bottom))",
        zIndex: 55,
        borderRadius: 16,
        border: "1px solid var(--border)",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 10px 30px rgba(30,26,23,0.1)",
        padding: "8px 10px",
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 8,
      }}
    >
      <button type="button" className="btn-ghost btn-sm" style={{ justifyContent: "center" }} onClick={onOpenFilters}>
        <Filter size={14} />
        Filtres
      </button>
      <button type="button" className="btn-ghost btn-sm" style={{ justifyContent: "center" }} onClick={onOpenViews}>
        <Layers size={14} />
        Vues ({selectedCount})
      </button>
      <button type="button" className="btn btn-primary btn-sm" style={{ justifyContent: "center" }} onClick={onRefresh}>
        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        Sync
      </button>
    </div>
  );
}
