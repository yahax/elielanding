import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveActorFromRequest } from "@/lib/os/server/actor";
import { getUserPreferences, saveUserPreferences } from "@/lib/os/preferences/repository";
import { executeIdempotentJsonMutation } from "@/lib/os/server/idempotency";
import { mapApiError, toApiErrorResponse } from "@/lib/os/orders/server/http";
import { logAuditEntry } from "@/lib/os/audit/logger";
import { dispatchDomainEvent } from "@/lib/os/realtime/event-dispatcher";
import type { UserPreferences } from "@/lib/os/domain/types";

const savedViewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  target: z.enum(["orders", "clients", "pipeline", "tracking"]),
  filters: z.record(
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(z.union([z.string(), z.number(), z.boolean()])),
    ])
  ),
  createdAt: z.string().min(1),
});

const patchSchema = z
  .object({
    warRoomMode: z.enum(["auto", "on", "off"]).optional(),
    notifications: z
      .object({
        toastsEnabled: z.boolean().optional(),
        soundsEnabled: z.boolean().optional(),
        refreshIntervalSec: z.number().int().min(5).max(300).optional(),
        slaWarningMinutes: z.number().int().min(10).max(480).optional(),
        categoriesEnabled: z
          .object({
            orders: z.boolean().optional(),
            stock: z.boolean().optional(),
            business: z.boolean().optional(),
            operators: z.boolean().optional(),
            system: z.boolean().optional(),
          })
          .optional(),
      })
      .optional(),
    dashboard: z
      .object({
        defaultPeriodDays: z.union([z.literal(7), z.literal(30)]).optional(),
        widgets: z.array(z.string().min(1)).optional(),
        savedViews: z.array(savedViewSchema).optional(),
      })
      .optional(),
    mobile: z
      .object({
        density: z.enum(["comfortable", "compact"]).optional(),
      })
      .optional(),
    operations: z
      .object({
        highValueThreshold: z.number().int().positive().optional(),
        slaTargetMinutes: z.number().int().positive().optional(),
      })
      .optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one preference field is required.",
  });

function toComparablePreferences(preferences: UserPreferences): Omit<UserPreferences, "updatedAt"> {
  const { updatedAt, ...rest } = preferences;
  void updatedAt;
  return rest;
}

async function resolveUserId(req: Request): Promise<string> {
  const actor = await resolveActorFromRequest(req);
  const url = new URL(req.url);
  const explicit = url.searchParams.get("userId");
  const allowOverride = process.env.ELIE_OS_ALLOW_PREFERENCES_USER_OVERRIDE === "1";
  if (allowOverride && explicit?.trim()) {
    return explicit.trim();
  }
  return actor.actorId;
}

export async function GET(req: Request) {
  try {
    const userId = await resolveUserId(req);
    const preferences = await getUserPreferences(userId);
    return NextResponse.json({ preferences }, { status: 200 });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to load preferences");
  }
}

export async function PUT(req: Request) {
  try {
    const actor = await resolveActorFromRequest(req);
    const userId = await resolveUserId(req);
    const payload = patchSchema.parse(await req.json());
    return executeIdempotentJsonMutation({
      req,
      scope: "preferences.update",
      actorId: actor.actorId,
      payload: { userId, patch: payload },
      execute: async () => {
        const before = await getUserPreferences(userId);
        const preferences = await saveUserPreferences(userId, payload);
        const changedFields = Object.keys(payload);
        const changed =
          JSON.stringify(toComparablePreferences(before)) !== JSON.stringify(toComparablePreferences(preferences));

        if (!changed) {
          return {
            body: { success: true, unchanged: true, preferences },
          };
        }

        await logAuditEntry({
          actorId: actor.actorId,
          actorName: actor.actorName,
          actionType: "preferences.saved",
          entityType: "preferences",
          entityId: userId,
          label: "Préférences opérateur mises à jour",
          details: `Champs modifiés: ${changedFields.join(", ") || "none"}.`,
          metadata: {
            changedFields,
          },
        });

        await dispatchDomainEvent({
          type: "settings.updated",
          entityType: "settings",
          entityId: userId,
          actorId: actor.actorId,
          actorName: actor.actorName,
          label: "Préférences opérateur mises à jour",
          payload: {
            changedFields,
            userId,
          },
        });

        return {
          body: { success: true, preferences },
        };
      },
      onError: (error) => mapApiError(error, "Unable to save preferences"),
    });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to save preferences");
  }
}
