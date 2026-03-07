import { PERFUMES } from "@/data/perfumes";

/**
 * Smart Gift Rule for ELIE Ramadan Offer:
 * - Gift perfume must be from the same gender as the majority of selected perfumes.
 * - If there is a tie, use a mix or default to a popular choice.
 * - Prefer "niche" perfumes if available in stock; otherwise use "classic".
 */
export function getSmartGiftPerfume(selectedIds: string[]) {
    // 1. Get selected perfumes data
    const selected = selectedIds.map(id => PERFUMES.find(p => p.id === id)).filter(Boolean);

    if (selected.length === 0) return PERFUMES.find(p => p.tier === 'classic' && p.gender === 'femme');

    // 2. Determine majority gender
    const counts = selected.reduce((acc, p) => {
        acc[p!.gender]++;
        return acc;
    }, { homme: 0, femme: 0 });

    const majorityGender = counts.homme > counts.femme ? 'homme' : 'femme';

    // 3. Filter candidates for gift
    // Condition: Correct gender + preferable Niche tier
    const candidates = PERFUMES.filter(p => !selectedIds.includes(p.id) && p.gender === majorityGender);

    // Pick a Niche one if possible
    const nicheCandidates = candidates.filter(p => p.tier === 'niche');
    if (nicheCandidates.length > 0) {
        return nicheCandidates[Math.floor(Math.random() * nicheCandidates.length)];
    }

    // Otherwise pick a Classic one
    if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Absolute fallback
    return PERFUMES.find(p => p.gender === majorityGender) || PERFUMES[0];
}
