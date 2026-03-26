import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const querySchema = z.object({
  q: z.string().min(2),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const q = parsed.data.q.trim();
    const supabase = createServiceSupabaseClient();

    const [{ data: orders, error: ordersError }, { data: perfumes, error: perfumesError }] =
      await Promise.all([
        supabase
          .from("orders")
          .select("id,customer_name,phone,city,status,created_at")
          .or(`customer_name.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%`)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("perfumes")
          .select("id,name,gender,tier")
          .ilike("name", `%${q}%`)
          .limit(8),
      ]);

    if (ordersError) {
      console.warn("[API/OS] search orders fallback empty:", ordersError);
      return NextResponse.json({ results: [] }, { status: 200 });
    }
    if (perfumesError) {
      console.warn("[API/OS] search perfumes fallback empty:", perfumesError);
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const results = [
      ...(orders || []).map((order) => ({
        type: "order",
        id: order.id,
        title: order.customer_name || "Client inconnu",
        subtitle: `${order.city || "Ville inconnue"} • ${order.phone || "Sans téléphone"}`,
        href: "/os-admin/orders",
        rank: 1,
      })),
      ...(perfumes || []).map((perfume) => ({
        type: "product",
        id: perfume.id,
        title: perfume.name,
        subtitle: `${perfume.gender || "mixte"} • ${perfume.tier || "classic"}`,
        href: "/os-admin/products",
        rank: 2,
      })),
    ]
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 12);

    return NextResponse.json({ results }, { status: 200 });
  } catch (error: unknown) {
    console.warn("[API/OS] search fallback empty:", error);
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
