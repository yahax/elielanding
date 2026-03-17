import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "ar" | "fr";

type StoreState = {
    language: Language;
    setLanguage: (language: Language) => void;
};

export const useStore = create<StoreState>()(
    persist(
        (set) => ({
            language: "ar",
            setLanguage: (language) => set({ language }),
        }),
        {
            // Key bump avoids carrying stale legacy checkout state from older builds.
            name: "elie-storage-v6",
            partialize: (state) => ({ language: state.language }),
        }
    )
);
