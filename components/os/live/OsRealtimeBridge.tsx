"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { fetchDomainEvents, fetchOrders, fetchOverview } from "@/lib/os/api";
import { generateNotificationDraftsFromOrders, toRealtimeSnapshot } from "@/lib/os/live/mock";
import type { RealtimeSnapshotEntry } from "@/lib/os/live/types";
import { mapDomainEventToNotificationDraft } from "@/lib/os/realtime/mappers";
import { useNotifications } from "@/hooks/useNotifications";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";

function pushToast(severity: "info" | "success" | "warning" | "critical", title: string, message: string) {
  const text = `${title} · ${message}`;
  if (severity === "critical") {
    toast.error(text, { duration: 5200, toasterId: "live" });
    return;
  }
  if (severity === "success") {
    toast.success(text, { duration: 3400, toasterId: "live" });
    return;
  }
  toast(text, { duration: severity === "warning" ? 4200 : 3000, toasterId: "live" });
}

export function OsRealtimeBridge() {
  const { settings, pushDrafts } = useNotifications();
  const { pushDraftEvents, setRealtimeStatus, setLastSyncAt } = useRealtimeFeed();

  const snapshotRef = useRef<Record<string, RealtimeSnapshotEntry>>({});
  const emittedKeysRef = useRef<Set<string>>(new Set());
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const eventCursorRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const toastCooldownRef = useRef<Map<string, number>>(new Map());

  const TOAST_COOLDOWN_MS = 60_000;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      setRealtimeStatus("disconnected", null);
    };
  }, [setRealtimeStatus]);

  useEffect(() => {
    let timer: number | null = null;

    const run = async () => {
      try {
        setRealtimeStatus("polling", null);
        let drafts = [] as ReturnType<typeof generateNotificationDraftsFromOrders>;

        const eventsResponse = await fetchDomainEvents({
          since: eventCursorRef.current ?? undefined,
          limit: 120,
        }).catch(() => null);

        if (eventsResponse && eventsResponse.events.length > 0) {
          const freshEvents = eventsResponse.events
            .slice()
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .filter((event) => {
              if (processedEventIdsRef.current.has(event.id)) return false;
              processedEventIdsRef.current.add(event.id);
              return true;
            });

          drafts = freshEvents
            .map((event) => mapDomainEventToNotificationDraft(event))
            .filter((draft): draft is NonNullable<typeof draft> => draft != null);

          eventCursorRef.current = eventsResponse.nextCursor ?? eventsResponse.events[0]?.createdAt ?? eventCursorRef.current;
        }

        if (drafts.length === 0) {
          const [ordersResponse, overviewResponse] = await Promise.all([
            fetchOrders({ limit: 220, days: 7 }),
            fetchOverview(7).catch(() => null),
          ]);

          if (!isMountedRef.current) return;

          drafts = generateNotificationDraftsFromOrders({
            orders: ordersResponse.orders,
            previousSnapshot: snapshotRef.current,
            overview: overviewResponse,
            emittedKeys: emittedKeysRef.current,
          });

          snapshotRef.current = toRealtimeSnapshot(ordersResponse.orders);
        }

        if (drafts.length > 0) {
          const notifications = pushDrafts(drafts);
          pushDraftEvents(drafts);

          if (settings.toastsEnabled) {
            const now = Date.now();
            let toastCount = 0;
            for (const item of notifications) {
              if (toastCount >= 2) break;
              const cooldownKey = item.entityId ? `${item.type}:${item.entityId}` : item.type;
              const lastToastTime = toastCooldownRef.current.get(cooldownKey) ?? 0;
              if (now - lastToastTime < TOAST_COOLDOWN_MS) continue;
              toastCooldownRef.current.set(cooldownKey, now);
              pushToast(item.severity, item.title, item.message);
              toastCount += 1;
            }
          }
        }

        setLastSyncAt(new Date().toISOString());
        setRealtimeStatus("live", null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Realtime feed error";
        if (isMountedRef.current) {
          setRealtimeStatus("error", message);
        }
      }
    };

    void run();
    timer = window.setInterval(() => {
      void run();
    }, Math.max(10, settings.refreshIntervalSec) * 1000);

    return () => {
      if (timer != null) window.clearInterval(timer);
    };
  }, [pushDraftEvents, pushDrafts, setLastSyncAt, setRealtimeStatus, settings.refreshIntervalSec, settings.toastsEnabled]);

  return null;
}
