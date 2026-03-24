import { calculateStats } from "@/lib/analytics";
import { buildCustomersFromOrders } from "@/lib/os/crm/helpers";
import { buildBusinessIntelligence } from "@/lib/os/intelligence/helpers";
import { normalizeOrderPerfumes } from "@/lib/order-utils";
import type { DashboardAnalyticsSnapshot, IntelligenceSnapshot, TrackingAnalyticsSnapshot } from "@/lib/os/domain/types";
import type { NormalizedOrder, OverviewResponse } from "@/lib/os/types";
import { buildTrackingSnapshot } from "@/lib/os/tracking/helpers";
import { average, diffMinutes, toPercent } from "@/lib/os/analytics/helpers";

function getOrderValue(order: Pick<NormalizedOrder, "price_mad" | "total_price">): number {
  const raw = Number(order.price_mad ?? order.total_price ?? 0);
  return Number.isFinite(raw) ? raw : 0;
}

function isConfirmedLike(status: string): boolean {
  return status === "confirmed" || status === "shipped" || status === "delivered";
}

function groupOrdersByDay(orders: NormalizedOrder[]): Map<string, NormalizedOrder[]> {
  const map = new Map<string, NormalizedOrder[]>();

  for (const order of orders) {
    const day = order.created_at.slice(0, 10);
    const bucket = map.get(day) ?? [];
    bucket.push(order);
    map.set(day, bucket);
  }

  return map;
}

