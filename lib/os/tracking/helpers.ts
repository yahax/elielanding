import { normalizeOrderPerfumes } from "@/lib/order-utils";
import { getCustomerMainSegment } from "@/lib/os/crm/helpers";
import type { Customer } from "@/lib/os/crm/types";
import { getOrderValue } from "@/lib/os/orders/helpers/format";
import type { NormalizedOrder } from "@/lib/os/types";
import { buildClientsQuery, buildOrdersQuery, buildTrackingQuery } from "@/lib/os/domain/query-filters";
import type {
  FunnelStage,
  NarrativeInsight,
  TopPerformer,
  TrackingBreakdown,
  TrackingBreakdownRow,
  TrackingMetric,
  TrackingSnapshot,
} from "@/lib/os/tracking/types";

const currencyFormatter = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function percent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function safeDate(iso: string): Date | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function confirmationValue(order: NormalizedOrder): number {
  return order.status === "canceled" ? 0 : getOrderValue(order);
}

function makeBreakdownRows(
  map: Map<string, NormalizedOrder[]>,
  limit = 8
): TrackingBreakdownRow[] {
  return [...map.entries()]
    .map(([label, bucket]) => {
      const confirmed = bucket.filter(
        (order) => order.status === "confirmed" || order.status === "shipped" || order.status === "delivered"
      ).length;
      const canceled = bucket.filter((order) => order.status === "canceled").length;
      const revenue = bucket.reduce((acc, order) => acc + confirmationValue(order), 0);

      return {
        id: `${label}-${bucket.length}`,
        label,
        orders: bucket.length,
        confirmed,
        canceled,
        confirmationRate: percent(confirmed, bucket.length),
        revenue,
      };
    })
    .sort((a, b) => b.orders - a.orders)
    .slice(0, limit);
}

function groupOrders(orders: NormalizedOrder[], resolver: (order: NormalizedOrder) => string): Map<string, NormalizedOrder[]> {
  const map = new Map<string, NormalizedOrder[]>();
  for (const order of orders) {
    const key = resolver(order);
    const current = map.get(key) ?? [];
    current.push(order);
    map.set(key, current);
  }
  return map;
}

function getAverageDelayHours(orders: NormalizedOrder[], field: "confirmed_at" | "shipped_at"): number {
  const values: number[] = [];

  for (const order of orders) {
    const created = safeDate(order.created_at);
    const target = safeDate(order[field] ?? "");
    if (!created || !target || target.getTime() < created.getTime()) continue;
    values.push((target.getTime() - created.getTime()) / (60 * 60 * 1000));
  }

  if (values.length === 0) return 0;
  return Number(average(values).toFixed(1));
}

function buildHourlyHeatmap(orders: NormalizedOrder[]): Array<{ hour: string; orders: number }> {
  const counter = new Map<number, number>();
  for (const order of orders) {
    const date = safeDate(order.created_at);
    if (!date) continue;
    const hour = date.getHours();
    counter.set(hour, (counter.get(hour) ?? 0) + 1);
  }

  const result: Array<{ hour: string; orders: number }> = [];
  for (let hour = 0; hour < 24; hour += 1) {
    result.push({ hour: `${hour.toString().padStart(2, "0")}:00`, orders: counter.get(hour) ?? 0 });
  }
  return result;
}

function buildFunnel(orders: NormalizedOrder[]): FunnelStage[] {
  const total = orders.length;
  const contacted = orders.filter((order) => order.status !== "new").length;
  const confirmed = orders.filter(
    (order) => order.status === "confirmed" || order.status === "shipped" || order.status === "delivered"
  ).length;
  const shipped = orders.filter((order) => order.status === "shipped" || order.status === "delivered").length;
  const delivered = orders.filter((order) => order.status === "delivered").length;
  const canceled = orders.filter((order) => order.status === "canceled").length;

  return [
    {
      id: "received",
      label: "Reçues",
      count: total,
      rate: 100,
      tone: "neutral",
    },
    {
      id: "contacted",
      label: "Contactées",
      count: contacted,
      rate: percent(contacted, total),
      tone: "warning",
    },
    {
      id: "confirmed",
      label: "Confirmées",
      count: confirmed,
      rate: percent(confirmed, total),
      tone: "success",
    },
    {
      id: "shipped",
      label: "Expédiées",
      count: shipped,
      rate: percent(shipped, total),
      tone: "success",
    },
    {
      id: "delivered",
      label: "Livrées",
      count: delivered,
      rate: percent(delivered, total),
      tone: "success",
    },
    {
      id: "canceled",
      label: "Annulées",
      count: canceled,
      rate: percent(canceled, total),
      tone: canceled >= Math.max(5, total * 0.16) ? "danger" : "warning",
    },
  ];
}

