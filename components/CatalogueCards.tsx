"use client";

import React from "react";
import { Container } from "./Container";
import { getAssetPath } from "@/lib/assets";
import { Download, ExternalLink } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useStore } from "@/store/useStore";

export function CatalogueCards() {
    const { t, dir } = useI18n();
    const { setPackType } = useStore();

    const catalogues = [
        {
            id: "femme" as const,
            title: t('pack_femme'),
            img: "/catalogues/catalogue-femme.jpg",
            link: "/catalogues/catalogue-femme.jpg", // Point to image or actual PDF if exists
            label: t('discover_femininity')
        },
        {
            id: "homme" as const,
            title: t('pack_homme'),
            img: "/catalogues/catalogue-homme.jpg",
            link: "/catalogues/catalogue-homme.jpg",
            label: t('luxury_modern_man')
        }
    ];

    const handleBrowse = (id: "homme" | "femme") => {
        setPackType(id);
        const perfumesSection = document.getElementById("perfumes");
        if (perfumesSection) {
            perfumesSection.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <section id="catalogues" className="py-20 bg-white/40 border-t border-zinc-100">
            <Container>
                <div className="text-center mb-16" dir={dir}>
                    <h2 className="text-3xl md:text-5xl font-black mb-4 text-zinc-900">{t('catalogue_title')}</h2>
                    <p className="text-zinc-500 font-medium">{t('catalogue_subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {catalogues.map((cat, i) => (
                        <div key={i} className="group relative overflow-hidden rounded-[40px] aspect-[16/9] border border-zinc-200 bg-white shadow-sm">
                            <img
                                src={getAssetPath(cat.img)}
                                alt={cat.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />

                            <div className={`absolute inset-0 p-10 flex flex-col justify-end items-start ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
                                <span className="text-primary text-sm font-black mb-2 uppercase tracking-widest">{cat.label}</span>
                                <h3 className="text-3xl font-black mb-6 text-zinc-900">{cat.title}</h3>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleBrowse(cat.id)}
                                        className="px-6 py-4 rounded-2xl bg-white border border-zinc-200 hover:border-primary/50 transition-all flex items-center gap-3 shadow-sm hover:scale-105 cursor-pointer"
                                    >
                                        <ExternalLink className="w-5 h-5 text-primary" />
                                        <span className="font-black text-zinc-800">{t('browse_now')}</span>
                                    </button>
                                    <a
                                        href={getAssetPath(cat.link)}
                                        download={cat.link.split('/').pop()}
                                        className="p-4 rounded-2xl bg-zinc-900 text-white hover:bg-primary transition-colors shadow-lg hover:scale-105 flex items-center justify-center"
                                    >
                                        <Download className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    );
}
