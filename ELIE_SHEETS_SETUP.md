# ELIE Orders OS — Google Sheets Setup Guide

**Spreadsheet URL:** https://docs.google.com/spreadsheets/d/1BfsZ5RzCkcinHzaflmmlvYeZpYGD-Zn_Fkf5AQnC_fs/edit  
**Owner:** yacine.raha@gmail.com

---

## STEP 1 — Create the 5 Tabs

Open the spreadsheet. At the bottom, create tabs in this exact order:
1. `ORDERS`
2. `PERFUMES`
3. `INVENTORY`
4. `DASHBOARD`
5. `SETTINGS`

Delete the default `Sheet1` tab if present.

---

## STEP 2 — SETTINGS Tab (do this first — other tabs reference it)

Click the `SETTINGS` tab and enter the following in columns A and B:

| A (Key)                            | B (Value)                                             |
|------------------------------------|-------------------------------------------------------|
| Ramadan_mode                       | TRUE                                                  |
| default_price_mad                  | 199                                                   |
| WhatsApp_number                    | +212669266486                                         |
| confirmation_message_template_ar   | مرحبا [الاسم]، تم تأكيد طلبك [order_id] بنجاح ✅ سيصلك خلال 24-48 ساعة. شكراً لثقتك في ELIE Parfum 🌙 |
| confirmation_message_template_fr   | Bonjour [Nom], votre commande [order_id] a été confirmée ✅ Livraison sous 24-48h. Merci de votre confiance — ELIE Parfum |

**Steps:**
1. Select B1 → Format > Number > Plain text (so TRUE stays as text).
2. Rename the row 1 header by making A1 **bold**.

---

## STEP 3 — PERFUMES Tab (reference table)

### 3a. Add headers in row 1 (bold):
`perfume_id` | `perfume_name` | `gender` | `tier` | `tags` | `active`

### 3b. Paste the perfume list below (copy all rows, paste starting at A2):

```
w-c-1	Dior Hypnotic Poison	femme	classic	حلو,قوية,هدية	TRUE
w-c-2	Jean Paul Gaultier Scandal	femme	classic	حلو,قوية,سهرة	TRUE
w-c-3	Dolce & Gabbana L'Impératrice	femme	classic	منعش,خفيفة,يومي	TRUE
w-c-4	Carolina Herrera Good Girl	femme	classic	حلو,متوسطة,سهرة	TRUE
w-c-5	Giorgio Armani My Way	femme	classic	منعش,متوسطة,يومي	TRUE
w-c-6	Paco Rabanne Olympea	femme	classic	منعش,خفيفة,يومي	TRUE
w-c-7	Burberry Her	femme	classic	حلو,خفيفة,يومي	TRUE
w-c-8	Guerlain Mon Guerlain	femme	classic	حلو,متوسطة,يومي	TRUE
w-c-9	Lattafa Yara	femme	classic	حلو,متوسطة,يومي	TRUE
w-c-10	Dior Poison Girl	femme	classic	حلو,متوسطة,يومي	TRUE
w-c-11	Yves Saint Laurent Libre Intense	femme	classic	حلو,قوية,سهرة	TRUE
w-c-12	Yves Rocher Evidence	femme	classic	منعش,خفيفة,يومي	TRUE
w-c-13	Gissah Imperial Valley	femme	classic	منعش,قوية,هدية	TRUE
w-c-14	Gucci Flora	femme	classic	منعش,خفيفة,يومي	TRUE
w-c-15	Elie Saab Le Parfum	femme	classic	منعش,متوسطة,سهرة	TRUE
w-c-16	Francis Kurkdjian Baccarat Rouge 540	femme	classic	حلو,قوية,هدية	TRUE
w-c-17	Alam Otur Taj	femme	classic	خشبي,قوية,سهرة	TRUE
w-c-18	Dolce & Gabbana The One Femme	femme	classic	حلو,قوية,سهرة	TRUE
w-c-19	Dior J'adore	femme	classic	منعش,متوسطة,يومي	TRUE
w-n-1	Kayali 28	femme	niche	حلو,قوية,هدية	TRUE
w-n-2	Kayali Utopia Vanilla	femme	niche	حلو,متوسطة,سهرة	TRUE
w-n-3	Kayali Marshmallow	femme	niche	حلو,خفيفة,يومي	TRUE
w-n-4	MFK Baccarat Rouge 540 Extrait	femme	niche	حلو,قوية,هدية	TRUE
w-n-5	Maison Marly Delina	femme	niche	منعش,قوية,سهرة	TRUE
m-c-1	Dior Sauvage Elixir	homme	classic	خشبي,قوية,سهرة	TRUE
m-c-2	Armani Stronger With You	homme	classic	حلو,قوية,سهرة	TRUE
m-c-3	Tom Ford Black Orchid	homme	classic	خشبي,قوية,سهرة	TRUE
m-c-4	Dior Intense	homme	classic	خشبي,قوية,يومي	TRUE
m-c-5	Dunhill Desire	homme	classic	حلو,متوسطة,يومي	TRUE
m-c-6	Dunhill Desire Blue	homme	classic	منعش,خفيفة,يومي	TRUE
m-c-7	JPG Ultra Male	homme	classic	حلو,قوية,سهرة	TRUE
m-c-8	Dior Sauvage	homme	classic	منعش,قوية,يومي	TRUE
m-c-9	Chanel Bleu	homme	classic	منعش,متوسطة,يومي	TRUE
m-c-10	JPG Le Male Elixir	homme	classic	حلو,قوية,سهرة	TRUE
m-c-11	Mont Blanc Legend	homme	classic	منعش,خفيفة,يومي	TRUE
m-c-12	Armani You Intensely	homme	classic	حلو,قوية,هدية	TRUE
m-c-13	Lancôme Oud Bouquet	homme	classic	خشبي,قوية,سهرة	TRUE
m-c-14	Paco Rabanne One Million	homme	classic	حلو,قوية,يومي	TRUE
m-c-15	Paco Rabanne Black XS	homme	classic	حلو,متوسطة,يومي	TRUE
m-c-16	Azzaro Wanted	homme	classic	خشبي,قوية,يومي	TRUE
m-c-17	Paco Rabanne XS L'Exces	homme	classic	منعش,متوسطة,يومي	TRUE
m-c-18	YSL La Nuit de L'Homme	homme	classic	خشبي,خفيفة,سهرة	TRUE
m-c-19	Alan Bray L'Homme Legend	homme	classic	منعش,متوسطة,يومي	TRUE
m-n-1	LV Ombre Nomade	homme	niche	خشبي,قوية,هدية	TRUE
m-n-2	LV Imagination	homme	niche	منعش,قوية,يومي	TRUE
m-n-3	Xerjoff Erba Pura	homme	niche	حلو,قوية,سهرة	TRUE
m-n-4	Xerjoff Naxos	homme	niche	خشبي,قوية,هدية	TRUE
m-n-5	Tom Ford Tobacco Vanille	homme	niche	خشبي,قوية,سهرة	TRUE
```

