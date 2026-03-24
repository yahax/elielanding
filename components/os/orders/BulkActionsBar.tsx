"use client";

import type { OrderStatus } from "@/lib/types";
import { STATUS_LABELS, STATUS_LIST } from "@/lib/types";
import { Archive, Download, Tag, UserRoundPlus, X } from "lucide-react";
import { useMemo, useState } from "react";

export function BulkActionsBar({
  selectedCount,
  operatorOptions,
  onClear,
  onAssignOperator,
  onChangeStatus,
  onMarkCallback,
  onExport,
  onTag,
  onArchive,
  loading = false,
}: {
  selectedCount: number;
  operatorOptions: string[];
  onClear: () => void;
  onAssignOperator: (operator: string) => void;
  onChangeStatus: (status: OrderStatus) => void;
  onMarkCallback: () => void;
  onExport: () => void;
  onTag: (tag: string) => void;
  onArchive: () => void;
  loading?: boolean;
}) {
  const [status, setStatus] = useState<OrderStatus>("to_confirm");
  const [operator, setOperator] = useState<string>("");
  const [tag, setTag] = useState<string>("");

  const cleanOperators = useMemo(
    () => Array.from(new Set(operatorOptions.filter((value) => value && value !== "Non assigné"))),
    [operatorOptions]
  );

  return (
    <div
      style={{
        position: "sticky",
        bottom: 16,
        zIndex: 45,
        borderRadius: 18,
        border: "1px solid var(--gold-border)",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 14px 28px rgba(30, 26, 23, 0.1)",
        padding: "12px 14px",
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
      }}
    >
      <span style={{ fontWeight: 900, color: "var(--gold)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {selectedCount} sélectionnées
      </span>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, flex: 1 }}>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
          className="filter-select"
          style={{ height: 36, minWidth: 170, fontSize: 12 }}
        >
          {STATUS_LIST.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-sm" onClick={() => onChangeStatus(status)} disabled={loading}>
          Changer statut
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={onMarkCallback} disabled={loading}>
          Marquer callback
        </button>

        <select
          value={operator}
          onChange={(event) => setOperator(event.target.value)}
          className="filter-select"
          style={{ height: 36, minWidth: 170, fontSize: 12 }}
        >
          <option value="">Assigner opérateur</option>
          {cleanOperators.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button type="button" className="btn-ghost btn-sm" onClick={() => operator && onAssignOperator(operator)} disabled={loading || operator === ""}>
          <UserRoundPlus size={13} />
          Assigner
        </button>

        <input
          value={tag}
          onChange={(event) => setTag(event.target.value)}
          className="filter-input"
          placeholder="Tag"
          style={{ height: 36, minWidth: 120, fontSize: 12 }}
        />
        <button type="button" className="btn-ghost btn-sm" onClick={() => tag && onTag(tag)} disabled={loading || tag.trim() === ""}>
          <Tag size={13} />
          Taguer
        </button>
      </div>

      <button type="button" className="btn-ghost btn-sm" onClick={onExport} disabled={loading}>
        <Download size={13} />
        Export
      </button>
      <button type="button" className="btn-ghost btn-sm" onClick={onArchive} disabled={loading}>
        <Archive size={13} />
        Archiver
      </button>
      <button type="button" className="btn-ghost btn-sm" onClick={onClear} disabled={loading}>
        <X size={13} />
        Fermer
      </button>
    </div>
  );
}
