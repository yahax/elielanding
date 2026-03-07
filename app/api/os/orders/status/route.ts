import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { STATUS_LIST } from "@/lib/types";

const statusValues = STATUS_LIST as [string, ...string[]];

const bodySchema = z.object({
  newStatus: z.enum(statusValues),
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

    const { orderId, orderIds, newStatus } = parsed.data;
    const supabase = createServiceSupabaseClient();

    if (orderId) {
      const { error } = await supabase.rpc("update_order_status_secure", {
        p_order_id: orderId,
        p_new_status: newStatus,
      });
      if (error) {
        return NextResponse.json({ error: error.message, details: error }, { status: 400 });
      }
      return NextResponse.json({ success: true, updatedCount: 1 }, { status: 200 });
    }

    if (orderIds && orderIds.length > 0) {
      const { data, error } = await supabase.rpc("bulk_update_order_status", {
        p_order_ids: orderIds,
        p_new_status: newStatus,
      });
      if (error) {
        return NextResponse.json({ error: error.message, details: error }, { status: 400 });
      }
      return NextResponse.json(
        { success: true, updatedCount: Number(data || 0) },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "orderId or orderIds is required" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to update order status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
