"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { PERFUMES } from "@/data/perfumes";
import { Container } from "./Container";
import { getAssetPath, handleImageError } from "@/lib/assets";
import { Check, Plus, Search, Filter, Info, X } from "lucide-react";
import { IS_RAMADAN, MAX_CHOSEN } from "@/lib/offer-config";
import { useI18n } from "@/hooks/useI18n";

export function PerfumeGrid2Rows() {
    const { catalogFilter, selectedPerfumes, addPerfume, activeSlotIndex } = useStore();
    const { t, dir } = useI18n();
    const filledCount = selectedPerfumes.filter(p => p !== null).length;
    const isFull = filledCount >= MAX_CHOSEN;
    const [showAll, setShowAll] = useState(false);
    const [search, setSearch] = useState("");
    const [activeTier, setActiveTier] = useState<"all" | "classic" | "niche">("all");

    const filteredPerfumes = useMemo(() => {
        let pool = PERFUMES;
        // Catalog Filter logic
        if (catalogFilter === "femme") {
            pool = pool.filter(p => p.gender === "femme");
        } else if (catalogFilter === "homme") {
            pool = pool.filter(p => p.gender === "homme");
        }
        // if "all", no filter

        if (activeTier !== "all") pool = pool.filter(p => p.tier === activeTier);
        if (search) pool = pool.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        return pool;
    }, [catalogFilter, activeTier, search]);

    const displayPerfumes = showAll ? filteredPerfumes : filteredPerfumes.slice(0, 12);
    const isSelected = (id: string) => selectedPerfumes.some(p => p?.id === id);

    return (
        <section id="perfumes" className="py-20 md:py-32 relative overflow-hidden">
            <Container>
                {/* Header */}
                <div className="flex flex-col md:flex-row-reverse items-start md:items-center justify-between gap-6 mb-10 md:mb-16">
                    <div className="text-right" dir={dir}>
                        <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tight flex items-center justify-end gap-3 text-zinc-900">
                            <span className="primary-text-gradient">{t('all')}</span> {t('search').includes('ابحث') ? 'العطور' : 'Parfums'}
                        </h2>
                        <p className="text-zinc-500 text-sm md:text-base font-medium">
                            {t('select_perfumes').replace('x', String(filledCount))}
                        </p>
                    </div>

                    {/* Tier Filter + Search */}
                    <div className="flex flex-col sm:flex-row-reverse items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <div className="segmented-control flex-shrink-0 bg-white/50 border-zinc-200">
                            {(["all", "classic", "niche"] as const).map((tKey) => (
                                <button
                                    key={tKey}
                                    onClick={() => setActiveTier(tKey)}
                                    className={`seg-tab ${activeTier === tKey ? "active !bg-primary !text-white" : "!text-zinc-400"}`}
                                >
                                    {t(tKey as any)}
                                </button>
                            ))}
                        </div>

                        <div className="relative group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder={t('search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full sm:w-56 pr-10 pl-4 py-3 rounded-2xl bg-white/80 border border-zinc-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none text-right text-sm transition-all text-zinc-900"
                                dir={dir}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-6 md:gap-8">
                    <AnimatePresence mode="popLayout">
                        {displayPerfumes.map((perfume, idx) => {
                            const selected = selectedPerfumes.some(p => p?.id === perfume.id);

                            return (
                                <motion.div
                                    key={perfume.id}
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: idx * 0.04 }}
                                    onClick={() => !selected && addPerfume(perfume)}
                                    className={`card-tap group relative p-5 rounded-[2.5rem] border-2 transition-all duration-700 bg-white card-premium ${selected
                                        ? "border-[#C9A86A] bg-[#C9A86A]/5 shadow-xl shadow-[#C9A86A]/10"
                                        : (isFull && activeSlotIndex === null)
                                            ? "border-transparent opacity-50 grayscale cursor-not-allowed"
                                            : "border-transparent shadow-[0_15px_40px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_50px_-15px_rgba(0,0,0,0.12)] hover:border-zinc-100"
                                        }`}
                                >
                                    {/* Image Container */}
                                    <div className="aspect-[4/5] mb-5 overflow-hidden rounded-[2rem] bg-zinc-50 p-6 flex items-center justify-center relative">
                                        <div className={`absolute inset-0 transition-opacity duration-500 ${selected ? "opacity-100 bg-[#C9A86A]/5" : "opacity-0 group-hover:opacity-100 bg-black/3"}`} />
                                        <img
                                            src={perfume.image}
                                            alt={perfume.name}
                                            className={`w-full h-full object-contain transition-all duration-[1000ms] ${selected ? 'scale-105 brightness-105' : 'group-hover:scale-115'}`}
                                            onError={handleImageError}
                                            loading="lazy"
                                        />

                                        {/* Selected Indicator */}
                                        <AnimatePresence>
                                            {selected && (
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -20 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#C9A86A] flex items-center justify-center shadow-lg border-2 border-white z-10"
                                                >
                                                    <Check className="w-5 h-5 text-white stroke-[4px]" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className={`px-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
                                        <div className="text-[10px] uppercase font-black text-[#C9A86A] mb-2 tracking-[0.2em] opacity-80">
                                            {perfume.tier === "niche" ? "✨ EXCLUSIF" : "💎 ELIE"}
                                        </div>
                                        <h4 className="font-bold text-[14px] md:text-[16px] mb-5 text-zinc-900 truncate leading-tight">
                                            {perfume.name}
                                        </h4>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); if (!selected) addPerfume(perfume); }}
                                            className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 font-black text-xs ${selected
                                                ? "bg-[#C9A86A]/10 text-[#C9A86A] cursor-default"
                                                : (isFull && activeSlotIndex === null)
                                                    ? "bg-zinc-100 text-zinc-400 border border-transparent cursor-not-allowed"
                                                    : "bg-zinc-900 text-white hover:bg-[#C9A86A] hover:shadow-xl hover:shadow-[#C9A86A]/20"
                                                }`}
                                        >
                                            {selected ? <Check className="w-4 h-4 stroke-[3px]" /> : <Plus className="w-4 h-4 stroke-[3px]" />}
                                            <span>
                                                {selected
                                                    ? t('added')
                                                    : (isFull && activeSlotIndex === null) ? t('full') : t('add')}
                                            </span>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {!showAll && filteredPerfumes.length > 12 && (
                    <div className="mt-12 text-center">
                        <button
                            onClick={() => setShowAll(true)}
                            className="px-10 py-4 rounded-2xl bg-white border border-zinc-200 hover:border-primary/50 text-zinc-900 font-black text-base transition-all hover:scale-105 active:scale-95 shadow-sm"
                        >
                            <span className="hover:text-primary transition-colors">{t('search').includes('ابحث') ? 'عرض المزيد من العطور' : 'Voir plus de parfums'}</span>
                        </button>
                    </div>
                )}

                {filteredPerfumes.length === 0 && (
                    <div className="text-center py-24 bg-white/50 rounded-[3rem] border border-zinc-200">
                        <p className="text-zinc-400 text-lg" dir={dir}>{t('search').includes('ابحث') ? 'عذراً، لم نجد نتائج تطابق بحثك' : 'Aucun résultat trouvé'}</p>
                    </div>
                )}
            </Container>
        </section>
    );
}
