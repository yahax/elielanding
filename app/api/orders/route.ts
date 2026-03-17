import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
    MAIN_SLOT_COUNT,
    TOTAL_SLOT_COUNT,
    validateCompleteSlotPayload,
} from "@/lib/checkout-security";
import { PRICE_MAD } from "@/lib/offer-config";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const SAFE_DB_SOURCES = new Set(["landing_page", "direct", "whatsapp", "meta_ads", "organic", "other"]);
const PHONE_REGEX = /^0[67]\d{8}$/;

const orderPayloadSchema = z
    .object({
        source: z.string().trim().min(1),
        locale: z.enum(["ar", "fr"]),
        offerType: z.enum(["homme", "femme", "mixte"]),
        customerIntent: z.string().nullable().optional(),
        slots: z.record(z.unknown()),
        selected_perfumes: z.array(z.string().trim().min(1)).length(MAIN_SLOT_COUNT),
        gift_perfume: z.string().trim().min(1),
        items: z
            .array(
                z
                    .object({
                        slot: z.coerce.number().int().min(1).max(TOTAL_SLOT_COUNT),
                        name: z.string().trim().min(1),
                        free: z.boolean().optional(),
                    })
                    .strict()
            )
            .optional(),
        pricing: z
            .object({
                currency: z.string().trim().min(1),
                total: z.coerce.number().int().positive(),
                delivery: z.coerce.number().int().min(0),
                paymentMethod: z.string().trim().min(1),
            })
            .strict(),
        customer: z
            .object({
                fullName: z.string().trim().min(1),
                phone: z.string().trim().min(1),
                city: z.string().trim().min(1),
                address: z.string().optional(),
            })
            .strict(),
        meta: z.record(z.unknown()).optional(),
    })
    .strict();

function normalizeSourceForInsert(rawSource: string) {
    const normalized = rawSource.trim().toLowerCase();
    return SAFE_DB_SOURCES.has(normalized) ? normalized : "landing_page";
}

function buildFallbackIdempotencyKey(input: {
    customerName: string;
    phone: string;
    city: string;
    packType: string;
    selectedPerfumes: string[];
    giftPerfume: string;
}) {
    const raw = [
        input.customerName,
        input.phone,
        input.city,
        input.packType,
        ...input.selectedPerfumes,
        input.giftPerfume,
    ].join("|");
    return createHash("sha256").update(raw).digest("hex");
}

