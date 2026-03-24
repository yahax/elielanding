import { NextResponse } from "next/server";
import { z } from "zod";
import { STATUS_LIST } from "@/lib/types";
import { changeOrderStatus } from "@/lib/os/orders/server/order-mutations";
import { resolveActorFromRequest } from "@/lib/os/server/actor";
import { mapApiError, toApiErrorResponse } from "@/lib/os/orders/server/http";
import type { DomainOrderStatus } from "@/lib/os/domain/types";
import { executeIdempotentJsonMutation } from "@/lib/os/server/idempotency";

const bodySchema = z.object({
  status: z.string().min(1),
});

function isDomainOrderStatus(value: string): value is DomainOrderStatus {
  return value === "ready_to_ship" || (STATUS_LIST as string[]).includes(value);
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = bodySchema.parse(await req.json());
    const nextStatus = payload.status;
    if (!isDomainOrderStatus(nextStatus)) {
      return NextResponse.json(
        { error: "Invalid status", details: { allowed: [...STATUS_LIST, "ready_to_ship"] } },
        { status: 400 }
      );
    }
    const actor = await resolveActorFromRequest(req);
    return executeIdempotentJsonMutation({
      req,
      scope: "orders.status.single",
      actorId: actor.actorId,
      payload: {
        orderId: id,
        status: nextStatus,
      },
      execute: async () => {
        const order = await changeOrderStatus(id, nextStatus, actor);
        return {
          body: { success: true, order },
        };
      },
      onError: (error) => mapApiError(error, "Unable to change status"),
    });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to change status");
  }
}
