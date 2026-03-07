"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { Container } from "./Container";
import { getAssetPath, handleImageError } from "@/lib/assets";
import { X, Gift, Plus } from "lucide-react";
import { MAX_CHOSEN } from "@/lib/offer-config";
import { useI18n } from "@/hooks/useI18n";
import { PerfumeSelector } from "./PerfumeSelector";

export function SlotsBuilder() {
    const {
        selectedPerfumes,
        removePerfume,
        suggestBundle,
        activeSlotIndex,
        setActiveSlotIndex,
        setSelectorOpen
    } = useStore();
    const { t, dir, language } = useI18n();
    const filledCount = selectedPerfumes.filter(p => p !== null).length;

    const handleSlotClick = (idx: number) => {
        setActiveSlotIndex(idx);
        setSelectorOpen(true);
    };

    return (
        <section id="builder" className="py-24 bg-white/60 border-y border-zinc-100 relative overflow-hidden">
            {/* Subtle luxury deco */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/2 rounded-full blur-3xl -mr-32 -mt-32" />

            <Container className="relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
                    <div className={`${dir === 'rtl' ? 'text-right' : 'text-left'} max-w-xl`} dir={dir}>
                        <h2 className="text-3xl md:text-5xl font-black mb-4 text-zinc-900 leading-tight">
                            {language === 'ar' ? 'اختر عطورك ' : 'Votre Pack '}<span className="primary-text-gradient">ELIE</span>
                        </h2>
                        <p className="text-zinc-500 font-bold text-lg">
                            {t('select_perfumes_count', { filled: filledCount }) || (dir === 'rtl' ? `اختر 6 عطور مفضلة لديك (${filledCount}/6)` : `Choisissez vos 6 parfums (${filledCount}/6)`)}
                        </p>
                    </div>

                    {/* Auto-suggest button removed for manual-only production phase */}
                </div>

                {/* ── 6 PREMIUM SLOTS ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                    {selectedPerfumes.map((perfume, idx) => {
                        const isEmpty = !perfume;
                        const isGift = idx === 5;
                        const isActive = activeSlotIndex === idx;

                        return (
                            <motion.div
                                key={idx}
                                initial={false}
                                animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                                className="relative group"
                            >
                                <div
                                    onClick={() => handleSlotClick(idx)}
                                    className={`aspect-[3/4] rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all duration-500 overflow-hidden relative cursor-pointer ${isActive
                                        ? "border-amber-400 bg-amber-50/50 shadow-[0_20px_40px_-15px_rgba(251,191,36,0.4)] ring-4 ring-amber-400/10"
                                        : isEmpty
                                            ? "border-dashed border-zinc-200 bg-white/40 hover:border-primary/40 hover:bg-white"
                                            : isGift ? "border-amber-400 bg-amber-50 shadow-md" : "border-primary/20 bg-white shadow-md hover:border-primary/40"
                                        }`}
                                >
                                    {/* Slot Background Number (Only when empty) */}
                                    {isEmpty && !isActive && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                                            <span className="text-9xl font-black text-black">{idx + 1}</span>
                                        </div>
                                    )}

                                    {!isEmpty ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="w-full h-full flex flex-col p-4 relative"
                                        >
                                            {/* Filled Slot */}
                                            <div className="relative group w-full h-full">
                                                {/* Remove Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removePerfume(idx);
                                                    }}
                                                    className="absolute top-2 right-2 z-20 p-2 rounded-full bg-white/90 text-zinc-400 hover:text-red-500 hover:bg-white shadow-sm transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>

                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                                                    <div className="relative w-full h-2/3 mb-2">
                                                        <motion.img
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            src={getAssetPath(perfume.image)}
                                                            alt={perfume.name}
                                                            className="w-full h-full object-contain drop-shadow-md"
                                                            onError={handleImageError}
                                                        />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className={`text-[10px] font-black uppercase tracking-tighter text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[90px]`}>
                                                            ELIE
                                                        </p>
                                                        <p className="text-[11px] font-black text-zinc-800 leading-tight line-clamp-2">
                                                            {perfume.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="text-center p-6 flex flex-col items-center gap-4">
                                            {isGift ? (
                                                <div className={isActive ? "animate-pulse" : ""}>
                                                    <Gift className={`w-12 h-12 ${isActive ? "text-amber-500" : "text-amber-400/40"}`} strokeWidth={1.5} />
                                                </div>
                                            ) : (
                                                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${isActive ? "border-amber-400 bg-amber-400 text-white" : "border-zinc-100 bg-zinc-50 text-zinc-300"}`}>
                                                    <Plus className="w-5 h-5" />
                                                </div>
                                            )}
                                            <div className={`text-xs font-bold uppercase tracking-widest ${isActive ? "text-[#C9A86A]" : "text-zinc-400"}`}>
                                                {isGift ? (t('gift') || 'OFFERT') : (dir === 'rtl' ? 'إختر عطرك' : 'Choisir parfum')}
                                            </div>
                                        </div>
                                    )}

                                    {/* Active Pulse Background */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-amber-400/5 animate-pulse pointer-events-none" />
                                    )}

                                    {/* Gift Badge */}
                                    {isGift && (
                                        <div className={`absolute top-0 right-0 ${isActive ? 'bg-amber-500' : 'bg-amber-400'} text-[10px] font-black text-white px-3 py-1 rounded-bl-2xl shadow-md z-20`}>
                                            {t('gift') || 'OFFERT'}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </Container>

            <PerfumeSelector />
        </section>
    );
}
