"use client";

import type { OrderStatus } from "@/lib/types";
import type {
  CatalogProduct,
  NormalizedOrder,
  OverviewResponse,
  ShopSettingsPayload,
  ShopSettingsResponse,
} from "@/lib/os/types";

type RequestInitWithNoStore = RequestInit & { noStore?: boolean };

async function osFetch<T>(url: string, init?: RequestInitWithNoStore): Promise<T> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: init?.noStore ? "no-store" : init?.cache,
    });

    const data = (await response.json().catch(() => ({}))) as T & { error?: string; message?: string };

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed (${response.status})`;
      // Catch specific Supabase 'Invalid API key' common errors
      if (errorMsg.includes("API key") || errorMsg.includes("JWT")) {
        throw new Error("Erreur de configuration API : Vérifiez vos clés Supabase.");
      }
      throw new Error(errorMsg);
    }
    return data;
  } catch (err) {
    console.error(`[OS/API] Fetch error for ${url}:`, err);
    throw err;
  }
}

export async function fetchOverview(days = 30): Promise<OverviewResponse> {
  return osFetch<OverviewResponse>(`/api/os/overview?days=${days}`, { noStore: true });
}

export interface FetchOrdersParams {
  status?: string;
  source?: string;
  pack?: string;
  search?: string;
  limit?: number;
  pipeline?: boolean;
}

export async function fetchOrders(params: FetchOrdersParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.source) searchParams.set("source", params.source);
  if (params.pack) searchParams.set("pack", params.pack);
  if (params.search) searchParams.set("search", params.search);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.pipeline) searchParams.set("pipeline", "1");

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return osFetch<{ orders: NormalizedOrder[] }>(`/api/os/orders${suffix}`, { noStore: true });
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  return osFetch<{ success: boolean; updatedCount: number }>("/api/os/orders/status", {
    method: "POST",
    body: JSON.stringify({ orderId, newStatus }),
  });
}

export async function bulkUpdateOrderStatus(orderIds: string[], newStatus: OrderStatus) {
  return osFetch<{ success: boolean; updatedCount: number }>("/api/os/orders/status", {
    method: "POST",
    body: JSON.stringify({ orderIds, newStatus }),
  });
}

export async function fetchCatalog() {
  return osFetch<{ products: CatalogProduct[] }>("/api/os/catalog", { noStore: true });
}

export async function createCatalogProduct(payload: Partial<CatalogProduct> & { name: string }) {
  return osFetch<{ product: CatalogProduct }>("/api/os/catalog", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCatalogProduct(payload: Partial<CatalogProduct> & { id: string; name: string }) {
  return osFetch<{ product: CatalogProduct }>("/api/os/catalog", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchSettings() {
  return osFetch<ShopSettingsResponse>("/api/os/settings", { noStore: true });
}

export async function saveSettings(payload: ShopSettingsPayload) {
  return osFetch<{ success: boolean }>("/api/os/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function searchOs(query: string) {
  const q = query.trim();
  if (q.length < 2) return { results: [] as Array<{ type: string; id: string; title: string; subtitle: string; href: string }> };
  return osFetch<{ results: Array<{ type: string; id: string; title: string; subtitle: string; href: string }> }>(`/api/os/search?q=${encodeURIComponent(q)}`, {
    noStore: true,
  });
}
