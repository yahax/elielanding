"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { PACKS } from "@/lib/packs";
import { useStore } from "@/store/useStore";

export function LandingHero() {
    const { t, isRTL, dir, language } = useI18n();
    const clearCheckoutFlow = useStore((state) => state.clearCheckoutFlow);
    const setCheckoutPackType = useStore((state) => state.setCheckoutPackType);
    const heroPack = PACKS.mixte;

    return (
        <section className="relative overflow-hidden pt-24 sm:pt-28">
            <div className="relative min-h-[90svh] sm:min-h-[88svh]">
                <picture>
                    <source media="(max-width: 767px)" srcSet={heroPack.heroMobile} />
                    <img
                        src={heroPack.heroDesktop}
                        alt="ELIE Parfum"
                        className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-500"
                    />
                </picture>

                <div
                    className={`absolute inset-y-0 z-[1] hidden w-[min(92vw,840px)] md:block ${isRTL
                        ? "right-0 bg-gradient-to-l from-black/72 via-black/42 to-transparent"
                        : "left-0 bg-gradient-to-r from-black/72 via-black/42 to-transparent"
                        }`}
                />
                <div className="absolute inset-x-0 bottom-0 z-[1] h-[62%] bg-gradient-to-t from-black/70 via-black/26 to-transparent md:hidden" />
                <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_78%_24%,rgba(214,179,116,0.16),transparent_45%)]" />

                <div className="relative z-[2] mx-auto flex min-h-[90svh] w-full max-w-7xl items-end px-4 pb-14 sm:px-6 sm:pb-20 md:min-h-[88svh] md:items-center md:pb-16 lg:px-8">
                    <div
                        className={`w-full max-w-[720px] rounded-[30px] border border-white/20 bg-black/26 p-6 shadow-[0_28px_74px_rgba(0,0,0,0.32)] backdrop-blur-[3px] sm:p-8 md:p-10 ${isRTL ? "md:ml-auto" : "md:mr-auto"
                            }`}
                        dir={dir}
                    >
                        <div className={`mb-5 flex flex-col gap-1.5 ${isRTL ? "items-end text-right" : "items-start text-left"}`}>
                            <p className="text-[13px] font-black uppercase tracking-[0.18em] text-[#e6c892] sm:text-[14px]">
                                {t("hero_eyebrow_1")}
                            </p>
                            <p className="text-[24px] font-semibold text-white sm:text-[28px] md:text-[32px]">
                                {t("hero_eyebrow_2")}
                            </p>
                        </div>

                        <h1
                            className={`text-[24px] font-semibold leading-[1.34] text-white sm:text-[30px] md:max-w-[620px] md:text-[40px] ${isRTL
                                ? "text-right"
                                : "font-[var(--font-display)] text-left"
                                }`}
                        >
                            {t("hero_headline")}
                        </h1>

                        <p className={`mt-4 max-w-[620px] text-[13px] leading-relaxed text-white/86 sm:text-[14px] ${isRTL ? "text-right" : "text-left"}`}>
                            {t("hero_support")}
                        </p>

                        <div className={`mt-4 flex flex-wrap gap-2 ${isRTL ? "justify-end" : "justify-start"}`}>
                            <span className="rounded-full border border-white/30 bg-white/12 px-3 py-1 text-[11px] font-semibold text-white/95">
                                {language === "ar" ? "+10,000 اختيار" : "10 000+ choix clients"}
                            </span>
                            <span className="rounded-full border border-white/30 bg-white/12 px-3 py-1 text-[11px] font-semibold text-white/95">
                                {language === "ar" ? "توصيل مجاني" : "Livraison gratuite"}
                            </span>
                            <span className="rounded-full border border-white/30 bg-white/12 px-3 py-1 text-[11px] font-semibold text-white/95">
                                {language === "ar" ? "الدفع عند الاستلام" : "Paiement a la livraison"}
                            </span>
                        </div>

                        <div className={`mt-7 flex flex-col gap-3 sm:flex-row ${isRTL ? "sm:flex-row-reverse" : ""}`}>
                            <Link
                                href={heroPack.href}
                                onClick={() => {
                                    clearCheckoutFlow();
                                    setCheckoutPackType("mixte");
                                }}
                                className="cta-primary inline-flex min-h-[56px] flex-1 items-center justify-center gap-2.5 px-6"
                            >
                                <span>{t("hero_cta_primary")}</span>
                                {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                            </Link>
                            <a
                                href="#packs"
                                className="inline-flex min-h-[56px] items-center justify-center rounded-[18px] border border-white/35 bg-white/12 px-6 font-semibold text-white backdrop-blur-sm transition hover:bg-white/18"
                            >
                                {t("hero_cta_secondary")}
                            </a>
                        </div>

                        <div className={`mt-4 flex items-center gap-2 text-[12px] text-white/90 ${isRTL ? "flex-row-reverse justify-end text-right" : "text-left"}`}>
                            <CheckCircle2 className="h-4 w-4 text-[#8ee1b5]" />
                            <span>
                                {language === "ar"
                                    ? `أنت الآن على ${heroPack.titleAr} • 5 + 1 OFFERT`
                                    : `Vous consultez ${heroPack.titleFr} • 5 + 1 OFFERT`}
                            </span>
                        </div>

                        <p className={`mt-5 text-[11px] tracking-wide text-white/75 sm:text-[12px] ${isRTL ? "text-right" : "text-left"}`}>
                            {language === "fr"
                                ? "© 2026 ELIE Parfum. Tous droits réservés."
                                : "© 2026 ELIE Parfum. جميع الحقوق محفوظة."}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
