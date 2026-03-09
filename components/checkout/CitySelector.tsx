"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { MOROCCAN_CITIES } from "@/lib/moroccan-cities";

type CitySelectorProps = {
    value: string;
    onChange: (city: string) => void;
};

const CITY_TRANSLATIONS_AR: Record<string, string> = {
    Casablanca: "الدار البيضاء",
    Rabat: "الرباط",
    "Salé": "سلا",
    Marrakech: "مراكش",
    Tanger: "طنجة",
    "Fès": "فاس",
    Agadir: "أكادير",
    "Meknès": "مكناس",
    Oujda: "وجدة",
    "Tétouan": "تطوان",
    "Kénitra": "القنيطرة",
    "El Jadida": "الجديدة",
    Safi: "آسفي",
    Mohammedia: "المحمدية",
    Nador: "الناظور",
    Khouribga: "خريبكة",
    Settat: "سطات",
    "Béni Mellal": "بني ملال",
    Larache: "العرائش",
    "Ksar El Kebir": "القصر الكبير",
    "Al Hoceïma": "الحسيمة",
    Taza: "تازة",
    Dakhla: "الداخلة",
    "Laâyoune": "العيون",
    Guelmim: "كلميم",
    Taroudant: "تارودانت",
    Essaouira: "الصويرة",
    Errachidia: "الرشيدية",
    Ouarzazate: "ورزازات",
};

const PRIORITY_CITIES: string[] = [
    "Casablanca",
    "Rabat",
    "Marrakech",
    "Tanger",
    "Fès",
    "Agadir",
    "Meknès",
    "Oujda",
    "Kénitra",
    "Tétouan",
    "Salé",
    "Mohammedia",
    "El Jadida",
    "Béni Mellal",
    "Nador",
    "Taza",
    "Safi",
    "Khouribga",
    "Settat",
    "Larache",
    "Ouarzazate",
    "Al Hoceïma",
    "Dakhla",
    "Laâyoune",
    "Errachidia",
    "Guelmim",
];

export function CitySelector({ value, onChange }: CitySelectorProps) {
    const { dir, language, isRTL } = useI18n();
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const orderedCities = useMemo(() => {
        const rest = MOROCCAN_CITIES.filter((city) => !PRIORITY_CITIES.includes(city));
        return [...PRIORITY_CITIES, ...rest];
    }, []);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        };
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
                setSearch("");
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", onEscape);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", onEscape);
        };
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return orderedCities;

        const startsWith: string[] = [];
        const includes: string[] = [];
        for (const city of orderedCities) {
            const latin = city.toLowerCase();
            const arabic = CITY_TRANSLATIONS_AR[city] || "";
            if (latin.startsWith(q) || arabic.startsWith(search.trim())) {
                startsWith.push(city);
                continue;
            }
            if (latin.includes(q) || arabic.includes(search.trim())) {
                includes.push(city);
            }
        }
        return [...startsWith, ...includes];
    }, [search, orderedCities]);

    const cityLabel = language === "ar" ? "المدينة" : "Ville";
    const searchLabel = language === "ar" ? "ابحث عن مدينة" : "Rechercher une ville";
    const chooseLabel = language === "ar" ? "اختر المدينة" : "Choisir une ville";
    const selectedLabel = value
        ? (language === "ar" ? CITY_TRANSLATIONS_AR[value] || value : value)
        : chooseLabel;

    return (
        <div ref={wrapperRef} className="rounded-[16px] border border-[#e5d6bf] bg-[#fffdf9] p-3" dir={dir}>
            <p className={`mb-2 text-[12px] font-medium text-zinc-600 ${isRTL ? "text-right" : "text-left"}`}>{cityLabel}</p>

            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`flex h-11 w-full items-center justify-between rounded-[12px] border border-[#e5d6bf] bg-white px-3 text-[14px] transition hover:border-[#b69257] ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}
            >
                <span className={value ? "text-zinc-900" : "text-zinc-500"}>{selectedLabel}</span>
                <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="mt-2 rounded-[12px] border border-[#efe5d6] bg-white p-2">
                    <div className="relative">
                        <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 ${isRTL ? "right-3" : "left-3"}`} />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={searchLabel}
                            autoFocus
                            className={`h-10 w-full rounded-[10px] border border-[#e5d6bf] bg-white px-10 text-[13px] text-zinc-900 outline-none transition focus:border-[#b69257] ${isRTL ? "text-right" : "text-left"}`}
                        />
                    </div>

                    <div className="mt-2 max-h-48 overflow-y-auto rounded-[10px] border border-[#efe5d6] bg-white">
                        {filtered.map((city) => {
                            const selected = city === value;
                            return (
                                <button
                                    key={city}
                                    type="button"
                                    onClick={() => {
                                        onChange(city);
                                        setIsOpen(false);
                                        setSearch("");
                                    }}
                                    className={`flex w-full items-center justify-between px-3 py-2.5 text-[13px] transition ${selected
                                        ? "bg-[#2f8f5b] text-white"
                                        : "text-zinc-700 hover:bg-[#f8f1e6]"
                                        } ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}
                                >
                                    <span>{language === "ar" ? CITY_TRANSLATIONS_AR[city] || city : city}</span>
                                    {selected && <span>✓</span>}
                                </button>
                            );
                        })}

                        {!filtered.length && (
                            <p className={`px-3 py-4 text-[12px] text-zinc-500 ${isRTL ? "text-right" : "text-left"}`}>
                                {language === "ar" ? "لا توجد نتيجة" : "Aucun resultat"}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {value && (
                <p className={`mt-2 text-[11px] text-zinc-500 ${isRTL ? "text-right" : "text-left"}`}>
                    {language === "ar"
                        ? `المدينة المختارة: ${selectedLabel}`
                        : `Ville selectionnee: ${selectedLabel}`}
                </p>
            )}
        </div>
    );
}
