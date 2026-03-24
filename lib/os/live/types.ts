export type NotificationType =
  | "new_order"
  | "urgent_order"
  | "callback_overdue"
  | "order_confirmed"
  | "order_canceled"
  | "stock_critical"
  | "vip_detected"
  | "conversion_anomaly"
  | "operator_activity"
  | "high_value_order";

export type NotificationSeverity = "info" | "success" | "warning" | "critical";
export type NotificationCategory = "all" | "orders" | "stock" | "business" | "operators" | "system";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  category: NotificationCategory;
  read: boolean;
  createdAt: string;
  link: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface LiveEvent {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  createdAt: string;
  link?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export type RealtimeStatus = "live" | "polling" | "disconnected" | "error";
export type WarRoomPreference = "auto" | "on" | "off";

export interface NotificationSettings {
  toastsEnabled: boolean;
  soundsEnabled: boolean;
  categoriesEnabled: Record<Exclude<NotificationCategory, "all">, boolean>;
  refreshIntervalSec: number;
  slaWarningMinutes: number;
  warRoomPreference: WarRoomPreference;
}

export interface MobileNavItem {
  id: "home" | "orders" | "pipeline" | "alerts" | "more";
  label: string;
  href: string;
}

export interface NotificationDraft {
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  category: NotificationCategory;
  link: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface RealtimeSnapshotEntry {
  id: string;
  status: string;
  updatedAt: string;
  createdAt: string;
  price: number;
  city: string | null;
  source: string;
}
