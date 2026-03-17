export const MAIN_SLOT_KEYS = ["slot1", "slot2", "slot3", "slot4", "slot5"] as const;
export const GIFT_SLOT_KEY = "giftSlot" as const;
export const REQUIRED_SLOT_KEYS = [...MAIN_SLOT_KEYS, GIFT_SLOT_KEY] as const;

export const MAIN_SLOT_COUNT = MAIN_SLOT_KEYS.length;
export const TOTAL_SLOT_COUNT = REQUIRED_SLOT_KEYS.length;
export const GIFT_SLOT_INDEX = MAIN_SLOT_COUNT;

type MainSlotKey = (typeof MAIN_SLOT_KEYS)[number];
export type SlotPayload = Record<MainSlotKey, string> & { giftSlot: string };

type SlotValidationResult = {
    isValid: boolean;
    errors: string[];
    normalizedSlots: SlotPayload | null;
    selectedPerfumes: string[];
    giftPerfume: string | null;
    totalSelected: number;
};

type CheckoutSelectionProgress = {
    normalizedSlots: (string | null)[];
    selectedMainPerfumes: string[];
    selectedGiftPerfume: string | null;
    mainCount: number;
    totalSelected: number;
    isMainComplete: boolean;
    hasGiftSelected: boolean;
    isSelectionComplete: boolean;
};

function normalizeSlotValue(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export function getCheckoutSelectionProgress(
    slots: readonly (string | null | undefined)[]
): CheckoutSelectionProgress {
    const normalizedSlots = Array.from({ length: TOTAL_SLOT_COUNT }, (_, index) => {
        const value = index < slots.length ? slots[index] : null;
        return normalizeSlotValue(value);
    });

    const selectedMainPerfumes = normalizedSlots
        .slice(0, MAIN_SLOT_COUNT)
        .filter((slot): slot is string => Boolean(slot));
    const selectedGiftPerfume = normalizedSlots[GIFT_SLOT_INDEX];
    const allSelections = selectedGiftPerfume
        ? [...selectedMainPerfumes, selectedGiftPerfume]
        : [...selectedMainPerfumes];
    const totalSelected = allSelections.length;
    const isMainComplete = selectedMainPerfumes.length === MAIN_SLOT_COUNT;
    const hasGiftSelected = Boolean(selectedGiftPerfume);

    return {
        normalizedSlots,
        selectedMainPerfumes,
        selectedGiftPerfume,
        mainCount: selectedMainPerfumes.length,
        totalSelected,
        isMainComplete,
        hasGiftSelected,
        isSelectionComplete: isMainComplete && hasGiftSelected && totalSelected === TOTAL_SLOT_COUNT,
    };
}

export function validateCompleteSlotPayload(payload: unknown): SlotValidationResult {
    const errors: string[] = [];

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return {
            isValid: false,
            errors: ["slots must be an object with slot1..slot5 and giftSlot."],
            normalizedSlots: null,
            selectedPerfumes: [],
            giftPerfume: null,
            totalSelected: 0,
        };
    }

    const slots = payload as Record<string, unknown>;
    const payloadKeys = Object.keys(slots);
    const missingKeys = REQUIRED_SLOT_KEYS.filter((key) => !(key in slots));
    const extraKeys = payloadKeys.filter(
        (key) => !REQUIRED_SLOT_KEYS.includes(key as (typeof REQUIRED_SLOT_KEYS)[number])
    );

    if (missingKeys.length > 0) {
        errors.push(`Missing slot keys: ${missingKeys.join(", ")}.`);
    }

    if (extraKeys.length > 0) {
        errors.push(`Unexpected slot keys: ${extraKeys.join(", ")}.`);
    }

    const normalized = {} as SlotPayload;
    for (const key of REQUIRED_SLOT_KEYS) {
        const value = normalizeSlotValue(slots[key]);
        if (!value) {
            errors.push(`${key} must be a non-empty perfume name.`);
            continue;
        }
        normalized[key] = value;
    }

    if (errors.length > 0) {
        return {
            isValid: false,
            errors,
            normalizedSlots: null,
            selectedPerfumes: [],
            giftPerfume: null,
            totalSelected: 0,
        };
    }

    const selectedPerfumes = MAIN_SLOT_KEYS.map((key) => normalized[key]);
    const giftPerfume = normalized.giftSlot;
    const allPerfumes = [...selectedPerfumes, giftPerfume];

    return {
        isValid: errors.length === 0,
        errors,
        normalizedSlots: normalized,
        selectedPerfumes,
        giftPerfume,
        totalSelected: allPerfumes.length,
    };
}
