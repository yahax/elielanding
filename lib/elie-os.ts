/**
 * ELIE OS Service Layer
 * Handles order submission to the internal order system.
 */

export interface ElieOSOrderPayload {
    source: string;
    locale: "ar" | "fr";
    offerType: "homme" | "femme" | "mixte";
    customerIntent: "لي" | "له" | "لها" | "للزوجين" | null;
    items: {
        slot: number;
        name: string;
        free?: boolean;
    }[];
    pricing: {
        currency: string;
        total: number;
        delivery: number;
        paymentMethod: string;
    };
    customer: {
        fullName: string;
        phone: string;
        city: string;
        address?: string;
    };
    meta: {
        userAgent: string;
        timestamp: string;
        page: string;
        utm_campaign?: string;
        utm_adset?: string;
        utm_ad?: string;
        referrer?: string;
    };
}

const SAFE_ORDERS_API_ENDPOINT = "/api/orders";

function resolveOrdersApiEndpoint(): string {
    const configured = process.env.NEXT_PUBLIC_ELIE_OS_ENDPOINT?.trim();

    // Security hard-stop:
    // checkout must never call Supabase REST (or any external origin) from the browser.
    // Only allow same-origin API route calls.
    if (!configured || configured === "") return SAFE_ORDERS_API_ENDPOINT;

    const isSafeInternalOrdersRoute = /^\/api\/orders(?:[/?#]|$)/.test(configured);
    if (isSafeInternalOrdersRoute) return configured;

    if (typeof window !== "undefined") {
        console.warn(
            `[ELIE] Ignoring unsafe NEXT_PUBLIC_ELIE_OS_ENDPOINT="${configured}". Using ${SAFE_ORDERS_API_ENDPOINT}.`
        );
    }

    return SAFE_ORDERS_API_ENDPOINT;
}

/**
 * Sends a normalized order payload to ELIE OS.
 */
export async function submitOrderToElieOS(payload: ElieOSOrderPayload): Promise<{ success: boolean; error?: string; orderId?: string }> {
    try {
        const endpoint = resolveOrdersApiEndpoint();
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(responseData.error || `Server error: ${response.status}`);
        }

        return {
            success: true,
            orderId: responseData.orderId
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        return {
            success: false,
            error: message
        };
    }
}
