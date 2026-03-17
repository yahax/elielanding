"use client";

import React from "react";
import { useStore } from "@/store/useStore";

export function LanguageSwitcher() {
    const language = useStore((state) => state.language);
    const setLanguage = useStore((state) => state.setLanguage);

    return (
        <div className="flex items-center gap-1 p-1 bg-white/60 backdrop-blur-md rounded-full border border-zinc-200 shadow-sm" dir="ltr">
            <button
                onClick={() => setLanguage("fr")}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${language === "fr"
                        ? "bg-primary text-white shadow-md"
                        : "text-zinc-400 hover:text-zinc-600"
                    }`}
            >
                FR
            </button>
            <button
                onClick={() => setLanguage("ar")}
                className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${language === "ar"
                        ? "bg-primary text-white shadow-md"
                        : "text-zinc-400 hover:text-zinc-600"
                    }`}
            >
                عربي
            </button>
        </div>
    );
}
