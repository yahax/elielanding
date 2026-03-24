import { NextResponse } from "next/server";
import { z } from "zod";
import { ordersRepository } from "@/lib/os/orders/repositories/orders-repository";
import { fetchCatalogProducts } from "@/lib/os/server";
import { buildAnalyticsBundle, buildIntelligenceSnapshot } from "@/lib/os/analytics/server/snapshots";
import { toApiErrorResponse } from "@/lib/os/orders/server/http";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const periodDays = parsed.days ?? 30;

    const [orders, catalog] = await Promise.all([
      ordersRepository.listNormalizedOrders({
        days: periodDays,
        limit: 2000,
      }),
      fetchCatalogProducts(),
    ]);

    const lowStockAlerts = catalog
      .filter((product) => product.stock <= product.low_stock_threshold)
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

    const snapshot = buildIntelligenceSnapshot(orders, periodDays, bundle.overview);
    return NextResponse.json({ snapshot }, { status: 200 });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to load intelligence analytics");
  }
}
