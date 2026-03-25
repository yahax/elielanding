import { calculateStats } from "@/lib/analytics";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { normalizeOrderStatus, type Order } from "@/lib/types";
import type { CatalogProduct, NormalizedOrder, OrderFilters } from "@/lib/os/types";

type OrderRow = {
  id: string;
  customer_name: string | null;
  phone: string | null;
  customer_phone?: string | null;
  city: string | null;
  address: string | null;
  pack_type: string | null;
  pack?: string | null;
  status: string | null;
  source: string | null;
  notes?: string | null;
  selected_perfumes: string[] | null;
  gift_perfume: string | null;
  total_price?: number | null;
  price: number | null;
  price_mad: number | null;
  offer_mode: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  canceled_at: string | null;
};

type PerfumeCatalogRow = {
  id: string | null;
  name: string | null;
  slug: string | null;
  gender: string | null;
  tier: string | null;
  is_active: boolean | null;
  image_url: string | null;
  created_at: string | null;
};

type LegacyPerfumeRow = {
  id: string | null;
  name: string | null;
  category: string | null;
  stock: number | null;
  created_at: string | null;
};

export function mapOrderRow(row: OrderRow): NormalizedOrder {
  const phone = row.phone ?? row.customer_phone ?? null;
  const packType = row.pack_type ?? row.pack ?? "mixte";
  const total = row.price_mad ?? row.price ?? row.total_price ?? 0;
  const status = normalizeOrderStatus(row.status);

  return {
    id: row.id,
    customer_id: null,
    customer_name: row.customer_name,
    phone,
    city: row.city,
    address: row.address,
    pack_type: packType as Order["pack_type"],
    total_price: total,
    price_mad: row.price_mad ?? total,
    status,
    source: row.source || "direct",
    notes: row.notes ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    confirmed_at: row.confirmed_at,
    shipped_at: row.shipped_at,
    delivered_at: row.delivered_at,
    canceled_at: row.canceled_at,
    selected_perfumes: Array.isArray(row.selected_perfumes) ? row.selected_perfumes : [],
    gift_perfume: row.gift_perfume,
    offer_mode: row.offer_mode || undefined,
    meta: row.meta ?? null,
  };
}

export async function fetchOrders(filters: OrderFilters = {}): Promise<NormalizedOrder[]> {
  const supabase = createServiceSupabaseClient();
  const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 1000) : 500;

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.days) {
    const since = new Date(Date.now() - filters.days * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", since);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("[OS/SERVER] fetchOrders fell back to empty array due to error:", error.message || error);
    return [];
  }

  const normalized = (data || []).map((row) => mapOrderRow(row as OrderRow));
  const searchToken = filters.search?.trim().toLowerCase() ?? "";

  return normalized.filter((order) => {
    if (filters.pipeline && (order.status === "delivered" || order.status === "canceled")) {
      return false;
    }

    if (filters.status && order.status !== normalizeOrderStatus(filters.status)) {
      return false;
    }

    if (filters.source && (order.source || "").toLowerCase() !== filters.source.toLowerCase()) {
      return false;
    }

    if (filters.pack && (order.pack_type || "").toLowerCase() !== filters.pack.toLowerCase()) {
      return false;
    }

    if (searchToken.length > 0) {
      const inName = (order.customer_name || "").toLowerCase().includes(searchToken);
      const inPhone = (order.phone || "").toLowerCase().includes(searchToken);
      const inCity = (order.city || "").toLowerCase().includes(searchToken);
      const inId = (order.id || "").toLowerCase().includes(searchToken);
      if (!inName && !inPhone && !inCity && !inId) {
        return false;
      }
    }

    return true;
  });
}