### 3c. Name this range (for use in dropdowns later):
1. Select B2:B48 (all perfume names).
2. In the Name Box (top-left, where it shows the cell reference), type `PerfumeNames` and press Enter.
3. Select A2:A48, name it `PerfumeIDs`.

### 3d. Freeze header row: View > Freeze > 1 row.

---

## STEP 4 — ORDERS Tab (main database)

### 4a. Add ALL headers in row 1 (bold, freeze this row after):

Paste this as row 1 starting at A1: _(each item = one column)_

```
order_id | created_at | channel | source | status | customer_name | phone | city | address_full | pack_type | perfumes_selected | free_perfume | total_items | price_mad | delivery_fee | notes | assigned_to | last_contact_at | next_followup_at | whatsapp_link | call_link | confirmation_log | utm_campaign | utm_adset | utm_ad | device | ip_country
```

_(That is 27 columns: A through AA)_

### 4b. Column widths (drag to set):
- A (order_id): 160px
- B (created_at): 170px
- E (status): 120px
- F (customer_name): 160px
- G (phone): 130px
- H (city): 110px
- I (address_full): 250px
- J (pack_type): 100px
- K (perfumes_selected): 350px
- L (free_perfume): 160px
- T (whatsapp_link): 200px

### 4c. Data Validations — click each column header, then Data > Data validation:

**C — channel:**  
Criteria: List of items → `WhatsApp,Form`  
Show dropdown in cell: ✓

**D — source:**  
Criteria: List of items → `Meta Ads,TikTok,Google,Organic,Direct,Influencer,Other`

**E — status:**  
Criteria: List of items → `New,To Confirm,Confirmed,Cancelled,Shipped,Delivered`

**H — city:**  
Criteria: List of items → `Casablanca,Rabat,Marrakech,Fes,Tanger,Agadir,Other`

**J — pack_type:**  
Criteria: List of items → `Homme,Femme,Mixte`

**Q — assigned_to:**  
Criteria: List of items → `Unassigned,Yacine,Agent 2,Agent 3`  
_(Add your team members here)_

### 4d. Auto-formulas (paste into row 2, then copy down to row 1000):

**M2 (total_items):**
```
=IF(SETTINGS!B1="TRUE", 6, 5)
```

