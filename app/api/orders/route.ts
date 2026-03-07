import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

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
        address: z.string().min(1),
    }),
    meta: z.record(z.any()).optional(),
});

export async function POST(req: Request) {
    console.log("[API/ORDERS] Received order request");

    try {
        const json = await req.json();
        const parsed = orderPayloadSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json({
                success: false,
                error: "Invalid request payload",
                details: parsed.error.flatten(),
            }, { status: 400 });
        }

        const payload = parsed.data;
        console.log("[API/ORDERS] Payload:", JSON.stringify(payload, null, 2));

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            console.error("[API/ORDERS] Supabase configuration missing");
            return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // Map ElieOSOrderPayload to create_order_secure parameters
        // ElieOSOrderPayload items are { slot, name, free }
        // We need exactly 6 perfume names for the RPC
        const perfumes = payload.items.map((item) => item.name.trim()).filter(Boolean).slice(0, 6);

        // Ensure we have exactly 6 perfumes (pad if necessary, though UI restricts this)
        while (perfumes.length < 6) {
            perfumes.push("Unknown");
        }

        const rpcPayload = {
            p_customer_name: payload.customer.fullName,
            p_phone: payload.customer.phone,
            p_city: payload.customer.city,
            p_address: payload.customer.address,
            p_pack_type: payload.offerType,
            p_total_price: payload.pricing.total,
            p_source: "landing_page", // Force landing_page for ELIE OS visibility
            p_perfumes: perfumes,
            p_offer_mode: "ramadan",
            p_meta: payload.meta || {}
        };

        console.log("[API/ORDERS] Supabase Config:", { url: supabaseUrl, endpoint: "/rpc/create_order_secure" });
        console.log("[API/ORDERS] Calling RPC create_order_secure with payload:", JSON.stringify(rpcPayload, null, 2));

        const { data: orderId, error } = await supabase.rpc("create_order_secure", rpcPayload);

        console.log("[API/ORDERS] RPC Response:", { data: orderId, error });

        if (error) {
            console.error("[API/ORDERS] Supabase RPC Error Full Object:", JSON.stringify(error, null, 2));
            return NextResponse.json({
                success: false,
                error: error.message || "Database error",
                details: error,
                hint: error.hint
            }, { status: 400 });
        }

        console.log("[API/ORDERS] Order created successfully ID:", orderId);

        return NextResponse.json({
            success: true,
            orderId: orderId,
            message: "Order created successfully"
        }, { status: 201 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal server error";
        const stack = error instanceof Error ? error.stack : undefined;
        console.error("[API/ORDERS] Fatal exception:", error);
        return NextResponse.json({
            success: false,
            error: message,
            stack
        }, { status: 500 });
    }
}
