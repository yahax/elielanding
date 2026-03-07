import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchOrders } from "@/lib/os/server";
import type { OrderStatus, PackType } from "@/lib/types";

const querySchema = z.object({
  status: z.string().optional(),
  source: z.string().optional(),
  pack: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
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
    const orders = await fetchOrders({
      status: (filters.status || "") as OrderStatus | "",
      source: filters.source,
      pack: (filters.pack || "") as PackType | "",
      search: filters.search,
      limit: filters.limit,
      pipeline: filters.pipeline,
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