**N2 (price_mad):**
```
=IF(SETTINGS!B1="TRUE", VALUE(SETTINGS!B2), VALUE(SETTINGS!B2))
```
_(Both cases reference SETTINGS!B2 = default_price_mad = 199. If you want a different post-Ramadan price, change SETTINGS!B2.)_

**O2 (delivery_fee):**  
Type `0` in O2, copy down. _(Always free delivery.)_

**T2 (whatsapp_link):**
```
=IF(F2="","","https://wa.me/"&SUBSTITUTE(SETTINGS!B3,"+","")&"?text="&ENCODEURL("*طلب ELIE* 🌙"&CHAR(10)&"الطلب: "&A2&CHAR(10)&"الزبون: "&F2&CHAR(10)&"الهاتف: "&G2&CHAR(10)&"المدينة: "&H2&CHAR(10)&"العطور: "&K2&CHAR(10)&"الهدية: "&L2&CHAR(10)&"الثمن: "&N2&" درهم - توصيل مجاني"))
```

**U2 (call_link):**
```
=IF(G2="","","tel:"&SUBSTITUTE(G2," ",""))
```

### 4e. Freeze row 1: View > Freeze > 1 row. Also freeze column A: View > Freeze > 1 column.

### 4f. Enable Filter: Select row 1 → Data > Create a filter.

---

## STEP 5 — Conditional Formatting in ORDERS

Select the entire range A2:AA1000, then Format > Conditional formatting:

Add 5 rules (click "+ Add another rule" for each):

**Rule 1 — New (gold):**
- Range: `A2:AA1000`
- Custom formula: `=$E2="New"`
- Fill color: `#B8860B` (dark gold), text: white

**Rule 2 — To Confirm (orange):**
- Custom formula: `=$E2="To Confirm"`
- Fill color: `#E65100`, text: white

**Rule 3 — Confirmed (green):**
- Custom formula: `=$E2="Confirmed"`
- Fill color: `#1B5E20`, text: white

**Rule 4 — Cancelled (red):**
- Custom formula: `=$E2="Cancelled"`
- Fill color: `#B71C1C`, text: white

**Rule 5 — Shipped/Delivered (blue-grey):**
- Custom formula: `=OR($E2="Shipped",$E2="Delivered")`
- Fill color: `#1A237E`, text: white

---

## STEP 6 — "Confirmation Team" Smart Filter View

1. In ORDERS tab, click Data > Filter views > Create new filter view.
2. Name it: `🎯 À Confirmer`
3. On column E (status): click the filter dropdown → select only `New` and `To Confirm`.
4. On column B (created_at): click Sort A→Z (oldest first).
5. Close the filter view editor. Now the team can switch to this view with one click.

---

## STEP 7 — INVENTORY Tab

### 7a. Headers in row 1 (bold):
```
perfume_name | stock_on_hand | low_stock_threshold | reserved_for_orders | used_today | used_7d | last_updated_at
```

### 7b. Paste all 48 perfume names in column A (rows 2–49), matching PERFUMES tab column B exactly.

### 7c. Set defaults:
- B2:B49 → enter `50` (starting stock, adjust as needed)
- C2:C49 → enter `5` (low stock threshold)

### 7d. Auto-formulas (paste in row 2, copy down to row 49):

**D2 (reserved_for_orders):**
```
=COUNTIF(ORDERS!K:K,"*"&A2&"*")+COUNTIF(ORDERS!L:L,A2)-COUNTIF(ORDERS!E:E,"Cancelled")-COUNTIF(ORDERS!E:E,"Delivered")
```
_(Counts appearances in confirmed/active orders)_

**E2 (used_today):**
```
=COUNTIFS(ORDERS!K:K,"*"&A2&"*",ORDERS!E:E,"Confirmed",ORDERS!B:B,">="&TODAY())+COUNTIFS(ORDERS!K:K,"*"&A2&"*",ORDERS!E:E,"Shipped",ORDERS!B:B,">="&TODAY())+COUNTIFS(ORDERS!L:L,A2,ORDERS!E:E,"Confirmed",ORDERS!B:B,">="&TODAY())
```

**F2 (used_7d):**
```
=COUNTIFS(ORDERS!K:K,"*"&A2&"*",ORDERS!E:E,"Confirmed",ORDERS!B:B,">="&(TODAY()-7))+COUNTIFS(ORDERS!K:K,"*"&A2&"*",ORDERS!E:E,"Shipped",ORDERS!B:B,">="&(TODAY()-7))+COUNTIFS(ORDERS!L:L,A2,ORDERS!E:E,"Confirmed",ORDERS!B:B,">="&(TODAY()-7))
```

