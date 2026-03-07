/**
 * Single source of truth for ELIE offer mode.
 *
 * NEXT_PUBLIC_OFFER_MODE = "ramadan" | "standard"
 *   - ramadan : 5 chosen + 1 gift perfume FREE + free delivery = 199 MAD
 *   - standard: 5 chosen + free delivery = 199 MAD (no gift)
 *
 * Defaults to "ramadan" when the env var is absent.
 */

export type OfferMode = "ramadan" | "standard";

export const OFFER_MODE: OfferMode =
    (process.env.NEXT_PUBLIC_OFFER_MODE as OfferMode) || "ramadan";

export const IS_RAMADAN = OFFER_MODE === "ramadan";

/** Number of perfumes the customer actively chooses */
export const MAX_CHOSEN = 6;

/** Total perfumes delivered (chosen + gift if ramadan) */
export const MAX_TOTAL = 6;

/** Pack price in MAD */
export const PRICE_MAD = 199;
