"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useI18n } from "@/hooks/useI18n";
import { PERFUMES, Perfume } from "@/data/perfumes";
import { getAssetPath, handleImageError } from "@/lib/assets";
import { X, Search, Trash2, CheckCircle2 } from "lucide-react";

export function PerfumeSelector() {
    const {
        isSelectorOpen,
        setSelectorOpen,
        selectedPackType,
        activeSlotIndex,
        selectedPerfumes,
        addPerfume,
        removePerfume
    } = useStore();
    const { t, dir, language } = useI18n();
    const [searchQuery, setSearchQuery] = useState("");

    // Filter perfumes based on pack type and search query
    const filteredPerfumes = useMemo(() => {
        let pool = PERFUMES;

        // 1. Filter by Pack Category
        if (selectedPackType === "homme") {
            pool = pool.filter(p => p.gender === "homme");
        } else if (selectedPackType === "femme") {
            pool = pool.filter(p => p.gender === "femme");
        }

        // 2. Filter by Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            pool = pool.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.tags && p.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        }

        return pool;
    }, [selectedPackType, searchQuery]);

    const activePerfume = activeSlotIndex !== null ? selectedPerfumes[activeSlotIndex] : null;

    const handleSelect = (perfume: Perfume) => {
        addPerfume(perfume);
        setSelectorOpen(false);
        setSearchQuery("");
    };

    const handleRemove = () => {
        if (activeSlotIndex !== null) {
            removePerfume(activeSlotIndex);
            setSelectorOpen(false);
            setSearchQuery("");
        }
    };

    if (!isSelectorOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectorOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Content Container */}
                <motion.div
                    initial={window.innerWidth < 768 ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
                    animate={window.innerWidth < 768 ? { y: 0 } : { opacity: 1, scale: 1 }}
                    exit={window.innerWidth < 768 ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full md:max-w-2xl bg-white md:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[80vh]"
                    dir={dir}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div>
                            <h3 className="text-xl font-black text-zinc-900">
                                {t('choose_perfume')}
                            </h3>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                                {selectedPackType === 'mixte' ? t('pack_mixte') : selectedPackType === 'homme' ? t('pack_homme') : t('pack_femme')}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectorOpen(false)}
                            className="p-2 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search & Actions */}
                    <div className="p-4 bg-zinc-50/50 border-b border-zinc-100 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input
                                type="text"
                                placeholder={t('search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-transparent bg-white focus:border-primary/50 focus:ring-0 transition-all font-bold text-zinc-800 shadow-sm"
                            />
                        </div>

                        {activePerfume && (
                            <button
                                onClick={handleRemove}
                                className="w-full py-3 flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>{t('remove_perfume')}</span>
                            </button>
                        )}
                    </div>

                    {/* Perfume List */}
                    <div className="flex-grow overflow-y-auto p-4 md:p-6 no-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {filteredPerfumes.map((perfume) => {
                                const isSelected = selectedPerfumes.some(p => p?.id === perfume.id);
                                const isCurrentInSlot = activePerfume?.id === perfume.id;

                                return (
                                    <button
                                        key={perfume.id}
                                        onClick={() => handleSelect(perfume)}
                                        className={`group relative flex flex-col p-4 rounded-3xl bg-white border-2 transition-all duration-300 text-center ${isCurrentInSlot
                                                ? "border-amber-400 bg-amber-50 shadow-md"
                                                : "border-zinc-100 hover:border-primary/30 hover:shadow-lg"
                                            }`}
                                    >
                                        <div className="aspect-square mb-3 relative flex items-center justify-center p-2">
                                            <img
                                                src={getAssetPath(perfume.image)}
                                                alt={perfume.name}
                                                className="max-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500"
                                                onError={handleImageError}
                                            />
                                            {isSelected && (
                                                <div className="absolute top-0 right-0 p-1">
                                                    <CheckCircle2 className={`w-5 h-5 ${isCurrentInSlot ? 'text-amber-500' : 'text-primary'}`} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-tighter">
                                                ELIE
                                            </p>
                                            <p className="text-sm font-black text-zinc-800 leading-tight line-clamp-2">
                                                {perfume.name}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {filteredPerfumes.length === 0 && (
                            <div className="py-20 text-center space-y-3">
                                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
                                    <Search className="w-8 h-8 text-zinc-300" />
                                </div>
                                <p className="text-zinc-500 font-bold text-lg">
                                    {language === 'ar' ? 'لم يتم العثور على نتائج' : 'Aucun résultat trouvé'}
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