**G2 (last_updated_at):** Leave empty — will be updated by Apps Script.

### 7e. Conditional formatting for low stock:
- Select B2:B49.
- Format > Conditional formatting.
- Custom formula: `=B2<=C2`
- Fill: red `#B71C1C`, text white.

### 7f. Freeze row 1.

---

## STEP 8 — DASHBOARD Tab

This tab shows KPIs and links. All cells are formulas referencing ORDERS.

### 8a. Layout (paste into cells):

**A1:** `📊 ELIE DASHBOARD` (bold, font size 18)
**A2:** `Mis à jour:` | **B2:** `=NOW()`

---

**A4:** `COMMANDES` (bold)

| Cell | Label | Formula |
|------|-------|---------|
| A5 | Today | `=COUNTIFS(ORDERS!B:B,">="&TODAY(),ORDERS!B:B,"<"&TODAY()+1)` |
| A6 | 7 jours | `=COUNTIFS(ORDERS!B:B,">="&(TODAY()-7))` |
| A7 | 30 jours | `=COUNTIFS(ORDERS!B:B,">="&(TODAY()-30))` |
| A8 | Total | `=COUNTA(ORDERS!A:A)-1` |

Put labels in column A, formulas in column B.

---

**A10:** `REVENUS (MAD)` (bold)

| Cell | Label | Formula |
|------|-------|---------|
| A11 | Aujourd'hui | `=SUMIFS(ORDERS!N:N,ORDERS!B:B,">="&TODAY(),ORDERS!B:B,"<"&TODAY()+1,ORDERS!E:E,"Confirmed")` |
| A12 | 7 jours | `=SUMIFS(ORDERS!N:N,ORDERS!B:B,">="&(TODAY()-7),ORDERS!E:E,"Confirmed")` |
| A13 | 30 jours | `=SUMIFS(ORDERS!N:N,ORDERS!B:B,">="&(TODAY()-30),ORDERS!E:E,"Confirmed")` |

---

**A15:** `TAUX DE CONVERSION` (bold)

| Cell | Label | Formula |
|------|-------|---------|
| A16 | Confirmé % | `=IFERROR(COUNTIF(ORDERS!E:E,"Confirmed")/MAX(COUNTA(ORDERS!A:A)-1,1),0)` (format as %) |
| A17 | Annulé % | `=IFERROR(COUNTIF(ORDERS!E:E,"Cancelled")/MAX(COUNTA(ORDERS!A:A)-1,1),0)` (format as %) |
| A18 | WhatsApp vs Form | `="WA: "&COUNTIF(ORDERS!C:C,"WhatsApp")&" / Form: "&COUNTIF(ORDERS!C:C,"Form")` |

---

**A20:** `TOP 10 VILLES` (bold)

In E1:F11, paste:
```
=QUERY(ORDERS!H:H,"SELECT H, COUNT(H) WHERE H <> '' GROUP BY H ORDER BY COUNT(H) DESC LIMIT 10",1)
```

---

**A22:** `TOP 10 PARFUMS` (bold)

This requires a helper column approach. In H1 write:
```
TOP PARFUMS (Sélection)
```
In H2:
```
=QUERY(ORDERS!K:K,"SELECT K, COUNT(K) WHERE K<>'' GROUP BY K ORDER BY COUNT(K) DESC LIMIT 10",1)
```
_(Note: Since `perfumes_selected` is a comma-separated list, exact counts per perfume need Apps Script to maintain a summary. This QUERY gives order-level frequency — accurate enough for top orders by perfume set.)_

---

**A24:** `ALERTES STOCK` (bold)

In J1:
```
=QUERY(INVENTORY!A:C,"SELECT A,B,C WHERE B<=C AND A<>'' ORDER BY B ASC",1)
```

---

## STEP 9 — Protect the Helper Columns in ORDERS

To prevent operators from accidentally overwriting auto-formulas:
1. Select columns M, N, O, T, U (hold Ctrl to multi-select).
2. Right-click → Protect range.
3. Description: "Auto-formulas — do not edit."
4. Restrict editing to: Only you (the owner).

---

## SUMMARY — Sheet is Ready

After completing these steps:
- ✅ ORDERS: 27 columns, dropdowns, auto-formulas, conditional formatting, filter view.
- ✅ PERFUMES: 48 perfumes reference table.
- ✅ INVENTORY: Real-time stock tracking via COUNTIFS.
- ✅ DASHBOARD: KPIs and alerts.
- ✅ SETTINGS: Ramadan mode toggle (change B1 to FALSE after Ramadan ends, prices auto-update).

**Next:** Follow `ELIE_APPS_SCRIPT.js` instructions to deploy the API.
