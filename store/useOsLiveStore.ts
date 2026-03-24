import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  LiveEvent,
  NotificationItem,
  NotificationSettings,
  RealtimeStatus,
  WarRoomPreference,
} from "@/lib/os/live/types";

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  toastsEnabled: true,
  soundsEnabled: false,
  categoriesEnabled: {
    orders: true,
    stock: true,
    business: true,
    operators: true,
    system: true,
  },
  refreshIntervalSec: 30,
  slaWarningMinutes: 40,
  warRoomPreference: "auto",
};

type OsLiveState = {
  notifications: NotificationItem[];
  feed: LiveEvent[];
  realtimeStatus: RealtimeStatus;
  realtimeError: string | null;
  lastSyncAt: string | null;
  settings: NotificationSettings;
  warRoomPreference: WarRoomPreference;
  addNotifications: (items: NotificationItem[]) => void;
  addFeedEvents: (events: LiveEvent[]) => void;
  markNotificationRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  setRealtimeStatus: (status: RealtimeStatus, error?: string | null) => void;
  setLastSyncAt: (iso: string) => void;
  updateSettings: (patch: Partial<NotificationSettings>) => void;
  setWarRoomPreference: (preference: WarRoomPreference) => void;
};

function sortByDateDesc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function deduplicateNotifications(items: NotificationItem[]): NotificationItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.entityId ? `${item.type}:${item.entityId}` : item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateFeedEvents(items: LiveEvent[]): LiveEvent[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.entityId ? `${item.type}:${item.entityId}` : item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const useOsLiveStore = create<OsLiveState>()(
  persist(
    (set) => ({
      notifications: [],
      feed: [],
      realtimeStatus: "disconnected",
      realtimeError: null,
      lastSyncAt: null,
      settings: DEFAULT_NOTIFICATION_SETTINGS,
      warRoomPreference: DEFAULT_NOTIFICATION_SETTINGS.warRoomPreference,
      addNotifications: (items) =>
        set((state) => {
          if (items.length === 0) return state;
          const merged = deduplicateNotifications(sortByDateDesc([...items, ...state.notifications]));
          return {
            ...state,
            notifications: merged.slice(0, 160),
          };
        }),
      addFeedEvents: (events) =>
        set((state) => {
          if (events.length === 0) return state;
          const merged = deduplicateFeedEvents(sortByDateDesc([...events, ...state.feed]));
          return {
            ...state,
            feed: merged.slice(0, 140),
          };
        }),
      markNotificationRead: (id) =>
        set((state) => ({
          ...state,
          notifications: state.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
        })),
      markAllAsRead: () =>
        set((state) => ({
          ...state,
          notifications: state.notifications.map((item) => ({ ...item, read: true })),
        })),
      clearNotifications: () =>
        set((state) => ({
          ...state,
          notifications: [],
          feed: [],
        })),
      setRealtimeStatus: (status, error = null) =>
        set((state) => ({
          ...state,
          realtimeStatus: status,
          realtimeError: error,
        })),
      setLastSyncAt: (iso) =>
        set((state) => ({
          ...state,
          lastSyncAt: iso,
        })),
      updateSettings: (patch) =>
        set((state) => {
          const next = { ...state.settings, ...patch };
          return {
            ...state,
            settings: next,
            warRoomPreference: next.warRoomPreference,
          };
        }),
      setWarRoomPreference: (preference) =>
        set((state) => ({
          ...state,
          warRoomPreference: preference,
          settings: {
            ...state.settings,
            warRoomPreference: preference,
          },
        })),
    }),
    {
      name: "elie-os-live-v1",
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 120),
        feed: state.feed.slice(0, 80),
        settings: state.settings,
        warRoomPreference: state.warRoomPreference,
      }),
    }
  )
);
