import { z } from "zod";
import { resolveActorFromRequest } from "@/lib/os/server/actor";
import { getUserPreferences, markNotificationsRead } from "@/lib/os/preferences/repository";
import { executeIdempotentJsonMutation } from "@/lib/os/server/idempotency";
import { mapApiError, toApiErrorResponse } from "@/lib/os/orders/server/http";
import { logAuditEntry } from "@/lib/os/audit/logger";
import { dispatchDomainEvent } from "@/lib/os/realtime/event-dispatcher";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  notificationId: z.string().min(1).optional(),
  notificationIds: z.array(z.string().min(1)).optional(),
});

function isMissingTableError(error: unknown): boolean {
  if (typeof error !== "object" || error == null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return code === "42P01" || code === "PGRST205" || code === "PGRST204";
}

export async function POST(req: Request) {
  try {
    const actor = await resolveActorFromRequest(req);
    const payload = bodySchema.parse(await req.json());

    const ids = [
      ...(payload.notificationId ? [payload.notificationId] : []),
      ...(payload.notificationIds ?? []),
    ];

    return executeIdempotentJsonMutation({
      req,
      scope: "notifications.read",
      actorId: actor.actorId,
      payload: {
        ids,
      },
      execute: async () => {
        const beforePreferences = await getUserPreferences(actor.actorId);
        const beforeReadSet = new Set(
          Array.isArray(beforePreferences.metadata.notificationReadIds)
            ? (beforePreferences.metadata.notificationReadIds as string[])
            : []
        );
        const preferences = await markNotificationsRead(actor.actorId, ids);
        const readIds = (preferences.metadata.notificationReadIds as string[] | undefined) ?? [];
        const newlyReadIds = ids.filter((id) => !beforeReadSet.has(id));
        let dbUpdatedCount = 0;

        if (ids.length > 0) {
          try {
            const supabase = createServiceSupabaseClient();
            const { data, error } = await supabase
              .from("os_notifications")
              .update({
                is_read: true,
                read_at: new Date().toISOString(),
                read_by: actor.actorId,
                updated_at: new Date().toISOString(),
              })
              .in("id", ids)
              .eq("is_read", false)
              .select("id");

            if (error && !isMissingTableError(error)) {
              throw error;
            }
            dbUpdatedCount = (data ?? []).length;
          } catch (syncError) {
            console.warn("[NOTIFICATIONS] DB mark-as-read fallback preferences only:", syncError);
          }
        }

        const changed = newlyReadIds.length > 0 || dbUpdatedCount > 0;
        if (!changed) {
          return {
            body: {
              success: true,
              unchanged: true,
              readCount: readIds.length,
              lastReadIds: ids,
            },
          };
        }

        if (ids.length > 0) {
          await logAuditEntry({
            actorId: actor.actorId,
            actorName: actor.actorName,
            actionType: "notification.read",
            entityType: "notification",
            entityId: ids[0] ?? "notification:bulk",
            label: "Notifications marquées comme lues",
            details: `${newlyReadIds.length || dbUpdatedCount} notification(s) marquées comme lues.`,
            metadata: {
              notificationIds: ids,
              newlyReadIds,
              dbUpdatedCount,
            },
          });

          await dispatchDomainEvent({
            type: "audit.logged",
            entityType: "audit",
            entityId: `notification-read:${Date.now()}`,
            actorId: actor.actorId,
            actorName: actor.actorName,
            label: `${newlyReadIds.length || dbUpdatedCount} notification(s) marquées comme lues`,
            payload: {
              notificationIds: ids,
              newlyReadIds,
              dbUpdatedCount,
            },
          });
        }

        return {
          body: {
            success: true,
            readCount: readIds.length,
            lastReadIds: ids,
          },
        };
      },
      onError: (error) => mapApiError(error, "Unable to mark notification as read"),
    });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to mark notification as read");
  }
}
