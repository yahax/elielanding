"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, GitBranch, Home, Menu, ShoppingCart } from "lucide-react";
import type { MobileNavItem } from "@/lib/os/live/types";
import { useNotifications } from "@/hooks/useNotifications";

const NAV_ITEMS: MobileNavItem[] = [
  { id: "home", label: "Accueil", href: "/os" },
  { id: "orders", label: "Commandes", href: "/os/orders" },
  { id: "pipeline", label: "Pipeline", href: "/os/pipeline" },
  { id: "alerts", label: "Alertes", href: "/os/notifications" },
  { id: "more", label: "Menu", href: "/os/settings" },
];

function iconFor(item: MobileNavItem["id"]) {
  switch (item) {
    case "home":
      return Home;
    case "orders":
      return ShoppingCart;
    case "pipeline":
      return GitBranch;
    case "alerts":
      return Bell;
    case "more":
    default:
      return Menu;
  }
}

export function BottomTabBar() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <nav
      aria-label="Navigation mobile"
      style={{
        position: "fixed",
        left: 10,
        right: 10,
        bottom: "calc(8px + var(--safe-bottom))",
        zIndex: 65,
        borderRadius: 18,
        border: "1px solid var(--border)",
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 16px 32px rgba(30,26,23,0.16)",
        padding: "6px 4px",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 4 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = iconFor(item.id);
          const active = item.href === "/os" ? pathname === "/os" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              style={{
                textDecoration: "none",
                color: active ? "var(--gold)" : "var(--text-dim)",
                borderRadius: 12,
                minHeight: 56,
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                position: "relative",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.04em",
                background: active ? "var(--gold-glow)" : "transparent",
                border: active ? "1px solid var(--gold-border)" : "1px solid transparent",
              }}
            >
              <Icon size={16} />
              <span>{item.label}</span>
              {item.id === "alerts" && unreadCount > 0 ? (
                <span
                  style={{
                    position: "absolute",
                    top: 5,
                    right: "26%",
                    minWidth: 16,
                    height: 16,
                    borderRadius: 999,
                    background: "var(--danger)",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 900,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
