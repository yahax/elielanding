import type { OrderStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import type { NextBestActionType, OrderPriority, OrderRisk, PipelineColumnType, SlaLevel } from "@/lib/os/orders/types";

export const PIPELINE_COLUMNS: PipelineColumnType[] = [
  "new",
  "to_confirm",
  "callback",
  "confirmed",
  "shipped",
  "delivered",
  "canceled",
];

export const STATUS_ORDER_WEIGHT: Record<OrderStatus, number> = {
  new: 40,
  to_confirm: 52,
  callback: 56,
  confirmed: 34,
  shipped: 20,
  delivered: 5,
  canceled: 4,
};

export const STATUS_RISK_WEIGHT: Record<OrderStatus, number> = {
  new: 24,
  to_confirm: 30,
  callback: 40,
  confirmed: 16,
  shipped: 8,
  delivered: 2,
  canceled: 6,
};

export const STATUS_SLA_MINUTES: Record<OrderStatus, number> = {
  new: 30,
  to_confirm: 25,
  callback: 180,
  confirmed: 480,
  shipped: 1440,
  delivered: 2880,
  canceled: 2880,
};

export const PRIORITY_LABELS: Record<OrderPriority, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Haute",
  critical: "Critique",
};

export const RISK_LABELS: Record<OrderRisk, string> = {
  low: "Faible",
  medium: "Modéré",
  high: "Élevé",
};

export const SLA_LABELS: Record<SlaLevel, string> = {
  normal: "Normal",
  attention: "Attention",
  critical: "Critique",
};

export const NEXT_ACTION_LABELS: Record<NextBestActionType, string> = {
  confirm_now: "Confirmer maintenant",
  send_whatsapp: "Relancer WhatsApp",
  call_customer: "Appeler client",
  schedule_callback: "Planifier callback",
  mark_shipped: "Marquer expédiée",
  verify_stock: "Vérifier stock",
  assign_operator: "Assigner opérateur",
  add_note: "Ajouter note",
};

export const STATUS_NEXT_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["to_confirm", "callback", "confirmed", "canceled"],
  to_confirm: ["confirmed", "callback", "canceled"],
  callback: ["to_confirm", "confirmed", "canceled"],
  confirmed: ["shipped", "canceled", "delivered"],
  shipped: ["delivered", "canceled"],
  delivered: [],
  canceled: [],
};

export function getStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusTone(status: OrderStatus): "neutral" | "info" | "success" | "warning" | "danger" {
  switch (status) {
    case "new":
      return "info";
    case "to_confirm":
      return "warning";
    case "callback":
      return "info";
    case "confirmed":
    case "delivered":
      return "success";
    case "canceled":
      return "danger";
    case "shipped":
    default:
      return "neutral";
  }
}

export function scoreToPriority(score: number): OrderPriority {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function scoreToRisk(score: number): OrderRisk {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function getSlaLevel(elapsedMinutes: number, slaMinutes: number): SlaLevel {
  if (elapsedMinutes >= slaMinutes * 1.5) return "critical";
  if (elapsedMinutes >= slaMinutes) return "attention";
  return "normal";
}
