import { NextResponse } from "next/server";
import { z } from "zod";
import { listDomainEvents } from "@/lib/os/realtime/event-dispatcher";
import { toApiErrorResponse } from "@/lib/os/orders/server/http";

const querySchema = z.object({
  since: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const events = await listDomainEvents({
      since: parsed.since,
      limit: parsed.limit,
    });

    return NextResponse.json(
      {
        events,
        nextCursor: events[0]?.createdAt ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.warn("[API/OS] events fallback empty list:", error);
    return NextResponse.json({ events: [], nextCursor: null }, { status: 200 });
  }
}
