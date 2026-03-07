"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { handleImageError } from "@/lib/assets";
import { Container } from "./Container";
import { useI18n } from "@/hooks/useI18n";

export function Hero() {
    const selectedPackType = useStore((state) => state.selectedPackType);
    const { t, dir, language } = useI18n();
    const [isMobile, setIsMobile] = useState(false);
    const decoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const backgrounds = {
        femme: isMobile
            ? "/catalogues/imag-landing/Mobile/Mobile-version-femme.webp"
            : "/catalogues/imag-landing/Desktop/Desktop-Hero-Femme.webp",
        homme: isMobile
            ? "/catalogues/imag-landing/Mobile/Mobile-version-homme.webp"
            : "/catalogues/imag-landing/Desktop/Desktop-Hero-Homme.webp",
        mixte: isMobile
            ? "/catalogues/imag-landing/Mobile/Mobile-version-mixte.webp"
            : "/catalogues/imag-landing/Desktop/Desktop-Hero-Mixte.webp",
    };

    const bgUrl = backgrounds[selectedPackType || "mixte"];

    return (
        <>
            <section
                className="relative w-full overflow-hidden flex flex-col md:flex-row md:items-center"
                style={{ minHeight: "100svh" }}
            >
                {/* ── BACKGROUND ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={bgUrl}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2 }}
                        className="absolute inset-0 z-0"
                    >
                        <div ref={decoRef} className="absolute inset-0">
                            <img
                                src={bgUrl}
                                alt="ELIE Parfum Hero"
                                className="h-full w-full object-cover object-center scale-100 transition-transform duration-[2000ms] ease-out"
                                onError={handleImageError}
                            />
                        </div>

                        {/* 
                            NO WHITE FOG. 
                            The photos stay visible, rich, cinematic and warm.
                            Very subtle localized dark gradient at the bottom/side ONLY for text contrast if needed.
                        */}
                        <div className="absolute inset-0 z-[1] bg-black/10 md:bg-transparent" />

                        {/* Text Legibility Gradient - Desktop (Side) */}
                        <div className={`absolute inset-0 z-[1] hidden md:block ${dir === 'rtl'
                            ? 'bg-gradient-to-l from-black/20 via-transparent to-transparent'
                            : 'bg-gradient-to-r from-black/20 via-transparent to-transparent'} max-w-[40%]`}
                        />

                        {/* Text Legibility Gradient - Mobile (Bottom) */}
                        <div className="absolute inset-0 z-[1] md:hidden bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </motion.div>
                </AnimatePresence>

                {/* ── MOBILE LAYOUT ── */}
                <div className="relative z-10 flex md:hidden w-full flex-col justify-end pb-32 pt-16 min-h-[100svh]">
                    {/* Logo Top Center */}
                    <div className="absolute top-10 left-0 right-0 flex justify-center">
                        <img
                            src="/catalogues/brand/logo-white.png"
                            alt="ELIE"
                            className="h-10 w-auto brightness-200"
                        />
                    </div>

                    {/* Mobile Text Section */}
                    <div className="px-6 text-center" dir={dir}>
                        {/* EB: Eyebrow hierarchy */}
                        <div className="flex flex-col items-center gap-1 mb-6">
                            <span className="text-[#C9A86A] text-[14px] font-black uppercase tracking-[0.2em] drop-shadow-md">
                                {t('hero_eyebrow_1')}
                            </span>
                            <span className="text-white text-[18px] font-black drop-shadow-lg">
                                {t('hero_eyebrow_2')}
                            </span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-[28px] font-bold mb-6 leading-[1.3] text-white drop-shadow-2xl px-2">
                            {t('hero_headline')}
                        </h1>

                        {/* Support Line */}
                        <p className="text-[14px] text-white/80 mb-10 leading-relaxed font-medium drop-shadow-md italic">
                            {t('hero_support')}
                        </p>

                        {/* CTA Zone */}
                        <div className="flex flex-col gap-4 mt-2">
                            <a
                                href="#builder"
                                className="wa-shimmer h-[72px] w-full rounded-[20px] bg-gradient-to-r from-[#C9A86A] to-[#B69559] text-white font-black text-[20px] flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 transition-all"
                            >
                                <span>{t('hero_cta_primary')}</span>
                                {dir === 'rtl' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                            </a>
                            <a
                                href="#offers"
                                className="h-[64px] w-full rounded-[20px] bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-[17px] flex items-center justify-center active:scale-95 transition-all"
                            >
                                {t('hero_cta_secondary')}
                            </a>
                        </div>
                    </div>
                </div>

                {/* ── DESKTOP LAYOUT ── */}
                <Container className="hidden md:block relative z-10">
                    <div className={`max-w-3xl ${dir === 'rtl' ? 'mr-0 text-right' : 'ml-0 text-left'}`}>
                        <motion.div
                            initial={{ opacity: 0, x: dir === 'rtl' ? 50 : -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 1 }}
                        >
                            {/* Eyebrow badge-like hierarchy */}
                            <div className={`flex flex-col ${dir === 'rtl' ? 'items-end' : 'items-start'} gap-2 mb-10`}>
                                <div className="px-5 py-2 rounded-full bg-[#C9A86A]/20 backdrop-blur-md border border-[#C9A86A]/30">
                                    <span className="text-[#C9A86A] text-sm font-black uppercase tracking-[0.25em]">
                                        {t('hero_eyebrow_1')}
                                    </span>
                                </div>
                                <span className="text-white text-3xl font-black drop-shadow-xl">
                                    {t('hero_eyebrow_2')}
                                </span>
                            </div>

                            {/* Main Headline Rebuild */}
                            <h1 className="text-5xl lg:text-6xl font-black mb-10 leading-[1.15] tracking-tight text-white drop-shadow-2xl max-w-[850px]">
                                {t('hero_headline')}
                            </h1>

                            {/* Support Line */}
                            <p className="text-xl text-white/90 mb-12 font-medium leading-relaxed max-w-xl drop-shadow-lg italic">
                                {t('hero_support')}
                            </p>

                            {/* CTA Zone */}
                            <div className={`flex items-center ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'} gap-6 mb-16`}>
                                <a
                                    href="#builder"
                                    className="wa-shimmer h-[76px] px-16 rounded-[22px] bg-gradient-to-r from-[#C9A86A] to-[#B69559] hover:to-[#C9A86A] text-white font-black text-[22px] hover:scale-[1.04] active:scale-95 transition-all shadow-[0_25px_50px_rgba(0,0,0,0.35)] flex items-center justify-center gap-4 group"
                                >
                                    <span>{t('hero_cta_primary')}</span>
                                    {dir === 'rtl' ? <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                                </a>
                                <a
                                    href="#offers"
                                    className="h-[76px] px-12 rounded-[22px] bg-white text-zinc-900 font-bold text-[19px] hover:bg-zinc-50 transition-all flex items-center justify-center shadow-lg hover:scale-[1.04] active:scale-95"
                                >
                                    {t('hero_cta_secondary')}
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </Container>

                {/* Desktop Price Badge - Adjusted for balance */}
                <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: 20 }}
                    animate={{ scale: 1, opacity: 1, rotate: -10 }}
                    transition={{ delay: 1, type: "spring" }}
                    className={`hidden lg:flex absolute bottom-20 ${dir === 'rtl' ? 'left-24' : 'right-24'} w-48 h-48 bg-white rounded-full flex-col items-center justify-center border-[8px] border-[#C9A86A]/10 shadow-[0_30px_70px_rgba(0,0,0,0.15)] z-20`}
                >
                    <div className="absolute inset-0 rounded-full bg-[#C9A86A]/5" />
                    <span className="text-[14px] text-zinc-400 font-black uppercase tracking-[0.1em] mb-1 z-10 text-center px-4 leading-tight">{t('pack_price_label')}</span>
                    <div className="flex items-baseline gap-1 z-10">
                        <span className="text-6xl font-black text-[#C9A86A]">199</span>
                        <span className="text-2xl font-black text-[#C9A86A]/70">DH</span>
                    </div>
                </motion.div>
            </section>
        </>
    );
}

// Helper icons
function ArrowRight(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}

function ArrowLeft(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
        </svg>
    )
}
