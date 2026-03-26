"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatNotificationTime } from "@/lib/os/live/helpers";
import { SeverityPill } from "@/components/os/live/SeverityPill";

export function NotificationBell({
  compact = false,
  showLabel = false,
}: {
  compact?: boolean;
  showLabel?: boolean;
}) {
  const { notifications, unreadCount, markNotificationRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const recent = useMemo(() => notifications.slice(0, 8), [notifications]);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className={compact ? "btn-ghost btn-sm" : "btn-ghost"}
        style={{
          width: compact ? 36 : 42,
          height: compact ? 36 : 42,
          padding: 0,
          borderRadius: 12,
          position: "relative",
        }}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        <Bell size={compact ? 16 : 18} />
        {unreadCount > 0 ? (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              background: "var(--danger)",
              color: "white",
              fontSize: 10,
              fontWeight: 900,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 5px",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {showLabel ? (
        <span style={{ marginLeft: 6, fontSize: 11, color: "var(--text-dim)", fontWeight: 800 }}>{unreadCount}</span>
      ) : null}

      {open ? (
        <div
          className="luxury-card"
          style={{
            position: "absolute",
            top: compact ? 42 : 48,
            right: 0,
            width: "min(92vw, 380px)",
            maxHeight: "70vh",
            overflowY: "auto",
            zIndex: 120,
            padding: 10,
            borderRadius: 14,
            boxShadow: "0 22px 44px rgba(30,26,23,0.16)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>Notifications</div>
            <button type="button" className="btn-ghost btn-sm" onClick={markAllAsRead}>
              <CheckCheck size={13} />
              Tout lire
            </button>
          </div>

          {recent.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 700, padding: 10 }}>Aucune notification</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recent.map((item) => (
                <Link
                  href={item.link}
                  key={item.id}
                  onClick={() => {
                    markNotificationRead(item.id);
                    setOpen(false);
                  }}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "9px 10px",
                    textDecoration: "none",
                    color: "inherit",
                    background: item.read ? "var(--surface)" : "color-mix(in srgb, var(--gold-glow) 35%, var(--surface))",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <SeverityPill severity={item.severity} compact />
                    <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 700 }}>{formatNotificationTime(item.createdAt)}</span>
                  </div>
                  <div style={{ marginTop: 5, fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{item.title}</div>
                  <div style={{ marginTop: 2, fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{item.message}</div>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/os-admin/notifications"
            onClick={() => setOpen(false)}
            style={{ display: "inline-block", marginTop: 10, fontSize: 12, fontWeight: 900, color: "var(--gold)", textDecoration: "none" }}
          >
            Ouvrir Notification Center
          </Link>
        </div>
      ) : null}
    </div>
  );
}
