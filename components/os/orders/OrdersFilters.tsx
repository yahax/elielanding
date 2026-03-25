"use client";

import type { OrderFilterOptions, OrderFiltersState, OrderPriority, OrderRisk } from "@/lib/os/orders/types";
import { PRIORITY_LABELS, RISK_LABELS } from "@/lib/os/orders/helpers/status";
import { STATUS_LABELS, STATUS_LIST } from "@/lib/types";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { FilterChip } from "@/components/ui/FilterChip";
import { FilterField, FilterFieldLabel } from "@/components/ui/FilterBar";

function toggleValue<T extends string>(arr: T[], value: T): T[] {
  if (arr.includes(value)) return arr.filter((item) => item !== value);
  return [...arr, value];
}

interface ActiveChip {
  id: string;
  label: string;
  onRemove: () => void;
}

export function OrdersFilters({
  filters,
  options,
  onChange,
  onReset,
  compact = false,
}: {
  filters: OrderFiltersState;
  options: OrderFilterOptions;
  onChange: (next: OrderFiltersState) => void;
  onReset: () => void;
  compact?: boolean;
}) {
  const activeChips: ActiveChip[] = [];

  for (const status of filters.statuses) {
    activeChips.push({
      id: `status-${status}`,
      label: STATUS_LABELS[status],
      onRemove: () => onChange({ ...filters, statuses: filters.statuses.filter((item) => item !== status) }),
    });
  }

  for (const city of filters.cities) {
    activeChips.push({
      id: `city-${city}`,
      label: city,
      onRemove: () => onChange({ ...filters, cities: filters.cities.filter((item) => item !== city) }),
    });
  }

  for (const source of filters.sources) {
    activeChips.push({
      id: `source-${source}`,
      label: source,
      onRemove: () => onChange({ ...filters, sources: filters.sources.filter((item) => item !== source) }),
    });
  }

  for (const pack of filters.packs) {
    activeChips.push({
      id: `pack-${pack}`,
      label: `Pack ${pack}`,
      onRemove: () => onChange({ ...filters, packs: filters.packs.filter((item) => item !== pack) }),
    });
  }

  for (const operator of filters.operators) {
    activeChips.push({
      id: `operator-${operator}`,
      label: operator,
      onRemove: () => onChange({ ...filters, operators: filters.operators.filter((item) => item !== operator) }),
    });
  }

  for (const product of filters.products) {
    activeChips.push({
      id: `product-${product}`,
      label: product,
      onRemove: () => onChange({ ...filters, products: filters.products.filter((item) => item !== product) }),
    });
  }

  for (const priority of filters.priorities) {
    activeChips.push({
      id: `priority-${priority}`,
      label: `Priorité ${PRIORITY_LABELS[priority]}`,
      onRemove: () => onChange({ ...filters, priorities: filters.priorities.filter((item) => item !== priority) }),
    });
  }

  for (const risk of filters.risks) {
    activeChips.push({
      id: `risk-${risk}`,
      label: `Risque ${RISK_LABELS[risk]}`,
      onRemove: () => onChange({ ...filters, risks: filters.risks.filter((item) => item !== risk) }),
    });
  }

  for (const clientType of filters.clientTypes) {
    activeChips.push({
      id: `client-${clientType}`,
      label: clientType === "returning" ? "Client récurrent" : "Nouveau client",
      onRemove: () => onChange({ ...filters, clientTypes: filters.clientTypes.filter((item) => item !== clientType) }),
    });
  }

  if (filters.onlyHighValue) {
    activeChips.push({
      id: "high-value",
      label: "Forte valeur",
      onRemove: () => onChange({ ...filters, onlyHighValue: false }),
    });
  }

  if (filters.onlyAtRisk) {
    activeChips.push({
      id: "at-risk",
      label: "Risque annulation",
      onRemove: () => onChange({ ...filters, onlyAtRisk: false }),
    });
  }

  if (filters.onlyUrgent) {
    activeChips.push({
      id: "urgent",
      label: "Urgence SLA",
      onRemove: () => onChange({ ...filters, onlyUrgent: false }),
    });
  }

  return (
    <div className="luxury-card os-card-subtle" style={{ padding: compact ? 14 : 16, borderRadius: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text)", fontWeight: 800, fontSize: 13 }}>
          <SlidersHorizontal size={14} />
          Smart Filters
        </div>
        <button type="button" className="btn-ghost btn-sm" onClick={onReset}>
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      <div className="os-filter-grid" style={compact ? { gridTemplateColumns: "1fr" } : undefined}>
        <FilterField>
          <FilterFieldLabel>Ville</FilterFieldLabel>
          <select
            className="filter-select"
            value=""
            onChange={(event) => {
              const value = event.target.value;
              if (value !== "") onChange({ ...filters, cities: toggleValue(filters.cities, value) });
            }}
            style={{ height: 40 }}
          >
            <option value="">Ajouter ville</option>
            {options.cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField>
          <FilterFieldLabel>Source</FilterFieldLabel>
          <select
            className="filter-select"
            value=""
            onChange={(event) => {
              const value = event.target.value;
              if (value !== "") onChange({ ...filters, sources: toggleValue(filters.sources, value) });
            }}
            style={{ height: 40 }}
          >
            <option value="">Ajouter source</option>
            {options.sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField>
          <FilterFieldLabel>Pack / Produit</FilterFieldLabel>
          <select
            className="filter-select"
            value=""
            onChange={(event) => {
              const value = event.target.value;
              if (value !== "") {
                if (value.startsWith("pack:")) {
                  onChange({ ...filters, packs: toggleValue(filters.packs, value.replace("pack:", "")) });
                } else {
                  onChange({ ...filters, products: toggleValue(filters.products, value.replace("product:", "")) });
                }
              }
            }}
            style={{ height: 40 }}
          >
            <option value="">Ajouter pack/produit</option>
            {options.packs.map((pack) => (
              <option key={`pack-${pack}`} value={`pack:${pack}`}>
                Pack {pack}
              </option>
            ))}
            {options.products.slice(0, 40).map((product) => (
              <option key={`product-${product}`} value={`product:${product}`}>
                {product}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField>
          <FilterFieldLabel>Opérateur</FilterFieldLabel>
          <select
            className="filter-select"
            value=""
            onChange={(event) => {
              const value = event.target.value;
              if (value !== "") onChange({ ...filters, operators: toggleValue(filters.operators, value) });
            }}
            style={{ height: 40 }}
          >
            <option value="">Ajouter opérateur</option>
            {options.operators.map((operator) => (
              <option key={operator} value={operator}>
                {operator}
              </option>
            ))}
          </select>
        </FilterField>
      </div>

      <div className="os-filter-chip-grid">
        {STATUS_LIST.map((status) => (
          <FilterChip
            key={status}
            label={STATUS_LABELS[status]}
            active={filters.statuses.includes(status)}
            onClick={() => onChange({ ...filters, statuses: toggleValue(filters.statuses, status) })}
          />
        ))}
      </div>

      <div className="os-filter-chip-grid">
        {(Object.keys(PRIORITY_LABELS) as OrderPriority[]).map((priority) => (
          <FilterChip
            key={priority}
            label={`Priorité ${PRIORITY_LABELS[priority]}`}
            active={filters.priorities.includes(priority)}
            onClick={() => onChange({ ...filters, priorities: toggleValue(filters.priorities, priority) })}
          />
        ))}
        {(Object.keys(RISK_LABELS) as OrderRisk[]).map((risk) => (
          <FilterChip
            key={risk}
            label={`Risque ${RISK_LABELS[risk]}`}
            active={filters.risks.includes(risk)}
            onClick={() => onChange({ ...filters, risks: toggleValue(filters.risks, risk) })}
          />
        ))}
      </div>

      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
          <input
            type="checkbox"
            checked={filters.clientTypes.includes("new")}
            onChange={() =>
              onChange({
                ...filters,
                clientTypes: toggleValue(filters.clientTypes, "new"),
              })
            }
          />
          Nouveaux clients
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
          <input
            type="checkbox"
            checked={filters.clientTypes.includes("returning")}
            onChange={() =>
              onChange({
                ...filters,
                clientTypes: toggleValue(filters.clientTypes, "returning"),
              })
            }
          />
          Clients récurrents
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
          <input type="checkbox" checked={filters.onlyHighValue} onChange={() => onChange({ ...filters, onlyHighValue: !filters.onlyHighValue })} />
          Forte valeur
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
          <input type="checkbox" checked={filters.onlyAtRisk} onChange={() => onChange({ ...filters, onlyAtRisk: !filters.onlyAtRisk })} />
          Risque annulation
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
          <input type="checkbox" checked={filters.onlyUrgent} onChange={() => onChange({ ...filters, onlyUrgent: !filters.onlyUrgent })} />
          Urgences SLA
        </label>
      </div>

      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <FilterField>
          <FilterFieldLabel>Période</FilterFieldLabel>
          <select
            className="filter-select"
            value={filters.datePreset}
            onChange={(event) => onChange({ ...filters, datePreset: event.target.value as OrderFiltersState["datePreset"] })}
            style={{ height: 40 }}
          >
            <option value="today">Aujourd’hui</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="90d">90 jours</option>
            <option value="all">Tout</option>
          </select>
        </FilterField>
        <FilterField>
          <FilterFieldLabel>Du</FilterFieldLabel>
          <input
            type="date"
            className="filter-input"
            value={filters.fromDate ?? ""}
            onChange={(event) => onChange({ ...filters, fromDate: event.target.value || null })}
            style={{ minWidth: 0, height: 40 }}
          />
        </FilterField>
        <FilterField>
          <FilterFieldLabel>Au</FilterFieldLabel>
          <input
            type="date"
            className="filter-input"
            value={filters.toDate ?? ""}
            onChange={(event) => onChange({ ...filters, toDate: event.target.value || null })}
            style={{ minWidth: 0, height: 40 }}
          />
        </FilterField>
      </div>

      {activeChips.length > 0 ? (
        <div className="os-filter-chip-grid" style={{ marginTop: 12 }}>
          {activeChips.map((chip) => (
            <span key={chip.id} className="os-chip">
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                style={{ border: "none", background: "transparent", cursor: "pointer", display: "inline-flex", color: "inherit", padding: 0 }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

