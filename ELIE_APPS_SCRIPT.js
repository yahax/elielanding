/**
 * ============================================================
 * ELIE Orders OS — Google Apps Script Web App
 * ============================================================
 * HOW TO DEPLOY:
 * 1. Open https://script.google.com
 * 2. Click "New project" → name it "ELIE Orders API"
 * 3. Delete the default code. Paste this entire file.
 * 4. Click the gear icon (⚙️ Project Settings):
 *    → Script Properties → Add property:
 *      Key: ELIE_SECRET   Value: (make up a strong random string, e.g. "elie-secret-2026-xK9m")
 *      Key: SPREADSHEET_ID  Value: 1BfsZ5RzCkcinHzaflmmlvYeZpYGD-Zn_Fkf5AQnC_fs
 * 5. Click Deploy > New deployment:
 *    → Type: Web App
 *    → Execute as: Me (yacine.raha@gmail.com)
 *    → Who has access: Anyone
 *    → Click Deploy → copy the Web App URL
 * 6. Paste the URL into your .env.local file:
 *      NEXT_PUBLIC_APPS_SCRIPT_URL=<paste URL here>
 *      NEXT_PUBLIC_APPS_SCRIPT_SECRET=<same value as ELIE_SECRET above>
 * ============================================================
 */

// ── Constants ────────────────────────────────────────────────
const ALLOWED_ORIGIN = "https://elie.ma";
const ORDERS_SHEET = "ORDERS";
const SETTINGS_SHEET = "SETTINGS";

// Column indices in ORDERS (0-based, matching your sheet layout)
const COL = {
    order_id: 0,   // A
    created_at: 1,   // B
    channel: 2,   // C
    source: 3,   // D
    status: 4,   // E
    customer_name: 5,   // F
    phone: 6,   // G
    city: 7,   // H
    address_full: 8,   // I
    pack_type: 9,   // J
    perfumes_selected: 10,  // K
    free_perfume: 11,  // L
    total_items: 12,  // M
    price_mad: 13,  // N
    delivery_fee: 14,  // O
    notes: 15,  // P
    assigned_to: 16,  // Q
    last_contact_at: 17,  // R
    next_followup_at: 18,  // S
    whatsapp_link: 19,  // T
    call_link: 20,  // U
    confirmation_log: 21,  // V
    utm_campaign: 22,  // W
    utm_adset: 23,  // X
    utm_ad: 24,  // Y
    device: 25,  // Z
    ip_country: 26,  // AA
};

// ── CORS helper ──────────────────────────────────────────────
function corsHeaders(output) {
    return output
        .setHeader("Access-Control-Allow-Origin", "*") // Allow all for Apps Script (browser handles CORS before reaching here)
        .setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        .setHeader("Access-Control-Allow-Headers", "Content-Type, x-elie-secret");
}

// ── Main entry points ─────────────────────────────────────────

/**
 * Handle preflight OPTIONS (Apps Script doesn't truly support OPTIONS,
 * but this keeps the code complete).
 */
function doOptions(e) {
    return corsHeaders(
        ContentService.createTextOutput(JSON.stringify({ ok: true }))
            .setMimeType(ContentService.MimeType.JSON)
    );
}

/**
 * GET → return a simple health check (never expose data).
 */
function doGet(e) {
    const out = ContentService.createTextOutput(
        JSON.stringify({ ok: true, service: "ELIE Orders API", version: "1.0" })
    ).setMimeType(ContentService.MimeType.JSON);
    return corsHeaders(out);
}

/**
 * POST /createOrder — main endpoint.
 * Expected body (JSON):
 * {
 *   customer_name: string,
 *   phone: string,
 *   city: string,
 *   address_full: string,
 *   pack_type: "Homme"|"Femme"|"Mixte",
 *   perfumes_selected: string,   // comma-separated list of 5 names
 *   free_perfume?: string,       // 1 name (optional in post-Ramadan)
 *   channel: "Form"|"WhatsApp",
 *   source?: string,
 *   utm_campaign?: string,
 *   utm_adset?: string,
 *   utm_ad?: string,
 *   device?: string,
 *   notes?: string,
 * }
 */
