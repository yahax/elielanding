"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function MobileUrgencyBanner({
  urgentCount,
  callbackOverdue,
}: {
  urgentCount: number;
  callbackOverdue: number;
}) {
  const hasUrgency = urgentCount > 0 || callbackOverdue > 0;

  return (
    <div
      style={{
        borderRadius: 14,
        border: hasUrgency ? "1px solid rgba(201,106,106,0.38)" : "1px solid var(--border)",
        background: hasUrgency ? "var(--danger-soft)" : "var(--surface)",
        padding: "12px 13px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <AlertTriangle size={16} style={{ color: hasUrgency ? "var(--danger)" : "var(--text-dim)" }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>
            {hasUrgency ? `${urgentCount} urgence(s) à traiter` : "Flux sous contrôle"}
          </div>
          <div style={{ marginTop: 2, fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>
            {callbackOverdue > 0 ? `${callbackOverdue} callback(s) en retard` : "Aucun callback en retard"}
          </div>
        </div>
      </div>

      <Link href="/os-admin/orders?status=to_confirm" className="btn btn-primary btn-sm" style={{ textDecoration: "none", height: 34 }}>
        Traiter
      </Link>
    </div>
  );
}
