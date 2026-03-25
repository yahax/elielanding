"use client";

import { normalizeOrderStatus } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";
import type {
  CatalogProduct,
  NormalizedOrder,
  OverviewResponse,
  ShopSettingsPayload,
  ShopSettingsResponse,
} from "@/lib/os/types";
import type {
  DashboardAnalyticsSnapshot,
  DomainEvent,
  IntelligenceSnapshot,
  TrackingAnalyticsSnapshot,
  UserPreferences,
} from "@/lib/os/domain/types";

type RequestInitWithNoStore = RequestInit & { noStore?: boolean };

function normalizeOrdersPayload(orders: NormalizedOrder[] | null | undefined): NormalizedOrder[] {
  if (!Array.isArray(orders)) return [];

  return orders
    .map((order) => {
      const id = typeof order?.id === "string" ? order.id : "";
      if (!id) return null;

      const createdAt = typeof order.created_at === "string" ? order.created_at : new Date().toISOString();
      const totalPrice = Number(order.price_mad ?? order.total_price ?? 0);
      const safeTotal = Number.isFinite(totalPrice) ? totalPrice : 0;

      return {
        ...order,
        id,
        created_at: createdAt,
        updated_at: typeof order.updated_at === "string" ? order.updated_at : createdAt,
        status: normalizeOrderStatus(order.status),
        selected_perfumes: Array.isArray(order.selected_perfumes)
          ? order.selected_perfumes.map((item) => String(item).trim()).filter(Boolean)
          : [],
        gift_perfume: typeof order.gift_perfume === "string" && order.gift_perfume.trim().length > 0
          ? order.gift_perfume.trim()
          : null,
        total_price: safeTotal,
        price_mad: safeTotal,
      } as NormalizedOrder;
    })
    .filter((order): order is NormalizedOrder => order != null);
}

function hashFnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function buildIdempotencyKey(url: string, init?: RequestInitWithNoStore): string | null {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method === "GET" || method === "HEAD") return null;

  const body = typeof init?.body === "string" ? init.body : "";
  const signature = `${method}|${url}|${body}`;
  return `os-${method.toLowerCase()}-${hashFnv1a(signature)}`;
}

