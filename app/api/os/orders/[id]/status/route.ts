import { NextResponse } from "next/server";
import { z } from "zod";
import { changeOrderStatus } from "@/lib/os/orders/server/order-mutations";
import { resolveActorFromRequest } from "@/lib/os/server/actor";
import { mapApiError, toApiErrorResponse } from "@/lib/os/orders/server/http";
import { parseDomainOrderStatus } from "@/lib/os/domain/status-transition-guards";
import { executeIdempotentJsonMutation } from "@/lib/os/server/idempotency";

const bodySchema = z.object({
  status: z.string().min(1),
});

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = bodySchema.parse(await req.json());
    const nextStatus = parseDomainOrderStatus(payload.status);
    if (!nextStatus) {
      return NextResponse.json(
        {
          error: "Invalid status",
          details: {
            allowed: [
              "new",
              "pending",
              "confirmed",
              "callback",
              "cancelled",
              "shipped",
              "delivered",
              "ready_to_ship",
            ],
          },
        },
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
