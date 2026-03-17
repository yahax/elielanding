import { Order } from './types';

/**
 * Robustly normalizes the list of perfumes from an order payload.
 * Handles stringified JSON, comma-separated strings, and avoids "Test" placeholders.
 */
export function normalizeOrderPerfumes(order: Order | null): string[] {
    if (!order) return [];

    let perfumes: string[] = [];

    // 1. Try to parse selected_perfumes
    const rawSelected = order.selected_perfumes;

    if (Array.isArray(rawSelected)) {
        perfumes = [...rawSelected];
    } else if (typeof rawSelected === 'string' && rawSelected) {
        try {
            // Might be JSON string
            const parsed = JSON.parse(rawSelected as string);
            if (Array.isArray(parsed)) {
                perfumes = parsed;
            } else {
                perfumes = [rawSelected as string];
            }
        } catch {
            // Fallback: handle comma-separated
            perfumes = (rawSelected as string).split(',').map((s: string) => s.trim()).filter(Boolean);
        }
    }

    // 2. Add gift if missing from the list (it should be at position 6)
    const gift = order.gift_perfume;
    if (gift && gift.toLowerCase() !== 'test' && !perfumes.includes(gift)) {
        perfumes.push(gift);
    }

    // 3. Filter out junk and normalize
    const cleanPerfumes = perfumes
        .map(p => p?.trim())
        .filter(p => p && p.toLowerCase() !== 'test' && p.toLowerCase() !== 'none');

    return cleanPerfumes;
}
