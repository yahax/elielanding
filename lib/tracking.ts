/**
 * Tracking utility — captures UTM params, device type, referrer.
 * Stores in sessionStorage so data persists across modal open/close.
 */

export interface TrackingData {
    utm_campaign: string;
    utm_adset: string;
    utm_ad: string;
    source: string;
    device: "mobile" | "desktop";
    referrer: string;
}

const STORAGE_KEY = "elie_tracking";

/**
 * Call this once on page load (e.g. in a useEffect in layout or page).
 * Reads URL params and stores them in sessionStorage for later use.
 */
export function captureTracking(): void {
    if (typeof window === "undefined") return;

    // Only capture once per session (don't overwrite)
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);

    const raw: TrackingData = {
        utm_campaign: params.get("utm_campaign") || "",
        utm_adset: params.get("utm_adset") || params.get("utm_content") || "",
        utm_ad: params.get("utm_ad") || params.get("utm_term") || "",
        source: deriveSource(params),
        device: isMobile() ? "mobile" : "desktop",
        referrer: document.referrer || "",
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
}

/**
 * Retrieve the captured tracking data (from sessionStorage).
 * Safe to call on any render — returns defaults if not yet captured.
 */
export function getTracking(): TrackingData {
    if (typeof window === "undefined") {
        return { utm_campaign: "", utm_adset: "", utm_ad: "", source: "Direct", device: "desktop", referrer: "" };
    }

    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored) as TrackingData;
    } catch {
        // fallthrough
    }

    return {
        utm_campaign: "",
        utm_adset: "",
        utm_ad: "",
        source: "Direct",
        device: isMobile() ? "mobile" : "desktop",
        referrer: typeof document !== "undefined" ? document.referrer : "",
    };
}

// ── Helpers ──────────────────────────────────────────────────

function isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
}

function deriveSource(params: URLSearchParams): string {
    const utmSource = params.get("utm_source") || "";
    const medium = params.get("utm_medium") || "";

    if (utmSource.toLowerCase().includes("facebook") || utmSource.toLowerCase().includes("meta") || medium.toLowerCase().includes("cpc")) {
        return "Meta Ads";
    }
    if (utmSource.toLowerCase().includes("tiktok")) return "TikTok";
    if (utmSource.toLowerCase().includes("google")) return "Google";
    if (utmSource.toLowerCase().includes("influencer") || medium.toLowerCase().includes("influencer")) return "Influencer";
    if (utmSource) return utmSource;

    const referrer = typeof document !== "undefined" ? document.referrer : "";
    if (referrer.includes("facebook") || referrer.includes("instagram")) return "Meta Ads";
    if (referrer.includes("tiktok")) return "TikTok";
    if (referrer.includes("google")) return "Google";
    if (referrer) return "Organic";

    return "Direct";
}
