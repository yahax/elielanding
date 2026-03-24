"use client";

import { Crown, Download, RefreshCw, Search } from "lucide-react";

interface ClientsCommandBarProps {
  totalCount: number;
  filteredCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onShowVip: () => void;
  refreshing?: boolean;
  compact?: boolean;
}

export function ClientsCommandBar({
  totalCount,
  filteredCount,
  search,
  onSearchChange,
  onRefresh,
  onExport,
  onShowVip,
  refreshing = false,
  compact = false,
}: ClientsCommandBarProps) {
  return (
    <section className="luxury-card" style={{ padding: compact ? 14 : 20, borderRadius: 20, overflow: "visible" }}>
      <div
        style={{
          display: "flex",
          alignItems: compact ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 12,
          flexDirection: compact ? "column" : "row",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: compact ? 20 : 24, fontWeight: 900, color: "var(--text)" }}>Clients CRM</h2>
            <span
              style={{
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                padding: "3px 9px",
                fontSize: 11,
                fontWeight: 900,
                color: "var(--text-dim)",
              }}
            >
              {filteredCount}/{totalCount}
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-dim)", fontWeight: 600 }}>
            Segmentation client, valeur et réactivation orientées action.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, width: compact ? "100%" : "auto" }}>
          <button type="button" className="btn-ghost btn-sm" onClick={onShowVip} style={{ flex: compact ? 1 : "none" }}>
            <Crown size={14} />
            Voir VIP
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={onExport} style={{ flex: compact ? 1 : "none" }}>
            <Download size={14} />
            Export
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={onRefresh} aria-label="Rafraîchir">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14, position: "relative" }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-dim)",
          }}
        />
        <input
          className="filter-input"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher client, téléphone, ville, produit..."
          style={{
            width: "100%",
            height: compact ? 44 : 48,
            borderRadius: 14,
            paddingLeft: 38,
            minWidth: 0,
          }}
        />
      </div>
    </section>
  );
}

