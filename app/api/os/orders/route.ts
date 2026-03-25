import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mapOrderRow } from "@/lib/os/server";
import { getOsSessionCookieName, verifyOsSessionToken } from "@/lib/os/server/session-token";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 5;
export const dynamic = "force-dynamic";

const MAX_PAGE_SIZE = 50;
const MAX_DAYS_RANGE = 365;

const CANONICAL_STATUSES = new Set([
  "new",
  "to_confirm",
  "confirmed",
  "callback",
  "shipped",
  "delivered",
  "canceled",
]);

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 1) return fallback;
  return Math.floor(parsed);
}

function parseBooleanFlag(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function parseStringList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeStatusToken(raw: string): string | null {
  const token = raw.trim().toLowerCase();
  if (token === "pending") return "to_confirm";
  if (token === "cancelled") return "canceled";
  if (token === "ready_to_ship") return "confirmed";
  if (CANONICAL_STATUSES.has(token)) return token;
  return null;
}

function expandStatusesForStorage(rawStatuses: string[]): string[] {
  if (rawStatuses.length === 0) return [];
  const expanded = new Set<string>();
  for (const raw of rawStatuses) {
    const status = normalizeStatusToken(raw);
    if (!status) continue;
    if (status === "to_confirm") {
      expanded.add("to_confirm");
      expanded.add("pending");
      continue;
    }
    if (status === "canceled") {
      expanded.add("canceled");
      expanded.add("cancelled");
      continue;
    }
    expanded.add(status);
  }
  return Array.from(expanded);
}

function parseDaysRange(value: string | null): number | null {
  if (value == null) return null;
  const parsed = parsePositiveInt(value, 0);
  if (parsed < 1) return null;
  return Math.min(MAX_DAYS_RANGE, parsed);
}

function sanitizeSearchToken(value: string): string {
  return value
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function buildOrdersResponse(params: {
  orders: ReturnType<typeof mapOrderRow>[];
  page: number;
  pageSize: number;
  total: number;
}) {
  const total = Number.isFinite(params.total) && params.total > 0 ? Math.floor(params.total) : 0;
  const hasMore = params.page * params.pageSize < total;
  return {
    orders: params.orders,
    page: params.page,
    total,
    pageSize: params.pageSize,
    hasMore,
  };
}

export async function GET(req: Request) {
  const requestStartedAt = performance.now();
  const url = new URL(req.url);
  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const requestedLimit = parsePositiveInt(url.searchParams.get("limit"), MAX_PAGE_SIZE);
  const pageSize = Math.min(MAX_PAGE_SIZE, requestedLimit);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const statusFilters = expandStatusesForStorage(parseStringList(url.searchParams.get("status")));
  const sourceFilters = parseStringList(url.searchParams.get("source")).map((item) => item.toLowerCase());
  const cityFilters = parseStringList(url.searchParams.get("city"));
  const packFilters = parseStringList(url.searchParams.get("pack")).map((item) => item.toLowerCase());
  const searchRaw = url.searchParams.get("search") ?? url.searchParams.get("q");
  const searchToken = searchRaw ? sanitizeSearchToken(searchRaw) : "";
  const daysRange = parseDaysRange(url.searchParams.get("days"));
  const pipelineOnly = parseBooleanFlag(url.searchParams.get("pipeline"));

  const receivedFiltersLog = {
    status: statusFilters,
    source: sourceFilters,
    city: cityFilters,
    pack: packFilters,
    search: searchToken || null,
    days: daysRange,
    pipeline: pipelineOnly,
  };

  console.log("[API/OS][orders] filters_received", {
    route: "/api/os/orders",
    page,
    pageSize,
    offset: from,
    filters: receivedFiltersLog,
    ts: new Date().toISOString(),
  });

  try {
    const secret = process.env.ELIE_OS_SECRET;
    const cookieStore = await cookies();
    const token = cookieStore.get(getOsSessionCookieName())?.value ?? null;
    const session = secret
      ? await verifyOsSessionToken({ secret, token })
      : null;

    if (!session) {
      console.warn("[API/OS][orders] missing or invalid session, returning safe empty payload.");
      const response = buildOrdersResponse({ orders: [], page, pageSize, total: 0 });
      console.log("[API/OS][orders] result_count", {
        route: "/api/os/orders",
        returnedCount: response.orders.length,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        hasMore: response.hasMore,
        fetchTimeMs: Math.round(performance.now() - requestStartedAt),
        ts: new Date().toISOString(),
      });
      return NextResponse.json(response, { status: 200 });
    }

    const supabase = createServiceSupabaseClient();
    let query = supabase
      .from("orders")
      .select("*", { count: "exact" });

    if (pipelineOnly) {
      query = query.not("status", "in", '("delivered","canceled","cancelled")');
    }

    if (statusFilters.length > 0) {
      query = query.in("status", statusFilters);
    }

    if (sourceFilters.length === 1) {
      query = query.eq("source", sourceFilters[0]);
    } else if (sourceFilters.length > 1) {
      query = query.in("source", sourceFilters);
    }

    if (cityFilters.length === 1) {
      query = query.eq("city", cityFilters[0]);
    } else if (cityFilters.length > 1) {
      query = query.in("city", cityFilters);
    }

    if (packFilters.length === 1) {
      query = query.eq("pack_type", packFilters[0]);
    } else if (packFilters.length > 1) {
      query = query.in("pack_type", packFilters);
    }

    if (daysRange) {
      const since = new Date(Date.now() - daysRange * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", since);
    }

    if (searchToken.length > 0) {
      query = query.or(`customer_name.ilike.%${searchToken}%,phone.ilike.%${searchToken}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[API/OS][orders] query_error", {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      const response = buildOrdersResponse({ orders: [], page, pageSize, total: 0 });
      console.log("[API/OS][orders] result_count", {
        route: "/api/os/orders",
        returnedCount: response.orders.length,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        hasMore: response.hasMore,
        fetchTimeMs: Math.round(performance.now() - requestStartedAt),
        ts: new Date().toISOString(),
      });
      return NextResponse.json(response, { status: 200 });
    }

    const rows = Array.isArray(data) ? data : [];
    const orders = rows.map((row) => mapOrderRow(row as Parameters<typeof mapOrderRow>[0]));
    const response = buildOrdersResponse({
      orders,
      page,
      pageSize,
      total: typeof count === "number" ? count : orders.length,
    });

    console.log("[API/OS][orders] result_count", {
      route: "/api/os/orders",
      returnedCount: response.orders.length,
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      hasMore: response.hasMore,
      fetchTimeMs: Math.round(performance.now() - requestStartedAt),
      ts: new Date().toISOString(),
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error("[API/OS][orders] fallback_empty", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    const response = buildOrdersResponse({ orders: [], page, pageSize, total: 0 });
    console.log("[API/OS][orders] result_count", {
      route: "/api/os/orders",
      returnedCount: response.orders.length,
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      hasMore: response.hasMore,
      fetchTimeMs: Math.round(performance.now() - requestStartedAt),
      ts: new Date().toISOString(),
    });
    return NextResponse.json(response, { status: 200 });
  }
}
