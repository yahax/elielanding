"use client";

import { NEXT_ACTION_LABELS } from "@/lib/os/orders/helpers/status";
import type { NextBestActionType } from "@/lib/os/orders/types";
import { ArrowRight, MessageCircle, Phone, PackageCheck, Repeat, UserPlus, WandSparkles } from "lucide-react";
import type { ReactNode } from "react";

function iconForAction(action: NextBestActionType): ReactNode {
  switch (action) {
    case "send_whatsapp":
      return <MessageCircle size={12} />;
    case "call_customer":
      return <Phone size={12} />;
    case "mark_shipped":
      return <PackageCheck size={12} />;
    case "schedule_callback":
      return <Repeat size={12} />;
    case "assign_operator":
      return <UserPlus size={12} />;
    case "verify_stock":
      return <WandSparkles size={12} />;
    case "confirm_now":
    case "add_note":
    default:
      return <ArrowRight size={12} />;
  }
}

export function NextBestActionChip({
  action,
  compact = false,
}: {
  action: NextBestActionType;
  compact?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        border: "1px solid var(--gold-border)",
        background: "var(--gold-glow)",
        color: "var(--gold)",
        padding: compact ? "3px 8px" : "4px 10px",
        fontSize: compact ? 10 : 11,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {iconForAction(action)}
      {NEXT_ACTION_LABELS[action]}
    </span>
  );
}
