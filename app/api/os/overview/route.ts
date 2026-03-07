import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchOverview } from "@/lib/os/server";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
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

    const days = parsed.data.days || 30;
    const overview = await fetchOverview(days);
    return NextResponse.json(overview, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to load overview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
