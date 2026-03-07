import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Perfume, PERFUMES } from "@/data/perfumes";
import { MAX_CHOSEN } from "@/lib/offer-config";

export type PackType = "homme" | "femme" | "mixte";
export type CatalogFilter = "homme" | "femme" | "all";
export type Language = "ar" | "fr";

interface StoreState {
    selectedPackType: PackType | null;
    catalogFilter: CatalogFilter;
    activeSlotIndex: number | null;
    selectedPerfumes: (Perfume | null)[];
    isDrawerOpen: boolean;
    isSelectorOpen: boolean;
    language: Language;

    // Actions
    setPackType: (type: PackType) => void;
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
            selectedPackType: "femme", // default to femme as before
            catalogFilter: "femme",
            activeSlotIndex: 0,
            selectedPerfumes: Array(MAX_CHOSEN).fill(null),
            isDrawerOpen: false,
            isSelectorOpen: false,
            language: "ar",

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
            name: "elie-storage-v4", // bumped version
            partialize: (state) => ({
                selectedPackType: state.selectedPackType,
                catalogFilter: state.catalogFilter,
                selectedPerfumes: state.selectedPerfumes,
                language: state.language,
                activeSlotIndex: state.activeSlotIndex,
            }),
        }
    )
);
