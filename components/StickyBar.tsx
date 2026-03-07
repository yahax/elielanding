"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { MAX_CHOSEN } from "@/lib/offer-config";
import { useI18n } from "@/hooks/useI18n";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";

export function StickyBar() {
    const { selectedPerfumes, setDrawerOpen } = useStore();
    const { t, dir } = useI18n();

    const filledCount = selectedPerfumes.filter(p => p !== null).length;
    const isComplete = filledCount === MAX_CHOSEN;
    const isRTL = dir === 'rtl';

    return (
        <AnimatePresence>
            {filledCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="fixed left-0 right-0 z-[60] p-4 md:p-8 pointer-events-none flex justify-center bottom-12 md:bottom-16"
                >
                    {/* Premium Floating Card */}
                    <div className="w-full max-w-[420px] bg-white rounded-[32px] border border-zinc-100 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.2)] pointer-events-auto overflow-hidden p-3 md:p-4">
                        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`} dir={dir}>

                            {/* Left/Right: Thumbnails (Secondary) */}
                            <div className="flex -space-x-2 flex-shrink-0 px-2">
                                {selectedPerfumes.filter(p => p !== null).map((p, i) => (
                                    <motion.div
                                        key={`thumb-${i}-${p?.id}`}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="w-10 h-12 rounded-xl bg-zinc-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center p-1"
                                    >
                                        <img src={p?.image} className="w-full h-full object-contain" />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Center/Right: Info & CTA */}
                            <div className={`flex-grow flex flex-col ${isRTL ? 'items-end' : 'items-start'} min-w-0 pr-2`}>
                                {isComplete ? (
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[12px] font-black text-green-600 uppercase tracking-widest animate-pulse">
                                            {t('sticky_success')}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                                        {t('select_x_more').replace('x', String(MAX_CHOSEN - filledCount))}
                                    </div>
                                )}

                                <button
                                    onClick={() => setDrawerOpen(true)}
                                    className={`w-full h-[64px] rounded-[20px] font-black text-[18px] flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-lg ${isComplete
                                        ? "bg-gradient-to-r from-[#C9A86A] to-[#B69559] text-white shadow-[#C9A86A]/30"
                                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                        }`}
                                    disabled={!isComplete}
                                >
                                    <span>{t('hero_cta_primary')}</span>
                                    {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
