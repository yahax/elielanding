import type { OrderStatus } from "@/lib/types";

export type CustomerSegment =
  | "vip"
  | "recurring"
  | "new"
  | "dormant"
  | "to_relaunch"
  | "at_risk"
  | "cancel_prone"
  | "high_value";

export type CustomerValueScore = number;
export type RepurchaseScore = number;

export type CustomerRelationshipStatus = "active" | "watch" | "dormant";

export type CustomerNextAction =
  | "send_whatsapp_relaunch"
  | "call_now"
  | "offer_bundle"
  | "nurture_vip"
  | "wait_and_monitor";

export interface CustomerOrderSummary {
  id: string;
  status: OrderStatus;
  source: string;
  city: string | null;
  value: number;
  products: string[];
  notes: string[];
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  address: string | null;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  totalOrders: number;
  successfulOrders: number;
  canceledOrders: number;
  totalSpent: number;
  avgBasket: number;
  avgDaysBetweenOrders: number | null;
  daysSinceLastOrder: number | null;
  preferredProducts: string[];
  preferredSources: string[];
  orderHistory: CustomerOrderSummary[];
  valueScore: CustomerValueScore;
  repurchaseScore: RepurchaseScore;
  riskScore: number;
  rfmScore: number;
  repurchaseProbability: number;
  cancellationRate: number;
  confirmationRate: number;
  segments: CustomerSegment[];
  relationshipStatus: CustomerRelationshipStatus;
  nextAction: CustomerNextAction;
}

export interface ClientInsight {
  id: string;
  customerId: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical" | "success";
  actionLabel: string;
  href: string;
}

export interface CustomerFiltersState {
  search: string;
  segment: CustomerSegment | "all";
  city: string | "all";
  relationship: CustomerRelationshipStatus | "all";
  minSpent: number;
  onlyAtRisk: boolean;
}

export interface CustomerKpis {
  totalCustomers: number;
  activeCustomers: number;
  recurringCustomers: number;
  vipCustomers: number;
  dormantCustomers: number;
  relaunchCandidates: number;
  avgCustomerValue: number;
  avgLtv: number;
}

export const DEFAULT_CUSTOMER_FILTERS: CustomerFiltersState = {
  search: "",
  segment: "all",
  city: "all",
  relationship: "all",
  minSpent: 0,
  onlyAtRisk: false,
};
