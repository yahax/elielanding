import type { DomainEvent } from "@/lib/os/domain/types";
import { buildOrdersQuery, buildPipelineQuery } from "@/lib/os/domain/query-filters";
import type { NotificationDraft } from "@/lib/os/live/types";

function orderLinkWithStatus(status: string): string {
  return buildOrdersQuery({ statuses: [status] });
}

export function mapDomainEventToNotificationDraft(event: DomainEvent): NotificationDraft | null {
  switch (event.type) {
    case "order.created":
      return {
        type: "new_order",
        title: "Nouvelle commande",
        message: event.label,
        severity: "info",
        category: "orders",
        link: orderLinkWithStatus("new"),
        entityId: event.entityId,
        metadata: event.payload,
      };
    case "order.confirmed":
      return {
        type: "order_confirmed",
        title: "Commande confirmée",
        message: event.label,
        severity: "success",
        category: "orders",
        link: orderLinkWithStatus("confirmed"),
        entityId: event.entityId,
        metadata: event.payload,
      };
    case "order.cancelled":
      return {
        type: "order_canceled",
        title: "Commande annulée",
        message: event.label,
        severity: "warning",
        category: "orders",
        link: orderLinkWithStatus("canceled"),
        entityId: event.entityId,
        metadata: event.payload,
      };
    case "order.assigned":
      return {
        type: "operator_activity",
        title: "Commande assignée",
        message: event.label,
        severity: "info",
        category: "operators",
        link: buildPipelineQuery({ view: "focus" }),
        entityId: event.entityId,
        metadata: event.payload,
      };
    case "stock.updated":
      return {
        type: "stock_critical",
        title: "Stock mis à jour",
        message: event.label,
        severity: "warning",
        category: "stock",
        link: "/os/inventory",
        entityId: event.entityId,
        metadata: event.payload,
      };
    case "notification.created":
      return {
        type: "operator_activity",
        title: "Notification opérateur",
        message: event.label,
        severity: "info",
        category: "operators",
        link: "/os/notifications",
        entityId: event.entityId,
        metadata: event.payload,
      };
    case "settings.updated":
      return {
        type: "operator_activity",
        title: "Settings mis à jour",
        message: event.label,
        severity: "info",
        category: "system",
        link: "/os/settings",
        entityId: event.entityId,
        metadata: event.payload,
      };
    case "audit.logged":
      return {
        type: "operator_activity",
        title: "Action opérateur tracée",
        message: event.label,
        severity: "info",
        category: "operators",
        link: "/os/notifications",
        entityId: event.entityId,
        metadata: event.payload,
      };
    case "order.updated":
    default:
      return null;
  }
}
