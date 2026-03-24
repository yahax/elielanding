import { randomUUID } from "crypto";
import type { AuditLogEntry } from "@/lib/os/domain/types";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getOsMemoryStore, pushMemoryAuditLog } from "@/lib/os/server/memory-store";

export interface CreateAuditLogInput {
  actorId: string;
  actorName: string;
  actionType: string;
  entityType: string;
  entityId: string;
  label: string;
  details: string;
  metadata?: Record<string, unknown>;
}

function isMissingTableError(error: unknown): boolean {
  if (typeof error !== "object" || error == null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return code === "42P01" || code === "PGRST205" || code === "PGRST204";
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toEventUuid(entityId: string): string {
  return isUuidLike(entityId) ? entityId : "00000000-0000-0000-0000-000000000000";
}

function mapDbRowToAuditLog(row: {
  id?: string;
  actor_id?: string;
  actor_name?: string;
  action_type?: string;
  entity_type?: string;
  entity_id?: string;
  label?: string;
  details?: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
}): AuditLogEntry {
  return {
    id: row.id ?? randomUUID(),
    actorId: row.actor_id ?? "operator:default",
    actorName: row.actor_name ?? "Operator ELIE",
    actionType: row.action_type ?? "unknown",
    entityType: row.entity_type ?? "system",
    entityId: row.entity_id ?? "unknown",
    label: row.label ?? "Action",
    details: row.details ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
    metadata: row.metadata ?? {},
  };
}

export async function logAuditEntry(input: CreateAuditLogInput): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: randomUUID(),
    actorId: input.actorId,
    actorName: input.actorName,
    actionType: input.actionType,
    entityType: input.entityType,
    entityId: input.entityId,
    label: input.label,
    details: input.details,
    createdAt: new Date().toISOString(),
    metadata: input.metadata ?? {},
  };

  pushMemoryAuditLog(entry);

  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("os_audit_logs")
      .insert({
        id: entry.id,
        actor_id: entry.actorId,
        actor_name: entry.actorName,
        action_type: entry.actionType,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        label: entry.label,
        details: entry.details,
        metadata: entry.metadata,
        created_at: entry.createdAt,
      })
      .select("id,actor_id,actor_name,action_type,entity_type,entity_id,label,details,metadata,created_at")
      .single();

    if (!error && data) {
      return mapDbRowToAuditLog(data);
    }

    if (error && !isMissingTableError(error)) {
      console.warn("[AUDIT] Failed to insert in os_audit_logs:", error);
    }
  } catch (error) {
    console.warn("[AUDIT] Falling back to memory store:", error);
  }

  return entry;
}

export async function listAuditEntries(params?: {
  entityType?: string;
  entityId?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  const limit = params?.limit && params.limit > 0 ? Math.min(params.limit, 500) : 100;

  try {
    const supabase = createServiceSupabaseClient();
    let query = supabase
      .from("os_audit_logs")
      .select("id,actor_id,actor_name,action_type,entity_type,entity_id,label,details,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (params?.entityType) query = query.eq("entity_type", params.entityType);
    if (params?.entityId) query = query.eq("entity_id", params.entityId);

    const { data, error } = await query;
    if (!error && data) {
      return data.map((row) => mapDbRowToAuditLog(row));
    }

    if (error && !isMissingTableError(error)) {
      console.warn("[AUDIT] list os_audit_logs failed:", error);
    }
  } catch (error) {
    console.warn("[AUDIT] list fallback memory due to error:", error);
  }

  const memoryLogs = getOsMemoryStore().auditLogs;
  return memoryLogs
    .filter((entry) => {
      if (params?.entityType && entry.entityType !== params.entityType) return false;
      if (params?.entityId && entry.entityId !== params.entityId) return false;
      return true;
    })
    .slice(0, limit);
}
