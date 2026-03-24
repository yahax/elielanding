import { DomainValidationError } from "@/lib/os/domain/errors";
import type { DomainOrder, DomainOrderStatus } from "@/lib/os/domain/types";
import { assertValidOrderTransition, normalizeDomainStatusForStorage } from "@/lib/os/domain/status-transition-guards";
import { logAuditEntry } from "@/lib/os/audit/logger";
import { dispatchDomainEvent } from "@/lib/os/realtime/event-dispatcher";
import { ordersRepository } from "@/lib/os/orders/repositories/orders-repository";
import { buildUpdatedOrderMeta, getOrderOsMeta, mapStorageOrderToDomainOrder } from "@/lib/os/orders/server/mappers";
import type { ActorContext } from "@/lib/os/server/actor";
import type { OrderStoragePatch, OrderStorageRow } from "@/lib/os/orders/adapters/types";

function buildStatusPatch(row: OrderStorageRow, targetStatus: DomainOrderStatus, nowIso: string): OrderStoragePatch {
  const normalizedStatus = normalizeDomainStatusForStorage(targetStatus);

  return {
    status: normalizedStatus,
    updated_at: nowIso,
    confirmed_at:
      normalizedStatus === "confirmed"
        ? row.confirmed_at ?? nowIso
        : row.confirmed_at,
    shipped_at: normalizedStatus === "shipped" ? row.shipped_at ?? nowIso : row.shipped_at,
    delivered_at:
      normalizedStatus === "delivered"
        ? row.delivered_at ?? nowIso
        : row.delivered_at,
    canceled_at:
      normalizedStatus === "canceled"
        ? row.canceled_at ?? nowIso
        : row.canceled_at,
  };
}

function nextActionForStatus(status: DomainOrderStatus): string {
  switch (status) {
    case "new":
    case "to_confirm":
      return "confirm_now";
    case "callback":
      return "call_customer";
    case "confirmed":
    case "ready_to_ship":
      return "mark_shipped";
    case "shipped":
      return "verify_stock";
    case "delivered":
    case "canceled":
    default:
      return "add_note";
  }
}

function statusToAuditAction(status: DomainOrderStatus): string {
  switch (status) {
    case "confirmed":
    case "ready_to_ship":
      return "order.confirmed";
    case "callback":
      return "order.callback";
    case "shipped":
      return "order.shipped";
    case "delivered":
      return "order.delivered";
    case "canceled":
      return "order.cancelled";
    case "to_confirm":
      return "order.to_confirm";
    case "new":
    default:
      return "order.updated";
  }
}

function statusToDomainEventType(status: DomainOrderStatus): "order.confirmed" | "order.cancelled" | "order.updated" {
  if (status === "confirmed" || status === "ready_to_ship") return "order.confirmed";
  if (status === "canceled") return "order.cancelled";
  return "order.updated";
}

async function applyStatusMutation(params: {
  orderId: string;
  targetStatus: DomainOrderStatus;
  actor: ActorContext;
  label: string;
  details: string;
  metadata?: Record<string, unknown>;
}): Promise<DomainOrder> {
  const nowIso = new Date().toISOString();
  const row = await ordersRepository.getStorageOrderByIdOrThrow(params.orderId);
  const current = mapStorageOrderToDomainOrder(row);
  const currentStorageStatus = normalizeDomainStatusForStorage(current.status);
  const targetStorageStatus = normalizeDomainStatusForStorage(params.targetStatus);

  if (currentStorageStatus === targetStorageStatus) {
    return current;
  }

  assertValidOrderTransition(current.status, params.targetStatus);

  const patchedMeta = buildUpdatedOrderMeta(row.meta, (meta) => ({
    ...meta,
    attemptCount: Number(meta.attemptCount ?? 0) + 1,
    callbackCount:
      params.targetStatus === "callback"
        ? Number(meta.callbackCount ?? 0) + 1
        : Number(meta.callbackCount ?? 0),
    lastTouchAt: nowIso,
    nextBestAction: nextActionForStatus(params.targetStatus),
  }));

  const updatedRow = await ordersRepository.updateStorageOrder(
    params.orderId,
    {
      ...buildStatusPatch(row, params.targetStatus, nowIso),
      meta: patchedMeta,
    },
    {
      expectedStatus: row.status,
      expectedUpdatedAt: row.updated_at ?? null,
    }
  );

  const updated = mapStorageOrderToDomainOrder(updatedRow);

  await logAuditEntry({
    actorId: params.actor.actorId,
    actorName: params.actor.actorName,
    actionType: statusToAuditAction(params.targetStatus),
    entityType: "order",
    entityId: params.orderId,
    label: params.label,
    details: params.details,
    metadata: {
      previousStatus: current.status,
      nextStatus: params.targetStatus,
      ...(params.metadata ?? {}),
    },
  });

  await dispatchDomainEvent({
    type: statusToDomainEventType(params.targetStatus),
    entityType: "order",
    entityId: params.orderId,
    actorId: params.actor.actorId,
    actorName: params.actor.actorName,
    label: params.label,
    payload: {
      previousStatus: current.status,
      nextStatus: params.targetStatus,
      ...(params.metadata ?? {}),
    },
  });

  return updated;
}