function doPost(e) {
    try {
        // ── 1. Auth check ─────────────────────────────────────────
        const props = PropertiesService.getScriptProperties();
        const secret = props.getProperty("ELIE_SECRET");
        const ssId = props.getProperty("SPREADSHEET_ID");

        // Extract secret from header or query param (Apps Script can't read custom headers
        // reliably; we accept it also as a query param as fallback).
        const providedSecret = (e.parameter && e.parameter.secret) || "";

        // Parse body
        let body = {};
        try {
            body = JSON.parse(e.postData.contents);
        } catch (parseErr) {
            return errorResponse("Invalid JSON body", 400);
        }

        // Secret can also come from body (for browser clients that can't set custom headers)
        const bodySecret = body.secret || providedSecret;

        if (!secret || bodySecret !== secret) {
            return errorResponse("Unauthorized", 401);
        }

        // ── 2. Validate required fields ───────────────────────────
        const required = ["customer_name", "phone", "city", "perfumes_selected"];
        for (const field of required) {
            if (!body[field] || String(body[field]).trim() === "") {
                return errorResponse(`Missing required field: ${field}`, 422);
            }
        }

        // Validate perfumes count (must be exactly 5 names, comma-separated)
        const perfumes = body.perfumes_selected.split(",").map(s => s.trim()).filter(Boolean);
        if (perfumes.length !== 5) {
            return errorResponse("perfumes_selected must contain exactly 5 perfumes", 422);
        }

        // Validate phone (Morocco format: 06xxxxxxxx or 07xxxxxxxx or +212xxxxxxxxx)
        const phone = sanitize(body.phone).replace(/\s/g, "");
        if (!/^(\+212|0)(6|7)\d{8}$/.test(phone)) {
            return errorResponse("Invalid Moroccan phone number", 422);
        }

        // ── 3. Read SETTINGS ──────────────────────────────────────
        const ss = SpreadsheetApp.openById(ssId);
        const settings = ss.getSheetByName(SETTINGS_SHEET);
        const ramadan = settings.getRange("B1").getValue() === "TRUE" || settings.getRange("B1").getValue() === true;
        const price = Number(settings.getRange("B2").getValue()) || 199;
        const waNumber = String(settings.getRange("B3").getValue()).replace(/\D/g, "");

        // ── 4. Generate order_id ──────────────────────────────────
        const now = new Date();
        const orderId = generateOrderId(ss, now);

        // ── 5. Build row ──────────────────────────────────────────
        const sanitizedName = sanitize(body.customer_name);
        const sanitizedCity = sanitize(body.city);
        const sanitizedAddress = sanitize(body.address_full || "");
        const sanitizedNotes = sanitize(body.notes || "");
        const freePerfume = sanitize(body.free_perfume || "");
        const packType = sanitize(body.pack_type || "Mixte");
        const channel = sanitize(body.channel || "Form");
        const source = sanitize(body.source || "Direct");
        const utmCampaign = sanitize(body.utm_campaign || "");
        const utmAdset = sanitize(body.utm_adset || "");
        const utmAd = sanitize(body.utm_ad || "");
        const device = sanitize(body.device || "");

        const totalItems = ramadan ? 6 : 5;
        const perfumesCsv = perfumes.map(sanitize).join(", ");

        // Build WhatsApp deep link
        const waMessage = encodeURIComponent(
            `*طلب جديد من ELIE Parfum* 🌙\n` +
            `*رقم الطلب:* ${orderId}\n` +
            `*نوع Pack:* ${packType}\n` +
            `*العطور:*\n${perfumes.map((p, i) => `${i + 1}. ${p}`).join("\n")}` +
            `${freePerfume ? "\nالهدية المجانية: " + freePerfume : ""}\n\n` +
            `*معلومات الزبون:*\n` +
            `الاسم: ${sanitizedName}\n` +
            `الهاتف: ${phone}\n` +
            `المدينة: ${sanitizedCity}\n` +
            `العنوان: ${sanitizedAddress}\n\n` +
            `*المجموع:* ${price} درهم (توصيل مجاني 🚚)`
        );
        const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;
        const callLink = `tel:${phone}`;

        // Build the full 27-column row
        const row = new Array(27).fill("");
        row[COL.order_id] = orderId;
        row[COL.created_at] = Utilities.formatDate(now, "Africa/Casablanca", "yyyy-MM-dd HH:mm:ss");
        row[COL.channel] = channel;
        row[COL.source] = source;
        row[COL.status] = "New";
        row[COL.customer_name] = sanitizedName;
        row[COL.phone] = phone;
        row[COL.city] = sanitizedCity;
        row[COL.address_full] = sanitizedAddress;
        row[COL.pack_type] = packType;
        row[COL.perfumes_selected] = perfumesCsv;
        row[COL.free_perfume] = freePerfume;
        row[COL.total_items] = totalItems;
        row[COL.price_mad] = price;
        row[COL.delivery_fee] = 0;
        row[COL.notes] = sanitizedNotes;
        row[COL.assigned_to] = "Unassigned";
        row[COL.whatsapp_link] = waLink;
        row[COL.call_link] = callLink;
        row[COL.utm_campaign] = utmCampaign;
        row[COL.utm_adset] = utmAdset;
        row[COL.utm_ad] = utmAd;
        row[COL.device] = device;

        // ── 6. Append to ORDERS sheet ─────────────────────────────
        const ordersSheet = ss.getSheetByName(ORDERS_SHEET);
        ordersSheet.appendRow(row);

        // ── 7. Log ────────────────────────────────────────────────
        console.log(`[ELIE] Order created: ${orderId} | ${sanitizedName} | ${sanitizedCity} | ${channel}`);

        // ── 8. Return success ─────────────────────────────────────
        const response = {
            ok: true,
            order_id: orderId,
            whatsapp_link: waLink,
            price_mad: price,
            total_items: totalItems,
            ramadan_mode: ramadan,
        };

        const out = ContentService.createTextOutput(JSON.stringify(response))
            .setMimeType(ContentService.MimeType.JSON);
        return corsHeaders(out);

    } catch (err) {
        console.error("[ELIE] Error:", err.toString());
        return errorResponse("Internal server error: " + err.message, 500);
    }
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Generate a unique order ID: ELIE-YYYYMMDD-XXXX
 * Uses the last row count to generate a sequential number per day.
 */
function generateOrderId(ss, now) {
    const dateStr = Utilities.formatDate(now, "Africa/Casablanca", "yyyyMMdd");
    const ordersSheet = ss.getSheetByName(ORDERS_SHEET);
    const lastRow = ordersSheet.getLastRow(); // includes header

    // Count orders from today to get today's seq number
    let todayCount = 0;
    if (lastRow > 1) {
        const dates = ordersSheet.getRange(2, 2, lastRow - 1, 1).getValues(); // created_at column
        const todayPrefix = Utilities.formatDate(now, "Africa/Casablanca", "yyyy-MM-dd");
        for (let i = 0; i < dates.length; i++) {
            if (String(dates[i][0]).startsWith(todayPrefix)) {
                todayCount++;
            }
        }
    }

    const seq = String(todayCount + 1).padStart(4, "0");
    return `ELIE-${dateStr}-${seq}`;
}

/**
 * Sanitize a string value to prevent formula injection in Google Sheets.
 * Strips leading =, +, -, @, TAB, CR, LF characters.
 */
function sanitize(value) {
    if (typeof value !== "string") return String(value ?? "");
    // Remove formula injection prefixes
    let s = value.trim();
    while (s.length > 0 && ["=", "+", "-", "@", "\t", "\r", "\n"].includes(s[0])) {
        s = s.slice(1).trim();
    }
    // Limit length to prevent abuse
    return s.slice(0, 1000);
}

/**
 * Return a standardized error JSON response.
 */
function errorResponse(message, code) {
    const out = ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: message, code: code })
    ).setMimeType(ContentService.MimeType.JSON);
    return corsHeaders(out);
}
