"use client";

import { useMemo } from "react";
import { useOsLiveStore } from "@/store/useOsLiveStore";

export function useWarRoomMode(options?: { isMobile?: boolean; urgentCountHint?: number }) {
  const notifications = useOsLiveStore((state) => state.notifications);
  const preference = useOsLiveStore((state) => state.warRoomPreference);
  const setWarRoomPreference = useOsLiveStore((state) => state.setWarRoomPreference);

  const criticalUnread = useMemo(
    () => notifications.filter((item) => !item.read && item.severity === "critical").length,
    [notifications]
  );

  const warningUnread = useMemo(
    () => notifications.filter((item) => !item.read && item.severity === "warning").length,
    [notifications]
  );

  const isWarRoomMode = useMemo(() => {
    if (preference === "on") return true;
    if (preference === "off") return false;

    const urgentHint = options?.urgentCountHint ?? 0;
    const hasSignal = criticalUnread > 0 || urgentHint > 0 || warningUnread >= 3;
    if (options?.isMobile === false) return false;
    return hasSignal;
  }, [criticalUnread, options?.isMobile, options?.urgentCountHint, preference, warningUnread]);

  return {
    isWarRoomMode,
    preference,
    criticalUnread,
    warningUnread,
    setWarRoomPreference,
  };
}
