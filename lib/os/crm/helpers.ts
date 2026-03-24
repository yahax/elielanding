import { normalizeOrderPerfumes } from "@/lib/order-utils";
import type { NormalizedOrder } from "@/lib/os/types";
import type { OrderStatus } from "@/lib/types";
import { getOrderValue, normalizePhone } from "@/lib/os/orders/helpers/format";
import { buildClientsQuery } from "@/lib/os/domain/query-filters";
import type {
  ClientInsight,
  Customer,
  CustomerFiltersState,
  CustomerKpis,
  CustomerNextAction,
  CustomerOrderSummary,
  CustomerRelationshipStatus,
  CustomerSegment,
} from "@/lib/os/crm/types";

const HIGH_VALUE_ORDER_THRESHOLD = 750;
const VIP_SPENT_THRESHOLD = 2800;
const DORMANT_DAYS_THRESHOLD = 45;
const RELAUNCH_DAYS_THRESHOLD = 21;

const SUCCESSFUL_STATUSES = new Set<OrderStatus>(["confirmed", "shipped", "delivered"]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysSince(iso: string | null | undefined, now: Date): number | null {
  const date = safeDate(iso);
  if (!date) return null;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function rankTopKeys(counter: Map<string, number>, limit = 3): string[] {
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

function computeAvgDaysBetweenOrders(sortedAsc: NormalizedOrder[]): number | null {
  if (sortedAsc.length < 2) return null;

  const diffs: number[] = [];
  for (let index = 1; index < sortedAsc.length; index += 1) {
    const previous = safeDate(sortedAsc[index - 1].created_at);
    const current = safeDate(sortedAsc[index].created_at);
    if (!previous || !current) continue;

    const diffDays = Math.max(1, Math.round((current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000)));
    diffs.push(diffDays);
  }

  if (diffs.length === 0) return null;
  return Math.round(average(diffs));
}

function computeValueScore(totalSpent: number, totalOrders: number, avgBasket: number): number {
  const spendComponent = clamp(totalSpent / 55, 0, 55);
  const frequencyComponent = clamp(totalOrders * 6, 0, 30);
  const basketComponent = clamp(avgBasket / 55, 0, 15);
  return Math.round(clamp(spendComponent + frequencyComponent + basketComponent, 0, 100));
}

function computeRepurchaseScore(input: {
  totalOrders: number;
  daysSinceLastOrder: number | null;
  avgDaysBetweenOrders: number | null;
  confirmationRate: number;
  cancellationRate: number;
}): number {
  const frequencyComponent = clamp(input.totalOrders * 8, 0, 36);
  const recencyDays = input.daysSinceLastOrder ?? 120;
  const recencyComponent = clamp(40 - recencyDays * 0.7, 0, 40);
  const cadenceBase = input.avgDaysBetweenOrders ?? 30;
  const cadenceComponent = clamp(18 - cadenceBase * 0.4, 0, 18);
  const qualityComponent = clamp(input.confirmationRate * 0.12 - input.cancellationRate * 0.15, -8, 16);

  return Math.round(clamp(frequencyComponent + recencyComponent + cadenceComponent + qualityComponent, 0, 100));
}

function computeRiskScore(input: {
  cancellationRate: number;
  daysSinceLastOrder: number | null;
  callbackOrders: number;
  totalOrders: number;
}): number {
  const cancellationComponent = clamp(input.cancellationRate * 0.75, 0, 55);
  const recencyComponent = clamp((input.daysSinceLastOrder ?? 90) * 0.45, 0, 28);
  const callbackRate = input.totalOrders > 0 ? (input.callbackOrders / input.totalOrders) * 100 : 0;
  const callbackComponent = clamp(callbackRate * 0.35, 0, 22);

  return Math.round(clamp(cancellationComponent + recencyComponent + callbackComponent, 0, 100));
}

function computeRfmScore(input: {
  daysSinceLastOrder: number | null;
  totalOrders: number;
  totalSpent: number;
}): number {
  const recencyDays = input.daysSinceLastOrder ?? 90;
  const recency = clamp(40 - recencyDays * 0.7, 0, 40);
  const frequency = clamp(input.totalOrders * 7, 0, 35);
  const monetary = clamp(input.totalSpent / 120, 0, 25);
  return Math.round(clamp(recency + frequency + monetary, 0, 100));
}

function computeRelationshipStatus(daysSinceLastOrder: number | null): CustomerRelationshipStatus {
  if (daysSinceLastOrder == null) return "watch";
  if (daysSinceLastOrder <= 14) return "active";
  if (daysSinceLastOrder <= DORMANT_DAYS_THRESHOLD) return "watch";
  return "dormant";
}

function computeSegments(input: {
  totalOrders: number;
  totalSpent: number;
  avgBasket: number;
  daysSinceLastOrder: number | null;
  cancellationRate: number;
  riskScore: number;
  valueScore: number;
  repurchaseScore: number;
}): CustomerSegment[] {
  const segments: CustomerSegment[] = [];
  const dormant = (input.daysSinceLastOrder ?? 0) >= DORMANT_DAYS_THRESHOLD;

  if (input.totalSpent >= VIP_SPENT_THRESHOLD || (input.totalOrders >= 6 && input.valueScore >= 80)) {
    segments.push("vip");
  }
  if (input.totalOrders >= 2) segments.push("recurring");
  if (input.totalOrders === 1) segments.push("new");
  if (dormant) segments.push("dormant");
  if ((input.daysSinceLastOrder ?? 0) >= RELAUNCH_DAYS_THRESHOLD) segments.push("to_relaunch");
  if (input.riskScore >= 62) segments.push("at_risk");
  if (input.cancellationRate >= 26) segments.push("cancel_prone");
  if (input.avgBasket >= HIGH_VALUE_ORDER_THRESHOLD || input.totalSpent >= 1800) segments.push("high_value");

  if (segments.length === 0) {
    segments.push(input.repurchaseScore >= 50 ? "recurring" : "new");
  }

  return segments;
}

function computeNextAction(input: {
  segments: CustomerSegment[];
  riskScore: number;
  daysSinceLastOrder: number | null;
  totalOrders: number;
}): CustomerNextAction {
  if (input.segments.includes("vip")) return "nurture_vip";
  if (input.riskScore >= 68 || input.segments.includes("cancel_prone")) return "call_now";
  if ((input.daysSinceLastOrder ?? 0) >= RELAUNCH_DAYS_THRESHOLD || input.segments.includes("dormant")) {
    return "send_whatsapp_relaunch";
  }
  if (input.totalOrders >= 2) return "offer_bundle";
  return "wait_and_monitor";
}

function toOrderSummary(order: NormalizedOrder): CustomerOrderSummary {
  return {
    id: order.id,
    status: order.status,
    source: order.source,
    city: order.city,
    value: getOrderValue(order),
    products: normalizeOrderPerfumes(order),
    createdAt: order.created_at,
  };
}

export function buildCustomersFromOrders(orders: NormalizedOrder[], now = new Date()): Customer[] {
  const byPhone = new Map<string, NormalizedOrder[]>();

  for (const order of orders) {
    const phone = normalizePhone(order.phone);
    const key = phone || `anon-${order.id}`;
    if (!byPhone.has(key)) byPhone.set(key, []);
    byPhone.get(key)?.push(order);
  }

  const customers: Customer[] = [];

  for (const [phoneKey, bucket] of byPhone.entries()) {
    const sortedDesc = [...bucket].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const sortedAsc = [...bucket].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const latest = sortedDesc[0];
    const oldest = sortedAsc[0];

    const totalSpent = sortedDesc.reduce((acc, order) => acc + getOrderValue(order), 0);
    const totalOrders = sortedDesc.length;
    const successfulOrders = sortedDesc.filter((order) => SUCCESSFUL_STATUSES.has(order.status)).length;
    const canceledOrders = sortedDesc.filter((order) => order.status === "canceled").length;
    const callbackOrders = sortedDesc.filter((order) => order.status === "callback").length;

    const avgBasket = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
    const daysSinceLastOrder = daysSince(latest?.created_at ?? null, now);
    const avgDaysBetweenOrders = computeAvgDaysBetweenOrders(sortedAsc);
    const confirmationRate = totalOrders > 0 ? Math.round((successfulOrders / totalOrders) * 100) : 0;
    const cancellationRate = totalOrders > 0 ? Math.round((canceledOrders / totalOrders) * 100) : 0;

    const productCounter = new Map<string, number>();
    const sourceCounter = new Map<string, number>();

    for (const order of sortedDesc) {
      sourceCounter.set(order.source, (sourceCounter.get(order.source) ?? 0) + 1);
      for (const product of normalizeOrderPerfumes(order)) {
        productCounter.set(product, (productCounter.get(product) ?? 0) + 1);
      }
    }

    const valueScore = computeValueScore(totalSpent, totalOrders, avgBasket);
    const repurchaseScore = computeRepurchaseScore({
      totalOrders,
      daysSinceLastOrder,
      avgDaysBetweenOrders,
      confirmationRate,
      cancellationRate,
    });
    const riskScore = computeRiskScore({
      cancellationRate,
      daysSinceLastOrder,
      callbackOrders,
      totalOrders,
    });

    const rfmScore = computeRfmScore({
      daysSinceLastOrder,
      totalOrders,
      totalSpent,
    });

    const repurchaseProbability = Math.round(clamp(repurchaseScore * 0.62 + (100 - riskScore) * 0.38, 0, 100));

    const segments = computeSegments({
      totalOrders,
      totalSpent,
      avgBasket,
      daysSinceLastOrder,
      cancellationRate,
      riskScore,
      valueScore,
      repurchaseScore,
    });

    const relationshipStatus = computeRelationshipStatus(daysSinceLastOrder);
    const nextAction = computeNextAction({
      segments,
      riskScore,
      daysSinceLastOrder,
      totalOrders,
    });

    customers.push({
      id: latest?.id ?? phoneKey,
      name: latest?.customer_name || "Client sans nom",
      phone: phoneKey.startsWith("anon-") ? (latest?.phone || "-") : phoneKey,
      city: latest?.city ?? null,
      address: latest?.address ?? null,
      firstOrderAt: oldest?.created_at ?? null,
      lastOrderAt: latest?.created_at ?? null,
      totalOrders,
      successfulOrders,
      canceledOrders,
      totalSpent,
      avgBasket,
      avgDaysBetweenOrders,
      daysSinceLastOrder,
      preferredProducts: rankTopKeys(productCounter, 4),
      preferredSources: rankTopKeys(sourceCounter, 3),
      orderHistory: sortedDesc.map(toOrderSummary),
      valueScore,
      repurchaseScore,
      riskScore,
      rfmScore,
      repurchaseProbability,
      cancellationRate,
      confirmationRate,
      segments,
      relationshipStatus,
      nextAction,
    });
  }

  return customers.sort((a, b) => {
    if (a.riskScore !== b.riskScore) return b.riskScore - a.riskScore;
    if (a.valueScore !== b.valueScore) return b.valueScore - a.valueScore;
    return b.totalSpent - a.totalSpent;
  });
}

export function filterCustomers(customers: Customer[], filters: CustomerFiltersState): Customer[] {
  const query = filters.search.trim().toLowerCase();

  return customers.filter((customer) => {
    if (query) {
      const haystack = [customer.name, customer.phone, customer.city || "", customer.preferredProducts.join(" ")].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (filters.segment !== "all" && !customer.segments.includes(filters.segment)) return false;
    if (filters.city !== "all" && (customer.city || "") !== filters.city) return false;
    if (filters.relationship !== "all" && customer.relationshipStatus !== filters.relationship) return false;
    if (customer.totalSpent < filters.minSpent) return false;
    if (filters.onlyAtRisk && customer.riskScore < 60) return false;

    return true;
  });
}

export function buildCustomerKpis(customers: Customer[]): CustomerKpis {
  const totalCustomers = customers.length;

  if (totalCustomers === 0) {
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      recurringCustomers: 0,
      vipCustomers: 0,
      dormantCustomers: 0,
      relaunchCandidates: 0,
      avgCustomerValue: 0,
      avgLtv: 0,
    };
  }

  const activeCustomers = customers.filter((customer) => customer.relationshipStatus === "active").length;
  const recurringCustomers = customers.filter((customer) => customer.segments.includes("recurring")).length;
  const vipCustomers = customers.filter((customer) => customer.segments.includes("vip")).length;
  const dormantCustomers = customers.filter((customer) => customer.segments.includes("dormant")).length;
  const relaunchCandidates = customers.filter((customer) => customer.segments.includes("to_relaunch")).length;
  const avgCustomerValue = Math.round(customers.reduce((acc, customer) => acc + customer.avgBasket, 0) / totalCustomers);
  const avgLtv = Math.round(customers.reduce((acc, customer) => acc + customer.totalSpent, 0) / totalCustomers);

  return {
    totalCustomers,
    activeCustomers,
    recurringCustomers,
    vipCustomers,
    dormantCustomers,
    relaunchCandidates,
    avgCustomerValue,
    avgLtv,
  };
}

export function buildClientInsights(customers: Customer[]): ClientInsight[] {
  const insights: ClientInsight[] = [];

  const topVip = [...customers]
    .filter((customer) => customer.segments.includes("vip"))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 3);

  for (const customer of topVip) {
    insights.push({
      id: `vip-${customer.id}`,
      customerId: customer.id,
      title: `${customer.name} est en segment VIP`,
      message: `LTV ${customer.totalSpent} MAD, probabilité de réachat ${customer.repurchaseProbability}%`,
      severity: "success",
      actionLabel: "Lancer offre premium",
      href: buildClientsQuery({ segment: "vip" }),
    });
  }

  const risky = [...customers]
    .filter((customer) => customer.riskScore >= 68)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3);

  for (const customer of risky) {
    insights.push({
      id: `risk-${customer.id}`,
      customerId: customer.id,
      title: `${customer.name} à risque d'attrition`,
      message: `Risque ${customer.riskScore}/100, annulation ${customer.cancellationRate}%`,
      severity: "warning",
      actionLabel: "Prioriser relance",
      href: buildClientsQuery({ segment: "at_risk", onlyAtRisk: true }),
    });
  }

  const dormant = [...customers]
    .filter((customer) => customer.segments.includes("dormant"))
    .sort((a, b) => (b.daysSinceLastOrder ?? 0) - (a.daysSinceLastOrder ?? 0))
    .slice(0, 3);

  for (const customer of dormant) {
    insights.push({
      id: `dormant-${customer.id}`,
      customerId: customer.id,
      title: `${customer.name} dort depuis ${customer.daysSinceLastOrder ?? "?"} jours`,
      message: `Segment dormant + score réachat ${customer.repurchaseScore}/100`,
      severity: "critical",
      actionLabel: "Réactiver maintenant",
      href: buildClientsQuery({ segment: "dormant" }),
    });
  }

  return insights.slice(0, 8);
}

export const CUSTOMER_SEGMENT_LABELS: Record<CustomerSegment, string> = {
  vip: "VIP",
  recurring: "Récurrent",
  new: "Nouveau",
  dormant: "Dormant",
  to_relaunch: "À relancer",
  at_risk: "À risque",
  cancel_prone: "Annule souvent",
  high_value: "Haute valeur",
};

export const NEXT_ACTION_LABELS: Record<CustomerNextAction, string> = {
  send_whatsapp_relaunch: "Relancer WhatsApp",
  call_now: "Appeler maintenant",
  offer_bundle: "Proposer un pack",
  nurture_vip: "Offre VIP",
  wait_and_monitor: "Surveiller",
};

export const RELATIONSHIP_LABELS: Record<CustomerRelationshipStatus, string> = {
  active: "Active",
  watch: "Sous suivi",
  dormant: "Dormante",
};

export function getCustomerMainSegment(customer: Customer): CustomerSegment {
  const ordered: CustomerSegment[] = ["vip", "at_risk", "dormant", "to_relaunch", "high_value", "recurring", "new", "cancel_prone"];
  for (const segment of ordered) {
    if (customer.segments.includes(segment)) return segment;
  }
  return customer.segments[0] ?? "new";
}

export function getUniqueCities(customers: Customer[]): string[] {
  return [...new Set(customers.map((customer) => customer.city).filter((city): city is string => Boolean(city)))]
    .sort((a, b) => a.localeCompare(b, "fr"));
}
