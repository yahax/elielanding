import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { DomainConflictError } from "@/lib/os/domain/errors";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getOsMemoryStore } from "@/lib/os/server/memory-store";

interface IdempotencyDbRow {
  id: string;
  request_hash: string;
  status: "pending" | "completed" | "failed";
  response_status: number | null;
  response_body: Record<string, unknown> | null;
  expires_at: string;
  updated_at: string;
}

type IdempotencyClaim =
  | {
      mode: "disabled";
    }
  | {
      mode: "replay";
      status: number;
      body: Record<string, unknown>;
    }
  | {
      mode: "in_progress";
    }
  | {
      mode: "started";
      recordId: string;
      key: string;
      requestHash: string;
      scope: string;
      actorId: string;
      expiresAt: string;
    };

type ApiResult = {
  status?: number;
  body: Record<string, unknown>;
};

function stableStringify(value: unknown): string {
  if (value == null) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  const serialized = entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`);
  return `{${serialized.join(",")}}`;
}

function hashPayload(payload: unknown): string {
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

function getIdempotencyKey(headers: Headers): string | null {
  const key = headers.get("idempotency-key") ?? headers.get("x-idempotency-key");
  if (!key) return null;
  const normalized = key.trim();
  return normalized.length > 0 ? normalized.slice(0, 180) : null;
}

function isMissingTableError(error: unknown): boolean {
  if (typeof error !== "object" || error == null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return code === "42P01" || code === "PGRST205" || code === "PGRST204";
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error == null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return code === "23505";
}

async function claimInMemory(params: {
  key: string;
  scope: string;
  actorId: string;
  requestHash: string;
  ttlSeconds: number;
}): Promise<IdempotencyClaim> {
  const store = getOsMemoryStore();
  const mapKey = `${params.scope}:${params.actorId}:${params.key}`;
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  const expiresAtIso = new Date(Date.now() + params.ttlSeconds * 1000).toISOString();
  const current = store.idempotency.get(mapKey);

  if (!current) {
    store.idempotency.set(mapKey, {
      requestHash: params.requestHash,
      status: "pending",
      responseStatus: null,
      responseBody: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt: expiresAtIso,
    });

    return {
      mode: "started",
      recordId: mapKey,
      key: params.key,
      requestHash: params.requestHash,
      scope: params.scope,
      actorId: params.actorId,
      expiresAt: expiresAtIso,
    };
  }

  const currentExpiresAtMs = new Date(current.expiresAt).getTime();
  if (!Number.isNaN(currentExpiresAtMs) && currentExpiresAtMs <= nowMs) {
    store.idempotency.set(mapKey, {
      requestHash: params.requestHash,
      status: "pending",
      responseStatus: null,
      responseBody: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt: expiresAtIso,
    });

    return {
      mode: "started",
      recordId: mapKey,
      key: params.key,
      requestHash: params.requestHash,
      scope: params.scope,
      actorId: params.actorId,
      expiresAt: expiresAtIso,
    };
  }

  if (current.requestHash !== params.requestHash) {
    throw new DomainConflictError("Idempotency key déjà utilisé avec un payload différent.");
  }

  if (current.status !== "pending" && current.responseStatus != null && current.responseBody != null) {
    return {
      mode: "replay",
      status: current.responseStatus,
      body: current.responseBody,
    };
  }

  return { mode: "in_progress" };
}

async function claimInDatabase(params: {
  key: string;
  scope: string;
  actorId: string;
  requestHash: string;
  ttlSeconds: number;
}): Promise<IdempotencyClaim> {
  const supabase = createServiceSupabaseClient();
  const now = new Date();
  const nowMs = now.getTime();
  const expiresAt = new Date(now.getTime() + params.ttlSeconds * 1000).toISOString();
  const nowIso = now.toISOString();
  const recordId = randomUUID();

  const { data: inserted, error: insertError } = await supabase
    .from("os_idempotency_keys")
    .insert({
      id: recordId,
      scope: params.scope,
      actor_id: params.actorId,
      idempotency_key: params.key,
      request_hash: params.requestHash,
      status: "pending",
      created_at: nowIso,
      updated_at: nowIso,
      expires_at: expiresAt,
    })
    .select("id,request_hash,status,response_status,response_body,expires_at,updated_at")
    .single();

  if (!insertError && inserted) {
    const row = inserted as IdempotencyDbRow;
    return {
      mode: "started",
      recordId: row.id,
      key: params.key,
      requestHash: params.requestHash,
      scope: params.scope,
      actorId: params.actorId,
      expiresAt: row.expires_at,
    };
  }

  if (insertError && isMissingTableError(insertError)) {
    return claimInMemory(params);
  }

  if (insertError && !isUniqueViolation(insertError)) {
    throw insertError;
  }

  const { data: existing, error: existingError } = await supabase
    .from("os_idempotency_keys")
    .select("id,request_hash,status,response_status,response_body,expires_at,updated_at")
    .eq("scope", params.scope)
    .eq("actor_id", params.actorId)
    .eq("idempotency_key", params.key)
    .maybeSingle();

  if (existingError && isMissingTableError(existingError)) {
    return claimInMemory(params);
  }
  if (existingError) {
    throw existingError;
  }
  if (!existing) {
    return { mode: "in_progress" };
  }

  const row = existing as IdempotencyDbRow;
  const rowExpiresAtMs = new Date(row.expires_at).getTime();
  if (!Number.isNaN(rowExpiresAtMs) && rowExpiresAtMs <= nowMs) {
    const { data: reclaimed, error: reclaimError } = await supabase
      .from("os_idempotency_keys")
      .update({
        request_hash: params.requestHash,
        status: "pending",
        response_status: null,
        response_body: null,
        updated_at: nowIso,
        expires_at: expiresAt,
      })
      .eq("id", row.id)
      .lte("expires_at", nowIso)
      .select("id,request_hash,status,response_status,response_body,expires_at,updated_at")
      .maybeSingle();

    if (reclaimError && isMissingTableError(reclaimError)) {
      return claimInMemory(params);
    }
    if (reclaimError) {
      throw reclaimError;
    }
    if (reclaimed) {
      const reclaimedRow = reclaimed as IdempotencyDbRow;
      return {
        mode: "started",
        recordId: reclaimedRow.id,
        key: params.key,
        requestHash: params.requestHash,
        scope: params.scope,
        actorId: params.actorId,
        expiresAt: reclaimedRow.expires_at,
      };
    }
  }

  if (row.request_hash !== params.requestHash) {
    throw new DomainConflictError("Idempotency key déjà utilisé avec un payload différent.");
  }

  if (row.status !== "pending" && row.response_status != null && row.response_body != null) {
    return {
      mode: "replay",
      status: row.response_status,
      body: row.response_body,
    };
  }

  return { mode: "in_progress" };
}

async function completeClaim(claim: IdempotencyClaim, result: { status: number; body: Record<string, unknown> }, failed: boolean): Promise<void> {
  if (claim.mode !== "started") return;

  const store = getOsMemoryStore();
  if (store.idempotency.has(claim.recordId)) {
    const previous = store.idempotency.get(claim.recordId);
    if (previous) {
      store.idempotency.set(claim.recordId, {
        ...previous,
        status: failed ? "failed" : "completed",
        responseStatus: result.status,
        responseBody: result.body,
        updatedAt: new Date().toISOString(),
      });
    }
    return;
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase
      .from("os_idempotency_keys")
      .update({
        status: failed ? "failed" : "completed",
        response_status: result.status,
        response_body: result.body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", claim.recordId);
    if (error && !isMissingTableError(error)) {
      throw error;
    }
  } catch (error) {
    console.warn("[IDEMPOTENCY] unable to complete key:", error);
  }
}

export async function executeIdempotentJsonMutation(params: {
  req: Request;
  scope: string;
  actorId: string;
  payload: unknown;
  ttlSeconds?: number;
  execute: () => Promise<ApiResult>;
  onError: (error: unknown) => { status: number; body: Record<string, unknown> };
}): Promise<NextResponse> {
  const key = getIdempotencyKey(params.req.headers);
  const requestHash = hashPayload({
    scope: params.scope,
    payload: params.payload,
  });

  const claim = key
    ? await claimInDatabase({
        key,
        scope: params.scope,
        actorId: params.actorId,
        requestHash,
        ttlSeconds: params.ttlSeconds ?? 60 * 60 * 12,
      })
    : ({ mode: "disabled" } satisfies IdempotencyClaim);

  if (claim.mode === "replay") {
    return NextResponse.json(claim.body, {
      status: claim.status,
      headers: { "x-idempotency-replayed": "1" },
    });
  }

  if (claim.mode === "in_progress") {
    return NextResponse.json(
      {
        error: "Une requête identique est déjà en cours.",
      },
      {
        status: 409,
      }
    );
  }

  try {
    const result = await params.execute();
    const normalized = { status: result.status ?? 200, body: result.body };
    await completeClaim(claim, normalized, false);
    return NextResponse.json(normalized.body, { status: normalized.status });
  } catch (error) {
    const mapped = params.onError(error);
    await completeClaim(claim, mapped, true);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