function buildTopPerformer(rows: TrackingBreakdownRow[], suffix?: string): TopPerformer[] {
  return rows.slice(0, 5).map((row) => ({
    label: row.label,
    value: row.orders,
    suffix,
  }));
}

function buildNarratives(input: {
  sourceRows: TrackingBreakdownRow[];
  cityRows: TrackingBreakdownRow[];
  productRows: TrackingBreakdownRow[];
  confirmationRate: number;
  cancellationRate: number;
  avgConfirmationDelay: number;
}): NarrativeInsight[] {
  const narratives: NarrativeInsight[] = [];

  const topSource = input.sourceRows[0];
  if (topSource) {
    narratives.push({
      id: "narrative-source",
      title: `${topSource.label} performe le mieux en volume`,
      body: `${topSource.orders} commandes avec ${topSource.confirmationRate}% de confirmation. Prioriser ce canal peut soutenir la croissance sans augmenter la complexité.`,
      tone: topSource.confirmationRate >= 65 ? "success" : "warning",
      ctaLabel: "Voir détail source",
      ctaHref: buildTrackingQuery({ source: topSource.label }),
    });
  }

  const topCity = input.cityRows[0];
  if (topCity) {
    narratives.push({
      id: "narrative-city",
      title: `${topCity.label} convertit mieux que les autres villes`,
      body: `${topCity.confirmationRate}% de confirmation pour ${topCity.orders} commandes. Cette ville mérite une priorisation SLA et stock.`,
      tone: topCity.confirmationRate >= 65 ? "success" : "neutral",
      ctaLabel: "Ouvrir commandes ville",
      ctaHref: buildOrdersQuery({ cities: [topCity.label] }),
    });
  }

  const topProduct = input.productRows[0];
  if (topProduct) {
    narratives.push({
      id: "narrative-product",
      title: `${topProduct.label} domine sur la période`,
      body: `${topProduct.orders} commandes et ${topProduct.confirmationRate}% de confirmation. Ajouter des relances ciblées sur ce produit est recommandé.`,
      tone: "gold",
      ctaLabel: "Voir produit/pack",
      ctaHref: "/os/products",
    });
  }

  if (input.cancellationRate >= 16) {
    narratives.push({
      id: "narrative-cancel",
      title: "Le taux d'annulation monte au-dessus du seuil",
      body: `${input.cancellationRate}% d'annulation observé. Réduire ce taux est prioritaire avant d'augmenter le volume d'acquisition.`,
      tone: "danger",
      ctaLabel: "Ouvrir intelligence",
      ctaHref: "/os/intelligence",
    });
  }

  if (input.avgConfirmationDelay >= 2) {
    narratives.push({
      id: "narrative-delay",
      title: "Le délai de confirmation impacte la conversion finale",
      body: `Délai moyen de ${input.avgConfirmationDelay}h. Une réduction de ce délai améliore généralement le taux de confirmation au-delà de ${input.confirmationRate}%.`,
      tone: "warning",
      ctaLabel: "Voir queue à confirmer",
      ctaHref: buildOrdersQuery({ statuses: ["to_confirm"] }),
    });
  }

  if (narratives.length === 0) {
    narratives.push({
      id: "narrative-stable",
      title: "Performance stable sur la période",
      body: "Les signaux clés restent équilibrés. Vous pouvez maintenant travailler la croissance sur les meilleurs segments clients.",
      tone: "success",
      ctaLabel: "Ouvrir CRM",
      ctaHref: buildClientsQuery({}),
    });
  }

  return narratives.slice(0, 6);
}