export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  try {
    const supabase = createServiceSupabaseClient();
    const { data: perfumesModern, error: perfumesModernError } = await supabase
      .from("perfumes")
      .select("id,name,slug,gender,tier,is_active,image_url,created_at")
      .order("name", { ascending: true });

    let perfumeRows: Array<PerfumeCatalogRow | LegacyPerfumeRow> = [];
    let legacyPerfumeShape = false;

    if (perfumesModernError) {
      if (perfumesModernError.code === "PGRST205" || perfumesModernError.code === "42P01") {
        console.warn("[OS/SERVER] Perfumes table missing, returning empty catalog");
        return [];
      }

      // Legacy schema fallback (perfumes table without slug/gender/tier columns).
      const { data: perfumesLegacy, error: perfumesLegacyError } = await supabase
        .from("perfumes")
        .select("id,name,category,stock,created_at")
        .order("name", { ascending: true });

      if (perfumesLegacyError) {
        console.error("[OS/SERVER] fetchCatalogProducts legacy perfumes error:", perfumesLegacyError);
        throw perfumesLegacyError;
      }

      perfumeRows = (perfumesLegacy || []) as LegacyPerfumeRow[];
      legacyPerfumeShape = true;
    } else {
      perfumeRows = (perfumesModern || []) as PerfumeCatalogRow[];
    }

    let inventoryRows: Array<Record<string, unknown>> = [];
    let inventoryError: { code?: string } | null = null;

    const inventoryWithThreshold = await supabase
      .from("inventory")
      .select("perfume_id,stock,low_stock_threshold");

    if (inventoryWithThreshold.error) {
      // Legacy inventory fallback (no low_stock_threshold column).
      const inventoryLegacy = await supabase
        .from("inventory")
        .select("perfume_id,stock");

      if (inventoryLegacy.error) {
        inventoryError = inventoryLegacy.error;
      } else {
        inventoryRows = (inventoryLegacy.data || []) as Array<Record<string, unknown>>;
      }
    } else {
      inventoryRows = (inventoryWithThreshold.data || []) as Array<Record<string, unknown>>;
    }

    if (inventoryError && inventoryError.code !== "PGRST204" && inventoryError.code !== "PGRST205" && inventoryError.code !== "42P01") {
      console.error("[OS/SERVER] fetchCatalogProducts inventory error:", inventoryError);
      throw inventoryError;
    }

    const inventoryMap = new Map<
      string,
      {
        stock: number;
        low_stock_threshold: number;
      }
    >();

    for (const row of inventoryRows) {
      const key = String((row as { perfume_id: unknown }).perfume_id ?? "");
      if (!key) continue;
      inventoryMap.set(key, {
        stock: Number((row as { stock?: unknown }).stock ?? 0) || 0,
        low_stock_threshold: Number((row as { low_stock_threshold?: unknown }).low_stock_threshold ?? 5) || 5,
      });
    }

    if (legacyPerfumeShape) {
      return (perfumeRows as LegacyPerfumeRow[]).map((row) => {
        const id = String(row.id ?? "");
        const inv = inventoryMap.get(id);
        const fallbackStock = Number(row.stock ?? 0) || 0;

        return {
          id,
          name: row.name ?? "Produit",
          slug: (row.name ?? "produit").toLowerCase().replace(/ /g, "-"),
          category: row.category || "mixte",
          tier: "classic",
          is_active: true,
          image_url: "/catalogues/placeholder.webp",
          stock: inv?.stock ?? fallbackStock,
          low_stock_threshold: inv?.low_stock_threshold ?? 5,
          created_at: row.created_at || undefined,
        };
      });
    }

    return (perfumeRows as PerfumeCatalogRow[]).map((row) => {
      const id = String(row.id ?? "");
      const inv = inventoryMap.get(id);
      return {
        id,
        name: row.name ?? "Produit",
        slug: row.slug || (row.name ?? "produit").toLowerCase().replace(/ /g, '-'),
        category: row.gender || "mixte",
        tier: row.tier || "classic",
        is_active: row.is_active ?? true,
        image_url: row.image_url || '/catalogues/placeholder.webp',
        stock: inv?.stock ?? 0,
        low_stock_threshold: inv?.low_stock_threshold ?? 5,
        created_at: row.created_at || undefined,
      };
    });
  } catch (err) {
    console.warn("[OS/SERVER] fetchCatalogProducts failed gracefully:", err);
    return [];
  }
}

export async function fetchInventoryStats() {
  const products = await fetchCatalogProducts();
  const lowStock = products.filter((p) => p.is_active && p.stock <= p.low_stock_threshold);

  return {
    totalItems: products.length,
    lowStockItems: lowStock.length,
    totalStockValue: products.reduce((acc, p) => acc + (p.stock || 0), 0),
    alerts: lowStock.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      threshold: p.low_stock_threshold,
    })),
  };
}

export async function fetchOverview(days = 30) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Fetch orders safely
    let orders: NormalizedOrder[] = [];
    try {
      orders = await fetchOrders({ limit: 1000 });
    } catch {
      console.warn("[OS/SERVER] Failed to fetch orders for overview, using empty list");
    }

    const scoped = orders.filter((order) => order.created_at >= since);
    const stats = calculateStats(scoped as Order[]);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((order) => order.created_at >= startOfToday.toISOString());
    const todayRevenue = todayOrders
      .filter((order) => order.status !== "canceled")
      .reduce((sum, order) => sum + (order.total_price || 0), 0);

    const avgBasket = stats.total_orders > 0 ? Math.round(stats.revenue / stats.total_orders) : 0;
    const confirmationRate =
      stats.total_orders > 0 ? Math.round((stats.confirmed / stats.total_orders) * 100) : 0;

    // Fetch catalog safely
    const catalog = await fetchCatalogProducts();
    const lowStockAlerts = catalog
      .filter((product) => product.stock <= product.low_stock_threshold)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5)
      .map((product) => ({
        perfume_id: product.id,
        name: product.name,
        stock: product.stock,
        low_stock_threshold: product.low_stock_threshold,
      }));

    return {
      stats,
      recentOrders: scoped.slice(0, 8),
      todayRevenue,
      todayOrders: todayOrders.length,
      avgBasket,
      confirmationRate,
      lowStockAlerts,
    };
  } catch (err) {
    console.warn("[OS/SERVER] fetchOverview fell back to zero stats due to error:", err instanceof Error ? err.message : err);
    return {
      stats: { total_orders: 0, revenue: 0, confirmed: 0, shipped: 0, delivered: 0, canceled: 0, top_cities: [], top_perfumes: [], source_breakdown: {} },
      recentOrders: [],
      todayRevenue: 0,
      todayOrders: 0,
      avgBasket: 0,
      confirmationRate: 0,
      lowStockAlerts: [],
    };
  }
}
