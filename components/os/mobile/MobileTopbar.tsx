"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { NotificationBell } from "@/components/os/notifications/NotificationBell";
import { LiveStatusDot } from "@/components/os/live/LiveStatusDot";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import { useNotifications } from "@/hooks/useNotifications";

const PAGE_TITLES: Record<string, string> = {
  "/os": "War Room",
  "/os/orders": "Commandes",
  "/os/pipeline": "Pipeline",
  "/os/notifications": "Alertes",
  "/os/clients": "Clients",
  "/os/settings": "Paramètres",
  "/os/intelligence": "Intelligence",
  "/os/inventory": "Stock",
  "/os/products": "Produits",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const key = Object.keys(PAGE_TITLES).find((candidate) => candidate !== "/os" && pathname.startsWith(candidate));
  return key ? PAGE_TITLES[key] : "ELIE OS";
}

export function MobileTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { realtimeStatus } = useRealtimeFeed();
  const { notifications } = useNotifications();

  const urgentCount = notifications.filter((item) => !item.read && item.severity === "critical").length;
  const title = resolveTitle(pathname);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "rgba(247,243,238,0.92)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ paddingTop: "max(8px, var(--safe-top))", paddingLeft: 12, paddingRight: 12, paddingBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
            <div style={{ marginTop: 2 }}>
              <LiveStatusDot status={realtimeStatus} compact />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {urgentCount > 0 ? (
              <Link href="/os/orders?status=to_confirm" className="btn-ghost btn-sm" style={{ height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", color: "var(--danger)" }}>
                <TriangleAlert size={13} />
                {urgentCount}
              </Link>
            ) : null}

            <button type="button" className="btn-ghost btn-sm" style={{ width: 34, height: 34, padding: 0 }} onClick={() => router.refresh()} aria-label="Rafraîchir">
              <RefreshCw size={14} />
            </button>

            <NotificationBell compact />
          </div>
        </div>
      </div>
    </header>
  );
}
