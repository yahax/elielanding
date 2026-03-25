"use client";

import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { fetchDomainEvents, fetchOrders } from "@/lib/os/api";
import { generateNotificationDraftsFromOrders, toRealtimeSnapshot } from "@/lib/os/live/mock";
import type { RealtimeSnapshotEntry } from "@/lib/os/live/types";
import { mapDomainEventToNotificationDraft } from "@/lib/os/realtime/mappers";
import { useNotifications } from "@/hooks/useNotifications";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";

const TOAST_COOLDOWN_MS = 60_000;
const POLLING_FLOOR_SEC = 30;

let sharedPollingTimer: number | null = null;
let sharedPollingIntervalMs = POLLING_FLOOR_SEC * 1000;
let sharedPollingInFlight = false;
const sharedPollingRunners = new Set<() => void>();

function stopSharedPollingTimer() {
  if (sharedPollingTimer != null) {
    window.clearInterval(sharedPollingTimer);
    sharedPollingTimer = null;
  }
}

function startSharedPollingTimer() {
  if (sharedPollingTimer != null || sharedPollingRunners.size === 0) return;
  if (typeof document !== "undefined" && document.hidden) return;
  sharedPollingTimer = window.setInterval(() => {
    const runner = sharedPollingRunners.values().next().value as (() => void) | undefined;
    runner?.();
  }, sharedPollingIntervalMs);
}

function refreshSharedPollingInterval(intervalMs: number) {
  if (sharedPollingIntervalMs === intervalMs) return;
  sharedPollingIntervalMs = intervalMs;
  if (sharedPollingTimer != null) {
    stopSharedPollingTimer();
    startSharedPollingTimer();
  }
}

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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      setRealtimeStatus("disconnected", null);
    };
  }, [setRealtimeStatus]);

  const run = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (typeof document !== "undefined" && document.hidden) return;
    if (sharedPollingInFlight) return;
    sharedPollingInFlight = true;

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
        const ordersResponse = await fetchOrders({ limit: 50, page: 1, days: 7 });

        if (!isMountedRef.current) return;

        drafts = generateNotificationDraftsFromOrders({
          orders: ordersResponse.orders,
          previousSnapshot: snapshotRef.current,
          overview: null,
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
    } finally {
      sharedPollingInFlight = false;
    }
  }, [pushDraftEvents, pushDrafts, setLastSyncAt, setRealtimeStatus, settings.toastsEnabled]);

  useEffect(() => {
    const intervalMs = Math.max(POLLING_FLOOR_SEC, settings.refreshIntervalSec) * 1000;
    const runner = () => {
      void run();
    };
    sharedPollingRunners.add(runner);
    refreshSharedPollingInterval(intervalMs);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopSharedPollingTimer();
        setRealtimeStatus("disconnected", null);
        return;
      }
      void run();
      startSharedPollingTimer();
    };

    if (typeof document !== "undefined") {
      if (document.hidden) {
        stopSharedPollingTimer();
      } else {
        void run();
        startSharedPollingTimer();
      }
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      sharedPollingRunners.delete(runner);
      if (sharedPollingRunners.size === 0) {
        stopSharedPollingTimer();
      }
    };
  }, [run, setRealtimeStatus, settings.refreshIntervalSec]);

  return null;
}
