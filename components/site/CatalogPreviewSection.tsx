"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useI18n } from "@/hooks/useI18n";
import { PACK_LIST } from "@/lib/packs";
import { PERFUMES } from "@/data/perfumes";
import { useStore } from "@/store/useStore";

export function CatalogPreviewSection() {
    const { dir, language } = useI18n();
    const clearCheckoutFlow = useStore((state) => state.clearCheckoutFlow);
    const setCheckoutPackType = useStore((state) => state.setCheckoutPackType);

    const previews = useMemo(() => {
        return PACK_LIST.map((pack) => {
            const pool = pack.id === "mixte" ? PERFUMES : PERFUMES.filter((p) => p.gender === pack.id);
            return {
                ...pack,
                perfumes: pool.slice(0, 3),
            };
        });
    }, []);

    return (
        <section id="catalogue-preview" className="bg-[#f5ecdf] py-14 sm:py-18" dir={dir}>
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className={`${dir === "rtl" ? "text-right" : "text-left"}`}>
                    <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#b69257]">
                        {language === "ar" ? "لمحة من الكتالوج" : "Apercu Catalogue"}
                    </p>
                    <h2 className={`mt-2 text-[30px] text-zinc-900 sm:text-[36px] ${dir === "rtl" ? "font-semibold" : "font-[var(--font-display)] font-semibold"}`}>
                        {language === "ar" ? "روائح مختارة من كل Pack" : "Decouvrez des signatures de chaque pack"}
                    </h2>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {previews.map((pack) => (
                        <Link
                            key={pack.id}
                            href={pack.href}
                            onClick={() => {
                                clearCheckoutFlow();
                                setCheckoutPackType(pack.id);
                            }}
                            className="rounded-[24px] border border-[#eadfcf] bg-white/85 p-5 shadow-[0_14px_36px_rgba(26,16,6,0.06)] transition hover:-translate-y-[2px] hover:border-[#d7c2a0]"
                        >
                            <h3 className={`text-[24px] text-zinc-900 ${dir === "rtl" ? "font-semibold text-right" : "font-[var(--font-display)] font-semibold text-left"}`}>
                                {language === "ar" ? pack.titleAr : pack.titleFr}
                            </h3>
                            <p className={`mt-1 text-[12px] text-zinc-500 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                                {language === "ar" ? "5 عطور من اختيارك + عطر هدية" : "5 parfums selectionnes + 1 parfum offert"}
                            </p>

                            <div className="mt-4 grid grid-cols-3 gap-2">
                                {pack.perfumes.map((perfume) => (
                                    <div key={perfume.id} className="rounded-[14px] border border-[#efe5d6] bg-[#fbf8f2] p-2">
                                        <img
                                            src={perfume.image}
                                            alt={perfume.name}
                                            className="mx-auto h-20 w-full object-contain"
                                            loading="lazy"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 inline-flex h-[44px] items-center justify-center rounded-[12px] border border-[#d7c19c] bg-[#f7f0e4] px-4 text-[12px] font-semibold text-zinc-800">
                                {language === "ar" ? "شاهد الكاتالوج" : "Voir le catalogue"}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
