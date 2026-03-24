import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { PERFUMES } from "@/data/perfumes";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServiceSupabaseClient();
    
    // Process perfumes in batches or all at once (66 items is small enough)
    const perfumesToInsert = PERFUMES.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
      tier: p.tier,
      gender: p.gender,
      image_url: p.image,
      tags: p.tags,
      is_active: true,
    }));

    const { error: perfumesError } = await supabase
      .from("perfumes")
      .upsert(perfumesToInsert, { onConflict: "id" });

    if (perfumesError) {
      console.error("[SEED] Error inserting perfumes:", perfumesError);
      return NextResponse.json({ error: perfumesError.message }, { status: 500 });
    }

    // Now initialize inventory for those that don't have it
    const inventoryToInsert = PERFUMES.map((p) => ({
      perfume_id: p.id,
      stock: 0,
      low_stock_threshold: 5,
    }));

    const { error: inventoryError } = await supabase
      .from("inventory")
      .upsert(inventoryToInsert, { onConflict: "perfume_id", ignoreDuplicates: true });

    if (inventoryError) {
      console.error("[SEED] Error inserting inventory:", inventoryError);
      // We don't error out completely if inventory exists but we warn
    }

    return NextResponse.json({
      message: "Seed completed successfully",
      count: PERFUMES.length,
    });
  } catch (error) {
    console.error("[SEED] Unhandled error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
