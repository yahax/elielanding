import type {
  LiveEvent,
  NotificationCategory,
  NotificationDraft,
  NotificationItem,
  NotificationSeverity,
  NotificationType,
} from "@/lib/os/live/types";

const CATEGORY_BY_TYPE: Record<NotificationType, Exclude<NotificationCategory, "all">> = {
  new_order: "orders",
  urgent_order: "orders",
  callback_overdue: "orders",
  order_confirmed: "orders",
  order_canceled: "orders",
  stock_critical: "stock",
  vip_detected: "business",
  conversion_anomaly: "business",
  operator_activity: "operators",
  high_value_order: "business",
};

const SEVERITY_BY_TYPE: Record<NotificationType, NotificationSeverity> = {
  new_order: "info",
  urgent_order: "critical",
  callback_overdue: "warning",
  order_confirmed: "success",
  order_canceled: "warning",
  stock_critical: "critical",
  vip_detected: "success",
  conversion_anomaly: "warning",
  operator_activity: "info",
  high_value_order: "warning",
};

export function getNotificationCategory(type: NotificationType): Exclude<NotificationCategory, "all"> {
  return CATEGORY_BY_TYPE[type];
}

export function getDefaultSeverity(type: NotificationType): NotificationSeverity {
  return SEVERITY_BY_TYPE[type];
}

export function severityRank(severity: NotificationSeverity): number {
  switch (severity) {
    case "critical":
      return 4;
    case "warning":
      return 3;
    case "success":
      return 2;
    case "info":
    default:
      return 1;
  }
}

export function formatNotificationTime(iso: string): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "à l'instant";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 24 * 60) return `il y a ${Math.floor(minutes / 60)} h`;
  return `il y a ${Math.floor(minutes / (24 * 60))} j`;
}

export function makeNotificationId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 9);
  return `${prefix}-${Date.now()}-${randomPart}`;
}

export function draftToNotification(draft: NotificationDraft): NotificationItem {
  return {
    id: makeNotificationId(draft.type),
    type: draft.type,
    title: draft.title,
    message: draft.message,
    severity: draft.severity || getDefaultSeverity(draft.type),
    category: draft.category || getNotificationCategory(draft.type),
    read: false,
    createdAt: new Date().toISOString(),
    link: draft.link,
    entityId: draft.entityId,
    metadata: draft.metadata,
  };
}

export function liveEventFromDraft(draft: NotificationDraft): LiveEvent {
  return {
    id: makeNotificationId(`event-${draft.type}`),
    type: draft.type,
    title: draft.title,
    message: draft.message,
    severity: draft.severity || getDefaultSeverity(draft.type),
    createdAt: new Date().toISOString(),
    link: draft.link,
    entityId: draft.entityId,
    metadata: draft.metadata,
  };
}

export function shouldDisplayCategory(category: Exclude<NotificationCategory, "all">, enabled: Record<Exclude<NotificationCategory, "all">, boolean>): boolean {
  return enabled[category] !== false;
}
