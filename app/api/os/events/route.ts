import { NextResponse } from "next/server";
import { z } from "zod";
import { listDomainEvents } from "@/lib/os/realtime/event-dispatcher";

const querySchema = z.object({
  since: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

const eventsWarnCooldownMs = 60_000;
let lastEventsWarnAt = 0;

function warnEventsRoute(message: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message, error);
    return;
  }
  const now = Date.now();
  if (now - lastEventsWarnAt < eventsWarnCooldownMs) return;
  lastEventsWarnAt = now;
  console.warn(message, error);
}

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
    warnEventsRoute("[API/OS] events fallback empty list:", error);
    return NextResponse.json({ events: [], nextCursor: null }, { status: 200 });
  }
}
