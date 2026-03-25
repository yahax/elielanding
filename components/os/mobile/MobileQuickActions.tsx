"use client";

import Link from "next/link";
import { MessageCircle, PackageSearch, PhoneCall, TriangleAlert, Warehouse } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

interface ActionItem {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  tone?: "neutral" | "warning" | "success";
}

function toneStyle(tone: ActionItem["tone"]): CSSProperties {
  switch (tone) {
    case "warning":
      return { border: "1px solid rgba(213,161,62,0.35)", background: "var(--warning-soft)", color: "var(--warning)" };
    case "success":
      return { border: "1px solid rgba(47,143,99,0.35)", background: "var(--success-soft)", color: "var(--success)" };
    case "neutral":
    default:
      return { border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" };
  }
}

export function MobileQuickActions({
  newOrdersCount,
  urgentCount,
  callbackCount,
  lowStockCount,
}: {
  newOrdersCount: number;
  urgentCount: number;
  callbackCount: number;
  lowStockCount: number;
}) {
  const actions: ActionItem[] = [
    {
      id: "new-orders",
      label: `Nouvelles (${newOrdersCount})`,
      href: "/os/orders?status=new",
      icon: <PackageSearch size={14} />,
      tone: "neutral",
    },
    {
      id: "urgent-orders",
      label: `Urgentes (${urgentCount})`,
      href: "/os/orders?status=to_confirm",
      icon: <TriangleAlert size={14} />,
      tone: "warning",
    },
    {
      id: "callbacks",
      label: `Callbacks (${callbackCount})`,
      href: "/os/orders?status=callback",
      icon: <PhoneCall size={14} />,
      tone: "warning",
    },
    {
      id: "whatsapp",
      label: "Relance WhatsApp",
      href: "/os/orders?status=callback",
      icon: <MessageCircle size={14} />,
      tone: "success",
    },
    {
      id: "stock",
      label: `Stock critique (${lowStockCount})`,
      href: "/os/inventory",
      icon: <Warehouse size={14} />,
      tone: lowStockCount > 0 ? "warning" : "neutral",
    },
  ];

  return (
    <div className="os-mobile-quick-actions" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
      {actions.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          className="os-mobile-quick-action"
          style={{
            borderRadius: 12,
            textDecoration: "none",
            padding: "10px 11px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 800,
            ...toneStyle(action.tone),
          }}
        >
          {action.icon}
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
