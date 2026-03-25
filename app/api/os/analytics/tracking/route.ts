import { NextResponse } from "next/server";
import { z } from "zod";
import { ordersRepository } from "@/lib/os/orders/repositories/orders-repository";
import { buildTrackingAnalyticsSnapshot } from "@/lib/os/analytics/server/snapshots";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const periodDays = parsed.days ?? 30;

    const orders = await ordersRepository.listNormalizedOrders({
      days: periodDays,
      limit: 2000,
    });

    const snapshot = buildTrackingAnalyticsSnapshot(orders, periodDays);
    return NextResponse.json({ snapshot }, { status: 200 });
  } catch (error) {
    console.warn("[API/OS] tracking fallback empty snapshot:", error);
    return NextResponse.json({ snapshot: buildTrackingAnalyticsSnapshot([], 30) }, { status: 200 });
  }
}