export async function POST(req: Request) {
    try {
        const offerMode = process.env.NEXT_PUBLIC_OFFER_MODE || "ramadan";
        const requestBody = await req.json();

        const parsed = orderPayloadSchema.safeParse(requestBody);
        if (!parsed.success) {
            console.error("[API/ORDERS][DEBUG] schema rejection", parsed.error.flatten());
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid request payload shape.",
                    details: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const payload = parsed.data;
        const slotValidation = validateCompleteSlotPayload(payload.slots);
        const selectedPerfumes = payload.selected_perfumes.map((perfume) => perfume.trim());
        const giftPerfume = payload.gift_perfume.trim();
        const totalPerfumes = selectedPerfumes.length + (giftPerfume ? 1 : 0);
        const normalizedPhone = payload.customer.phone.trim();

        const validationErrors: string[] = [];

        if (!slotValidation.isValid || !slotValidation.normalizedSlots) {
            validationErrors.push(...slotValidation.errors);
        }

        if (selectedPerfumes.length !== MAIN_SLOT_COUNT) {
            validationErrors.push("selected_perfumes must contain exactly 5 entries.");
        }

        if (!giftPerfume) {
            validationErrors.push("gift_perfume is required.");
        }

        if (totalPerfumes !== TOTAL_SLOT_COUNT) {
            validationErrors.push("Total perfumes must be exactly 6.");
        }

        if (!payload.customer.fullName.trim()) {
            validationErrors.push("customer.fullName is required.");
        }
        if (!normalizedPhone) {
            validationErrors.push("customer.phone is required.");
        }
        if (!payload.customer.city.trim()) {
            validationErrors.push("customer.city is required.");
        }

        if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone)) {
            validationErrors.push("customer.phone must be a valid Moroccan phone number.");
        }

        if (payload.pricing.total !== PRICE_MAD) {
            validationErrors.push(`pricing.total must equal offer price (${PRICE_MAD}).`);
        }

        if (slotValidation.isValid && slotValidation.normalizedSlots) {
            const slotSelected = slotValidation.selectedPerfumes;
            const slotGift = slotValidation.giftPerfume;
            const slotsMatchSelected =
                slotSelected.length === selectedPerfumes.length &&
                slotSelected.every((perfume, index) => perfume === selectedPerfumes[index]);
            if (!slotsMatchSelected) {
                validationErrors.push("slots.slot1..slot5 must match selected_perfumes exactly.");
            }
            if (slotGift !== giftPerfume) {
                validationErrors.push("slots.giftSlot must match gift_perfume.");
            }
            if (slotValidation.totalSelected !== TOTAL_SLOT_COUNT) {
                validationErrors.push("slots payload must contain exactly 6 perfumes.");
            }
        }

        if (validationErrors.length > 0) {
            console.error("[API/ORDERS][DEBUG] semantic rejection", validationErrors);
            return NextResponse.json(
                {
                    success: false,
                    error: "Order rejected: incomplete or malformed ELIE checkout payload.",
                    details: validationErrors,
                },
                { status: 400 }
            );
        }

        const meta = payload.meta || {};
        const requestedIdempotencyKey =
            typeof meta.idempotency_key === "string" ? meta.idempotency_key.trim() : "";
        const idempotencyKey =
            requestedIdempotencyKey ||
            buildFallbackIdempotencyKey({
                customerName: payload.customer.fullName.trim(),
                phone: normalizedPhone,
                city: payload.customer.city.trim(),
                packType: payload.offerType,
                selectedPerfumes,
                giftPerfume,
            });

        const supabase = createServiceSupabaseClient();

        const { data: existingOrder, error: existingOrderError } = await supabase
            .from("orders")
            .select("id")
            .filter("meta->>idempotency_key", "eq", idempotencyKey)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingOrderError) {
            console.warn("[API/ORDERS][DEBUG] idempotency pre-check warning", existingOrderError);
        }

        if (existingOrder?.id) {
            return NextResponse.json(
                {
                    success: true,
                    duplicate: true,
                    orderId: existingOrder.id,
                    message: "Duplicate submit blocked. Existing order returned.",
                },
                { status: 200 }
            );
        }

        const sourceForInsert = normalizeSourceForInsert(payload.source);
        const perfumes = [...selectedPerfumes, giftPerfume];
        const rpcPayload = {
            p_customer_name: payload.customer.fullName.trim(),
            p_phone: normalizedPhone,
            p_city: payload.customer.city.trim(),
            p_address: payload.customer.address?.trim() || payload.customer.city.trim(),
            p_pack_type: payload.offerType,
            p_total_price: PRICE_MAD,
            p_source: sourceForInsert,
            p_perfumes: perfumes,
            p_offer_mode: offerMode,
            p_meta: {
                ...meta,
                idempotency_key: idempotencyKey,
                source_raw: payload.source.trim(),
                checkout_security: {
                    selectedMainCount: selectedPerfumes.length,
                    giftSelected: Boolean(giftPerfume),
                    totalPerfumes,
                },
            },
        };

        const { data: orderId, error } = await supabase.rpc("create_order_secure", rpcPayload);

        if (error) {
            console.error("[API/ORDERS][DEBUG] backend rejection", error);
            return NextResponse.json(
                {
                    success: false,
                    error: error.message || "Database rejected the order.",
                    details: error,
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                orderId,
                message: "Order created successfully",
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        if (error instanceof SyntaxError) {
            console.error("[API/ORDERS][DEBUG] invalid JSON body", error.message);
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid JSON body.",
                },
                { status: 400 }
            );
        }

        const message = error instanceof Error ? error.message : "Internal server error";
        console.error("[API/ORDERS][DEBUG] fatal error", error);
        return NextResponse.json(
            {
                success: false,
                error: message,
            },
            { status: 500 }
        );
    }
}