async function osFetch<T>(url: string, init?: RequestInitWithNoStore): Promise<T> {
  try {
    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (!headers.has("x-idempotency-key") && !headers.has("idempotency-key")) {
      const key = buildIdempotencyKey(url, init);
      if (key) headers.set("x-idempotency-key", key);
    }

    const response = await fetch(url, {
      ...init,
      headers,
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
  try {
    const data = await osFetch<{ snapshot: DashboardAnalyticsSnapshot; overview: OverviewResponse }>(
      `/api/os/analytics/dashboard?days=${days}`,
      { noStore: true }
    );
    return data.overview;
  } catch {
    return osFetch<OverviewResponse>(`/api/os/overview?days=${days}`, { noStore: true });
  }
}

export async function fetchDashboardAnalytics(days = 30) {
  return osFetch<{ snapshot: DashboardAnalyticsSnapshot; overview: OverviewResponse }>(
    `/api/os/analytics/dashboard?days=${days}`,
    { noStore: true }
  );
}

export async function fetchTrackingAnalytics(days = 30) {
  return osFetch<{ snapshot: TrackingAnalyticsSnapshot }>(
    `/api/os/analytics/tracking?days=${days}`,
    { noStore: true }
  );
}

export async function fetchIntelligenceAnalytics(days = 30) {
  return osFetch<{ snapshot: IntelligenceSnapshot }>(
    `/api/os/analytics/intelligence?days=${days}`,
    { noStore: true }
  );
}

export interface FetchOrdersParams {
  status?: string;
  source?: string;
  pack?: string;
  search?: string;
  limit?: number;
  page?: number;
  pipeline?: boolean;
  days?: number;
}

export interface FetchOrdersResponse {
  orders: NormalizedOrder[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

type OrdersApiResponse = {
  orders?: NormalizedOrder[] | null;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
};

function toPositiveInt(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const intValue = Math.floor(Number(value));
  return intValue > 0 ? intValue : fallback;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function fetchOrders(params: FetchOrdersParams = {}): Promise<FetchOrdersResponse> {
  const requestedLimit = toPositiveInt(params.limit, 50);
  const cappedLimit = Math.min(requestedLimit, 300);
  const pageSize = Math.min(50, cappedLimit);
  const requestedPage = params.page != null ? toPositiveInt(params.page, 1) : undefined;

  const buildQuery = (page: number, limit: number) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set("status", params.status);
    if (params.source) searchParams.set("source", params.source);
    if (params.pack) searchParams.set("pack", params.pack);
    if (params.search) searchParams.set("search", params.search);
    if (params.pipeline) searchParams.set("pipeline", "1");
    if (params.days) searchParams.set("days", String(params.days));
    searchParams.set("limit", String(limit));
    searchParams.set("page", String(page));
    return searchParams.toString() ? `?${searchParams.toString()}` : "";
  };

  const fetchPage = async (page: number, limit: number): Promise<FetchOrdersResponse> => {
    const suffix = buildQuery(page, limit);
    const response = await osFetch<OrdersApiResponse>(`/api/os/orders${suffix}`, { noStore: true });
    const normalized = normalizeOrdersPayload(response.orders ?? []);
    const responsePage = isFiniteNumber(response.page) ? toPositiveInt(response.page, page) : page;
    const responsePageSize = isFiniteNumber(response.pageSize) ? Math.min(50, toPositiveInt(response.pageSize, limit)) : limit;
    const responseHasMore = Boolean(response.hasMore);
    return {
      orders: normalized,
      page: responsePage,
      pageSize: responsePageSize,
      hasMore: responseHasMore,
    };
  };

  try {
    if (requestedPage != null || cappedLimit <= 50) {
      return await fetchPage(requestedPage ?? 1, pageSize);
    }

    const aggregate: NormalizedOrder[] = [];
    let page = 1;
    let hasMore = true;
    const maxPages = Math.min(12, Math.ceil(cappedLimit / 50) + 1);

    while (hasMore && aggregate.length < cappedLimit && page <= maxPages) {
      const pageLimit = Math.min(50, cappedLimit - aggregate.length);
      const response = await fetchPage(page, pageLimit);
      aggregate.push(...response.orders);
      hasMore = response.hasMore;
      page += 1;
      if (response.orders.length === 0) break;
    }

    return {
      orders: aggregate.slice(0, cappedLimit),
      page: 1,
      pageSize,
      hasMore,
    };
  } catch (error) {
    console.warn("[OS/API] fetchOrders fallback empty list:", error);
    return {
      orders: [],
      page: requestedPage ?? 1,
      pageSize,
      hasMore: false,
    };
  }
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  return osFetch<{ success: boolean; updatedCount: number }>("/api/os/orders/status", {
    method: "POST",
    body: JSON.stringify({ orderId, newStatus }),
  });
}

export async function updateOrderStatusById(orderId: string, status: OrderStatus) {
  return osFetch<{ success: boolean; order: unknown }>(`/api/os/orders/${orderId}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export async function confirmOrder(orderId: string) {
  return osFetch<{ success: boolean; order: unknown }>(`/api/os/orders/${orderId}/confirm`, {
    method: "POST",
  });
}

export async function markOrderCallback(orderId: string) {
  return osFetch<{ success: boolean; order: unknown }>(`/api/os/orders/${orderId}/callback`, {
    method: "POST",
  });
}

export async function markOrderShipped(orderId: string) {
  return osFetch<{ success: boolean; order: unknown }>(`/api/os/orders/${orderId}/ship`, {
    method: "POST",
  });
}

export async function cancelOrder(orderId: string, reason?: string) {
  return osFetch<{ success: boolean; order: unknown }>(`/api/os/orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function assignOrder(orderId: string, payload: { operatorId: string; operatorName: string }) {
  return osFetch<{ success: boolean; order: unknown }>(`/api/os/orders/${orderId}/assign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function addOrderNote(orderId: string, note: string) {
  return osFetch<{ success: boolean; order: unknown }>(`/api/os/orders/${orderId}/notes`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function prepareOrderWhatsappRelaunch(orderId: string, templateId?: string) {
  return osFetch<{ success: boolean; order: unknown }>(`/api/os/orders/${orderId}/whatsapp`, {
    method: "POST",
    body: JSON.stringify({ templateId }),
  });
}

export async function bulkUpdateOrderStatus(orderIds: string[], newStatus: OrderStatus) {
  return osFetch<{ success: boolean; updatedCount: number }>("/api/os/orders/status", {
    method: "POST",
    body: JSON.stringify({ orderIds, newStatus }),
  });
}

export async function fetchAuditLog(params: { entityType?: string; entityId?: string; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.entityType) search.set("entityType", params.entityType);
  if (params.entityId) search.set("entityId", params.entityId);
  if (params.limit) search.set("limit", String(params.limit));
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return osFetch<{ entries: Array<Record<string, unknown>> }>(`/api/os/audit${suffix}`, { noStore: true });
}

export async function fetchDomainEvents(params: { since?: string; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.since) search.set("since", params.since);
  if (params.limit) search.set("limit", String(params.limit));
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return osFetch<{ events: DomainEvent[]; nextCursor: string | null }>(`/api/os/events${suffix}`, { noStore: true });
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

export async function updateCatalogProduct(payload: Partial<CatalogProduct> & { id: string }) {
  return osFetch<{ success: boolean; product: CatalogProduct | null }>("/api/os/catalog", {
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

export async function fetchUserPreferences() {
  return osFetch<{ preferences: UserPreferences }>("/api/os/preferences", { noStore: true });
}

export async function saveUserPreferences(patch: Partial<UserPreferences>) {
  return osFetch<{ success: boolean; preferences: UserPreferences }>("/api/os/preferences", {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function markNotificationsRead(payload: { notificationId?: string; notificationIds?: string[] }) {
  return osFetch<{ success: boolean; readCount: number; lastReadIds: string[] }>("/api/os/notifications/read", {
    method: "POST",
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
