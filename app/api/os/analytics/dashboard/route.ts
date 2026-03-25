import { NextResponse } from "next/server";
import { z } from "zod";
import { ordersRepository } from "@/lib/os/orders/repositories/orders-repository";
import { fetchCatalogProducts } from "@/lib/os/server";
import { buildAnalyticsBundle } from "@/lib/os/analytics/server/snapshots";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
    }
    const periodDays = parsed.data.days ?? 30;

    const [orders, catalog] = await Promise.all([
      ordersRepository.listNormalizedOrders({
        days: periodDays,
        limit: 1500,
      }),
      fetchCatalogProducts(),
    ]);

    const lowStockAlerts = catalog
      .filter((product) => product.stock <= product.low_stock_threshold)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8)
      .map((product) => ({
        perfume_id: product.id,
        name: product.name,
        stock: product.stock,
        low_stock_threshold: product.low_stock_threshold,
      }));

    const bundle = buildAnalyticsBundle({
      orders,
      periodDays,
      lowStockAlerts,
    });

    return NextResponse.json(
      {
        snapshot: bundle.dashboard,
        overview: bundle.overview,
      },
      { status: 200 }
    );
  } catch (error) {
    console.warn("[API/OS] dashboard fallback empty stats:", error);
    const bundle = buildAnalyticsBundle({ orders: [], periodDays: 30, lowStockAlerts: [] });
    return NextResponse.json({ snapshot: bundle.dashboard, overview: bundle.overview }, { status: 200 });
  }
}
