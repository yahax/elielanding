import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveActorFromRequest } from "@/lib/os/server/actor";
import { bulkChangeOrderStatus, changeOrderStatus } from "@/lib/os/orders/server/order-mutations";
import { mapApiError, toApiErrorResponse } from "@/lib/os/orders/server/http";
import { STATUS_LIST } from "@/lib/types";
import type { DomainOrderStatus } from "@/lib/os/domain/types";
import { executeIdempotentJsonMutation } from "@/lib/os/server/idempotency";

function isDomainOrderStatus(value: string): value is DomainOrderStatus {
  return value === "ready_to_ship" || (STATUS_LIST as string[]).includes(value);
}

const bodySchema = z.object({
  newStatus: z.string().min(1),
  orderId: z.string().uuid().optional(),
  orderIds: z.array(z.string().uuid()).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { orderId, orderIds, newStatus: rawStatus } = parsed.data;
    if (!isDomainOrderStatus(rawStatus)) {
      return NextResponse.json(
        {
          error: "Invalid status",
          details: { allowed: [...STATUS_LIST, "ready_to_ship"] },
        },
        { status: 400 }
      );
    }

    const newStatus: DomainOrderStatus = rawStatus;
    const actor = await resolveActorFromRequest(req);
    return executeIdempotentJsonMutation({
      req,
      scope: "orders.status.bulk",
      actorId: actor.actorId,
      payload: parsed.data,
      execute: async () => {
        if (orderId) {
          const updated = await changeOrderStatus(orderId, newStatus, actor);
          return {
            body: { success: true, updatedCount: 1, order: updated },
          };
        }

        if (orderIds && orderIds.length > 0) {
          const result = await bulkChangeOrderStatus(orderIds, newStatus, actor);
          return {
            body: { success: true, updatedCount: result.updatedCount, failedIds: result.failedIds },
          };
        }

        return {
          status: 400,
          body: { error: "orderId or orderIds is required" },
        };
      },
      onError: (error) => mapApiError(error, "Unable to update order status"),
    });
  } catch (error: unknown) {
    return toApiErrorResponse(error, "Unable to update order status");
  }
}
