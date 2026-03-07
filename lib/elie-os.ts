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
        address: string;
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

const ORDERS_API_ENDPOINT = "/api/orders";

/**
 * Sends a normalized order payload to ELIE OS.
 */
export async function submitOrderToElieOS(payload: ElieOSOrderPayload): Promise<{ success: boolean; error?: string; orderId?: string }> {
    console.log("[ELIE OS] >>> Submitting order to ELIE OS...");
    console.log("[ELIE OS] Endpoint:", ORDERS_API_ENDPOINT);
    console.log("[ELIE OS] Payload:", JSON.stringify(payload, null, 2));

    try {
        const startTime = Date.now();
        const response = await fetch(ORDERS_API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const duration = Date.now() - startTime;
        console.log(`[ELIE OS] Response status: ${response.status} (${duration}ms)`);

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error("[ELIE OS] Server rejected request:", responseData);
            throw new Error(responseData.error || `Server error: ${response.status}`);
        }

        console.log("[ELIE OS] <<< Success! Order confirmed:", responseData);

        return {
            success: true,
            orderId: responseData.orderId
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("[ELIE OS] <<< Submission failed:", error);
        return {
            success: false,
            error: message
        };
    }
}
