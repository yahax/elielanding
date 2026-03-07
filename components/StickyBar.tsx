"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { MAX_CHOSEN } from "@/lib/offer-config";
import { useI18n } from "@/hooks/useI18n";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";

export function StickyBar() {
    const { selectedPerfumes, setDrawerOpen } = useStore();
    const { t, dir, language } = useI18n();

    const filledCount = selectedPerfumes.filter(p => p !== null).length;
    const isComplete = filledCount === MAX_CHOSEN;
    const ProgressIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    return (
        <AnimatePresence>
            {filledCount > 0 && (
                <motion.div
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 120, opacity: 0 }}
                    transition={{ type: "spring", damping: 28, stiffness: 340 }}
                    className="fixed left-0 right-0 z-[52] p-3 md:p-6 pointer-events-none"
                    style={{ bottom: "calc(var(--safe-bottom, 0px) + 72px)" }}
                >
                    {/* Progress pill - Light Theme */}
                    <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-[24px] border border-zinc-200 shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden pointer-events-auto">
                        {/* Progress bar track */}
                        <div className="h-1.5 w-full bg-zinc-100">
                            <motion.div
                                className="h-full bg-primary shadow-[0_0_10px_rgba(198,163,78,0.4)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${(filledCount / MAX_CHOSEN) * 100}%` }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                        </div>

                        <div className={`flex items-center justify-between gap-3 px-4 py-3.5 ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`} dir={dir}>
                            {/* Slot icons - show 6 slots */}
                            <div className="flex gap-1 flex-shrink-0">
                                {[...Array(MAX_CHOSEN)].map((_, i) => {
                                    const p = selectedPerfumes[i];
                                    const isGift = i === 5;
                                    return (
                                        <div
                                            key={i}
                                            className={`w-7 h-9 rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all duration-400 ${p
                                                ? (isGift ? "border-amber-400 bg-amber-50" : "border-primary/40 bg-white")
                                                : "border-zinc-100 bg-zinc-50/50"}`}
                                        >
                                            {p ? (
                                                <motion.img
                                                    initial={{ scale: 0.4, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    src={p.image}
                                                    className="w-full h-full object-contain p-0.5"
                                                    onError={(e) => {
                                                        if (!e.currentTarget.src.includes("/placeholder.webp")) {
                                                            e.currentTarget.src = "/placeholder.webp";
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <span className={`text-[10px] font-black ${isGift ? "text-amber-400" : "text-zinc-200"}`}>
                                                    {isGift ? "🎁" : i + 1}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Status + CTA */}
                            <div className={`flex flex-col ${dir === 'rtl' ? 'items-end' : 'items-start'} gap-1.5 min-w-0 flex-shrink`}>
                                <div className="flex items-center gap-1.5">
                                    {isComplete && <Check className="w-3.5 h-3.5 text-green-600 font-bold" />}
                                    <span className={`text-[11px] font-black ${isComplete ? "text-green-600" : "text-zinc-400"} uppercase tracking-widest`}>
                                        {isComplete ? t('complete') : t('select_x_more').replace('x', String(MAX_CHOSEN - filledCount))}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setDrawerOpen(true)}
                                    className={`h-[64px] px-10 rounded-[16px] font-bold text-[18px] flex items-center gap-3 transition-all whitespace-nowrap active:scale-95 shadow-[0_12px_32px_rgba(201,168,106,0.25)] ${isComplete
                                        ? "bg-[#C9A86A] text-white gold-glow"
                                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                        }`}
                                >
                                    <span className="font-bold text-[18px] tracking-tight">{isComplete ? t('checkout') : (dir === 'rtl' ? 'إختر عطرك' : 'Choisir parfum')}</span>
                                    <ProgressIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
