import type { BusinessInsight, BusinessSignal, IntelligenceSummary } from "@/lib/os/intelligence/types";
import type { TrackingSnapshot } from "@/lib/os/tracking/types";
import type { OrderStatus } from "@/lib/types";

export type DomainOrderStatus = OrderStatus | "ready_to_ship";

export interface DomainOrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  isGift?: boolean;
}

export interface DomainOrder {
  id: string;
  reference: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  city: string | null;
  address: string | null;
  source: string;
  items: DomainOrderItem[];
  pack: string;
  amount: number;
  status: DomainOrderStatus;
  assignedOperatorId: string | null;
  assignedOperatorName: string | null;
  notes: string[];
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  riskScore: number;
  priorityScore: number;
  nextBestAction: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
}

export type OrderMutationActionType =
  | "confirm"
  | "mark_callback"
  | "prepare_whatsapp_relaunch"
  | "assign_operator"
  | "add_note"
  | "change_status"
  | "mark_shipped"
  | "cancel"
  | "adjust_stock"
  | "mark_notification_read"
  | "save_preferences";

export interface OrderMutationPayload {
  orderId: string;
  action: OrderMutationActionType;
  status?: DomainOrderStatus;
  note?: string;
  operatorId?: string;
  operatorName?: string;
  whatsappTemplateId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface DomainCustomer {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  ltv: number;
  segment: string;
}

export interface DomainOperator {
  id: string;
  name: string;
  role: "admin" | "manager" | "operator" | "viewer";
}

export type DomainEventType =
  | "order.created"
  | "order.updated"
  | "order.confirmed"
  | "order.cancelled"
  | "order.assigned"
  | "stock.updated"
  | "notification.created"
  | "settings.updated"
  | "audit.logged";

export interface DomainEvent {
  id: string;
  type: DomainEventType;
  entityType: "order" | "stock" | "notification" | "settings" | "audit" | "system";
  entityId: string;
  actorId: string | null;
  actorName: string | null;
  label: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actionType: string;
  entityType: string;
  entityId: string;
  label: string;
  details: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface SavedView {
  id: string;
  name: string;
  target: "orders" | "clients" | "pipeline" | "tracking";
  filters: QueryFilterState;
  createdAt: string;
}

export type QueryFilterValue = string | number | boolean | null | undefined | Array<string | number | boolean>;
export type QueryFilterState = Record<string, QueryFilterValue>;

export interface UserPreferences {
  userId: string;
  warRoomMode: "auto" | "on" | "off";
  notifications: {
    toastsEnabled: boolean;
    soundsEnabled: boolean;
    refreshIntervalSec: number;
    slaWarningMinutes: number;
    categoriesEnabled: Record<"orders" | "stock" | "business" | "operators" | "system", boolean>;
  };
  dashboard: {
    defaultPeriodDays: 7 | 30;
    widgets: string[];
    savedViews: SavedView[];
  };
  mobile: {
    density: "comfortable" | "compact";
  };
  operations: {
    highValueThreshold: number;
    slaTargetMinutes: number;
  };
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface DashboardAnalyticsSnapshot {
  periodDays: number;
  generatedAt: string;
  totals: {
    orders: number;
    confirmations: number;
    confirmationRate: number;
    cancellations: number;
    estimatedRevenue: number;
    averageBasket: number;
    averageConfirmationDelayMinutes: number;
    averageProcessingDelayMinutes: number;
    recurringCustomers: number;
  };
  ordersByDay: Array<{ day: string; orders: number; confirmed: number; cancelled: number; revenue: number }>;
  sourcePerformance: Array<{ source: string; orders: number; confirmationRate: number; revenue: number }>;
  cityPerformance: Array<{ city: string; orders: number; confirmationRate: number; revenue: number }>;
  productPerformance: Array<{ product: string; orders: number; revenue: number }>;
  packPerformance: Array<{ pack: string; orders: number; revenue: number }>;
  topPerformers: Array<{ label: string; type: "operator" | "source" | "city" | "product"; value: number }>;
  funnel: Array<{ stage: string; count: number; rate: number }>;
  customerLtv: {
    average: number;
    total: number;
    highValueCustomers: number;
  };
}

export interface TrackingAnalyticsSnapshot {
  periodDays: number;
  generatedAt: string;
  snapshot: TrackingSnapshot;
}

export interface IntelligenceSnapshot {
  periodDays: number;
  generatedAt: string;
  summary: IntelligenceSummary;
  insights: BusinessInsight[];
  groupedInsights: Record<string, BusinessInsight[]>;
  signals: BusinessSignal[];
}
