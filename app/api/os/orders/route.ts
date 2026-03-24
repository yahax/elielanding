import { NextResponse } from "next/server";
import { z } from "zod";
import { ordersRepository } from "@/lib/os/orders/repositories/orders-repository";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  status: z.string().optional(),
  source: z.string().optional(),
  city: z.string().optional(),
  pack: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  days: z.coerce.number().int().positive().optional(),
  pipeline: z
    .string()
    .optional()
    .transform((value) => value === "1" || value === "true"),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query params", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const filters = parsed.data;
    console.log("[API/OS] Fetching orders with filters:", filters);
    
    const orders = await ordersRepository.listNormalizedOrders({
      status: filters.status,
      source: filters.source,
      city: filters.city,
      pack: filters.pack,
      search: filters.search,
      limit: filters.limit,
      pipeline: filters.pipeline,
      days: filters.days,
    });

    console.log(`[API/OS] Orders fetched: ${orders.length}`);
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error("[API/OS] orders fallback empty list. Error details:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
    });
    return NextResponse.json({ orders: [] }, { status: 200 });
  }
}
