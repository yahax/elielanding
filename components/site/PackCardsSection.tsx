"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { PACK_LIST } from "@/lib/packs";
import { useStore } from "@/store/useStore";

export function PackCardsSection() {
    const { dir, isRTL, language } = useI18n();
    const clearCheckoutFlow = useStore((state) => state.clearCheckoutFlow);
    const setCheckoutPackType = useStore((state) => state.setCheckoutPackType);

    return (
        <section id="packs" className="bg-[#f8f2e9] py-14 sm:py-18">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8" dir={dir}>
                <div className={`mb-8 sm:mb-10 ${isRTL ? "text-right" : "text-left"}`}>
                    <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#b69257]">
                        {language === "ar" ? "اختيار الـ Pack" : "Choix Du Pack"}
                    </p>
                    <h2 className={`mt-2 text-[30px] leading-tight text-zinc-900 sm:text-[38px] ${isRTL ? "font-semibold" : "font-[var(--font-display)] font-semibold"}`}>
                        {language === "ar" ? "اختر الـ Pack المناسب وابدأ رحلتك" : "Choisissez votre pack en un seul geste"}
                    </h2>
                    <p className="mt-2 max-w-[700px] text-[14px] text-zinc-600 sm:text-[15px]">
                        {language === "ar"
                            ? "اختر الـ Pack وانتقل مباشرة إلى صفحة الشراء المخصصة له."
                            : "Choisissez votre pack et passez directement a sa page d'achat dediee."}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {PACK_LIST.map((pack) => {
                        const title = language === "ar" ? pack.titleAr : pack.titleFr;
                        const benefit = language === "ar" ? pack.benefitAr : pack.benefitFr;
                        const logic = language === "ar" ? pack.logicAr : pack.logicFr;

                        return (
                            <Link
                                key={pack.id}
                                href={pack.href}
                                onClick={() => {
                                    clearCheckoutFlow();
                                    setCheckoutPackType(pack.id);
                                }}
                                className="group block overflow-hidden rounded-[28px] border border-[#eadfcf] bg-white shadow-[0_18px_48px_rgba(26,16,6,0.08)] transition hover:-translate-y-[2px] hover:border-[#d7c2a0]"
                            >
                                <div className="relative">
                                    <Image
                                        src={pack.cardImage}
                                        alt={title}
                                        width={720}
                                        height={920}
                                        className="h-[250px] w-full object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
                                    <div className={`absolute bottom-3 ${isRTL ? "right-4" : "left-4"}`}>
                                        <span className="rounded-full border border-white/40 bg-black/30 px-3 py-1 text-[11px] font-semibold text-white">
                                            30ml • 5+1
                                        </span>
                                    </div>
                                </div>

                                <div className={`p-5 ${isRTL ? "text-right" : "text-left"}`}>
                                    <h3 className={`text-[24px] leading-tight text-zinc-900 ${isRTL ? "font-semibold" : "font-[var(--font-display)] font-semibold"}`}>
                                        {title}
                                    </h3>
                                    <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">{benefit}</p>
                                    <p className="mt-2 text-[12px] font-semibold text-[#8f6b3a]">{logic}</p>
                                    <div className={`mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-600 ${isRTL ? "justify-end" : "justify-start"}`}>
                                        <span className="rounded-full border border-[#eadfce] bg-[#faf6ef] px-2.5 py-1">
                                            {language === "ar" ? "توصيل مجاني" : "Livraison gratuite"}
                                        </span>
                                        <span className="rounded-full border border-[#eadfce] bg-[#faf6ef] px-2.5 py-1">
                                            {language === "ar" ? "الدفع عند الاستلام" : "Paiement a la livraison"}
                                        </span>
                                    </div>

                                    <div className="cta-primary mt-4 inline-flex h-[56px] w-full items-center justify-center gap-2.5">
                                        <span>{language === "ar" ? "اختر هذا الباك" : "Choisir ce pack"}</span>
                                        {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
