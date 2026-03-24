import { markOrderCallback } from "@/lib/os/orders/server/order-mutations";
import { resolveActorFromRequest } from "@/lib/os/server/actor";
import { executeIdempotentJsonMutation } from "@/lib/os/server/idempotency";
import { mapApiError, toApiErrorResponse } from "@/lib/os/orders/server/http";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const actor = await resolveActorFromRequest(req);
    return executeIdempotentJsonMutation({
      req,
      scope: "orders.callback",
      actorId: actor.actorId,
      payload: { orderId: id },
      execute: async () => {
        const order = await markOrderCallback(id, actor);
        return {
          body: { success: true, order },
        };
      },
      onError: (error) => mapApiError(error, "Unable to mark callback"),
    });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to mark callback");
  }
}
