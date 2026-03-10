"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { MOROCCAN_CITIES } from "@/lib/moroccan-cities";

type CitySelectorProps = {
    value: string;
    onChange: (city: string) => void;
};

const FEATURED_CITIES = [
    "Casablanca",
    "Rabat",
    "Marrakech",
    "Fès",
    "Tanger",
    "Agadir",
    "Meknès",
    "Oujda",
    "Kénitra",
    "Tétouan",
    "Safi",
    "El Jadida",
    "Béni Mellal",
    "Nador",
    "Taza",
    "Khouribga",
    "Settat",
    "Larache",
    "Ksar El Kebir",
    "Ouarzazate",
    "Errachidia",
    "Essaouira",
    "Laâyoune",
    "Dakhla",
    "Mohammedia",
    "Berrechid",
    "Temara",
    "Salé",
    "Al Hoceima",
    "Inezgane",
    "Taroudant",
    "Guelmim",
];

const CITY_TRANSLATIONS_AR: Record<string, string> = {
    Agadir: "أكادير",
    "Al Hoceima": "الحسيمة",
    "Ait Melloul": "آيت ملول",
    Asilah: "أصيلا",
    Berkane: "بركان",
    "Béni Mellal": "بني ملال",
    Berrechid: "برشيد",
    Biougra: "بيوكرى",
    Bouskoura: "بوسكورة",
    Bouznika: "بوزنيقة",
    Casablanca: "الدار البيضاء",
    Chefchaouen: "شفشاون",
    Dakhla: "الداخلة",
    "El Jadida": "الجديدة",
    Errachidia: "الرشيدية",
    Essaouira: "الصويرة",
    "Fès": "فاس",
    Fnideq: "الفنيدق",
    Guelmim: "كلميم",
    Ifrane: "إفران",
    Inezgane: "إنزكان",
    "Ksar El Kebir": "القصر الكبير",
    "Kénitra": "القنيطرة",
    Khouribga: "خريبكة",
    Larache: "العرائش",
    "Laâyoune": "العيون",
    Marrakech: "مراكش",
    Martil: "مرتيل",
    "Meknès": "مكناس",
    Mohammedia: "المحمدية",
    Nador: "الناظور",
    Ouarzazate: "ورزازات",
    Oujda: "وجدة",
    Rabat: "الرباط",
    Safi: "آسفي",
    "Salé": "سلا",
    Settat: "سطات",
    Tanger: "طنجة",
    Taroudant: "تارودانت",
    Temara: "تمارة",
    "Tétouan": "تطوان",
    Taza: "تازة",
};

const CITY_ALIASES: Record<string, string> = {
    "Al Hoceima": "Al Hoceima Al Hoceima Al Hoceima الحسيمة",
    "Fès": "Fes Fes Fès Fez فاس",
    "Kénitra": "Kenitra Kenitra Kénitra القنيطرة",
    "Laâyoune": "Laayoune Laâyoune العيون",
    "Meknès": "Meknes Meknès مكناس",
    "Salé": "Sale Salé سلا",
    "Tétouan": "Tetouan Tétouan تطوان",
};

