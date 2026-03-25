import type { DomainOrder, DomainOrderItem, DomainOrderStatus } from "@/lib/os/domain/types";
import type { OrderStorageRow } from "@/lib/os/orders/adapters/types";
import type { NormalizedOrder } from "@/lib/os/types";
import { normalizeOrderStatus, type OrderStatus } from "@/lib/types";

export interface OrderOsMeta {
  assignedOperatorId: string | null;
  assignedOperatorName: string | null;
  notes: string[];
  tags: string[];
  riskScore: number;
  priorityScore: number;
  nextBestAction: string | null;
  callbackCount: number;
  attemptCount: number;
  archived: boolean;
  lastTouchAt: string | null;
  assignedAt: string | null;
  lastWhatsappPreparedAt: string | null;
}

const EMPTY_OS_META: OrderOsMeta = {
  assignedOperatorId: null,
  assignedOperatorName: null,
  notes: [],
  tags: [],
  riskScore: 0,
  priorityScore: 0,
  nextBestAction: null,
  callbackCount: 0,
  attemptCount: 0,
  archived: false,
  lastTouchAt: null,
  assignedAt: null,
  lastWhatsappPreparedAt: null,
};

function parseArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
}

function parseNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBoolean(value: unknown): boolean {
  return value === true;
}

export function getOrderOsMeta(meta: Record<string, unknown> | null | undefined): OrderOsMeta {
  const rawOs = meta && typeof meta === "object" ? (meta.os as Record<string, unknown> | undefined) : undefined;
  if (!rawOs || typeof rawOs !== "object") return EMPTY_OS_META;

  return {
    assignedOperatorId: parseNullableString(rawOs.assignedOperatorId),
    assignedOperatorName: parseNullableString(rawOs.assignedOperatorName),
    notes: parseArray(rawOs.notes),
    tags: parseArray(rawOs.tags),
    riskScore: parseNumber(rawOs.riskScore),
    priorityScore: parseNumber(rawOs.priorityScore),
    nextBestAction: parseNullableString(rawOs.nextBestAction),
    callbackCount: parseNumber(rawOs.callbackCount),
    attemptCount: parseNumber(rawOs.attemptCount),
    archived: parseBoolean(rawOs.archived),
    lastTouchAt: parseNullableString(rawOs.lastTouchAt),
    assignedAt: parseNullableString(rawOs.assignedAt),
    lastWhatsappPreparedAt: parseNullableString(rawOs.lastWhatsappPreparedAt),
  };
}

function resolveDomainStatus(row: OrderStorageRow, osMeta: OrderOsMeta): DomainOrderStatus {
  const normalizedStatus = normalizeOrderStatus(row.status);
  if (normalizedStatus === "confirmed" && osMeta.nextBestAction === "mark_shipped") {
    return "ready_to_ship";
  }

  return normalizedStatus;
}

function buildOrderItems(row: OrderStorageRow): DomainOrderItem[] {
  const selected = Array.isArray(row.selected_perfumes) ? row.selected_perfumes : [];
  const gift = row.gift_perfume ? [row.gift_perfume] : [];
  const merged = [...selected, ...gift].filter((item) => typeof item === "string" && item.trim().length > 0);

  const amount = Number(row.price_mad ?? row.price ?? 0);
  const unit = merged.length > 0 ? Math.round(amount / merged.length) : amount;

  return merged.map((name, index) => ({
    sku: `${row.id}-${index + 1}`,
    name,
    quantity: 1,
    unitAmount: unit,
    totalAmount: unit,
    isGift: index >= selected.length,
  }));
}

export function mapStorageOrderToDomainOrder(row: OrderStorageRow): DomainOrder {
  const osMeta = getOrderOsMeta(row.meta);
  const amount = Number(row.price_mad ?? row.price ?? 0);

  return {
    id: row.id,
    reference: `ORD-${row.id.slice(-8).toUpperCase()}`,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.phone,
    city: row.city,
    address: row.address,
    source: row.source ?? "direct",
    items: buildOrderItems(row),
    pack: row.pack_type ?? "mixte",
    amount: Number.isFinite(amount) ? amount : 0,
    status: resolveDomainStatus(row, osMeta),
    assignedOperatorId: osMeta.assignedOperatorId,
    assignedOperatorName: osMeta.assignedOperatorName,
    notes: osMeta.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    confirmedAt: row.confirmed_at,
    shippedAt: row.shipped_at,
    deliveredAt: row.delivered_at,
    cancelledAt: row.canceled_at,
    riskScore: osMeta.riskScore,
    priorityScore: osMeta.priorityScore,
    nextBestAction: osMeta.nextBestAction,
    tags: osMeta.tags,
    metadata: row.meta ?? {},
  };
}

export function mapDomainOrderToNormalizedOrder(order: DomainOrder): NormalizedOrder {
  const selectedPerfumes = order.items.filter((item) => !item.isGift).map((item) => item.name);
  const giftPerfume = order.items.find((item) => item.isGift)?.name ?? null;
  const status = order.status === "ready_to_ship" ? "confirmed" : order.status;

  return {
    id: order.id,
    customer_id: order.customerId,
    customer_name: order.customerName,
    phone: order.customerPhone,
    city: order.city,
    address: order.address,
    pack_type: order.pack as NormalizedOrder["pack_type"],
    total_price: order.amount,
    price_mad: order.amount,
    status: status as OrderStatus,
    source: order.source,
    notes: order.notes[0] ?? null,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    confirmed_at: order.confirmedAt,
    shipped_at: order.shippedAt,
    delivered_at: order.deliveredAt,
    canceled_at: order.cancelledAt,
    selected_perfumes: selectedPerfumes,
    gift_perfume: giftPerfume,
    meta: order.metadata,
  };
}

export function buildUpdatedOrderMeta(
  currentMeta: Record<string, unknown> | null | undefined,
  updater: (meta: OrderOsMeta) => OrderOsMeta
): Record<string, unknown> {
  const base: Record<string, unknown> = currentMeta && typeof currentMeta === "object" ? { ...currentMeta } : {};
  const currentOs = getOrderOsMeta(base);
  const nextOs = updater(currentOs);

  return {
    ...base,
    os: {
      ...nextOs,
      notes: nextOs.notes,
      tags: nextOs.tags,
      riskScore: nextOs.riskScore,
      priorityScore: nextOs.priorityScore,
      nextBestAction: nextOs.nextBestAction,
      callbackCount: nextOs.callbackCount,
      attemptCount: nextOs.attemptCount,
      archived: nextOs.archived,
      lastTouchAt: nextOs.lastTouchAt,
      assignedAt: nextOs.assignedAt,
      assignedOperatorId: nextOs.assignedOperatorId,
      assignedOperatorName: nextOs.assignedOperatorName,
      lastWhatsappPreparedAt: nextOs.lastWhatsappPreparedAt,
    },
  };
}
