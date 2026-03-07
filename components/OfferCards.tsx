"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, PackType } from "@/store/useStore";
import { Container } from "./Container";
import { SmartQuiz } from "./SmartQuiz";
import { useI18n } from "@/hooks/useI18n";
import { getAssetPath } from "@/lib/assets";
import { Check, Package } from "lucide-react";

/**
 * 3 Premium Cards for Pack Selection
 * Homme, Femme, Mixte
 */
const OFFERS: { id: PackType; titleKey: string; descKey: string; img: string }[] = [
    {
        id: "femme",
        titleKey: "pack_femme",
        descKey: "pack_femme_desc",
        img: "/catalogues/imag-landing/Mobile/Mobile-version-femme.webp",
    },
    {
        id: "homme",
        titleKey: "pack_homme",
        descKey: "pack_homme_desc",
        img: "/catalogues/imag-landing/Mobile/Mobile-version-homme.webp",
    },
    {
        id: "mixte",
        titleKey: "pack_mixte",
        descKey: "pack_mixte_desc",
        img: "/catalogues/imag-landing/Mobile/Mobile-version-mixte.webp",
    },
];

export function OfferCards() {
    const { selectedPackType, setPackType } = useStore();
    const { t, dir } = useI18n();

    const handleSelectPack = (id: PackType) => {
        setPackType(id);
        const builderSection = document.getElementById("builder");
        if (builderSection) {
            builderSection.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Mapping for explicit labels if translation is missing
    const getFallbackLabel = (id: string, type: 'title' | 'desc' | 'cta' | 'selected') => {
        const fallbacks: any = {
            title: { femme: 'Pack Femme', homme: 'Pack Homme', mixte: 'Pack Mixte' },
            desc: {
                femme: '6 Parfums Élégance Féminine',
                homme: '6 Parfums Force & Caractère',
                mixte: '6 Parfums Mixte (Homme + Femme)'
            },
            cta: dir === 'rtl' ? 'اختيار هذا العرض' : 'Choisir ce pack',
            selected: dir === 'rtl' ? 'تم الاختيار ✓' : 'Sélectionné ✓'
        };
        if (type === 'cta' || type === 'selected') return fallbacks[type];
        return fallbacks[type][id];
    };

    return (
        <section id="offers" className="py-24 bg-zinc-50/50 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber-400/5 blur-3xl" />
            </div>

            <Container className="relative z-10">
                <div className="text-center mb-16" dir={dir}>
                    <h2 className="text-3xl md:text-5xl font-black mb-4 text-zinc-900 leading-tight">
                        {dir === 'rtl' ? 'اختر Pack ELIE المفضل' : 'Choisissez votre Pack'}
                    </h2>
                    <p className="text-zinc-500 font-bold max-w-xl mx-auto text-lg leading-relaxed">
                        {dir === 'rtl' ? 'ابدأ تجربتك الفاخرة باختيار العرض المناسب لك' : 'Commencez votre expérience de luxe en choisissant l\'offre qui vous convient'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto">
                    {OFFERS.map((offer) => {
                        const isSelected = selectedPackType === offer.id;

                        return (
                            <motion.div
                                key={offer.id}
                                whileHover={{ y: -8 }}
                                onClick={() => handleSelectPack(offer.id)}
                                className={`group relative flex flex-col rounded-[2.5rem] bg-white transition-all duration-500 cursor-pointer overflow-hidden border-2 ${isSelected
                                    ? "border-amber-400 shadow-[0_25px_60px_-15px_rgba(251,191,36,0.3)] ring-4 ring-amber-400/5"
                                    : "border-transparent shadow-[0_15px_35px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_45px_-15px_rgba(0,0,0,0.1)] hover:border-zinc-200"
                                    }`}
                            >
                                {/* Top Section: Image */}
                                <div className="aspect-[4/5] overflow-hidden bg-zinc-50 relative">
                                    <img
                                        src={getAssetPath(offer.img)}
                                        alt={t(offer.titleKey as any) || getFallbackLabel(offer.id, 'title')}
                                        className={`w-full h-full object-cover transition-transform duration-1000 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}
                                    />
                                    {/* Premium Readability Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />

                                    {/* Content - Bottom Aligned for Premium Look */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 z-10" dir={dir}>
                                        <h3 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
                                            {t(offer.titleKey as any) || getFallbackLabel(offer.id, 'title')}
                                        </h3>
                                        <p className="text-white/80 text-sm md:text-base font-medium line-clamp-2">
                                            {t(offer.descKey as any) || getFallbackLabel(offer.id, 'desc')}
                                        </p>
                                    </div>

                                    {/* Selected Badge Over Image */}
                                    <AnimatePresence>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-amber-400 shadow-lg flex items-center justify-center border-4 border-white z-20"
                                            >
                                                <Check className="w-6 h-6 text-white stroke-[3px]" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Middle Section: Content */}
                                <div className={`p-8 flex-grow flex flex-col items-center text-center ${dir === 'rtl' ? 'rtl' : 'ltr'}`} dir={dir}>
                                    <h3 className={`text-2xl font-black mb-3 ${isSelected ? 'text-amber-600' : 'text-zinc-900'}`}>
                                        {t(offer.titleKey as any) || getFallbackLabel(offer.id, 'title')}
                                    </h3>
                                    <p className="text-zinc-500 font-bold mb-8 leading-relaxed">
                                        {t(offer.descKey as any) || getFallbackLabel(offer.id, 'desc')}
                                    </p>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectPack(offer.id);
                                        }}
                                        className={`mt-auto w-full h-[64px] rounded-[16px] font-bold text-[18px] transition-all flex items-center justify-center gap-3 overflow-hidden relative ${isSelected
                                            ? "bg-[#C9A86A] text-white shadow-xl shadow-[#C9A86A]/20"
                                            : "bg-zinc-900 text-white group-hover:bg-[#C9A86A] group-hover:shadow-xl group-hover:shadow-[#C9A86A]/20"
                                            }`}
                                    >
                                        {isSelected && <Check className="w-5 h-5 flex-shrink-0" />}
                                        <span className="relative z-10">
                                            {isSelected
                                                ? getFallbackLabel(offer.id, 'selected')
                                                : getFallbackLabel(offer.id, 'cta')}
                                        </span>
                                    </button>
                                </div>

                                {/* Selection Overlay */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-amber-400/5 pointer-events-none" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Optional Quiz CTA */}
                <div className="mt-20">
                    <SmartQuiz />
                </div>
            </Container>
        </section>
    );
}
