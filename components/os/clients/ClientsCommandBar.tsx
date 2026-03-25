"use client";

import { Crown, Download, RefreshCw, Search } from "lucide-react";
import { FilterBar, FilterBarActions, FilterBarMeta, FilterBarRow, FilterBarSearch, FilterBarTitle, FilterBarTop } from "@/components/ui/FilterBar";

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
    <FilterBar className="os-card-subtle os-clients-commandbar" sticky={false}>
      <FilterBarTop>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <FilterBarTitle>Clients CRM</FilterBarTitle>
            <span className="os-chip">
              {filteredCount}/{totalCount}
            </span>
          </div>
          <FilterBarMeta>
            Segmentation client, valeur et réactivation orientées action.
          </FilterBarMeta>
        </div>

        <FilterBarActions>
          <button type="button" className="btn-ghost btn-sm os-toolbar-btn" onClick={onShowVip} style={{ flex: compact ? 1 : undefined }}>
            <Crown size={14} />
            Voir VIP
          </button>
          <button type="button" className="btn-ghost btn-sm os-toolbar-btn" onClick={onExport} style={{ flex: compact ? 1 : undefined }}>
            <Download size={14} />
            Export
          </button>
          <button type="button" className="btn-ghost btn-sm os-toolbar-btn" onClick={onRefresh} aria-label="Rafraîchir">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        </FilterBarActions>
      </FilterBarTop>

      <FilterBarRow style={{ gridTemplateColumns: "1fr" }}>
        <FilterBarSearch>
          <Search size={16} />
          <input
            className="filter-input os-toolbar-search-input"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rechercher client, téléphone, ville, produit..."
            style={{ height: compact ? 44 : 48 }}
          />
        </FilterBarSearch>
      </FilterBarRow>
    </FilterBar>
  );
}
