import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { ShopSettingsPayload } from "@/lib/os/types";

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
    const message = error instanceof Error ? error.message : "Unable to load settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
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
        return NextResponse.json(
          {
            error: "Settings table is not configured yet.",
            hint: "Run supabase/settings_schema.sql in Supabase SQL editor.",
          },
          { status: 501 }
        );
      }
      return NextResponse.json({ error: error.message, details: error }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to save settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
