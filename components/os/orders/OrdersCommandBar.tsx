"use client";

import { Filter, Layers, RefreshCw, Save, Search, Users } from "lucide-react";
import {
  FilterBar,
  FilterBarActions,
  FilterBarChips,
  FilterBarMeta,
  FilterBarRow,
  FilterBarSearch,
  FilterBarTitle,
  FilterBarTop,
} from "@/components/ui/FilterBar";
import { FilterChip } from "@/components/ui/FilterChip";

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
    <FilterBar sticky className="os-card-subtle os-orders-commandbar">
      <FilterBarTop>
        <div>
          <FilterBarTitle>Orders Execution Desk</FilterBarTitle>
          <FilterBarMeta>
            <Layers size={13} />
            {filteredCount} commandes visibles
          </FilterBarMeta>
        </div>

        <FilterBarActions>
          {isMobile ? (
            <button type="button" className="btn-ghost btn-sm os-toolbar-btn" onClick={onOpenMobileFilters}>
              <Filter size={14} />
              Filtres
            </button>
          ) : null}

          <button type="button" className="btn-ghost btn-sm os-toolbar-btn" onClick={onOpenSavedViews}>
            <Layers size={14} />
            Vues
          </button>
          <button type="button" className="btn-ghost btn-sm os-toolbar-btn" onClick={onSaveCurrentView}>
            <Save size={14} />
            Sauver vue
          </button>
          <button type="button" className="btn-ghost btn-sm os-toolbar-btn" onClick={onRefresh}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          {hasSelection ? (
            <button type="button" className="btn btn-primary btn-sm os-toolbar-btn" onClick={onOpenBulkActions}>
              <Users size={14} />
              Bulk ({selectionCount})
            </button>
          ) : null}
        </FilterBarActions>
      </FilterBarTop>

      <FilterBarRow>
        <FilterBarSearch>
          <Search size={15} />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="filter-input os-toolbar-search-input"
            placeholder="Recherche rapide: client, téléphone, ville, commande..."
            style={{ height: 44 }}
          />
        </FilterBarSearch>

        <FilterBarChips>
          {quickFilters.map((quickFilter) => (
            <FilterChip
              key={quickFilter.id}
              label={quickFilter.label}
              active={quickFilter.active}
              onClick={quickFilter.onClick}
            />
          ))}
        </FilterBarChips>
      </FilterBarRow>
    </FilterBar>
  );
}
