"use client";

import { useCallback, useMemo } from "react";
import { markNotificationsRead as markNotificationsReadRequest } from "@/lib/os/api";
import { draftToNotification, shouldDisplayCategory } from "@/lib/os/live/helpers";
import type { NotificationCategory, NotificationDraft, NotificationItem } from "@/lib/os/live/types";
import { useOsLiveStore } from "@/store/useOsLiveStore";

export function useNotifications() {
  const notifications = useOsLiveStore((state) => state.notifications);
  const settings = useOsLiveStore((state) => state.settings);
  const addNotifications = useOsLiveStore((state) => state.addNotifications);
  const markNotificationReadLocal = useOsLiveStore((state) => state.markNotificationRead);
  const markAllAsReadLocal = useOsLiveStore((state) => state.markAllAsRead);
  const clearNotifications = useOsLiveStore((state) => state.clearNotifications);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const pushDrafts = useCallback((drafts: NotificationDraft[]) => {
    const materialized = drafts
      .filter((draft) => shouldDisplayCategory(draft.category as Exclude<NotificationCategory, "all">, settings.categoriesEnabled))
      .map((draft) => draftToNotification(draft));
    addNotifications(materialized);
    return materialized;
  }, [addNotifications, settings.categoriesEnabled]);

  const filterByCategory = useCallback((category: NotificationCategory, onlyUnread = false): NotificationItem[] => {
    return notifications.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (onlyUnread && item.read) return false;
      return true;
    });
  }, [notifications]);

  const markNotificationRead = useCallback((id: string) => {
    markNotificationReadLocal(id);
    void markNotificationsReadRequest({ notificationId: id }).catch((error) => {
      console.warn("[NOTIFICATIONS] Failed to persist read state:", error);
    });
  }, [markNotificationReadLocal]);

  const markAllAsRead = useCallback(() => {
    const unreadIds = notifications.filter((item) => !item.read).map((item) => item.id);
    markAllAsReadLocal();
    if (unreadIds.length > 0) {
      void markNotificationsReadRequest({ notificationIds: unreadIds }).catch((error) => {
        console.warn("[NOTIFICATIONS] Failed to persist bulk read state:", error);
      });
    }
  }, [markAllAsReadLocal, notifications]);

  return {
    notifications,
    unreadCount,
    settings,
    pushDrafts,
    filterByCategory,
    markNotificationRead,
    markAllAsRead,
    clearNotifications,
  };
}
