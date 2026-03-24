import { NextResponse } from "next/server";
import { z } from "zod";
import { listAuditEntries } from "@/lib/os/audit/logger";
import { toApiErrorResponse } from "@/lib/os/orders/server/http";

const querySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const entries = await listAuditEntries({
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      limit: parsed.limit,
    });

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to load audit log");
  }
}