function buildTopRows(counter: Map<string, number>, limit = 5): Array<{ label: string; value: number }> {
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

function buildOverviewFromOrders(
  orders: NormalizedOrder[],
  lowStockAlerts: OverviewResponse["lowStockAlerts"]
): OverviewResponse {
  const stats = calculateStats(orders as never);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((order) => new Date(order.created_at).getTime() >= startOfToday.getTime());
  const todayRevenue = todayOrders
    .filter((order) => order.status !== "canceled")
    .reduce((sum, order) => sum + getOrderValue(order), 0);

  const avgBasket = stats.total_orders > 0 ? Math.round(stats.revenue / stats.total_orders) : 0;
  const confirmationRate = stats.total_orders > 0 ? Math.round((stats.confirmed / stats.total_orders) * 100) : 0;

  return {
    stats,
    recentOrders: orders.slice(0, 8),
    todayRevenue,
    todayOrders: todayOrders.length,
    avgBasket,
    confirmationRate,
    lowStockAlerts,
  };
}

export function buildDashboardAnalyticsSnapshot(
  orders: NormalizedOrder[],
  periodDays: number
): DashboardAnalyticsSnapshot {
  const generatedAt = new Date().toISOString();
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter((order) => isConfirmedLike(order.status)).length;
  const cancelledOrders = orders.filter((order) => order.status === "canceled").length;
  const estimatedRevenue = orders
    .filter((order) => order.status !== "canceled")
    .reduce((sum, order) => sum + getOrderValue(order), 0);
  const averageBasket = totalOrders > 0 ? Math.round(estimatedRevenue / totalOrders) : 0;

  const confirmationDelays = orders
    .map((order) => diffMinutes(order.created_at, order.confirmed_at))
    .filter((value) => value > 0);

  const processingDelays = orders
    .map((order) => diffMinutes(order.created_at, order.shipped_at))
    .filter((value) => value > 0);

  const byPhone = new Map<string, { total: number; value: number }>();
  for (const order of orders) {
    const key = (order.phone || "").replace(/\D/g, "");
    if (!key) continue;
    const previous = byPhone.get(key) ?? { total: 0, value: 0 };
    byPhone.set(key, {
      total: previous.total + 1,
      value: previous.value + getOrderValue(order),
    });
  }

  const recurringCustomers = [...byPhone.values()].filter((entry) => entry.total > 1).length;
  const ltvValues = [...byPhone.values()].map((entry) => entry.value);

  const byDay = groupOrdersByDay(orders);
  const ordersByDay = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, bucket]) => {
      const confirmed = bucket.filter((order) => isConfirmedLike(order.status)).length;
      const cancelled = bucket.filter((order) => order.status === "canceled").length;
      const revenue = bucket
        .filter((order) => order.status !== "canceled")
        .reduce((sum, order) => sum + getOrderValue(order), 0);

      return {
        day,
        orders: bucket.length,
        confirmed,
        cancelled,
        revenue,
      };
    });

  const bySource = new Map<string, NormalizedOrder[]>();
  const byCity = new Map<string, NormalizedOrder[]>();
  const byPack = new Map<string, NormalizedOrder[]>();
  const byProduct = new Map<string, number>();

  for (const order of orders) {
    const source = order.source || "direct";
    const city = order.city || "Ville inconnue";
    const pack = order.pack_type || "mixte";

    bySource.set(source, [...(bySource.get(source) ?? []), order]);
    byCity.set(city, [...(byCity.get(city) ?? []), order]);
    byPack.set(pack, [...(byPack.get(pack) ?? []), order]);

    for (const perfume of normalizeOrderPerfumes(order)) {
      byProduct.set(perfume, (byProduct.get(perfume) ?? 0) + 1);
    }
  }

  const sourcePerformance = [...bySource.entries()]
    .map(([source, bucket]) => ({
      source,
      orders: bucket.length,
      confirmationRate: toPercent(bucket.filter((order) => isConfirmedLike(order.status)).length, bucket.length),
      revenue: bucket
        .filter((order) => order.status !== "canceled")
        .reduce((sum, order) => sum + getOrderValue(order), 0),
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);

  const cityPerformance = [...byCity.entries()]
    .map(([city, bucket]) => ({
      city,
      orders: bucket.length,
      confirmationRate: toPercent(bucket.filter((order) => isConfirmedLike(order.status)).length, bucket.length),
      revenue: bucket
        .filter((order) => order.status !== "canceled")
        .reduce((sum, order) => sum + getOrderValue(order), 0),
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);

  const packPerformance = [...byPack.entries()]
    .map(([pack, bucket]) => ({
      pack,
      orders: bucket.length,
      revenue: bucket
        .filter((order) => order.status !== "canceled")
        .reduce((sum, order) => sum + getOrderValue(order), 0),
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);

  const productPerformance = [...byProduct.entries()]
    .map(([product, count]) => ({
      product,
      orders: count,
      revenue: count * averageBasket,
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);

  const topSources = sourcePerformance.slice(0, 3).map((item) => ({
    label: item.source,
    type: "source" as const,
    value: item.orders,
  }));

  const topCities = cityPerformance.slice(0, 3).map((item) => ({
    label: item.city,
    type: "city" as const,
    value: item.orders,
  }));

  const topProducts = productPerformance.slice(0, 3).map((item) => ({
    label: item.product,
    type: "product" as const,
    value: item.orders,
  }));

  const topPerformers = [...topSources, ...topCities, ...topProducts].slice(0, 6);

  const funnelOrder = ["new", "to_confirm", "callback", "confirmed", "shipped", "delivered", "canceled"];
  const funnel = funnelOrder.map((stage) => {
    const count = orders.filter((order) => order.status === stage).length;
    return {
      stage,
      count,
      rate: toPercent(count, totalOrders),
    };
  });

  return {
    periodDays,
    generatedAt,
    totals: {
      orders: totalOrders,
      confirmations: confirmedOrders,
      confirmationRate: toPercent(confirmedOrders, totalOrders),
      cancellations: cancelledOrders,
      estimatedRevenue,
      averageBasket,
      averageConfirmationDelayMinutes: Math.round(average(confirmationDelays)),
      averageProcessingDelayMinutes: Math.round(average(processingDelays)),
      recurringCustomers,
    },
    ordersByDay,
    sourcePerformance,
    cityPerformance,
    productPerformance,
    packPerformance,
    topPerformers,
    funnel,
    customerLtv: {
      average: Math.round(average(ltvValues)),
      total: ltvValues.reduce((sum, value) => sum + value, 0),
      highValueCustomers: ltvValues.filter((value) => value >= 2800).length,
    },
  };
}

export function buildTrackingAnalyticsSnapshot(orders: NormalizedOrder[], periodDays: number): TrackingAnalyticsSnapshot {
  const customers = buildCustomersFromOrders(orders);
  return {
    periodDays,
    generatedAt: new Date().toISOString(),
    snapshot: buildTrackingSnapshot(orders, customers, periodDays),
  };
}

export function buildIntelligenceSnapshot(
  orders: NormalizedOrder[],
  periodDays: number,
  overview: OverviewResponse | null
): IntelligenceSnapshot {
  const customers = buildCustomersFromOrders(orders);
  const intelligence = buildBusinessIntelligence({
    orders,
    customers,
    overview,
  });

  return {
    periodDays,
    generatedAt: new Date().toISOString(),
    summary: intelligence.summary,
    insights: intelligence.insights,
    groupedInsights: intelligence.groupedInsights,
    signals: intelligence.signals,
  };
}

export function buildAnalyticsBundle(params: {
  orders: NormalizedOrder[];
  periodDays: number;
  lowStockAlerts: OverviewResponse["lowStockAlerts"];
}): {
  dashboard: DashboardAnalyticsSnapshot;
  overview: OverviewResponse;
  tracking: TrackingAnalyticsSnapshot;
  intelligence: IntelligenceSnapshot;
} {
  const overview = buildOverviewFromOrders(params.orders, params.lowStockAlerts);

  return {
    dashboard: buildDashboardAnalyticsSnapshot(params.orders, params.periodDays),
    overview,
    tracking: buildTrackingAnalyticsSnapshot(params.orders, params.periodDays),
    intelligence: buildIntelligenceSnapshot(params.orders, params.periodDays, overview),
  };
}
