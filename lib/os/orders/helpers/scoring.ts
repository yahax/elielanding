import { normalizeOrderPerfumes } from "@/lib/order-utils";
import type { NormalizedOrder } from "@/lib/os/types";
import type {
  ClientType,
  EnrichedOrder,
  OrderFilterOptions,
  OrderFiltersState,
  OrderOperationalMeta,
  OrderOperationalMetaMap,
  OrderSortField,
  OrdersSummaryStats,
  PipelineColumnStats,
  PipelineHealth,
  SortDirection,
} from "@/lib/os/orders/types";
import type { OrderStatus } from "@/lib/types";
import {
  getSlaLevel,
  PIPELINE_COLUMNS,
  scoreToPriority,
  scoreToRisk,
  STATUS_ORDER_WEIGHT,
  STATUS_RISK_WEIGHT,
  STATUS_SLA_MINUTES,
} from "@/lib/os/orders/helpers/status";
import { getOrderValue, isSameDayISO, normalizePhone } from "@/lib/os/orders/helpers/format";

const HIGH_VALUE_THRESHOLD = 699;

const CITY_RISK_WEIGHT: Record<string, number> = {
  casablanca: 8,
  sale: 9,
  fes: 7,
  kenitra: 6,
  tanger: 4,
  rabat: 4,
  agadir: 3,
  marrakech: 5,
};

