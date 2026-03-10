import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Perfume, PERFUMES } from "@/data/perfumes";
import { MAX_CHOSEN } from "@/lib/offer-config";

export type PackType = "homme" | "femme" | "mixte";
export type CatalogFilter = "homme" | "femme" | "all";
export type Language = "ar" | "fr";
const CHECKOUT_SELECTION_COUNT = 5;
const CHECKOUT_TOTAL_SLOTS = 6;
const CHECKOUT_GIFT_SLOT = 5;
type CheckoutCustomer = {
    fullName: string;
    phone: string;
    city: string;
};

function createEmptyCheckoutSlots(): (string | null)[] {
    return Array(CHECKOUT_TOTAL_SLOTS).fill(null);
}

function isPerfumeEligibleForPack(perfume: Perfume, pack: PackType) {
    if (pack === "mixte") return true;
    return perfume.gender === pack;
}

interface StoreState {
    selectedPackType: PackType | null;
    catalogFilter: CatalogFilter;
    activeSlotIndex: number | null;
    selectedPerfumes: (Perfume | null)[];
    isDrawerOpen: boolean;
    isSelectorOpen: boolean;
    language: Language;
    checkoutPackType: PackType | null;
    checkoutSelectionSlots: (string | null)[];
    checkoutPerfumeIds: string[];
    checkoutGiftPerfumeId: string | null;
    checkoutCustomer: CheckoutCustomer;

