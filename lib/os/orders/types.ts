import type { NormalizedOrder } from "@/lib/os/types";
import type { OrderStatus } from "@/lib/types";

export type OrderPriority = "low" | "medium" | "high" | "critical";
export type OrderRisk = "low" | "medium" | "high";
export type SlaLevel = "normal" | "attention" | "critical";
export type ClientType = "new" | "returning";

export type PipelineColumnType = OrderStatus;

export type BulkActionType =
  | "assign_operator"
  | "update_status"
  | "mark_callback"
  | "export"
  | "tag"
  | "archive";

export type NextBestActionType =
  | "confirm_now"
  | "send_whatsapp"
  | "call_customer"
  | "schedule_callback"
  | "mark_shipped"
  | "verify_stock"
  | "assign_operator"
  | "add_note";

export type OrderSortField = "created_at" | "elapsed" | "value" | "priority" | "risk" | "status";
export type SortDirection = "asc" | "desc";

export interface OrderTimelineItem {
  id: string;
  at: string;
  label: string;
  kind: "created" | "status" | "touch" | "note" | "system";
  description?: string;
}

export interface OrderOperationalMeta {
  operator: string | null;
  tags: string[];
  notes: string[];
  callbackCount: number;
  attemptCount: number;
  archived: boolean;
  lastTouchAt: string | null;
  assignedAt: string | null;
}

export type OrderOperationalMetaMap = Record<string, Partial<OrderOperationalMeta>>;

export interface EnrichedOrder extends NormalizedOrder {
  customerKey: string;
  perfumes: string[];
  estimatedValue: number;
  operator: string | null;
  tags: string[];
  internalNotes: string[];
  callbackCount: number;
  attemptCount: number;
  archived: boolean;
  lastTouchAt: string | null;
  assignedAt: string | null;
  priorityScore: number;
  priority: OrderPriority;
  riskScore: number;
  risk: OrderRisk;
  nextBestAction: NextBestActionType;
  slaMinutes: number;
  slaLevel: SlaLevel;
  elapsedMinutes: number;
  isUrgent: boolean;
  isReturningCustomer: boolean;
  customerOrderCount: number;
  customerLifetimeValue: number;
  isHighValue: boolean;
  timeline: OrderTimelineItem[];
}

export interface OrderFiltersState {
  search: string;
  statuses: OrderStatus[];
  cities: string[];
  sources: string[];
  packs: string[];
  products: string[];
  operators: string[];
  priorities: OrderPriority[];
  risks: OrderRisk[];
  clientTypes: ClientType[];
  onlyHighValue: boolean;
  onlyUrgent: boolean;
  onlyAtRisk: boolean;
  includeArchived: boolean;
  datePreset: "today" | "7d" | "30d" | "90d" | "all";
  fromDate: string | null;
  toDate: string | null;
}

export interface OrderFilterOptions {
  cities: string[];
  sources: string[];
  packs: string[];
  products: string[];
  operators: string[];
}

export interface OrderSavedView {
  id: string;
  name: string;
  filters: OrderFiltersState;
  createdAt: string;
}

export interface OrdersSummaryStats {
  newOrders: number;
  toConfirm: number;
  callbacks: number;
  urgent: number;
  confirmedToday: number;
  canceledToday: number;
  avgBasket: number;
}

export type SummaryMetricKey =
  | "new_orders"
  | "to_confirm"
  | "callbacks"
  | "urgent"
  | "confirmed_today"
  | "canceled_today";

export interface PipelineHealth {
  totalInProgress: number;
  stagnating: number;
  urgent: number;
  progressionRate: number;
  blockedColumn: PipelineColumnType | null;
  blockedColumnCount: number;
}

export interface PipelineColumnStats {
  status: PipelineColumnType;
  count: number;
  urgentCount: number;
  avgElapsedMinutes: number;
  stagnationCount: number;
}

export const DEFAULT_OPERATORS = [
  "Equipe Confirmation",
  "Equipe Callback",
  "Senior Desk",
  "Nadia",
  "Yassine",
  "Meriem",
];

export const DEFAULT_ORDER_FILTERS_STATE: OrderFiltersState = {
  search: "",
  statuses: [],
  cities: [],
  sources: [],
  packs: [],
  products: [],
  operators: [],
  priorities: [],
  risks: [],
  clientTypes: [],
  onlyHighValue: false,
  onlyUrgent: false,
  onlyAtRisk: false,
  includeArchived: false,
  datePreset: "30d",
  fromDate: null,
  toDate: null,
};

export const ORDERS_STORAGE_KEYS = {
  opsMeta: "elie.os.orders.ops-meta.v1",
  savedViews: "elie.os.orders.saved-views.v1",
};
