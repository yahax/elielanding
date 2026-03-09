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
 * Mixte, Femme, Homme
 */
const OFFERS: { id: PackType; titleKey: string; descKey: string; img: string }[] = [
    {
        id: "mixte",
        titleKey: "pack_mixte",
        descKey: "pack_mixte_desc",
        img: "/catalogues/imag-landing/Mobile/Mobile-version-mixte.webp",
    },
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 max-w-6xl mx-auto px-4 md:px-0">
                    {OFFERS.map((offer) => {
                        const isSelected = selectedPackType === offer.id;

                        return (
                            <motion.div
                                key={offer.id}
                                whileHover={{ y: -12 }}
                                onClick={() => handleSelectPack(offer.id)}
                                className={`group relative flex flex-col rounded-[2.5rem] bg-white transition-all duration-700 cursor-pointer overflow-hidden border-2 ${isSelected
                                    ? "border-[#C9A86A] shadow-[0_30px_70px_-15px_rgba(198,163,78,0.4)] ring-[6px] ring-[#C9A86A]/10"
                                    : "border-transparent shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] hover:border-zinc-200"
                                    }`}
                            >
                                {/* Top Section: Image */}
                                <div className="aspect-[4/5] overflow-hidden bg-zinc-50 relative">
                                    <img
                                        src={getAssetPath(offer.img)}
                                        alt={t(offer.titleKey as any) || getFallbackLabel(offer.id, 'title')}
                                        className={`w-full h-full object-cover transition-transform duration-[1200ms] ease-out ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}
                                    />
                                    {/* Premium Readability Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-500" />

                                    {/* Content - Bottom Aligned for Premium Look */}
                                    <div className="absolute bottom-0 left-0 right-0 p-8 z-10" dir={dir}>
                                        <h3 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
                                            {t(offer.titleKey as any) || getFallbackLabel(offer.id, 'title')}
                                        </h3>
                                        <p className="text-white/90 text-sm md:text-base font-medium line-clamp-2 leading-relaxed">
                                            {t(offer.descKey as any) || getFallbackLabel(offer.id, 'desc')}
                                        </p>
                                    </div>

                                    {/* Selected Badge Over Image */}
                                    <AnimatePresence>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0, rotate: -20 }}
                                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                                className="absolute top-8 right-8 w-14 h-14 rounded-full bg-[#C9A86A] shadow-xl flex items-center justify-center border-4 border-white z-20"
                                            >
                                                <Check className="w-8 h-8 text-white stroke-[3.5px]" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Middle Section: Content */}
                                <div className={`p-9 flex-grow flex flex-col items-center text-center ${dir === 'rtl' ? 'rtl' : 'ltr'}`} dir={dir}>
                                    <h3 className={`text-2xl font-black mb-4 ${isSelected ? 'text-[#C9A86A]' : 'text-zinc-900'}`}>
                                        {t(offer.titleKey as any) || getFallbackLabel(offer.id, 'title')}
                                    </h3>
                                    <p className="text-zinc-500 font-medium mb-10 leading-relaxed text-sm md:text-base">
                                        {t(offer.descKey as any) || getFallbackLabel(offer.id, 'desc')}
                                    </p>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectPack(offer.id);
                                        }}
                                        className={`mt-auto w-full h-[68px] rounded-[18px] font-black text-[18px] transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden relative ${isSelected
                                            ? "bg-[#C9A86A] text-white shadow-xl shadow-[#C9A86A]/30"
                                            : "bg-zinc-900 text-white group-hover:bg-[#C9A86A] group-hover:shadow-xl group-hover:shadow-[#C9A86A]/30"
                                            }`}
                                    >
                                        {isSelected && <Check className="w-6 h-6 flex-shrink-0 stroke-[3px]" />}
                                        <span className="relative z-10">
                                            {isSelected
                                                ? getFallbackLabel(offer.id, 'selected')
                                                : getFallbackLabel(offer.id, 'cta')}
                                        </span>
                                    </button>
                                </div>

                                {/* Selection Overlay */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-[#C9A86A]/5 pointer-events-none" />
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
