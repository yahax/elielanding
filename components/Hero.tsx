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
                        transition={{ duration: 0.9 }}
                        className="absolute inset-0 z-0"
                    >
                        <div ref={decoRef} className="absolute inset-0">
                            <img
                                src={bgUrl}
                                alt="ELIE Parfum Hero"
                                className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000"
                                onError={handleImageError}
                            />
                        </div>
                        {/* Directional Gradents for readability without washed-out look */}
                        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-white/40 via-transparent to-white/80 md:hidden" />
                        <div className={`absolute inset-0 z-[1] hidden md:block ${dir === 'rtl' ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-white/90 via-white/20 to-transparent max-w-[50%]`} />
                    </motion.div>
                </AnimatePresence>

                {/* ── MOBILE LAYOUT ── */}
                <div className="relative z-10 flex md:hidden w-full flex-col justify-end pb-32 pt-16 min-h-[100svh]">
                    {/* Logo Top Center */}
                    <div className="absolute top-6 left-0 right-0 flex justify-center">
                        <img
                            src="/catalogues/brand/logo-noir.png"
                            alt="ELIE"
                            className="h-8 w-auto"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `<div class="text-zinc-900 font-bold text-xl tracking-widest">ELIE</div>`;
                            }}
                        />
                    </div>

                    {/* Offer Badge */}
                    <div className="flex justify-center mb-5">
                        <span className="px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-md border border-primary/20 text-primary text-[13px] font-black flex items-center justify-center gap-2 shadow-sm">
                            ✨ {t('hero_badge')}
                        </span>
                    </div>

                    {/* Mobile Text Section */}
                    <div className="px-5 text-center" dir={dir}>
                        <h1 className="text-[38px] font-black mb-3 leading-[1.15] text-[#111111] text-shadow-premium">
                            {t('hero_title_1')} <br />
                            <span className="text-[#C9A86A] tracking-tight">{t('hero_title_2')} 🎁</span>
                        </h1>

                        <p className="text-[15px] text-zinc-500 mb-6 leading-relaxed px-2 font-medium">
                            {t('hero_description')}
                        </p>

                        {/* Trust Badges Row - Reduced friction rounded chips */}
                        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                            {[
                                { icon: "🚚", label: t('free_delivery') },
                                { icon: "💰", label: t('payment_on_delivery') },
                                { icon: "🎁", label: t('gift_included') },
                            ].map((b) => (
                                <div key={b.label} className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-100 shadow-sm flex items-center gap-2">
                                    <span className="text-base">{b.icon}</span>
                                    <span className="text-[11px] text-zinc-800 font-bold uppercase tracking-wider">
                                        {b.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* CTA Zone Redesign */}
                        <div className="flex flex-col gap-3 mt-4">
                            <a
                                href="#builder"
                                className="wa-shimmer h-[64px] w-full rounded-[16px] bg-primary text-white font-bold text-[18px] flex items-center justify-center gap-3 shadow-[0_12px_32px_rgba(198,163,78,0.25)] active:scale-95 transition-all"
                            >
                                <span>{t('view_perfumes')}</span>
                                <ArrowRight className="w-6 h-6" />
                            </a>
                            <a
                                href="#perfumes"
                                className="h-[54px] w-full rounded-[16px] bg-white/80 backdrop-blur-sm border border-zinc-200 text-zinc-800 font-bold text-[15px] flex items-center justify-center shadow-sm active:scale-95 transition-all"
                            >
                                {t('browse_now')}
                            </a>
                        </div>
                    </div>
                </div>

                {/* ── DESKTOP LAYOUT ── */}
                <Container className="hidden md:block relative z-10">
                    <div className={`max-w-2xl ${dir === 'rtl' ? 'mr-auto text-right' : 'ml-auto text-left'}`}>
                        <motion.div
                            initial={{ opacity: 0, x: dir === 'rtl' ? -50 : 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                        >
                            <div className={`flex ${dir === 'rtl' ? 'justify-end' : 'justify-start'} mb-8`}>
                                <span className="px-8 py-3 rounded-full bg-white/60 backdrop-blur-lg border border-primary/20 text-primary text-xl font-black shadow-sm">
                                    {t('hero_badge')} ✨
                                </span>
                            </div>

                            <h1 className="text-64px font-black mb-8 leading-[1.1] tracking-tight text-[#111111] text-shadow-premium">
                                {t('hero_title_1')} <br />
                                <span className="text-[#C9A86A]">{t('hero_title_2')} 🎁</span>
                            </h1>

                            <p className="text-xl md:text-2xl text-zinc-500 mb-8 font-bold leading-relaxed">
                                {t('hero_description')}
                            </p>

                            <div className={`flex items-center ${dir === 'rtl' ? 'justify-end' : 'justify-start'} gap-4 mb-12`}>
                                {[
                                    { icon: "🚚", label: t('free_delivery') },
                                    { icon: "💰", label: t('payment_on_delivery') },
                                    { icon: "🎁", label: t('gift_included') },
                                ].map((b) => (
                                    <div key={b.label} className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border border-zinc-100 shadow-sm flex items-center gap-3">
                                        <span className="text-xl">{b.icon}</span>
                                        <span className="text-sm text-zinc-800 font-bold uppercase tracking-widest">{b.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className={`flex flex-col sm:flex-row ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'} gap-4 mb-16`}>
                                <a
                                    href="#builder"
                                    className="wa-shimmer h-[64px] px-12 rounded-[16px] bg-primary hover:bg-primary/90 text-white font-bold text-[18px] hover:scale-105 transition-all shadow-[0_12px_32px_rgba(198,163,78,0.25)] flex items-center justify-center gap-3 group"
                                >
                                    <span>{t('checkout')}</span>
                                    {dir === 'rtl' ? <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                                </a>
                                <a
                                    href="#perfumes"
                                    className="h-[64px] px-12 rounded-[16px] bg-white border border-zinc-200 text-zinc-800 font-bold text-[18px] hover:bg-zinc-50 transition-colors flex items-center justify-center shadow-sm hover:scale-105"
                                >
                                    {t('view_perfumes')}
                                </a>
                            </div>

                            <p className={`text-sm text-zinc-400 font-bold leading-relaxed ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {(t('hero_footer') as string).split('\n').map((line: string, i: number) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        <br />
                                    </React.Fragment>
                                ))}
                            </p>
                        </motion.div>
                    </div>
                </Container>

                {/* Desktop Price Badge */}
                <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: 20 }}
                    animate={{ scale: 1, opacity: 1, rotate: -10 }}
                    transition={{ delay: 1, type: "spring" }}
                    className={`hidden lg:flex absolute bottom-12 ${dir === 'rtl' ? 'left-12' : 'right-12'} w-44 h-44 bg-white rounded-full flex-col items-center justify-center border-4 border-primary shadow-[0_20px_60px_rgba(0,0,0,0.08)] z-20`}
                >
                    <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
                    <span className="text-[13px] text-zinc-400 font-black uppercase tracking-widest mb-1 z-10 text-center px-4 leading-tight">{t('pack_price_label')}</span>
                    <div className="flex items-baseline gap-1 z-10">
                        <span className="text-4xl font-black text-primary">199</span>
                        <span className="text-lg font-black text-primary/70">DH</span>
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
