"use client";

import { Filter, Layers, RefreshCw, Save, Search, Users } from "lucide-react";

interface QuickFilterAction {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function OrdersCommandBar({
  filteredCount,
  search,
  onSearchChange,
  onRefresh,
  refreshing,
  quickFilters,
  hasSelection,
  selectionCount,
  onOpenBulkActions,
  onOpenSavedViews,
  onSaveCurrentView,
  onOpenMobileFilters,
  isMobile,
}: {
  filteredCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  quickFilters: QuickFilterAction[];
  hasSelection: boolean;
  selectionCount: number;
  onOpenBulkActions: () => void;
  onOpenSavedViews: () => void;
  onSaveCurrentView: () => void;
  onOpenMobileFilters: () => void;
  isMobile: boolean;
}) {
  return (
    <div
      className="luxury-card"
      style={{
        padding: isMobile ? 14 : 18,
        borderRadius: 20,
        position: "sticky",
        top: 0,
        zIndex: 35,
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? 19 : 22, fontWeight: 900, color: "var(--text)" }}>Orders Execution Desk</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12, fontWeight: 700 }}>
            <Layers size={13} />
            {filteredCount} commandes visibles
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {isMobile ? (
            <button type="button" className="btn-ghost btn-sm" onClick={onOpenMobileFilters}>
              <Filter size={14} />
              Filtres
            </button>
          ) : null}

          <button type="button" className="btn-ghost btn-sm" onClick={onOpenSavedViews}>
            <Layers size={14} />
            Vues
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={onSaveCurrentView}>
            <Save size={14} />
            Sauver vue
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={onRefresh}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          {hasSelection ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={onOpenBulkActions}>
              <Users size={14} />
              Bulk ({selectionCount})
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(320px, 1fr) auto", gap: 12, marginTop: 12 }}>
        <div style={{ position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="filter-input"
            placeholder="Recherche rapide: client, téléphone, ville, commande..."
            style={{ width: "100%", height: 44, borderRadius: 12, paddingLeft: 40 }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {quickFilters.map((quickFilter) => (
            <button
              type="button"
              key={quickFilter.id}
              onClick={quickFilter.onClick}
              className={quickFilter.active ? "btn btn-primary btn-sm" : "btn-ghost btn-sm"}
              style={{ borderRadius: 999, whiteSpace: "nowrap", padding: "0 14px", height: 38 }}
            >
              {quickFilter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