    // Actions
    setPackType: (type: PackType) => void;
    setCheckoutPackType: (type: PackType) => void;
    setCheckoutSelectionSlots: (slots: (string | null)[]) => void;
    toggleCheckoutPerfume: (perfumeId: string) => void;
    setCheckoutGiftPerfumeId: (perfumeId: string | null) => void;
    setCheckoutCustomer: (patch: Partial<CheckoutCustomer>) => void;
    clearCheckoutFlow: () => void;
    setCatalogFilter: (filter: CatalogFilter) => void;
    setActiveSlotIndex: (index: number | null) => void;
    setLanguage: (lang: Language) => void;
    addPerfume: (perfume: Perfume) => void;
    removePerfume: (index: number) => void;
    clearPerfumes: () => void;
    setDrawerOpen: (open: boolean) => void;
    setSelectorOpen: (open: boolean) => void;
    suggestBundle: () => void;
    recommendByTags: (tags: string[]) => void;
}

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            selectedPackType: "mixte",
            catalogFilter: "all",
            activeSlotIndex: 0,
            selectedPerfumes: Array(MAX_CHOSEN).fill(null),
            isDrawerOpen: false,
            isSelectorOpen: false,
            language: "ar",
            checkoutPackType: null,
            checkoutSelectionSlots: createEmptyCheckoutSlots(),
            checkoutPerfumeIds: [],
            checkoutGiftPerfumeId: null,
            checkoutCustomer: {
                fullName: "",
                phone: "",
                city: "",
            },

            setCheckoutSelectionSlots: (slots) => {
                const { checkoutPackType } = get();
                if (!checkoutPackType) return;
                if (slots.length !== CHECKOUT_TOTAL_SLOTS) return;

                const cleaned: (string | null)[] = slots.map((slot) => {
                    if (!slot) return null;
                    const perfume = PERFUMES.find((candidate) => candidate.id === slot);
                    if (!perfume) return null;
                    if (!isPerfumeEligibleForPack(perfume, checkoutPackType)) return null;
                    return slot;
                });

                const deduped = createEmptyCheckoutSlots();
                cleaned.forEach((slot, index) => {
                    if (!slot) return;
                    if (deduped.includes(slot)) return;
                    deduped[index] = slot;
                });

                const checkoutPerfumeIds = deduped
                    .slice(0, CHECKOUT_SELECTION_COUNT)
                    .filter((slot): slot is string => Boolean(slot));

                const checkoutGiftPerfumeId = deduped[CHECKOUT_GIFT_SLOT];

                set({
                    checkoutSelectionSlots: deduped,
                    checkoutPerfumeIds,
                    checkoutGiftPerfumeId,
                });
            },

            setPackType: (type) => {
                set({
                    selectedPackType: type,
                    catalogFilter: type === 'mixte' ? 'all' : type,
                    activeSlotIndex: 0
                });

                // Scroll to builder section
                const builderSection = document.getElementById("builder");
                if (builderSection) {
                    builderSection.scrollIntoView({ behavior: "smooth" });
                }
            },

            setCheckoutPackType: (type) => {
                const current = get();
                if (current.checkoutPackType === type) {
                    return;
                }

                set({
                    checkoutPackType: type,
                    checkoutSelectionSlots: createEmptyCheckoutSlots(),
                    checkoutPerfumeIds: [],
                    checkoutGiftPerfumeId: null,
                    selectedPackType: type,
                    catalogFilter: type === "mixte" ? "all" : type,
                });
            },

            toggleCheckoutPerfume: (perfumeId) => {
                const { checkoutPackType, checkoutSelectionSlots } = get();
                if (!checkoutPackType) return;

                const perfume = PERFUMES.find((candidate) => candidate.id === perfumeId);
                if (!perfume) return;
                if (!isPerfumeEligibleForPack(perfume, checkoutPackType)) return;

                const nextSlots = [...checkoutSelectionSlots];
                const existingIndex = nextSlots.findIndex((slot) => slot === perfumeId);

                if (existingIndex !== -1 && existingIndex < CHECKOUT_SELECTION_COUNT) {
                    nextSlots[existingIndex] = null;
                } else if (existingIndex === -1) {
                    const emptyMainSlot = nextSlots
                        .slice(0, CHECKOUT_SELECTION_COUNT)
                        .findIndex((slot) => slot === null);
                    if (emptyMainSlot === -1) return;
                    nextSlots[emptyMainSlot] = perfumeId;
                } else {
                    return;
                }

                const checkoutPerfumeIds = nextSlots
                    .slice(0, CHECKOUT_SELECTION_COUNT)
                    .filter((slot): slot is string => Boolean(slot));
                const checkoutGiftPerfumeId = nextSlots[CHECKOUT_GIFT_SLOT];

                set({
                    checkoutSelectionSlots: nextSlots,
                    checkoutPerfumeIds,
                    checkoutGiftPerfumeId,
                });
            },

            setCheckoutGiftPerfumeId: (perfumeId) => {
                const { checkoutPackType, checkoutSelectionSlots } = get();
                if (!perfumeId) {
                    const nextSlots = [...checkoutSelectionSlots];
                    nextSlots[CHECKOUT_GIFT_SLOT] = null;
                    set({
                        checkoutSelectionSlots: nextSlots,
                        checkoutGiftPerfumeId: null,
                    });
                    return;
                }

                if (!checkoutPackType) return;
                const mainSelection = checkoutSelectionSlots
                    .slice(0, CHECKOUT_SELECTION_COUNT)
                    .filter((slot): slot is string => Boolean(slot));
                if (mainSelection.length !== CHECKOUT_SELECTION_COUNT) return;
                if (mainSelection.includes(perfumeId)) return;

                const perfume = PERFUMES.find((candidate) => candidate.id === perfumeId);
                if (!perfume) return;
                if (!isPerfumeEligibleForPack(perfume, checkoutPackType)) return;

                const nextSlots = [...checkoutSelectionSlots];
                const existingIndex = nextSlots.findIndex((slot) => slot === perfumeId);
                if (existingIndex !== -1) nextSlots[existingIndex] = null;
                nextSlots[CHECKOUT_GIFT_SLOT] = perfumeId;

                set({
                    checkoutSelectionSlots: nextSlots,
                    checkoutGiftPerfumeId: perfumeId,
                });
            },

            setCheckoutCustomer: (patch) => {
                set((state) => ({
                    checkoutCustomer: {
                        ...state.checkoutCustomer,
                        ...patch,
                    }
                }));
            },

            clearCheckoutFlow: () => {
                set({
                    checkoutPackType: null,
                    checkoutSelectionSlots: createEmptyCheckoutSlots(),
                    checkoutPerfumeIds: [],
                    checkoutGiftPerfumeId: null,
                    checkoutCustomer: {
                        fullName: "",
                        phone: "",
                        city: "",
                    },
                });
            },

            setCatalogFilter: (filter) => set({ catalogFilter: filter }),

            setActiveSlotIndex: (index) => set({ activeSlotIndex: index }),

            setLanguage: (lang) => set({ language: lang }),

            addPerfume: (perfume) => {
                const current = [...get().selectedPerfumes];
                const activeIndex = get().activeSlotIndex;

                let targetIndex = activeIndex;

                // 1. If no slot is explicitly active, find first empty
                if (targetIndex === null) {
                    const firstEmpty = current.findIndex((p) => p === null);
                    if (firstEmpty !== -1) {
                        targetIndex = firstEmpty;
                    }
                }

                // 2. If we have a target index (either active or first empty), fill it
                if (targetIndex !== null) {
                    current[targetIndex] = perfume;
                } else {
                    return; // Pack full and no slot active to override
                }

                // 3. Automatically find next *empty* slot for the next interaction
                const nextEmpty = current.findIndex((p) => p === null);
                set({
                    selectedPerfumes: current,
                    activeSlotIndex: nextEmpty === -1 ? null : nextEmpty,
                });
            },

            removePerfume: (index) => {
                const next = [...get().selectedPerfumes];
                next[index] = null;
                // When removing, make this specific slot active so user can fill it immediately
                set({
                    selectedPerfumes: next,
                    activeSlotIndex: index
                });
            },

            clearPerfumes: () => {
                set({
                    selectedPerfumes: Array(MAX_CHOSEN).fill(null),
                    activeSlotIndex: 0
                });
            },

            setDrawerOpen: (open) => set({ isDrawerOpen: open }),

            setSelectorOpen: (open) => set({ isSelectorOpen: open }),

            suggestBundle: () => {
                const packType = get().selectedPackType || 'mixte';
                let pool = PERFUMES;

                if (packType === "mixte") {
                    const femmes = PERFUMES.filter(p => p.gender === "femme").sort(() => 0.5 - Math.random()).slice(0, 3);
                    const hommes = PERFUMES.filter(p => p.gender === "homme").sort(() => 0.5 - Math.random()).slice(0, 3);
                    set({
                        selectedPerfumes: [...femmes, ...hommes].slice(0, MAX_CHOSEN),
                        activeSlotIndex: null
                    });
                    return;
                }

                const gender = packType === "homme" ? "homme" : "femme";
                pool = PERFUMES.filter(p => p.gender === gender).sort(() => 0.5 - Math.random());
                set({
                    selectedPerfumes: pool.slice(0, MAX_CHOSEN),
                    activeSlotIndex: null
                });
            },

            recommendByTags: (tags: string[]) => {
                const packType = get().selectedPackType || 'mixte';
                let pool = PERFUMES;

                if (packType !== "mixte") {
                    const gender = packType === "homme" ? "homme" : "femme";
                    pool = pool.filter(p => p.gender === gender);
                }

                const scored = pool.map(p => ({
                    perfume: p,
                    score: p.tags.filter(t => tags.includes(t)).length
                })).sort((a, b) => b.score - a.score);

                const recs = scored.slice(0, MAX_CHOSEN).map(s => s.perfume);

                set({
                    selectedPerfumes: recs,
                    activeSlotIndex: null
                });
            }
        }),
        {
            name: "elie-storage-v5",
            partialize: (state) => ({
                selectedPackType: state.selectedPackType,
                catalogFilter: state.catalogFilter,
                selectedPerfumes: state.selectedPerfumes,
                language: state.language,
                activeSlotIndex: state.activeSlotIndex,
                checkoutPackType: state.checkoutPackType,
                checkoutSelectionSlots: state.checkoutSelectionSlots,
                checkoutPerfumeIds: state.checkoutPerfumeIds,
                checkoutGiftPerfumeId: state.checkoutGiftPerfumeId,
                checkoutCustomer: state.checkoutCustomer,
            }),
        }
    )
);
