import { z } from "zod";
import { cancelOrder } from "@/lib/os/orders/server/order-mutations";
import { resolveActorFromRequest } from "@/lib/os/server/actor";
import { executeIdempotentJsonMutation } from "@/lib/os/server/idempotency";
import { mapApiError, toApiErrorResponse } from "@/lib/os/orders/server/http";

const bodySchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = bodySchema.parse(await req.json().catch(() => ({})));
    const actor = await resolveActorFromRequest(req);
    return executeIdempotentJsonMutation({
      req,
      scope: "orders.cancel",
      actorId: actor.actorId,
      payload: { orderId: id, reason: payload.reason ?? null },
      execute: async () => {
        const order = await cancelOrder(id, actor, payload.reason);
        return {
          body: { success: true, order },
        };
      },
      onError: (error) => mapApiError(error, "Unable to cancel order"),
    });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to cancel order");
  }
}
