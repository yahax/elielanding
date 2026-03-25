import type { NormalizedOrder } from "@/lib/os/types";
import type { OrderOperationalMetaMap } from "@/lib/os/orders/types";

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
}

function parseStringValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function extractOpsMetaFromOrders(orders: NormalizedOrder[]): OrderOperationalMetaMap {
  const result: OrderOperationalMetaMap = {};

  for (const order of orders) {
    const meta = order.meta;
    if (meta == null || typeof meta !== "object") continue;

    const rawOs = "os" in meta ? (meta.os as Record<string, unknown>) : null;
    if (!rawOs || typeof rawOs !== "object") continue;

    result[order.id] = {
      operator: parseStringValue(rawOs.assignedOperatorName),
      tags: parseStringArray(rawOs.tags),
      notes: parseStringArray(rawOs.notes),
      callbackCount: Number(rawOs.callbackCount ?? 0),
      attemptCount: Number(rawOs.attemptCount ?? 0),
      archived: rawOs.archived === true,
      lastTouchAt: parseStringValue(rawOs.lastTouchAt),
      assignedAt: parseStringValue(rawOs.assignedAt),
    };
  }

  return result;
}
