import { Perfume, PERFUMES } from "@/data/perfumes";
import { OfferMode, OFFER_MODE } from "./offer-config";

/**
 * Smart gift rule (ramadan only):
 * Gift perfume should match the majority gender of the selected perfumes.
 * Prefers niche tier when available.
 */
export function getSmartGift(selectedPerfumeNames: string[]): Perfume {
    const selected = selectedPerfumeNames
        .map(name => PERFUMES.find(p => p.name === name))
        .filter(Boolean) as Perfume[];

    const counts = selected.reduce((acc, p) => {
        acc[p.gender] = (acc[p.gender] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const majorityGender = (counts['homme'] || 0) > (counts['femme'] || 0) ? 'homme' : 'femme';

    const availableGifts = PERFUMES.filter(p => !selectedPerfumeNames.includes(p.name));
    let candidates = availableGifts.filter(p => p.gender === majorityGender);
    if (candidates.length === 0) candidates = availableGifts;

    const nicheCandidates = candidates.filter(p => p.tier === 'niche');
    const finalCandidates = nicheCandidates.length > 0 ? nicheCandidates : candidates;

    return finalCandidates[0] || PERFUMES[0];
}

/**
 * Calculate total inventory outflow for an order (text[] schema).
 */
export function getOrderOutflow(order: {
    selected_perfumes: string[];
    gift_perfume?: string | null;
    offer_mode?: OfferMode;
}): Record<string, number> {
    const movement: Record<string, number> = {};

    order.selected_perfumes.forEach(name => {
        movement[name] = (movement[name] || 0) - 1;
    });

    if (order.offer_mode === 'ramadan' && order.gift_perfume) {
        movement[order.gift_perfume] = (movement[order.gift_perfume] || 0) - 1;
    }

    return movement;
}

/**
 * Check if currently in Ramadan offer mode.
 */
export function isRamadanMode(): boolean {
    return OFFER_MODE === 'ramadan';
}
