import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const orderPayloadSchema = z.object({
    offerType: z.string().min(1),
    items: z.array(
        z.object({
            name: z.string().min(1),
        })
    ).min(1),
    pricing: z.object({
        total: z.coerce.number().finite(),
    }),
    customer: z.object({
        fullName: z.string().min(1),
        phone: z.string().min(1),
        city: z.string().min(1),
        address: z.string().optional(),
    }),
    meta: z.record(z.any()).optional(),
});



export async function POST(req: Request) {
    try {
        const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
        const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
        const offerMode = process.env.NEXT_PUBLIC_OFFER_MODE || "ramadan";

        console.log("[API/ORDERS][DEBUG] env", {
            hasServiceRoleKey,
            hasSupabaseUrl,
            offerMode,
            endpoint: "/api/orders",
        });

        const json = await req.json();
        console.log("[API/ORDERS][DEBUG] incoming payload", json);

        const parsed = orderPayloadSchema.safeParse(json);
        if (!parsed.success) {
            console.error("[API/ORDERS][DEBUG] invalid payload", parsed.error.flatten());
            return NextResponse.json({
                success: false,
                error: "Invalid request payload",
                details: parsed.error.flatten(),
            }, { status: 400 });
        }

        const payload = parsed.data;
        const supabase = createServiceSupabaseClient();

        // Map ElieOSOrderPayload to create_order_secure parameters
        // ElieOSOrderPayload items are { slot, name, free }
        // We need exactly 6 perfume names for the RPC as TEXT[]
        const perfumes = payload.items.map((item) => item.name.trim()).filter(Boolean).slice(0, 6);
        const perfumesAreStrings = perfumes.every((item) => typeof item === "string");

        if (!perfumesAreStrings || perfumes.length !== 6) {
            console.error("[API/ORDERS][DEBUG] invalid p_perfumes", {
                perfumes,
                perfumesLength: perfumes.length,
                perfumesTypes: perfumes.map((p) => typeof p),
            });
            return NextResponse.json({
                success: false,
                error: "p_perfumes must be a TEXT[] with exactly 6 entries",
                debug: {
                    perfumes,
                    perfumesLength: perfumes.length,
                    perfumesTypes: perfumes.map((p) => typeof p),
                },
            }, { status: 400 });
        }

        const rpcPayload = {
            p_customer_name: payload.customer.fullName,
            p_phone: payload.customer.phone,
            p_city: payload.customer.city,
            p_address: payload.customer.address?.trim() || payload.customer.city,
            p_pack_type: payload.offerType,
            p_total_price: payload.pricing.total,
            p_source: "landing_page", // Force landing_page for ELIE OS visibility
            p_perfumes: perfumes,
            p_offer_mode: offerMode,
            p_meta: payload.meta || {}
        };
        console.log("[API/ORDERS][DEBUG] rpc payload create_order_secure", rpcPayload);

        const { data: orderId, error } = await supabase.rpc("create_order_secure", rpcPayload);
        console.log("[API/ORDERS][DEBUG] rpc result create_order_secure", { orderId, error });

        if (error) {
            console.error("[API/ORDERS][DEBUG] backend error", error);
            return NextResponse.json({
                success: false,
                error: error.message || "Database error",
                details: error,
                hint: error.hint,
                action: "Please ensure create_order_secure RPC is properly defined in Supabase",
                backendError: error,
            }, { status: 400 });
        }

        console.log("[API/ORDERS][DEBUG] success", { orderId });
        return NextResponse.json({
            success: true,
            orderId: orderId,
            message: "Order created successfully"
        }, { status: 201 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal server error";
        const stack = error instanceof Error ? error.stack : undefined;
        console.error("[API/ORDERS][DEBUG] fatal error", error);
        return NextResponse.json({
            success: false,
            error: message,
            stack,
            backendError: message,
        }, { status: 500 });
    }
}