export function buildTrackingSnapshot(orders: NormalizedOrder[], customers: Customer[], periodDays: number): TrackingSnapshot {
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter(
    (order) => order.status === "confirmed" || order.status === "shipped" || order.status === "delivered"
  ).length;
  const canceledOrders = orders.filter((order) => order.status === "canceled").length;
  const revenue = orders.reduce((acc, order) => acc + confirmationValue(order), 0);
  const avgBasket = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0;
  const confirmationRate = percent(confirmedOrders, totalOrders);
  const cancellationRate = percent(canceledOrders, totalOrders);

  const avgConfirmationDelay = getAverageDelayHours(orders, "confirmed_at");
  const avgProcessingDelay = getAverageDelayHours(orders, "shipped_at");

  const sourceRows = makeBreakdownRows(groupOrders(orders, (order) => order.source || "inconnu"), 6);
  const cityRows = makeBreakdownRows(groupOrders(orders, (order) => order.city || "Ville inconnue"), 6);
  const productRows = makeBreakdownRows(
    groupOrders(orders, (order) => {
      const perfumes = normalizeOrderPerfumes(order);
      if (perfumes.length > 0) return perfumes[0];
      return order.pack_type || "Pack inconnu";
    }),
    6
  );
  const statusRows = makeBreakdownRows(groupOrders(orders, (order) => order.status), 7);

  const temporalRows = makeBreakdownRows(
    groupOrders(orders, (order) => {
      const date = safeDate(order.created_at);
      if (!date) return "Date inconnue";
      return new Intl.DateTimeFormat("fr-MA", { month: "short", day: "2-digit" }).format(date);
    }),
    Math.min(periodDays, 10)
  );

  const sourceBreakdown: TrackingBreakdown = {
    id: "source",
    title: "Performance par source",
    description: "Volume, confirmation et revenu estimé par canal d'acquisition.",
    rows: sourceRows,
  };

  const cityBreakdown: TrackingBreakdown = {
    id: "city",
    title: "Performance par ville",
    description: "Lecture des zones géographiques qui convertissent le mieux.",
    rows: cityRows,
  };

  const productBreakdown: TrackingBreakdown = {
    id: "product",
    title: "Performance par produit / pack",
    description: "Les références qui tirent le chiffre et la conversion.",
    rows: productRows,
  };

  const statusBreakdown: TrackingBreakdown = {
    id: "status",
    title: "Performance par statut",
    description: "Répartition opérationnelle du pipeline sur la période.",
    rows: statusRows,
  };

  const temporalBreakdown: TrackingBreakdown = {
    id: "temporal",
    title: `Évolution ${periodDays} jours`,
    description: "Tendance quotidienne du volume.",
    rows: temporalRows,
  };

  const segmentCounter = new Map<string, number>();
  for (const customer of customers) {
    const key = getCustomerMainSegment(customer);
    segmentCounter.set(key, (segmentCounter.get(key) ?? 0) + 1);
  }

  const topCustomerSegments: TopPerformer[] = [...segmentCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value, suffix: "clients" }));

  const metrics: TrackingMetric[] = [
    {
      id: "orders",
      label: "Commandes",
      value: totalOrders,
      valueLabel: `${totalOrders}`,
      sub: `Période ${periodDays}j`,
      tone: "neutral",
    },
    {
      id: "confirmations",
      label: "Confirmations",
      value: confirmedOrders,
      valueLabel: `${confirmedOrders}`,
      sub: `${confirmationRate}% du total`,
      tone: confirmationRate >= 65 ? "success" : "warning",
    },
    {
      id: "cancelations",
      label: "Annulations",
      value: canceledOrders,
      valueLabel: `${canceledOrders}`,
      sub: `${cancellationRate}% du total`,
      tone: cancellationRate >= 16 ? "danger" : "warning",
    },
    {
      id: "revenue",
      label: "CA estimé",
      value: revenue,
      valueLabel: formatCurrency(revenue),
      sub: `Panier moyen ${formatCurrency(avgBasket)}`,
      tone: "gold",
    },
    {
      id: "avg-basket",
      label: "Panier moyen",
      value: avgBasket,
      valueLabel: formatCurrency(avgBasket),
      sub: "Sur commandes non annulées",
      tone: "neutral",
    },
    {
      id: "delay-confirm",
      label: "Délai confirmation",
      value: avgConfirmationDelay,
      valueLabel: `${avgConfirmationDelay}h`,
      sub: "Temps moyen contact -> confirmation",
      tone: avgConfirmationDelay >= 2 ? "warning" : "success",
    },
    {
      id: "delay-processing",
      label: "Délai traitement",
      value: avgProcessingDelay,
      valueLabel: `${avgProcessingDelay}h`,
      sub: "Temps moyen confirmation -> expédition",
      tone: avgProcessingDelay >= 8 ? "warning" : "success",
    },
  ];

  const narratives = buildNarratives({
    sourceRows,
    cityRows,
    productRows,
    confirmationRate,
    cancellationRate,
    avgConfirmationDelay,
  });

  return {
    metrics,
    sourceBreakdown,
    cityBreakdown,
    productBreakdown,
    statusBreakdown,
    temporalBreakdown,
    funnel: buildFunnel(orders),
    topCities: buildTopPerformer(cityRows, "cmd"),
    topProducts: buildTopPerformer(productRows, "cmd"),
    topSources: buildTopPerformer(sourceRows, "cmd"),
    topCustomerSegments,
    narratives,
    hourlyHeatmap: buildHourlyHeatmap(orders),
  };
}
