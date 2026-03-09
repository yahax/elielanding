"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { PACK_LIST, PackSlug } from "@/lib/packs";
import { useStore } from "@/store/useStore";

export function PackCardsSection() {
    const router = useRouter();
    const { dir, isRTL, t, language } = useI18n();
    const [selected, setSelected] = useState<PackSlug>("mixte");
    const clearCheckoutFlow = useStore((state) => state.clearCheckoutFlow);
    const setCheckoutPackType = useStore((state) => state.setCheckoutPackType);

    const handlePackGo = (pack: PackSlug) => {
        clearCheckoutFlow();
        setCheckoutPackType(pack);
        setSelected(pack);
        window.setTimeout(() => {
            router.push(`/pack/${pack}`);
        }, 130);
    };

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
                        const isSelected = selected === pack.id;
                        const title = language === "ar" ? pack.titleAr : pack.titleFr;
                        const benefit = language === "ar" ? pack.benefitAr : pack.benefitFr;
                        const logic = language === "ar" ? pack.logicAr : pack.logicFr;

                        return (
                            <article
                                key={pack.id}
                                onClick={() => handlePackGo(pack.id)}
                                className={`group cursor-pointer overflow-hidden rounded-[28px] border bg-white shadow-[0_18px_48px_rgba(26,16,6,0.08)] transition ${isSelected
                                    ? "border-[#b69257] ring-2 ring-[#d8c09a]"
                                    : "border-[#eadfcf] hover:border-[#d7c2a0] hover:-translate-y-[2px]"
                                    }`}
                            >
                                <div className="relative">
                                    <img
                                        src={pack.cardImage}
                                        alt={title}
                                        className="h-[250px] w-full object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
                                    <div className={`absolute bottom-3 ${isRTL ? "right-4" : "left-4"}`}>
                                        <span className="rounded-full border border-white/40 bg-black/30 px-3 py-1 text-[11px] font-semibold text-white">
                                            30ml • 5+1
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <div className={`absolute top-3 ${isRTL ? "left-3" : "right-3"} inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2f8f5b]`}>
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            <span>{language === "ar" ? "مختار" : "Sélectionné"}</span>
                                        </div>
                                    )}
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

                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handlePackGo(pack.id);
                                        }}
                                        className="cta-primary mt-4 inline-flex h-[56px] w-full items-center justify-center gap-2.5"
                                    >
                                        <span>{t("hero_cta_primary")}</span>
                                        {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
