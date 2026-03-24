import { z } from "zod";
import { addOrderNote } from "@/lib/os/orders/server/order-mutations";
import { resolveActorFromRequest } from "@/lib/os/server/actor";
import { executeIdempotentJsonMutation } from "@/lib/os/server/idempotency";
import { mapApiError, toApiErrorResponse } from "@/lib/os/orders/server/http";

const bodySchema = z.object({
  note: z.string().trim().min(1).max(2000),
});

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = bodySchema.parse(await req.json());
    const actor = await resolveActorFromRequest(req);
    return executeIdempotentJsonMutation({
      req,
      scope: "orders.note",
      actorId: actor.actorId,
      payload: {
        orderId: id,
        note: payload.note,
      },
      execute: async () => {
        const order = await addOrderNote(id, actor, payload.note);
        return {
          body: { success: true, order },
        };
      },
      onError: (error) => mapApiError(error, "Unable to add note"),
    });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to add note");
  }
}
