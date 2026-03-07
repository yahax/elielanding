import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { fetchCatalogProducts } from "@/lib/os/server";

const catalogPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  category: z.string().min(1),
  tier: z.string().min(1).default("classic"),
  is_active: z.boolean().default(true),
  stock: z.coerce.number().int().min(0).default(0),
  low_stock_threshold: z.coerce.number().int().min(0).default(5),
});

export async function GET() {
  try {
    const products = await fetchCatalogProducts();
    return NextResponse.json({ products }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to load catalog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = catalogPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const supabase = createServiceSupabaseClient();

    // Map to 'products' table as per schema.sql
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert([
        {
          name: payload.name,
          category: payload.category, // Matches schema.sql
          tier: payload.tier,
          is_active: payload.is_active,
          slug: payload.name.toLowerCase().replace(/\s+/g, '-'), // Schema requires slug
        },
      ])
      .select("id")
      .single();

    if (productError) {
      console.error("[CATALOG/POST] Product creation error:", productError);
      return NextResponse.json({ error: productError.message, details: productError }, { status: 400 });
    }

    // Update stock/inventory
    const { error: invError } = await supabase.from("products").update({
      stock: payload.stock,
      low_stock_threshold: payload.low_stock_threshold,
      updated_at: new Date().toISOString(),
    }).eq("id", product.id);

    if (invError) {
      console.error("[CATALOG/POST] Inventory update error:", invError);
      return NextResponse.json({ error: invError.message, details: invError }, { status: 400 });
    }

    const products = await fetchCatalogProducts();
    const created = products.find((item) => item.id === product.id);
    return NextResponse.json({ product: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const parsed = catalogPayloadSchema.safeParse(body);
    if (!parsed.success || !parsed.data.id) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.success ? { id: "id is required" } : parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const supabase = createServiceSupabaseClient();

    const { error: productError } = await supabase
      .from("products")
      .update({
        name: payload.name,
        category: payload.category,
        tier: payload.tier,
        is_active: payload.is_active,
        stock: payload.stock,
        low_stock_threshold: payload.low_stock_threshold,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id);

    if (productError) {
      console.error("[CATALOG/PATCH] Product update error:", productError);
      return NextResponse.json({ error: productError.message, details: productError }, { status: 400 });
    }

    const products = await fetchCatalogProducts();
    const updated = products.find((item) => item.id === payload.id);
    return NextResponse.json({ product: updated }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to update product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