type CustomerStats = {
  count: number;
  lifetimeValue: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeMinutesSince(iso: string | null | undefined, now: Date): number {
  if (iso == null || iso === "") return 0;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
}

function withDefaults(meta?: Partial<OrderOperationalMeta>): OrderOperationalMeta {
  return {
    operator: meta?.operator ?? null,
    tags: Array.isArray(meta?.tags) ? meta.tags : [],
    notes: Array.isArray(meta?.notes) ? meta.notes : [],
    callbackCount: Number.isFinite(meta?.callbackCount) ? Number(meta?.callbackCount) : 0,
    attemptCount: Number.isFinite(meta?.attemptCount) ? Number(meta?.attemptCount) : 0,
    archived: Boolean(meta?.archived),
    lastTouchAt: meta?.lastTouchAt ?? null,
    assignedAt: meta?.assignedAt ?? null,
  };
}

function buildCustomerMap(orders: NormalizedOrder[]): Map<string, CustomerStats> {
  const map = new Map<string, CustomerStats>();

  for (const order of orders) {
    const key = normalizePhone(order.phone);
    if (key === "") continue;

    const previous = map.get(key);
    const value = getOrderValue(order);
    map.set(key, {
      count: (previous?.count ?? 0) + 1,
      lifetimeValue: (previous?.lifetimeValue ?? 0) + value,
    });
  }

  return map;
}

function computePriorityScore(input: {
  status: OrderStatus;
  elapsedMinutes: number;
  value: number;
  isReturningCustomer: boolean;
  callbackCount: number;
  attemptCount: number;
  hasOperator: boolean;
  slaLevel: "normal" | "attention" | "critical";
}): number {
  const ageWeight = clamp(Math.round(input.elapsedMinutes / 14), 0, 28);
  const valueWeight = clamp(Math.round(input.value / 60), 0, 18);
  const callbackWeight = clamp(input.callbackCount * 8, 0, 20);
  const attemptsWeight = clamp(input.attemptCount * 4, 0, 12);
  const operatorWeight = input.hasOperator ? 0 : 7;
  const customerWeight = input.isReturningCustomer ? 6 : 2;
  const slaWeight = input.slaLevel === "critical" ? 14 : input.slaLevel === "attention" ? 7 : 0;

  const score =
    STATUS_ORDER_WEIGHT[input.status] +
    ageWeight +
    valueWeight +
    callbackWeight +
    attemptsWeight +
    operatorWeight +
    customerWeight +
    slaWeight -
    12;

  return clamp(score, 0, 100);
}

function computeRiskScore(input: {
  status: OrderStatus;
  staleMinutes: number;
  city: string | null;
  callbackCount: number;
  attemptCount: number;
  isReturningCustomer: boolean;
  value: number;
}): number {
  const staleWeight = clamp(Math.round(input.staleMinutes / 24), 0, 26);
  const callbackWeight = clamp(input.callbackCount * 10, 0, 24);
  const attemptsWeight = clamp(input.attemptCount * 5, 0, 16);
  const customerWeight = input.isReturningCustomer ? 0 : 8;
  const valueWeight = input.value >= HIGH_VALUE_THRESHOLD ? 8 : 0;
  const cityKey = (input.city || "").trim().toLowerCase();
  const cityWeight = CITY_RISK_WEIGHT[cityKey] ?? 3;

  const score =
    STATUS_RISK_WEIGHT[input.status] +
    staleWeight +
    callbackWeight +
    attemptsWeight +
    customerWeight +
    valueWeight +
    cityWeight -
    6;

  return clamp(score, 0, 100);
}

function computeNextBestAction(input: {
  status: OrderStatus;
  priority: EnrichedOrder["priority"];
  risk: EnrichedOrder["risk"];
  hasOperator: boolean;
  elapsedMinutes: number;
}): EnrichedOrder["nextBestAction"] {
  if (!input.hasOperator && (input.status === "new" || input.status === "to_confirm" || input.status === "callback")) {
    return "assign_operator";
  }

  if (input.status === "confirmed") {
    return "mark_shipped";
  }

  if (input.status === "shipped") {
    return "verify_stock";
  }

  if (input.status === "callback") {
    return input.elapsedMinutes > 120 ? "call_customer" : "schedule_callback";
  }

  if (input.status === "new" || input.status === "to_confirm") {
    if (input.priority === "critical" || input.risk === "high") return "call_customer";
    return "confirm_now";
  }

  if (input.risk === "high") {
    return "send_whatsapp";
  }

  if (input.status === "canceled" || input.status === "delivered") {
    return "add_note";
  }

  return "send_whatsapp";
}

function buildTimeline(order: NormalizedOrder, notes: string[], lastTouchAt: string | null) {
  const timeline: EnrichedOrder["timeline"] = [
    {
      id: `${order.id}-created`,
      at: order.created_at,
      label: "Commande créée",
      kind: "created",
    },
  ];

  if (order.confirmed_at) {
    timeline.push({
      id: `${order.id}-confirmed`,
      at: order.confirmed_at,
      label: "Commande confirmée",
      kind: "status",
    });
  }

  if (order.shipped_at) {
    timeline.push({
      id: `${order.id}-shipped`,
      at: order.shipped_at,
      label: "Commande expédiée",
      kind: "status",
    });
  }

  if (order.delivered_at) {
    timeline.push({
      id: `${order.id}-delivered`,
      at: order.delivered_at,
      label: "Commande livrée",
      kind: "status",
    });
  }

  if (order.canceled_at) {
    timeline.push({
      id: `${order.id}-canceled`,
      at: order.canceled_at,
      label: "Commande annulée",
      kind: "status",
    });
  }

  if (lastTouchAt) {
    timeline.push({
      id: `${order.id}-touch`,
      at: lastTouchAt,
      label: "Dernier contact opérateur",
      kind: "touch",
    });
  }

  notes.slice(0, 3).forEach((note, index) => {
    timeline.push({
      id: `${order.id}-note-${index}`,
      at: order.updated_at,
      label: "Note interne",
      kind: "note",
      description: note,
    });
  });

  timeline.sort((a, b) => {
    const aDate = new Date(a.at).getTime();
    const bDate = new Date(b.at).getTime();
    return bDate - aDate;
  });

  return timeline;
}

export function enrichOrders(
  orders: NormalizedOrder[],
  opsMap: OrderOperationalMetaMap,
  now = new Date()
): EnrichedOrder[] {
  const customerMap = buildCustomerMap(orders);

  return orders.map((order) => {
    const meta = withDefaults(opsMap[order.id]);
    const customerKey = normalizePhone(order.phone);
    const customerStats = customerMap.get(customerKey) ?? { count: 1, lifetimeValue: getOrderValue(order) };
    const elapsedMinutes = safeMinutesSince(order.created_at, now);
    const slaMinutes = STATUS_SLA_MINUTES[order.status];
    const slaLevel = getSlaLevel(elapsedMinutes, slaMinutes);
    const value = getOrderValue(order);
    const staleMinutes = meta.lastTouchAt ? safeMinutesSince(meta.lastTouchAt, now) : elapsedMinutes;

    const priorityScore = computePriorityScore({
      status: order.status,
      elapsedMinutes,
      value,
      isReturningCustomer: customerStats.count > 1,
      callbackCount: meta.callbackCount,
      attemptCount: meta.attemptCount,
      hasOperator: meta.operator != null && meta.operator !== "",
      slaLevel,
    });

    const riskScore = computeRiskScore({
      status: order.status,
      staleMinutes,
      city: order.city,
      callbackCount: meta.callbackCount,
      attemptCount: meta.attemptCount,
      isReturningCustomer: customerStats.count > 1,
      value,
    });

    const priority = scoreToPriority(priorityScore);
    const risk = scoreToRisk(riskScore);

    return {
      ...order,
      customerKey,
      perfumes: normalizeOrderPerfumes(order),
      estimatedValue: value,
      operator: meta.operator,
      tags: meta.tags,
      internalNotes: meta.notes,
      callbackCount: meta.callbackCount,
      attemptCount: meta.attemptCount,
      archived: meta.archived,
      lastTouchAt: meta.lastTouchAt,
      assignedAt: meta.assignedAt,
      priorityScore,
      priority,
      riskScore,
      risk,
      slaMinutes,
      slaLevel,
      elapsedMinutes,
      isUrgent: priority === "critical" || slaLevel === "critical" || (risk === "high" && elapsedMinutes >= 45),
      isReturningCustomer: customerStats.count > 1,
      customerOrderCount: customerStats.count,
      customerLifetimeValue: customerStats.lifetimeValue,
      isHighValue: value >= HIGH_VALUE_THRESHOLD,
      nextBestAction: computeNextBestAction({
        status: order.status,
        priority,
        risk,
        hasOperator: meta.operator != null && meta.operator !== "",
        elapsedMinutes,
      }),
      timeline: buildTimeline(order, meta.notes, meta.lastTouchAt),
    };
  });
}

function includesTokenInText(haystack: string | null | undefined, token: string): boolean {
  if (haystack == null || haystack === "") return false;
  return haystack.toLowerCase().includes(token);
}

function resolveClientType(order: EnrichedOrder): ClientType {
  return order.isReturningCustomer ? "returning" : "new";
}

function isDateWithinPreset(iso: string, preset: OrderFiltersState["datePreset"], now: Date): boolean {
  if (preset === "all") return true;

  const createdAt = new Date(iso);
  if (Number.isNaN(createdAt.getTime())) return false;

  if (preset === "today") {
    return isSameDayISO(iso, now);
  }

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const minDate = new Date(now);
  minDate.setDate(minDate.getDate() - days);
  return createdAt >= minDate;
}

function isDateWithinBounds(iso: string, fromDate: string | null, toDate: string | null): boolean {
  const createdAt = new Date(iso);
  if (Number.isNaN(createdAt.getTime())) return false;

  if (fromDate) {
    const from = new Date(fromDate);
    if (!Number.isNaN(from.getTime()) && createdAt < from) return false;
  }

  if (toDate) {
    const to = new Date(toDate);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      if (createdAt > to) return false;
    }
  }

  return true;
}

