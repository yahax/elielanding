const randomUUID = (): string => globalThis.crypto.randomUUID();
import type { DomainEvent, DomainEventType } from "@/lib/os/domain/types";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getOsMemoryStore, pushMemoryDomainEvent } from "@/lib/os/server/memory-store";

export interface DispatchDomainEventInput {
  type: DomainEventType;
  entityType: DomainEvent["entityType"];
  entityId: string;
  actorId?: string | null;
  actorName?: string | null;
  label: string;
  payload?: Record<string, unknown>;
}

const EVENT_SELECT_SAFE = "id,event_type,entity_type,entity_id,label,payload,created_at";
const eventWarnCooldownMs = 60_000;
const lastEventWarnByKey = new Map<string, number>();

function isSchemaCompatibilityError(error: unknown): boolean {
  if (typeof error !== "object" || error == null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  if (code === "42P01" || code === "PGRST205" || code === "PGRST204" || code === "42703") return true;
  const message = "message" in error ? String((error as { message?: string }).message ?? "") : "";
  return message.includes("does not exist");
}

function warnEventThrottled(key: string, message: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message, error);
    return;
  }
  const now = Date.now();
  const lastAt = lastEventWarnByKey.get(key) ?? 0;
  if (now - lastAt < eventWarnCooldownMs) return;
  lastEventWarnByKey.set(key, now);
  console.warn(message, error);
}

function mapDbRowToDomainEvent(row: {
  id?: string;
  event_type?: string;
  entity_type?: string;
  entity_id?: string;
  actor_id?: string | null;
  actor_name?: string | null;
  label?: string;
  payload?: Record<string, unknown>;
  created_at?: string;
}): DomainEvent {
  return {
    id: row.id ?? randomUUID(),
    type: (row.event_type ?? "audit.logged") as DomainEventType,
    entityType: (row.entity_type ?? "system") as DomainEvent["entityType"],
    entityId: row.entity_id ?? "unknown",
    actorId: row.actor_id ?? null,
    actorName: row.actor_name ?? null,
    label: row.label ?? "Event",
    payload: row.payload ?? {},
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export async function dispatchDomainEvent(input: DispatchDomainEventInput): Promise<DomainEvent> {
  const event: DomainEvent = {
    id: randomUUID(),
    type: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    actorId: input.actorId ?? null,
    actorName: input.actorName ?? null,
    label: input.label,
    payload: input.payload ?? {},
    createdAt: new Date().toISOString(),
  };

  pushMemoryDomainEvent(event);

  try {
    const supabase = createServiceSupabaseClient();

    let { data, error } = await supabase
      .from("os_domain_events")
      .insert({
        id: event.id,
        event_type: event.type,
        entity_type: event.entityType,
        entity_id: event.entityId,
        actor_id: event.actorId,
        actor_name: event.actorName,
        label: event.label,
        payload: event.payload,
        created_at: event.createdAt,
      })
      .select(EVENT_SELECT_SAFE)
      .single();

    if (error && isSchemaCompatibilityError(error)) {
      const fallbackInsert = await supabase
        .from("os_domain_events")
        .insert({
          id: event.id,
          event_type: event.type,
          entity_type: event.entityType,
          entity_id: event.entityId,
          label: event.label,
          payload: event.payload,
          created_at: event.createdAt,
        })
        .select(EVENT_SELECT_SAFE)
        .single();
      data = fallbackInsert.data;
      error = fallbackInsert.error;
    }

    if (!error && data) {
      return mapDbRowToDomainEvent(data);
    }

    if (error && !isSchemaCompatibilityError(error)) {
      warnEventThrottled("events:insert", "[EVENT] os_domain_events insert failed:", error);
    }
  } catch (error) {
    warnEventThrottled("events:insert:catch", "[EVENT] Falling back to memory store:", error);
  }

  return event;
}

export async function listDomainEvents(params?: {
  since?: string;
  limit?: number;
}): Promise<DomainEvent[]> {
  const limit = params?.limit && params.limit > 0 ? Math.min(params.limit, 500) : 100;

  try {
    const supabase = createServiceSupabaseClient();

    let query = supabase
      .from("os_domain_events")
      .select(EVENT_SELECT_SAFE)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (params?.since) query = query.gte("created_at", params.since);

    const { data, error } = await query;
    if (!error && data) {
      return data.map((row) => mapDbRowToDomainEvent(row));
    }

    if (error && !isSchemaCompatibilityError(error)) {
      warnEventThrottled("events:list", "[EVENT] list os_domain_events failed:", error);
    }
  } catch (error) {
    warnEventThrottled("events:list:catch", "[EVENT] list fallback memory due to error:", error);
  }

  const events = getOsMemoryStore().domainEvents;
  return events
    .filter((event) => {
      if (!params?.since) return true;
      return new Date(event.createdAt).getTime() >= new Date(params.since).getTime();
    })
    .slice(0, limit);
}
