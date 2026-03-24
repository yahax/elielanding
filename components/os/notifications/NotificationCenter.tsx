"use client";

import { useMemo, useState } from "react";
import type { NotificationCategory } from "@/lib/os/live/types";
import { useNotifications } from "@/hooks/useNotifications";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import { NotificationCategoryTabs } from "@/components/os/notifications/NotificationCategoryTabs";
import { NotificationList } from "@/components/os/notifications/NotificationList";
import { LiveStatusDot } from "@/components/os/live/LiveStatusDot";
import { RealtimeFeedCard } from "@/components/os/live/RealtimeFeedCard";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

export function NotificationCenter({ compact = false }: { compact?: boolean }) {
  const { notifications, markNotificationRead, markAllAsRead, clearNotifications } = useNotifications();
  const { latestEvents, realtimeStatus, lastSyncAt } = useRealtimeFeed();
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>("all");
  const [onlyUnread, setOnlyUnread] = useState<boolean>(false);

  const counts = useMemo(() => {
    const base: Record<NotificationCategory, number> = {
      all: notifications.length,
      orders: 0,
      stock: 0,
      business: 0,
      operators: 0,
      system: 0,
    };

    for (const item of notifications) {
      base[item.category] = (base[item.category] ?? 0) + 1;
    }

    return base;
  }, [notifications]);

  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      if (activeCategory !== "all" && item.category !== activeCategory) return false;
      if (onlyUnread && item.read) return false;
      return true;
    });
  }, [activeCategory, notifications, onlyUnread]);

  return (
    <section className="luxury-card os-surface-card" style={{ padding: compact ? 14 : 18, borderRadius: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={15} style={{ color: "var(--gold)" }} />
            <h2 style={{ margin: 0, fontSize: compact ? 16 : 18, fontWeight: 900, color: "var(--text)" }}>Centre Notifications</h2>
          </div>
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <LiveStatusDot status={realtimeStatus} compact />
            <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>
              {lastSyncAt ? `Sync: ${new Date(lastSyncAt).toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" })}` : "En attente de sync"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className={onlyUnread ? "btn btn-primary btn-sm" : "btn-ghost btn-sm"} onClick={() => setOnlyUnread((prev) => !prev)} aria-pressed={onlyUnread}>
            Non lues
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={markAllAsRead}>
            <CheckCheck size={13} />
            Tout lire
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={clearNotifications}>
            <Trash2 size={13} />
            Vider
          </button>
        </div>
      </div>

      <NotificationCategoryTabs active={activeCategory} onChange={setActiveCategory} counts={counts} />

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: compact ? "1fr" : "1.4fr .9fr", gap: 12 }}>
        <NotificationList items={filtered} onRead={markNotificationRead} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Flux temps réel</div>
          {latestEvents.length === 0 ? (
            <div style={{ border: "1px dashed var(--border)", borderRadius: 12, padding: 16, color: "var(--text-dim)", fontSize: 12, fontWeight: 700 }}>
              Aucun événement live pour le moment.
            </div>
          ) : (
            latestEvents.slice(0, compact ? 4 : 8).map((event) => <RealtimeFeedCard key={event.id} event={event} />)
          )}
        </div>
      </div>
    </section>
  );
}
