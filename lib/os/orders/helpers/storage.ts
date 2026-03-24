import type { OrderOperationalMetaMap, OrderSavedView } from "@/lib/os/orders/types";
import { ORDERS_STORAGE_KEYS } from "@/lib/os/orders/types";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadOpsMeta(): OrderOperationalMetaMap {
  if (!canUseStorage()) return {};

  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEYS.opsMeta);
    if (raw == null) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed == null) return {};
    return parsed as OrderOperationalMetaMap;
  } catch {
    return {};
  }
}

export function saveOpsMeta(value: OrderOperationalMetaMap): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ORDERS_STORAGE_KEYS.opsMeta, JSON.stringify(value));
}

export function loadSavedViews(): OrderSavedView[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEYS.savedViews);
    if (raw == null) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as OrderSavedView[];
  } catch {
    return [];
  }
}

export function saveSavedViews(views: OrderSavedView[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ORDERS_STORAGE_KEYS.savedViews, JSON.stringify(views));
}
