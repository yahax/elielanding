import type { Order, OrderStatus, PackType } from "@/lib/types";

export interface NormalizedOrder extends Omit<Order, "total_price" | "source"> {
  total_price: number;
  source: string;
}

export interface OrderFilters {
  status?: OrderStatus | "";
  source?: string;
  pack?: PackType | "";
  search?: string;
  limit?: number;
  pipeline?: boolean;
  days?: number;
}

export interface OverviewResponse {
  stats: {
    total_orders: number;
    confirmed: number;
    delivered: number;
    canceled: number;
    revenue: number;
    orders_per_hour: { hour: string; count: number }[];
    top_cities: { city: string; count: number }[];
    top_perfumes: { name: string; count: number }[];
    source_breakdown: Record<string, number>;
  };
  recentOrders: NormalizedOrder[];
  todayRevenue: number;
  todayOrders: number;
  avgBasket: number;
  confirmationRate: number;
  lowStockAlerts: {
    perfume_id: string;
    name: string;
    stock: number;
    low_stock_threshold: number;
  }[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  tier: string;
  is_active: boolean;
  stock: number;
  low_stock_threshold: number;
  created_at?: string;
}

export interface ShopSettingsPayload {
  shop_name: string;
  support_email: string;
  whatsapp: string;
  auto_validate: boolean;
  low_stock_alert: boolean;
  currency: string;
  timezone: string;
}

export interface ShopSettingsResponse {
  settings: ShopSettingsPayload;
  configured: boolean;
  message?: string;
}
