import type { Customer } from "@/lib/os/crm/types";
import type { OverviewResponse, NormalizedOrder } from "@/lib/os/types";
import { getOrderValue } from "@/lib/os/orders/helpers/format";
import type { BusinessInsight, BusinessSignal, InsightCategory, InsightPriority, IntelligenceSummary } from "@/lib/os/intelligence/types";
import { buildClientsQuery, buildOrdersQuery, buildPipelineQuery, buildTrackingQuery } from "@/lib/os/domain/query-filters";

interface IntelligenceBundle {
  summary: IntelligenceSummary;
  insights: BusinessInsight[];
  groupedInsights: Record<InsightCategory, BusinessInsight[]>;
  signals: BusinessSignal[];
}

function percent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function hoursSince(iso: string): number {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, (Date.now() - date.getTime()) / (60 * 60 * 1000));
}

function resolvePriorityFromImpact(impact: number): InsightPriority {
  if (impact >= 80) return "critical";
  if (impact >= 60) return "high";
  if (impact >= 35) return "medium";
  return "low";
}

function groupBy<T, K extends string | number>(items: T[], keyGetter: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyGetter(item);
    const existing = map.get(key) ?? [];
    existing.push(item);
    map.set(key, existing);
  }
  return map;
}

function topEntry(map: Map<string, number>): [string, number] | null {
  if (map.size === 0) return null;
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
}

function computeAvgConfirmationDelayHours(orders: NormalizedOrder[]): number {
  const delays: number[] = [];

  for (const order of orders) {
    if (!order.confirmed_at) continue;
    const createdAt = new Date(order.created_at).getTime();
    const confirmedAt = new Date(order.confirmed_at).getTime();
    if (Number.isNaN(createdAt) || Number.isNaN(confirmedAt) || confirmedAt < createdAt) continue;
    delays.push((confirmedAt - createdAt) / (1000 * 60 * 60));
  }

  if (delays.length === 0) return 0;
  return Number((delays.reduce((acc, value) => acc + value, 0) / delays.length).toFixed(1));
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    meta_ads: "Meta Ads",
    whatsapp: "WhatsApp",
    direct: "Direct",
    organic: "Organic",
    landing_page: "Landing Page",
    other: "Autre",
  };
  return labels[source] ?? source;
}

function buildSummary(insights: BusinessInsight[]): IntelligenceSummary {
  const countByCategory: Record<InsightCategory, number> = {
    urgent: 0,
    opportunity: 0,
    risk: 0,
    growth: 0,
    retention: 0,
  };

  for (const insight of insights) {
    countByCategory[insight.category] += 1;
  }

  const headline =
    countByCategory.urgent > 0
      ? `${countByCategory.urgent} signal(s) urgent(s) à traiter immédiatement`
      : countByCategory.risk > 0
        ? `${countByCategory.risk} risque(s) métier surveillés`
        : "Système stable: prioriser les opportunités de croissance";

  return {
    totalInsights: insights.length,
    urgentCount: countByCategory.urgent,
    opportunityCount: countByCategory.opportunity,
    riskCount: countByCategory.risk,
    growthCount: countByCategory.growth,
    retentionCount: countByCategory.retention,
    headline,
  };
}

