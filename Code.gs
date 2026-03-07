/**
 * ============================================================
 * ELIE Orders — Google Apps Script Web App  (Code.gs)
 * ============================================================
 * 
 * SETUP:
 * 1. Open https://script.google.com → "New project" → name "ELIE Orders"
 * 2. Delete default code, paste this entire file.
 * 3. ⚙️ Project Settings → Script Properties → Add:
 *      ELIE_SECRET    = elie2026xK9m  (use any strong string)
 *      SPREADSHEET_ID = 1BfsZ5RzCkcinHzaflmmlvYeZpYGD-Zn_Fkf5AQnC_fs
 * 4. Deploy → New Deployment → Web App:
 *      Execute as: Me
 *      Who has access: Anyone
 *    → Copy the URL
 * 5. Put the URL + secret in your .env.local
 * ============================================================
 */

var ORDERS_SHEET_NAME = "ORDERS";

// ── 17 columns (exactly matching spec) ───────────────────────
var HEADERS = [
  "orderId",        // A
  "createdAt",      // B
  "channel",        // C
  "offerMode",      // D
  "fullName",       // E
  "phone",          // F
  "city",           // G
  "address",        // H
  "packType",       // I
  "chosenPerfumes", // J
  "giftPerfume",    // K
  "priceMAD",       // L
  "delivery",       // M
  "refSource",      // N
  "userAgent",      // O
  "status",         // P
  "notes"           // Q
];

var COL_WIDTHS = [160,180,80,80,150,120,100,220,80,350,180,70,60,100,200,90,200];

// ── GET: health check ─────────────────────────────────────────
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, service: "ELIE Orders API", version: "2.0" })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ── POST: create order ────────────────────────────────────────
function doPost(e) {
  try {
    // 1. Parse body
    var body = {};
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return respond({ ok: false, error: "Invalid JSON body" });
    }

    // 2. Auth
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty("ELIE_SECRET");
    var provided = body.secret || (e.parameter && e.parameter.secret) || "";
    if (!secret || provided !== secret) {
      return respond({ ok: false, error: "Unauthorized" });
    }

    // 3. Open spreadsheet & ensure ORDERS sheet exists
    var ssId = props.getProperty("SPREADSHEET_ID");
    var ss = SpreadsheetApp.openById(ssId);
    var sheet = ss.getSheetByName(ORDERS_SHEET_NAME);
    if (!sheet) {
      sheet = createOrdersSheet(ss);
    }

    // 4. Build row (17 columns)
    var now = new Date();
    var orderId = sanitize(body.order_id || body.orderId || generateId(now));
    var row = [
      orderId,                                                              // orderId
      body.created_at || body.createdAt || formatDate(now),                  // createdAt
      sanitize(body.channel || "sheet"),                                     // channel
      sanitize(body.offer_mode || body.offerMode || "ramadan"),              // offerMode
      sanitize(body.customer_name || body.fullName || ""),                   // fullName
      sanitize(body.phone || ""),                                            // phone
      sanitize(body.city || ""),                                             // city
      sanitize(body.address_full || body.address || ""),                     // address
      sanitize(body.pack_type || body.packType || "Femme"),                  // packType
      sanitize(body.perfumes_selected || body.chosenPerfumes || ""),         // chosenPerfumes
      sanitize(body.free_perfume || body.giftPerfume || ""),                 // giftPerfume
      Number(body.price_mad || body.priceMAD) || 199,                       // priceMAD
      sanitize(body.delivery || "free"),                                     // delivery
      sanitize(body.source || body.refSource || ""),                         // refSource
      sanitize(body.user_agent || body.userAgent || "").substring(0, 300),   // userAgent
      "Nouveau",                                                             // status (default)
      sanitize(body.notes || "")                                             // notes
    ];

    // 5. Append
    sheet.appendRow(row);
    var rowNum = sheet.getLastRow();

    Logger.log("[ELIE] Order " + orderId + " added at row " + rowNum);

    return respond({
      ok: true,
      order_id: orderId,
      row: rowNum,
      price_mad: 199
    });

  } catch (err) {
    Logger.log("[ELIE] Error: " + err.toString());
    return respond({ ok: false, error: err.message });
  }
}

// ── Create and format ORDERS sheet ────────────────────────────
function createOrdersSheet(ss) {
  var sheet = ss.insertSheet(ORDERS_SHEET_NAME, 0);

  // Write headers
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);

  // Format header row
  headerRange
    .setBackground("#1a1a2e")
    .setFontColor("#c6a34e")
    .setFontWeight("bold")
    .setFontSize(10)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  // Set row height
  sheet.setRowHeight(1, 36);

  // Set column widths
  for (var i = 0; i < COL_WIDTHS.length; i++) {
    sheet.setColumnWidth(i + 1, COL_WIDTHS[i]);
  }

  // Freeze header
  sheet.setFrozenRows(1);

  // Add filter
  var filterRange = sheet.getRange(1, 1, 1, HEADERS.length);
  if (!sheet.getFilter()) {
    filterRange.createFilter();
  }

  // Set tab color
  sheet.setTabColor("#c6a34e");

  return sheet;
}

// ── Manually run this to create/format the sheet ──────────────
function setupSheet() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty("SPREADSHEET_ID");
  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName(ORDERS_SHEET_NAME);
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  createOrdersSheet(ss);
  Logger.log("ORDERS sheet created and formatted.");
}

// ── Helpers ───────────────────────────────────────────────────

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateId(now) {
  var d = Utilities.formatDate(now, "Africa/Casablanca", "yyyyMMdd");
  var r = Math.random().toString(36).substring(2, 6).toUpperCase();
  return "ELIE-" + d + "-" + r;
}

function formatDate(d) {
  return Utilities.formatDate(d, "Africa/Casablanca", "yyyy-MM-dd HH:mm:ss");
}

function sanitize(value) {
  if (typeof value !== "string") return String(value || "");
  var s = value.trim();
  while (s.length > 0 && ["=", "+", "-", "@", "\t", "\r", "\n"].indexOf(s[0]) !== -1) {
    s = s.substring(1).trim();
  }
  return s.substring(0, 1000);
}
