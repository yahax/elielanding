"use client";

import { useCallback, useMemo } from "react";
import { liveEventFromDraft } from "@/lib/os/live/helpers";
import type { LiveEvent, NotificationDraft } from "@/lib/os/live/types";
import { useOsLiveStore } from "@/store/useOsLiveStore";

export function useRealtimeFeed() {
  const feed = useOsLiveStore((state) => state.feed);
  const realtimeStatus = useOsLiveStore((state) => state.realtimeStatus);
  const realtimeError = useOsLiveStore((state) => state.realtimeError);
  const lastSyncAt = useOsLiveStore((state) => state.lastSyncAt);
  const addFeedEvents = useOsLiveStore((state) => state.addFeedEvents);
  const setRealtimeStatus = useOsLiveStore((state) => state.setRealtimeStatus);
  const setLastSyncAt = useOsLiveStore((state) => state.setLastSyncAt);

  const pushDraftEvents = useCallback((drafts: NotificationDraft[]) => {
    const events = drafts.map((draft) => liveEventFromDraft(draft));
    addFeedEvents(events);
    return events;
  }, [addFeedEvents]);

  const latestEvents = useMemo<LiveEvent[]>(() => feed.slice(0, 24), [feed]);

  return {
    feed,
    latestEvents,
    realtimeStatus,
    realtimeError,
    lastSyncAt,
    pushDraftEvents,
    addFeedEvents,
    setRealtimeStatus,
    setLastSyncAt,
  };
}
