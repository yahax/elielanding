import type { NormalizedOrder, OverviewResponse } from "@/lib/os/types";
import type { NotificationDraft, NotificationType, RealtimeSnapshotEntry } from "@/lib/os/live/types";
import { getDefaultSeverity, getNotificationCategory } from "@/lib/os/live/helpers";

const HIGH_VALUE_THRESHOLD = 699;
const URGENT_MINUTES_THRESHOLD = 40;
const CALLBACK_OVERDUE_MINUTES = 180;

function orderValue(order: NormalizedOrder): number {
  const value = Number(order.price_mad ?? order.total_price ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function ageInMinutes(iso: string): number {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
}

function keyFor(type: NotificationType, orderId: string): string {
  return `${type}:${orderId}`;
}

export function toRealtimeSnapshot(orders: NormalizedOrder[]): Record<string, RealtimeSnapshotEntry> {
  const snapshot: Record<string, RealtimeSnapshotEntry> = {};
  for (const order of orders) {
    snapshot[order.id] = {
      id: order.id,
      status: order.status,
      updatedAt: order.updated_at,
      createdAt: order.created_at,
      price: orderValue(order),
      city: order.city,
      source: order.source,
    };
  }
  return snapshot;
}

export function generateNotificationDraftsFromOrders(params: {
  orders: NormalizedOrder[];
  previousSnapshot: Record<string, RealtimeSnapshotEntry>;
  overview: OverviewResponse | null;
  emittedKeys: Set<string>;
}): NotificationDraft[] {
  const { orders, previousSnapshot, overview, emittedKeys } = params;
  const drafts: NotificationDraft[] = [];

  const customerCount = new Map<string, number>();
  for (const order of orders) {
    const phone = (order.phone || "").replace(/\D/g, "");
    if (!phone) continue;
    customerCount.set(phone, (customerCount.get(phone) ?? 0) + 1);
  }

  for (const order of orders) {
    const previous = previousSnapshot[order.id];
    const value = orderValue(order);
    const ageMinutes = ageInMinutes(order.created_at);
    const isHighValue = value >= HIGH_VALUE_THRESHOLD;
    const orderLabel = `#${order.id.slice(-8).toUpperCase()}`;
    const cityLabel = order.city || "Ville non spécifiée";
    const keySuffix = order.id;

    if (!previous) {
      const key = keyFor("new_order", keySuffix);
      if (!emittedKeys.has(key)) {
        drafts.push({
          type: "new_order",
          title: "Nouvelle commande reçue",
          message: `${orderLabel} · ${cityLabel} · ${value} MAD`,
          severity: getDefaultSeverity("new_order"),
          category: getNotificationCategory("new_order"),
          link: `/os/orders?status=new`,
          entityId: order.id,
          metadata: { source: order.source, value },
        });
        emittedKeys.add(key);
      }
    }

    if (previous && previous.status !== order.status) {
      if (order.status === "confirmed") {
        const key = keyFor("order_confirmed", keySuffix);
        if (!emittedKeys.has(key)) {
          drafts.push({
            type: "order_confirmed",
            title: "Commande confirmée",
            message: `${orderLabel} confirmée par l'équipe`,
            severity: getDefaultSeverity("order_confirmed"),
            category: getNotificationCategory("order_confirmed"),
            link: `/os/orders?status=confirmed`,
            entityId: order.id,
          });
          emittedKeys.add(key);
        }
      }

      if (order.status === "canceled") {
        const key = keyFor("order_canceled", keySuffix);
        if (!emittedKeys.has(key)) {
          drafts.push({
            type: "order_canceled",
            title: "Commande annulée",
            message: `${orderLabel} a été annulée`,
            severity: getDefaultSeverity("order_canceled"),
            category: getNotificationCategory("order_canceled"),
            link: `/os/orders?status=canceled`,
            entityId: order.id,
          });
          emittedKeys.add(key);
        }
      }
    }

    if ((order.status === "new" || order.status === "to_confirm") && ageMinutes >= URGENT_MINUTES_THRESHOLD) {
      const key = keyFor("urgent_order", keySuffix);
      if (!emittedKeys.has(key)) {
        drafts.push({
          type: "urgent_order",
          title: "Commande urgente non traitée",
          message: `${orderLabel} dépasse le délai de traitement (${ageMinutes} min)`,
          severity: getDefaultSeverity("urgent_order"),
          category: getNotificationCategory("urgent_order"),
          link: `/os/orders?status=to_confirm`,
          entityId: order.id,
          metadata: { ageMinutes, value },
        });
        emittedKeys.add(key);
      }
    }

    if (order.status === "callback" && ageMinutes >= CALLBACK_OVERDUE_MINUTES) {
      const key = keyFor("callback_overdue", keySuffix);
      if (!emittedKeys.has(key)) {
        drafts.push({
          type: "callback_overdue",
          title: "Callback en retard",
          message: `${orderLabel} attend une relance depuis ${Math.floor(ageMinutes / 60)}h`,
          severity: getDefaultSeverity("callback_overdue"),
          category: getNotificationCategory("callback_overdue"),
          link: `/os/orders?status=callback`,
          entityId: order.id,
          metadata: { ageMinutes },
        });
        emittedKeys.add(key);
      }
    }

    if (isHighValue && (order.status === "new" || order.status === "to_confirm")) {
      const key = keyFor("high_value_order", keySuffix);
      if (!emittedKeys.has(key)) {
        drafts.push({
          type: "high_value_order",
          title: "Commande haute valeur",
          message: `${orderLabel} · ${value} MAD à sécuriser rapidement`,
          severity: getDefaultSeverity("high_value_order"),
          category: getNotificationCategory("high_value_order"),
          link: `/os/orders?status=to_confirm`,
          entityId: order.id,
          metadata: { value },
        });
        emittedKeys.add(key);
      }
    }

    const phone = (order.phone || "").replace(/\D/g, "");
    if (phone && (customerCount.get(phone) ?? 0) >= 2 && (order.status === "new" || order.status === "to_confirm")) {
      const key = keyFor("vip_detected", keySuffix);
      if (!emittedKeys.has(key)) {
        drafts.push({
          type: "vip_detected",
          title: "Client VIP détecté",
          message: `${orderLabel} provient d'un client récurrent`,
          severity: getDefaultSeverity("vip_detected"),
          category: getNotificationCategory("vip_detected"),
          link: `/os/orders?status=to_confirm`,
          entityId: order.id,
        });
        emittedKeys.add(key);
      }
    }
  }

  const lowStock = overview?.lowStockAlerts || [];
  if (lowStock.length > 0) {
    const key = "stock_critical:global";
    if (!emittedKeys.has(key)) {
      drafts.push({
        type: "stock_critical",
        title: "Alerte stock critique",
        message: `${lowStock.length} référence(s) proche(s) de la rupture`,
        severity: getDefaultSeverity("stock_critical"),
        category: getNotificationCategory("stock_critical"),
        link: "/os/inventory",
        metadata: { products: lowStock.map((item) => item.name) },
      });
      emittedKeys.add(key);
    }
  }

  const confirmationRate = overview?.confirmationRate ?? 100;
  if (confirmationRate < 45) {
    const key = "conversion_anomaly:global";
    if (!emittedKeys.has(key)) {
      drafts.push({
        type: "conversion_anomaly",
        title: "Anomalie conversion",
        message: `Taux de confirmation bas (${confirmationRate}%)`,
        severity: getDefaultSeverity("conversion_anomaly"),
        category: getNotificationCategory("conversion_anomaly"),
        link: "/os/intelligence",
        metadata: { confirmationRate },
      });
      emittedKeys.add(key);
    }
  }

  return drafts;
}
