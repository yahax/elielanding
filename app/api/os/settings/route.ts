import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { ShopSettingsPayload } from "@/lib/os/types";
import { resolveActorFromRequest } from "@/lib/os/server/actor";
import { logAuditEntry } from "@/lib/os/audit/logger";
import { dispatchDomainEvent } from "@/lib/os/realtime/event-dispatcher";
import { executeIdempotentJsonMutation } from "@/lib/os/server/idempotency";
import { mapApiError } from "@/lib/os/orders/server/http";

const defaultSettings: ShopSettingsPayload = {
  shop_name: "ELIE PERFUMES",
  support_email: "contact@elie.ma",
  whatsapp: "+212 600 000 000",
  auto_validate: false,
  low_stock_alert: true,
  currency: "MAD",
  timezone: "Africa/Casablanca",
};

const settingsSchema = z.object({
  shop_name: z.string().min(1),
  support_email: z.string().email(),
  whatsapp: z.string().min(3),
  auto_validate: z.boolean(),
  low_stock_alert: z.boolean(),
  currency: z.string().min(1),
  timezone: z.string().min(1),
});

function isMissingTableError(error: { code?: string }) {
  return error.code === "PGRST205" || error.code === "42P01";
}

function sameSettings(current: Partial<ShopSettingsPayload> | null, next: ShopSettingsPayload): boolean {
  if (!current) return false;
  return (
    current.shop_name === next.shop_name &&
    current.support_email === next.support_email &&
    current.whatsapp === next.whatsapp &&
    current.auto_validate === next.auto_validate &&
    current.low_stock_alert === next.low_stock_alert &&
    current.currency === next.currency &&
    current.timezone === next.timezone
  );
}

export async function GET() {
  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("shop_settings")
      .select("*")
      .eq("id", "global")
      .single(); // Changed from maybeSingle() to single()

    if (error) {
      // If table missing or row missing, return default
      if (error.code === 'PGRST116' || error.code === 'PGRST204' || error.code === '42P01') {
        console.warn("[SETTINGS] shop_settings table missing or row not found, using defaults");
        return NextResponse.json({
          settings: defaultSettings, // Using defaultSettings
          configured: false,
          message: 'Table shop_settings introuvable ou non configurée'
        }, { status: 200 });
      }
      throw error; // Re-throw other errors
    }

    return NextResponse.json(
      {
        settings: data || defaultSettings, // If data is null (shouldn't happen with single() unless error), use defaults
        configured: !!data,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('[Settings/API] GET error:', error);
    return NextResponse.json(
      {
        settings: defaultSettings,
        configured: false,
        message: "Fallback settings returned after API error.",
      },
      { status: 200 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const actor = await resolveActorFromRequest(req);
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const payload = parsed.data;
    return executeIdempotentJsonMutation({
      req,
      scope: "settings.update",
      actorId: actor.actorId,
      payload,
      execute: async () => {
        const { data: currentSettings, error: currentError } = await supabase
          .from("shop_settings")
          .select("shop_name,support_email,whatsapp,auto_validate,low_stock_alert,currency,timezone")
          .eq("id", "global")
          .maybeSingle();

        if (currentError && !isMissingTableError(currentError)) {
          throw currentError;
        }

        if (sameSettings((currentSettings as Partial<ShopSettingsPayload> | null) ?? null, payload)) {
          return {
            body: { success: true, unchanged: true },
          };
        }

        const { error } = await supabase.from("shop_settings").upsert(
          [
            {
              id: "global",
              ...payload,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "id" }
        );

        if (error) {
          if (isMissingTableError(error)) {
            return {
              status: 501,
              body: {
                error: "Settings table is not configured yet.",
                hint: "Run supabase/settings_schema.sql in Supabase SQL editor.",
              },
            };
          }
          return {
            status: 400,
            body: { error: error.message, details: error },
          };
        }

        await logAuditEntry({
          actorId: actor.actorId,
          actorName: actor.actorName,
          actionType: "settings.updated",
          entityType: "settings",
          entityId: "global",
          label: "Paramètres boutique mis à jour",
          details: `Paramètres globaux actualisés (${Object.keys(payload).join(", ")}).`,
          metadata: {
            changedFields: Object.keys(payload),
          },
        });

        await dispatchDomainEvent({
          type: "settings.updated",
          entityType: "settings",
          entityId: "global",
          actorId: actor.actorId,
          actorName: actor.actorName,
          label: "Settings mis à jour",
          payload: {
            changedFields: Object.keys(payload),
          },
        });

        return {
          body: { success: true },
        };
      },
      onError: (error) => mapApiError(error, "Unable to save settings"),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to save settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