export function buildBusinessIntelligence(input: {
  orders: NormalizedOrder[];
  customers: Customer[];
  overview: OverviewResponse | null;
}): IntelligenceBundle {
  const orders = [...input.orders];
  const customers = [...input.customers];

  const insights: BusinessInsight[] = [];

  const topCity = input.overview?.stats.top_cities?.[0] ?? null;
  const topPerfume = input.overview?.stats.top_perfumes?.[0] ?? null;

  const sourceCounter = new Map<string, number>();
  const cityCounter = new Map<string, number>();

  for (const order of orders) {
    sourceCounter.set(order.source, (sourceCounter.get(order.source) ?? 0) + 1);
    if (order.city) cityCounter.set(order.city, (cityCounter.get(order.city) ?? 0) + 1);
  }

  const topSource = topEntry(sourceCounter);
  const dominantCity = topEntry(cityCounter);

  const canceledOrders = orders.filter((order) => order.status === "canceled");
  const callbacks = orders.filter((order) => order.status === "callback");
  const unconfirmedHighValue = orders.filter(
    (order) => (order.status === "new" || order.status === "to_confirm" || order.status === "callback") && getOrderValue(order) >= 700
  );
  const staleConfirmation = orders.filter(
    (order) => (order.status === "new" || order.status === "to_confirm") && hoursSince(order.created_at) >= 2
  );

  const cancellationRate = percent(canceledOrders.length, orders.length);
  const callbackRate = percent(callbacks.length, orders.length);
  const avgConfirmationDelay = computeAvgConfirmationDelayHours(orders);

  if (topSource) {
    const impact = Math.min(95, Math.round((topSource[1] / Math.max(1, orders.length)) * 130));
    insights.push({
      id: "best-source",
      title: `${sourceLabel(topSource[0])} est la source dominante`,
      explanation: `${topSource[1]} commandes proviennent de cette source. Augmenter le budget ou la capacité opérateur sur ce canal peut générer un gain rapide.`,
      category: "growth",
      priority: resolvePriorityFromImpact(impact),
      impactLabel: "Impact acquisition",
      impactValue: impact,
      ctaLabel: "Voir tracking par source",
      ctaHref: buildTrackingQuery({ source: topSource[0] }),
      metricLabel: "Part source",
      metricValue: `${percent(topSource[1], orders.length)}%`,
    });
  }

  if (dominantCity) {
    const impact = Math.min(90, Math.round((dominantCity[1] / Math.max(1, orders.length)) * 115));
    insights.push({
      id: "best-city",
      title: `${dominantCity[0]} surperforme les autres villes`,
      explanation: `${dominantCity[1]} commandes sur la période. Prioriser le stock et la couverture opérateur sur cette ville peut améliorer le taux final.`,
      category: "opportunity",
      priority: resolvePriorityFromImpact(impact),
      impactLabel: "Impact local",
      impactValue: impact,
      ctaLabel: "Voir commandes de la ville",
      ctaHref: buildOrdersQuery({ cities: [dominantCity[0]] }),
      metricLabel: "Part ville",
      metricValue: `${percent(dominantCity[1], orders.length)}%`,
    });
  }

  if (topPerfume) {
    const impact = Math.min(88, Math.round((topPerfume.count / Math.max(1, orders.length)) * 125));
    insights.push({
      id: "rising-product",
      title: `${topPerfume.name} porte la demande`,
      explanation: `${topPerfume.count} commandes associées. Aligner l'approvisionnement et les templates WhatsApp sur ce produit est prioritaire.`,
      category: "growth",
      priority: resolvePriorityFromImpact(impact),
      impactLabel: "Impact produit",
      impactValue: impact,
      ctaLabel: "Ouvrir stock",
      ctaHref: "/os/inventory",
      metricLabel: "Volume",
      metricValue: `${topPerfume.count}`,
    });
  }

  if (input.overview && input.overview.lowStockAlerts.length > 0) {
    const pressure = Math.min(98, input.overview.lowStockAlerts.length * 24);
    insights.push({
      id: "stock-pressure",
      title: "Le stock critique freine la croissance",
      explanation: `${input.overview.lowStockAlerts.length} référence(s) sous seuil. Certaines opportunités sont potentiellement perdues avant confirmation.`,
      category: "urgent",
      priority: resolvePriorityFromImpact(pressure),
      impactLabel: "Risque de rupture",
      impactValue: pressure,
      ctaLabel: "Ajuster stock",
      ctaHref: "/os/inventory",
      metricLabel: "SKU critiques",
      metricValue: `${input.overview.lowStockAlerts.length}`,
    });
  }

  if (cancellationRate >= 18) {
    const impact = Math.min(96, 45 + cancellationRate * 2);
    insights.push({
      id: "cancellation-risk",
      title: "Le taux d'annulation est trop élevé",
      explanation: `${cancellationRate}% d'annulation sur la période. Vérifier prioritairement les sources et les villes qui génèrent ces annulations.`,
      category: "risk",
      priority: resolvePriorityFromImpact(impact),
      impactLabel: "Risque revenu",
      impactValue: Math.round(impact),
      ctaLabel: "Diagnostiquer tracking",
      ctaHref: buildTrackingQuery({}),
      metricLabel: "Taux annulation",
      metricValue: `${cancellationRate}%`,
    });
  }

  if (staleConfirmation.length > 0) {
    const impact = Math.min(95, 28 + staleConfirmation.length * 4);
    insights.push({
      id: "confirmation-delay",
      title: "Le délai de confirmation ralentit la conversion",
      explanation: `${staleConfirmation.length} commande(s) restent non confirmées depuis plus de 2h. La vitesse de traitement doit être renforcée sur la queue urgente.`,
      category: "urgent",
      priority: resolvePriorityFromImpact(impact),
      impactLabel: "Impact conversion",
      impactValue: impact,
      ctaLabel: "Ouvrir file urgente",
      ctaHref: buildOrdersQuery({ statuses: ["to_confirm"] }),
      metricLabel: "Délai moyen confirmation",
      metricValue: `${avgConfirmationDelay}h`,
    });
  }

  if (unconfirmedHighValue.length > 0) {
    const impact = Math.min(97, 30 + unconfirmedHighValue.length * 7);
    insights.push({
      id: "high-value-stuck",
      title: "Des commandes haute valeur attendent un traitement",
      explanation: `${unconfirmedHighValue.length} commande(s) >= 700 MAD ne sont pas confirmées. Prioriser ces dossiers augmente le CA journalier immédiatement.`,
      category: "urgent",
      priority: resolvePriorityFromImpact(impact),
      impactLabel: "Impact CA",
      impactValue: impact,
      ctaLabel: "Voir commandes premium",
      ctaHref: buildOrdersQuery({
        statuses: ["new", "to_confirm", "callback"],
        onlyHighValue: true,
      }),
      metricLabel: "Montant potentiel",
      metricValue: `${unconfirmedHighValue.reduce((acc, order) => acc + getOrderValue(order), 0)} MAD`,
    });
  }

  const dormantCustomers = customers.filter((customer) => customer.segments.includes("dormant"));
  const vipCustomers = customers.filter((customer) => customer.segments.includes("vip"));
  if (dormantCustomers.length > 0) {
    const impact = Math.min(88, 20 + dormantCustomers.length * 3);
    insights.push({
      id: "retention-relaunch",
      title: "Un segment client dormant peut être réactivé",
      explanation: `${dormantCustomers.length} client(s) n'ont pas commandé récemment. Une relance ciblée peut récupérer du revenu à faible coût d'acquisition.`,
      category: "retention",
      priority: resolvePriorityFromImpact(impact),
      impactLabel: "Impact rétention",
      impactValue: impact,
      ctaLabel: "Voir clients dormants",
      ctaHref: buildClientsQuery({ segment: "dormant" }),
      metricLabel: "Base réactivation",
      metricValue: `${dormantCustomers.length}`,
    });
  }

  if (vipCustomers.length > 0) {
    const impact = Math.min(84, 16 + vipCustomers.length * 5);
    insights.push({
      id: "vip-expansion",
      title: "Le segment VIP mérite une offre dédiée",
      explanation: `${vipCustomers.length} client(s) en haute valeur. Une offre premium ou un bundle exclusif peut améliorer la fréquence de rachat.`,
      category: "opportunity",
      priority: resolvePriorityFromImpact(impact),
      impactLabel: "Impact panier",
      impactValue: impact,
      ctaLabel: "Ouvrir CRM VIP",
      ctaHref: buildClientsQuery({ segment: "vip" }),
      metricLabel: "Clients VIP",
      metricValue: `${vipCustomers.length}`,
    });
  }

  if (callbackRate >= 12) {
    const impact = Math.min(92, 25 + callbackRate * 2);
    insights.push({
      id: "callback-buildup",
      title: "Le backlog callback s'accumule",
      explanation: `${callbackRate}% des commandes sont en callback. Ajuster la capacité opérateur sur ce statut réduit le risque d'annulation.`,
      category: "risk",
      priority: resolvePriorityFromImpact(impact),
      impactLabel: "Risque backlog",
      impactValue: Math.round(impact),
      ctaLabel: "Voir pipeline callback",
      ctaHref: buildPipelineQuery({ view: "focus", priority: "high" }),
      metricLabel: "Part callback",
      metricValue: `${callbackRate}%`,
    });
  }

  const grouped = groupBy(insights, (insight) => insight.category);
  const groupedInsights: Record<InsightCategory, BusinessInsight[]> = {
    urgent: grouped.get("urgent") ?? [],
    opportunity: grouped.get("opportunity") ?? [],
    risk: grouped.get("risk") ?? [],
    growth: grouped.get("growth") ?? [],
    retention: grouped.get("retention") ?? [],
  };

  const orderedInsights = [...insights].sort((a, b) => b.impactValue - a.impactValue);

  const pipelineHealth = percent(
    orders.filter((order) => order.status === "confirmed" || order.status === "shipped" || order.status === "delivered").length,
    orders.length
  );

  const signals: BusinessSignal[] = [
    {
      id: "signal-momentum-product",
      label: "Top momentum produit",
      value: topPerfume ? topPerfume.name : "N/A",
      sub: topPerfume ? `${topPerfume.count} commandes` : "Pas assez de données",
      tone: "gold",
    },
    {
      id: "signal-top-city",
      label: "Top ville",
      value: topCity ? topCity.city : dominantCity?.[0] ?? "N/A",
      sub: topCity ? `${topCity.count} commandes` : "Ville dominante calculée",
      tone: "success",
    },
    {
      id: "signal-source",
      label: "Source dominante",
      value: topSource ? sourceLabel(topSource[0]) : "N/A",
      sub: topSource ? `${percent(topSource[1], orders.length)}% du volume` : "Distribution équilibrée",
      tone: "neutral",
    },
    {
      id: "signal-cancel-rate",
      label: "Taux annulation",
      value: `${cancellationRate}%`,
      sub: "Sur la période active",
      tone: cancellationRate >= 18 ? "danger" : cancellationRate >= 12 ? "warning" : "success",
    },
    {
      id: "signal-confirm-delay",
      label: "Délai confirmation",
      value: `${avgConfirmationDelay}h`,
      sub: "Moyenne constatée",
      tone: avgConfirmationDelay >= 2.5 ? "warning" : "success",
    },
    {
      id: "signal-pipeline-health",
      label: "Santé pipeline",
      value: `${pipelineHealth}%`,
      sub: "Commandes en progression",
      tone: pipelineHealth < 58 ? "warning" : "success",
    },
    {
      id: "signal-stock-pressure",
      label: "Stock pressure",
      value: `${input.overview?.lowStockAlerts.length ?? 0}`,
      sub: "Références sous seuil",
      tone: (input.overview?.lowStockAlerts.length ?? 0) > 0 ? "danger" : "success",
    },
    {
      id: "signal-callback-load",
      label: "Charge callback",
      value: `${callbackRate}%`,
      sub: `${callbacks.length} commandes`,
      tone: callbackRate >= 12 ? "warning" : "neutral",
    },
  ];

  return {
    summary: buildSummary(orderedInsights),
    insights: orderedInsights,
    groupedInsights,
    signals,
  };
}

export function getInsightCategoryLabel(category: InsightCategory): string {
  const labels: Record<InsightCategory, string> = {
    urgent: "Urgent",
    opportunity: "Opportunité",
    risk: "Risque",
    growth: "Croissance",
    retention: "Rétention",
  };
  return labels[category];
}