export function applyOrderFilters(
  orders: EnrichedOrder[],
  filters: OrderFiltersState,
  now = new Date()
): EnrichedOrder[] {
  const searchToken = filters.search.trim().toLowerCase();

  return orders.filter((order) => {
    if (!filters.includeArchived && order.archived) return false;

    if (searchToken) {
      const inPerfumes = order.perfumes.some((item) => item.toLowerCase().includes(searchToken));
      const matchesSearch =
        includesTokenInText(order.customer_name, searchToken) ||
        includesTokenInText(order.phone, searchToken) ||
        includesTokenInText(order.city, searchToken) ||
        includesTokenInText(order.id, searchToken) ||
        inPerfumes;
      if (!matchesSearch) return false;
    }

    if (filters.statuses.length > 0 && !filters.statuses.includes(order.status)) return false;
    if (filters.cities.length > 0 && !filters.cities.includes(order.city || "")) return false;
    if (filters.sources.length > 0 && !filters.sources.includes(order.source || "")) return false;
    if (filters.packs.length > 0 && !filters.packs.includes(order.pack_type || "")) return false;
    if (filters.products.length > 0) {
      const hasSelectedProduct = filters.products.some((product) => order.perfumes.includes(product));
      if (!hasSelectedProduct) return false;
    }

    if (filters.operators.length > 0) {
      const operatorValue = order.operator ?? "Non assigné";
      if (!filters.operators.includes(operatorValue)) return false;
    }

    if (filters.priorities.length > 0 && !filters.priorities.includes(order.priority)) return false;
    if (filters.risks.length > 0 && !filters.risks.includes(order.risk)) return false;
    if (filters.clientTypes.length > 0 && !filters.clientTypes.includes(resolveClientType(order))) return false;
    if (filters.onlyHighValue && !order.isHighValue) return false;
    if (filters.onlyUrgent && !order.isUrgent) return false;
    if (filters.onlyAtRisk && order.risk !== "high") return false;

    if (!isDateWithinPreset(order.created_at, filters.datePreset, now)) return false;
    if (!isDateWithinBounds(order.created_at, filters.fromDate, filters.toDate)) return false;

    return true;
  });
}

