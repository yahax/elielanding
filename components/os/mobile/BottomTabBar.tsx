"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, GitBranch, Home, Menu, ShoppingCart } from "lucide-react";
import type { MobileNavItem } from "@/lib/os/live/types";
import { useNotifications } from "@/hooks/useNotifications";

const NAV_ITEMS: MobileNavItem[] = [
  { id: "home", label: "Accueil", href: "/os/control" },
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
    <nav className="os-mobile-tabbar" aria-label="Navigation mobile ELIE OS">
      <div className="os-mobile-tabbar-grid">
        {NAV_ITEMS.map((item) => {
          const Icon = iconFor(item.id);
          const active = item.href === "/os/control" ? pathname === "/os/control" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`os-mobile-tab${active ? " active" : ""}`}
            >
              <span className="os-mobile-tab-icon-wrap">
                <Icon size={17} />
              </span>
              <span className="os-mobile-tab-label">{item.label}</span>

              {item.id === "alerts" && unreadCount > 0 ? (
                <span className="os-mobile-tab-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
              ) : null}

              {active ? <span className="os-mobile-tab-active-indicator" aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