function normalizeSearchValue(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export function CitySelector({ value, onChange }: CitySelectorProps) {
    const { dir, isRTL, language } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const listboxId = useId();
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const orderedCities = useMemo(() => {
        const merged = [...FEATURED_CITIES, ...MOROCCAN_CITIES];
        const unique: string[] = [];
        const seen = new Set<string>();

        merged.forEach((city) => {
            const normalized = normalizeSearchValue(city);
            if (seen.has(normalized)) return;
            seen.add(normalized);
            unique.push(city);
        });

        return unique;
    }, []);

    const filteredCities = useMemo(() => {
        const normalizedQuery = normalizeSearchValue(search);
        if (!normalizedQuery) return orderedCities;

        return orderedCities.filter((city) => {
            const arabicLabel = CITY_TRANSLATIONS_AR[city] || "";
            const aliases = CITY_ALIASES[city] || "";
            const searchable = [city, arabicLabel, aliases]
                .map((entry) => normalizeSearchValue(entry))
                .join(" ");

            return searchable.includes(normalizedQuery);
        });
    }, [orderedCities, search]);

    useEffect(() => {
        if (!isOpen) return;
        inputRef.current?.focus();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const option = optionRefs.current[highlightedIndex];
        option?.scrollIntoView({ block: "nearest" });
    }, [highlightedIndex, isOpen]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
                setSearch("");
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const cityLabel = language === "ar" ? "المدينة" : "Ville";
    const chooseLabel = language === "ar" ? "اختر المدينة" : "Choisir une ville";
    const searchPlaceholder = language === "ar" ? "ابحث عن مدينة" : "Rechercher une ville";
    const emptyResultsLabel = language === "ar" ? "لا توجد نتيجة" : "Aucun resultat";

    const formatCityLabel = (city: string) => (language === "ar" ? CITY_TRANSLATIONS_AR[city] || city : city);
    const selectedLabel = value ? formatCityLabel(value) : chooseLabel;

    const openDropdown = () => {
        const selectedIndex = orderedCities.findIndex((city) => city === value);
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        setIsOpen(true);
    };

    const selectCity = (city: string) => {
        onChange(city);
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div ref={wrapperRef} className="relative" dir={dir}>
            <p className={`mb-1.5 text-[12px] font-semibold text-[#6F6257] ${isRTL ? "text-right" : "text-left"}`}>
                {cityLabel}
            </p>

            <button
                type="button"
                onClick={() => {
                    if (isOpen) {
                        setIsOpen(false);
                        setSearch("");
                        return;
                    }

                    openDropdown();
                }}
                onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDropdown();
                    }
                }}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                className={`flex h-12 w-full items-center justify-between rounded-[16px] border border-[#E6D6BE] bg-white px-4 text-[14px] text-[#201A16] shadow-[0_8px_20px_rgba(32,26,22,0.03)] transition hover:border-[#C9A86A] ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}
            >
                <span className={value ? "text-[#201A16]" : "text-[#8A7868]"}>{selectedLabel}</span>
                <ChevronDown className={`h-4 w-4 text-[#8A7868] transition ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen ? (
                <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-[20px] border border-[#E6D6BE] bg-white shadow-[0_20px_44px_rgba(32,26,22,0.12)]">
                    <div className="border-b border-[#F1E5D4] p-3">
                        <div className="relative">
                            <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A7868] ${isRTL ? "right-3" : "left-3"}`} />
                            <input
                                ref={inputRef}
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setHighlightedIndex(0);
                                }}
                                onKeyDown={(event) => {
                                    if (!filteredCities.length) {
                                        if (event.key === "Escape") {
                                            setIsOpen(false);
                                            setSearch("");
                                        }
                                        return;
                                    }

                                    if (event.key === "ArrowDown") {
                                        event.preventDefault();
                                        setHighlightedIndex((current) => Math.min(current + 1, filteredCities.length - 1));
                                    }

                                    if (event.key === "ArrowUp") {
                                        event.preventDefault();
                                        setHighlightedIndex((current) => Math.max(current - 1, 0));
                                    }

                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        const nextCity = filteredCities[highlightedIndex];
                                        if (nextCity) selectCity(nextCity);
                                    }

                                    if (event.key === "Escape") {
                                        event.preventDefault();
                                        setIsOpen(false);
                                        setSearch("");
                                    }
                                }}
                                role="combobox"
                                aria-expanded={isOpen}
                                aria-controls={listboxId}
                                aria-activedescendant={filteredCities[highlightedIndex] ? `${listboxId}-${highlightedIndex}` : undefined}
                                placeholder={searchPlaceholder}
                                className={`h-11 w-full rounded-[14px] border border-[#E6D6BE] bg-[#FFFDF9] px-10 text-[13px] text-[#201A16] outline-none transition focus:border-[#C9A86A] ${isRTL ? "text-right" : "text-left"}`}
                            />
                        </div>
                    </div>

                    <div id={listboxId} role="listbox" className="max-h-64 overflow-y-auto p-2">
                        {filteredCities.length ? (
                            filteredCities.map((city, index) => {
                                const isSelected = city === value;
                                const isHighlighted = index === highlightedIndex;

                                return (
                                    <button
                                        key={city}
                                        ref={(node) => {
                                            optionRefs.current[index] = node;
                                        }}
                                        id={`${listboxId}-${index}`}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        onClick={() => selectCity(city)}
                                        className={`flex w-full items-center justify-between rounded-[14px] px-3 py-3 text-[13px] transition ${
                                            isHighlighted
                                                ? "bg-[#F7F1E8]"
                                                : "bg-white"
                                        } ${
                                            isSelected
                                                ? "text-[#2F9E5B]"
                                                : "text-[#201A16]"
                                        } ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}
                                    >
                                        <span>{formatCityLabel(city)}</span>
                                        {isSelected ? <Check className="h-4 w-4" /> : null}
                                    </button>
                                );
                            })
                        ) : (
                            <p className={`px-3 py-5 text-[13px] text-[#8A7868] ${isRTL ? "text-right" : "text-left"}`}>
                                {emptyResultsLabel}
                            </p>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