export async function confirmOrder(orderId: string, actor: ActorContext): Promise<DomainOrder> {
  return applyStatusMutation({
    orderId,
    targetStatus: "confirmed",
    actor,
    label: "Commande confirmée",
    details: "Confirmation opérateur effectuée.",
  });
}

export async function markOrderCallback(orderId: string, actor: ActorContext): Promise<DomainOrder> {
  return applyStatusMutation({
    orderId,
    targetStatus: "callback",
    actor,
    label: "Callback planifié",
    details: "Commande passée en file callback.",
  });
}

export async function markOrderShipped(orderId: string, actor: ActorContext): Promise<DomainOrder> {
  return applyStatusMutation({
    orderId,
    targetStatus: "shipped",
    actor,
    label: "Commande expédiée",
    details: "Expédition validée par l'équipe.",
  });
}

export async function cancelOrder(orderId: string, actor: ActorContext, reason?: string): Promise<DomainOrder> {
  return applyStatusMutation({
    orderId,
    targetStatus: "canceled",
    actor,
    label: "Commande annulée",
    details: reason?.trim() || "Annulation opérateur.",
    metadata: reason ? { reason } : undefined,
  });
}

export async function changeOrderStatus(orderId: string, status: DomainOrderStatus, actor: ActorContext): Promise<DomainOrder> {
  return applyStatusMutation({
    orderId,
    targetStatus: status,
    actor,
    label: `Statut mis à jour: ${status}`,
    details: "Mise à jour manuelle du statut.",
  });
}

export async function assignOrderOperator(
  orderId: string,
  actor: ActorContext,
  input: { operatorId: string; operatorName: string }
): Promise<DomainOrder> {
  if (input.operatorId.trim().length === 0 || input.operatorName.trim().length === 0) {
    throw new DomainValidationError("operatorId et operatorName sont requis pour l'assignation.");
  }

  const nowIso = new Date().toISOString();
  const row = await ordersRepository.getStorageOrderByIdOrThrow(orderId);
  const currentMeta = getOrderOsMeta(row.meta);
  const normalizedOperatorId = input.operatorId.trim();
  const normalizedOperatorName = input.operatorName.trim();

  if (
    currentMeta.assignedOperatorId === normalizedOperatorId &&
    currentMeta.assignedOperatorName === normalizedOperatorName
  ) {
    return mapStorageOrderToDomainOrder(row);
  }

  const updatedMeta = buildUpdatedOrderMeta(row.meta, (meta) => ({
    ...meta,
    assignedOperatorId: normalizedOperatorId,
    assignedOperatorName: normalizedOperatorName,
    assignedAt: nowIso,
    lastTouchAt: nowIso,
    attemptCount: Number(meta.attemptCount ?? 0) + 1,
  }));

  const updated = await ordersRepository.updateStorageOrderAndMapDomain(
    orderId,
    {
      updated_at: nowIso,
      meta: updatedMeta,
    },
    {
      expectedStatus: row.status,
      expectedUpdatedAt: row.updated_at ?? null,
    }
  );

  await logAuditEntry({
    actorId: actor.actorId,
    actorName: actor.actorName,
    actionType: "order.assigned",
    entityType: "order",
    entityId: orderId,
    label: "Assignation opérateur",
    details: `Commande assignée à ${input.operatorName}.`,
    metadata: {
      assignedOperatorId: input.operatorId,
      assignedOperatorName: input.operatorName,
    },
  });

  await dispatchDomainEvent({
    type: "order.assigned",
    entityType: "order",
    entityId: orderId,
    actorId: actor.actorId,
    actorName: actor.actorName,
    label: "Commande assignée",
    payload: {
      assignedOperatorId: input.operatorId,
      assignedOperatorName: input.operatorName,
    },
  });

  return updated;
}

