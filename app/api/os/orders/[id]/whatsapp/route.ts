import { z } from "zod";
import { prepareOrderWhatsappRelaunch } from "@/lib/os/orders/server/order-mutations";
import { resolveActorFromRequest } from "@/lib/os/server/actor";
import { executeIdempotentJsonMutation } from "@/lib/os/server/idempotency";
import { mapApiError, toApiErrorResponse } from "@/lib/os/orders/server/http";

const bodySchema = z.object({
  templateId: z.string().trim().min(1).max(128).optional(),
});

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = bodySchema.parse(await req.json().catch(() => ({})));
    const actor = await resolveActorFromRequest(req);
    return executeIdempotentJsonMutation({
      req,
      scope: "orders.whatsapp",
      actorId: actor.actorId,
      payload: {
        orderId: id,
        templateId: payload.templateId || "default",
      },
      execute: async () => {
        const order = await prepareOrderWhatsappRelaunch(id, actor, payload.templateId || "default");
        return {
          body: { success: true, order },
        };
      },
      onError: (error) => mapApiError(error, "Unable to prepare WhatsApp relaunch"),
    });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to prepare WhatsApp relaunch");
  }
}