export function sortOrders(
  orders: EnrichedOrder[],
  field: OrderSortField,
  direction: SortDirection
): EnrichedOrder[] {
  const cloned = [...orders];
  const sign = direction === "asc" ? 1 : -1;

  cloned.sort((a, b) => {
    switch (field) {
      case "value":
        return (a.estimatedValue - b.estimatedValue) * sign;
      case "priority":
        return (a.priorityScore - b.priorityScore) * sign;
      case "risk":
        return (a.riskScore - b.riskScore) * sign;
      case "elapsed":
        return (a.elapsedMinutes - b.elapsedMinutes) * sign;
      case "status":
        return a.status.localeCompare(b.status) * sign;
      case "created_at":
      default:
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * sign;
    }
  });

  return cloned;
}

export function buildOrdersSummaryStats(orders: EnrichedOrder[], now = new Date()): OrdersSummaryStats {
  const validValueOrders = orders.filter((order) => order.status !== "canceled");
  const avgBasket =
    validValueOrders.length > 0
      ? Math.round(validValueOrders.reduce((acc, item) => acc + item.estimatedValue, 0) / validValueOrders.length)
      : 0;

  return {
    newOrders: orders.filter((order) => order.status === "new").length,
    toConfirm: orders.filter((order) => order.status === "to_confirm").length,
    callbacks: orders.filter((order) => order.status === "callback").length,
    urgent: orders.filter((order) => order.isUrgent).length,
    confirmedToday: orders.filter((order) => order.status === "confirmed" && isSameDayISO(order.updated_at, now)).length,
    canceledToday: orders.filter((order) => order.status === "canceled" && isSameDayISO(order.updated_at, now)).length,
    avgBasket,
  };
}

export function buildOrderFilterOptions(orders: EnrichedOrder[]): OrderFilterOptions {
  const unique = <T,>(values: T[]) => Array.from(new Set(values)).sort((a, b) => String(a).localeCompare(String(b)));

  return {
    cities: unique(orders.map((order) => order.city || "").filter((value) => value !== "")),
    sources: unique(orders.map((order) => order.source || "").filter((value) => value !== "")),
    packs: unique(orders.map((order) => order.pack_type)),
    products: unique(orders.flatMap((order) => order.perfumes).filter((value) => value !== "")),
    operators: unique(orders.map((order) => order.operator || "Non assigné")),
  };
}

export function buildPipelineColumnStats(orders: EnrichedOrder[]): PipelineColumnStats[] {
  return PIPELINE_COLUMNS.map((status) => {
    const columnOrders = orders.filter((order) => order.status === status);
    const avgElapsedMinutes =
      columnOrders.length > 0
        ? Math.round(columnOrders.reduce((acc, order) => acc + order.elapsedMinutes, 0) / columnOrders.length)
        : 0;

    return {
      status,
      count: columnOrders.length,
      urgentCount: columnOrders.filter((order) => order.isUrgent).length,
      avgElapsedMinutes,
      stagnationCount: columnOrders.filter((order) => order.slaLevel === "critical").length,
    };
  });
}

export function buildPipelineHealth(orders: EnrichedOrder[]): PipelineHealth {
  const columnStats = buildPipelineColumnStats(orders);
  const inProgress = orders.filter((order) => order.status !== "delivered" && order.status !== "canceled");
  const completed = orders.filter((order) => order.status === "delivered").length;
  const progressionRate = orders.length > 0 ? Math.round((completed / orders.length) * 100) : 0;

  const blocked = columnStats
    .filter((column) => column.stagnationCount > 0)
    .sort((a, b) => b.stagnationCount - a.stagnationCount)[0];

  return {
    totalInProgress: inProgress.length,
    stagnating: inProgress.filter((order) => order.slaLevel === "critical").length,
    urgent: inProgress.filter((order) => order.isUrgent).length,
    progressionRate,
    blockedColumn: blocked?.status ?? null,
    blockedColumnCount: blocked?.stagnationCount ?? 0,
  };
}

export function buildFocusQueue(orders: EnrichedOrder[], limit = 25): EnrichedOrder[] {
  return [...orders]
    .filter((order) => order.status !== "delivered" && order.status !== "canceled")
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
      return b.elapsedMinutes - a.elapsedMinutes;
    })
    .slice(0, limit);
}