export async function addOrderNote(orderId: string, actor: ActorContext, note: string): Promise<DomainOrder> {
  const normalized = note.trim();
  if (normalized.length === 0) {
    throw new DomainValidationError("La note est vide.");
  }

  const nowIso = new Date().toISOString();
  const row = await ordersRepository.getStorageOrderByIdOrThrow(orderId);
  const currentMeta = getOrderOsMeta(row.meta);

  const updatedMeta = buildUpdatedOrderMeta(row.meta, (meta) => ({
    ...meta,
    notes: [...currentMeta.notes, normalized].slice(-20),
    lastTouchAt: nowIso,
    attemptCount: Number(meta.attemptCount ?? 0) + 1,
  }));

  const updated = await ordersRepository.updateStorageOrderAndMapDomain(
    orderId,
    {
      updated_at: nowIso,
      notes: normalized,
      meta: updatedMeta,
    },
    {
      expectedStatus: row.status,
      expectedUpdatedAt: row.updated_at ?? null,
    }
  );

  await logAuditEntry({
    actorId: actor.actorId,
    actorName: actor.actorName,
    actionType: "order.note_added",
    entityType: "order",
    entityId: orderId,
    label: "Note ajoutée",
    details: normalized,
  });

  await dispatchDomainEvent({
    type: "order.updated",
    entityType: "order",
    entityId: orderId,
    actorId: actor.actorId,
    actorName: actor.actorName,
    label: "Note commande ajoutée",
    payload: {
      note: normalized,
    },
  });

  return updated;
}

export async function prepareOrderWhatsappRelaunch(
  orderId: string,
  actor: ActorContext,
  templateId = "default"
): Promise<DomainOrder> {
  const nowIso = new Date().toISOString();
  const row = await ordersRepository.getStorageOrderByIdOrThrow(orderId);

  const updatedMeta = buildUpdatedOrderMeta(row.meta, (meta) => ({
    ...meta,
    attemptCount: Number(meta.attemptCount ?? 0) + 1,
    lastTouchAt: nowIso,
    lastWhatsappPreparedAt: nowIso,
  }));

  const updated = await ordersRepository.updateStorageOrderAndMapDomain(
    orderId,
    {
      updated_at: nowIso,
      meta: updatedMeta,
    },
    {
      expectedStatus: row.status,
      expectedUpdatedAt: row.updated_at ?? null,
    }
  );

  await logAuditEntry({
    actorId: actor.actorId,
    actorName: actor.actorName,
    actionType: "order.whatsapp_prepared",
    entityType: "order",
    entityId: orderId,
    label: "Relance WhatsApp préparée",
    details: `Template: ${templateId}`,
    metadata: { templateId },
  });

  await dispatchDomainEvent({
    type: "notification.created",
    entityType: "notification",
    entityId: orderId,
    actorId: actor.actorId,
    actorName: actor.actorName,
    label: "Rappel WhatsApp prêt",
    payload: {
      orderId,
      templateId,
    },
  });

  return updated;
}

export async function bulkChangeOrderStatus(
  orderIds: string[],
  status: DomainOrderStatus,
  actor: ActorContext
): Promise<{ updatedCount: number; failedIds: string[] }> {
  const uniqueIds = Array.from(new Set(orderIds));
  const failedIds: string[] = [];
  let updatedCount = 0;

  for (const id of uniqueIds) {
    try {
      await changeOrderStatus(id, status, actor);
      updatedCount += 1;
    } catch (error) {
      console.warn(`[ORDERS] Bulk status update failed for ${id}:`, error);
      failedIds.push(id);
    }
  }

  return {
    updatedCount,
    failedIds,
  };
}
