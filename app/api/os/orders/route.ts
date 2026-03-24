import { NextResponse } from "next/server";
import { z } from "zod";
import { ordersRepository } from "@/lib/os/orders/repositories/orders-repository";

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

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: unknown) {
    console.warn("[API/OS] orders fallback empty list:", error);
    return NextResponse.json({ orders: [] }, { status: 200 });
  }
}
