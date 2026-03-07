import { calculateStats } from "@/lib/analytics";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import type { CatalogProduct, NormalizedOrder, OrderFilters } from "@/lib/os/types";

type OrderRow = {
  id: string;
  customer_name: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  pack_type: string | null;
  status: string | null;
  source: string | null;
  selected_perfumes: string[] | null;
  gift_perfume: string | null;
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

export function mapOrderRow(row: OrderRow): NormalizedOrder {
  const total = row.price_mad ?? row.price ?? 0;

  return {
    id: row.id,
    customer_id: null,
    customer_name: row.customer_name,
    phone: row.phone,
    city: row.city,
    address: row.address,
    pack_type: (row.pack_type || "mixte") as Order["pack_type"],
    total_price: total,
    price_mad: row.price_mad ?? total,
    status: (row.status || "new") as Order["status"],
    source: row.source || "direct",
    notes: null,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    confirmed_at: row.confirmed_at,
    shipped_at: row.shipped_at,
    delivered_at: row.delivered_at,
    canceled_at: row.canceled_at,
    selected_perfumes: row.selected_perfumes || [],
    gift_perfume: row.gift_perfume,
    offer_mode: row.offer_mode || undefined,
    items: [],
  };
}

export async function fetchOrders(filters: OrderFilters = {}): Promise<NormalizedOrder[]> {
  const supabase = createServiceSupabaseClient();
  const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 1000) : 500;

  let query = supabase
    .from("orders")
    .select(
      "id,customer_name,phone,city,address,pack_type,status,source,selected_perfumes,gift_perfume,price,price_mad,offer_mode,meta,created_at,updated_at,confirmed_at,shipped_at,delivered_at,canceled_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.pipeline) {
    // Pipeline usually excludes final states to keep board clean
    query = query.not("status", "in", '("delivered","canceled")');
  }

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.pack) query = query.eq("pack_type", filters.pack);

  if (filters.search) {
    const search = filters.search.trim();
    if (search.length > 0) {
      // Use logical OR for search across name, phone, and city
      query = query.or(
        `customer_name.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`
      );
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error("[OS/SERVER] fetchOrders error:", error);
    throw error;
  }

  return (data || []).map((row) => mapOrderRow(row as OrderRow));
}

export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,category,tier,is_active,stock,low_stock_threshold,created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("[OS/SERVER] fetchCatalogProducts error:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category || "mixte",
    tier: row.tier || "classic",
    is_active: row.is_active ?? true,
    stock: row.stock ?? 0,
    low_stock_threshold: row.low_stock_threshold ?? 5,
    created_at: row.created_at || undefined,
  }));
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
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const orders = await fetchOrders({ limit: 1000 });
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
}
