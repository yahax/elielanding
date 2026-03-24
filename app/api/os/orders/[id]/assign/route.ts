import { z } from "zod";
import { assignOrderOperator } from "@/lib/os/orders/server/order-mutations";
import { resolveActorFromRequest } from "@/lib/os/server/actor";
import { executeIdempotentJsonMutation } from "@/lib/os/server/idempotency";
import { mapApiError, toApiErrorResponse } from "@/lib/os/orders/server/http";

const bodySchema = z.object({
  operatorId: z.string().trim().min(1),
  operatorName: z.string().trim().min(1),
});

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = bodySchema.parse(await req.json());
    const actor = await resolveActorFromRequest(req);
    return executeIdempotentJsonMutation({
      req,
      scope: "orders.assign",
      actorId: actor.actorId,
      payload: {
        orderId: id,
        ...payload,
      },
      execute: async () => {
        const order = await assignOrderOperator(id, actor, payload);
        return {
          body: { success: true, order },
        };
      },
      onError: (error) => mapApiError(error, "Unable to assign operator"),
    });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to assign operator");
  }
}
