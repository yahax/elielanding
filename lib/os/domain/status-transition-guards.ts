import type { OrderStatus } from "@/lib/types";
import type { DomainOrderStatus } from "@/lib/os/domain/types";
import { DomainConflictError } from "@/lib/os/domain/errors";

const ALLOWED_TRANSITIONS: Record<DomainOrderStatus, DomainOrderStatus[]> = {
  new: ["to_confirm", "callback", "confirmed", "canceled"],
  to_confirm: ["callback", "confirmed", "canceled"],
  callback: ["callback", "to_confirm", "confirmed", "canceled"],
  confirmed: ["ready_to_ship", "shipped", "canceled"],
  ready_to_ship: ["shipped", "canceled"],
  shipped: ["delivered", "canceled"],
  delivered: [],
  canceled: [],
};

export function normalizeDomainStatusForStorage(status: DomainOrderStatus): OrderStatus {
  if (status === "ready_to_ship") return "confirmed";
  return status;
}

export function parseDomainOrderStatus(input: unknown): DomainOrderStatus | null {
  if (typeof input !== "string") return null;
  const normalized = input.trim().toLowerCase();

  switch (normalized) {
    case "new":
      return "new";
    case "pending":
    case "to_confirm":
      return "to_confirm";
    case "confirmed":
      return "confirmed";
    case "callback":
      return "callback";
    case "cancelled":
    case "canceled":
      return "canceled";
    case "shipped":
      return "shipped";
    case "delivered":
      return "delivered";
    case "ready_to_ship":
      return "ready_to_ship";
    default:
      return null;
  }
}

export function normalizeStatusForTransition(status: DomainOrderStatus): DomainOrderStatus {
  if (status === "confirmed") {
    return "ready_to_ship";
  }
  return status;
}

export function canTransitionOrderStatus(from: DomainOrderStatus, to: DomainOrderStatus): boolean {
  const normalizedFrom = normalizeStatusForTransition(from);
  const normalizedTo = normalizeStatusForTransition(to);
  return ALLOWED_TRANSITIONS[normalizedFrom].includes(normalizedTo);
}

export function assertValidOrderTransition(from: DomainOrderStatus, to: DomainOrderStatus): void {
  if (from === to) return;
  if (!canTransitionOrderStatus(from, to)) {
    throw new DomainConflictError(`Transition métier invalide: ${from} -> ${to}`);
  }
}

export function getAllowedOrderTransitions(status: DomainOrderStatus): DomainOrderStatus[] {
  return [...ALLOWED_TRANSITIONS[normalizeStatusForTransition(status)]];
}
