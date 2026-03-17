"use client";

import { FormEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Lock, Search } from "lucide-react";
import { CitySelector } from "@/components/checkout/CitySelector";
import { SlotSelector } from "@/components/pack/SlotSelector";
import { FloatingWhatsAppButton } from "@/components/site/FloatingWhatsAppButton";
import { PERFUMES, type Perfume } from "@/data/perfumes";
import { useI18n } from "@/hooks/useI18n";
import {
    GIFT_SLOT_INDEX,
    getCheckoutSelectionProgress,
    MAIN_SLOT_COUNT,
    TOTAL_SLOT_COUNT,
} from "@/lib/checkout-security";
import { submitOrderToElieOS, type ElieOSOrderPayload } from "@/lib/elie-os";
import { PRICE_MAD } from "@/lib/offer-config";
import { PACKS } from "@/lib/packs";
import { captureTracking, getTracking } from "@/lib/tracking";

const PHONE_REGEX = /^0[67]\d{8}$/;

type FieldErrorKey = "name" | "phone" | "city";
type CatalogFilter = "all" | "femme" | "homme";
type CheckoutCustomer = {
    name: string;
    phone: string;
    city: string;
};
type CheckoutCopy = {
    active: string;
    activeHint: string;
    cardTitle: string;
    cta: string;
    ctaLocked: string;
    empty: string;
    errCity: string;
    errName: string;
    errPhone: string;
    errSelection: string;
    filterAll: string;
    filterFemme: string;
    filterHomme: string;
    footer: string;
    gift: string;
    giftLocked: string;
    heading: string;
    helper: string;
    loading: string;
    pack: string;
    searchPlaceholder: string;
    slot: string;
    slotsTitle: string;
    summaryPrice: string;
    summaryDelivery: string;
    summaryPayment: string;
    summaryGuide: string;
    progressSelectMain: string;
    progressSelectGift: string;
    progressReady: string;
    viewCatalog: string;
};

const EMPTY_CUSTOMER: CheckoutCustomer = {
    name: "",
    phone: "",
    city: "",
};

const FR_TAGS: Record<string, string> = {
    "حلو": "Gourmand",
    "منعش": "Frais",
    "خشبي": "Boise",
    "قوية": "Intense",
    "خفيفة": "Leger",
    "متوسطة": "Equilibre",
    "سهرة": "Soiree",
    "يومي": "Quotidien",
};

function createEmptySlots() {
    return Array<string | null>(TOTAL_SLOT_COUNT).fill(null);
}

function normalizeSearchValue(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function normalizeMoroccanPhone(value: string) {
    const digits = value.replace(/\D/g, "");

    if (digits.length === 9 && /^[67]/.test(digits)) {
        return `0${digits}`;
    }

    if (digits.length === 12 && digits.startsWith("212") && /^[67]/.test(digits.slice(3))) {
        return `0${digits.slice(3)}`;
    }

    if (digits.length === 10 && digits.startsWith("0")) {
        return digits;
    }

    return value.trim();
}

function findNextEmptySlotIndex(slots: (string | null)[], startIndex: number) {
    for (let index = startIndex + 1; index < slots.length; index += 1) {
        if (!slots[index]) return index;
    }

    for (let index = 0; index < startIndex; index += 1) {
        if (!slots[index]) return index;
    }

    return -1;
}

function scrollToSection(node: HTMLElement | null) {
    if (!node) return;

    const offset = window.innerWidth < 1024 ? 80 : 96;
    const target = node.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
}

function scentNotes(perfume: Perfume, language: "ar" | "fr") {
    const notes = perfume.tags.filter((tag) => tag !== "هدية").slice(0, 2);

    if (language === "ar") return notes.join(" • ");

    return notes.map((tag) => FR_TAGS[tag] || tag).join(" • ");
}

function tierLabel(tier: "classic" | "niche", language: "ar" | "fr") {
    if (language === "ar") return tier === "classic" ? "كلاسيك" : "نيش";
    return tier === "classic" ? "Classique" : "Niche";
}

export function PackExperience() {
    const router = useRouter();
    const { dir, isRTL, language, setLanguage } = useI18n();

    const [hasMounted, setHasMounted] = useState(false);
    const [slots, setSlots] = useState<(string | null)[]>(() => createEmptySlots());
    const [activeSlot, setActiveSlot] = useState(0);
    const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [query, setQuery] = useState("");
    const [customer, setCustomer] = useState<CheckoutCustomer>(EMPTY_CUSTOMER);
    const [errors, setErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
    const [selectionError, setSelectionError] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const selectionRef = useRef<HTMLDivElement | null>(null);
    const catalogRef = useRef<HTMLDivElement | null>(null);
    const checkoutRef = useRef<HTMLFormElement | null>(null);
    const mobileFormRef = useRef<HTMLDivElement | null>(null);
    const submitLockRef = useRef(false);
    const idempotencyKeyRef = useRef<string | null>(null);

    const perfumeById = useMemo(
        () => new Map(PERFUMES.map((perfume) => [perfume.id, perfume])),
        []
    );

    const packContent = PACKS.mixte;
    const isArabic = language === "ar";

    useEffect(() => {
        setHasMounted(true);
        captureTracking();
    }, []);

    useEffect(() => {
        if (!mobileFormRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsFormVisible(entry.isIntersecting);
            },
            { threshold: 0 }
        );

        observer.observe(mobileFormRef.current);
        return () => observer.disconnect();
    }, [hasMounted]);

    useEffect(() => {
        idempotencyKeyRef.current = null;
    }, [slots, customer.name, customer.phone, customer.city]);

    const selectedPerfumes = useMemo(
        () => slots.map((perfumeId) => (perfumeId ? perfumeById.get(perfumeId) || null : null)),
        [perfumeById, slots]
    );

    const selectionProgress = useMemo(() => getCheckoutSelectionProgress(slots), [slots]);
    const firstFiveComplete = selectionProgress.isMainComplete;
    const isSelectionComplete = selectionProgress.isSelectionComplete;
    const isCoffretFull = isSelectionComplete;
    const hasRequiredName = customer.name.trim().length > 0;
    const hasRequiredPhone = customer.phone.trim().length > 0;
    const hasRequiredCity = customer.city.trim().length > 0;
    const hasRequiredCustomerFields = hasRequiredName && hasRequiredPhone && hasRequiredCity;
    const canSubmitOrder = isSelectionComplete && hasRequiredCustomerFields && !submitting;

    const filteredPerfumes = useMemo(() => {
        const normalizedQuery = normalizeSearchValue(query);

        return PERFUMES.filter((perfume) => {
            if (catalogFilter !== "all" && perfume.gender !== catalogFilter) return false;
            if (!normalizedQuery) return true;

            const searchable = [
                perfume.name,
                perfume.gender,
                perfume.tier,
                ...perfume.tags,
                scentNotes(perfume, language),
            ]
                .map((value) => normalizeSearchValue(value))
                .join(" ");

            return searchable.includes(normalizedQuery);
        });
    }, [catalogFilter, language, query]);

    const copy: CheckoutCopy = isArabic
        ? {
            active: "نشطة",
            activeHint: "أنت تختار الآن للخانة",
            cardTitle: "إتمام الطلب",
            cta: "تأكيد الطلب",
            ctaLocked: "أكمل اختيارك أولاً",
            empty: "اختر عطراً",
            errCity: "يرجى اختيار المدينة.",
            errName: "يرجى إدخال الاسم.",
            errPhone: "أدخل رقم هاتف مغربي صحيح.",
            errSelection: "اختر 5 عطور ثم عطر الهدية.",
            filterAll: "الكل",
            filterFemme: "نسائي",
            filterHomme: "رجالي",
            footer: "© 2026 ELIE Parfum",
            gift: "هدية",
            giftLocked: "متاحة بعد إكمال 5 خانات",
            heading: "اختر 5 عطور من الكاتالوج واحصل على العطر السادس هدية",
            helper: "توصيل مجاني والدفع عند الاستلام في جميع مدن المغرب",
            loading: "جارٍ إرسال الطلب...",
            pack: "Pack Mixte",
            searchPlaceholder: "ابحث في الكاتالوج",
            slot: "خانة",
            slotsTitle: "صندوق ELIE الخاص بك",
            summaryPrice: "السعر: DH 199",
            summaryDelivery: "التوصيل مجاني",
            summaryPayment: "الدفع عند الاستلام",
            summaryGuide: "اختر 5 عطور ثم عطر الهدية",
            progressSelectMain: "اختر 5 عطور من اختيارك",
            progressSelectGift: "ممتاز — اختر الآن عطر الهدية",
            progressReady: "جاهز لتأكيد الطلب",
            viewCatalog: "الكاتالوج",
        }
        : {
            active: "Actif",
            activeHint: "Vous choisissez maintenant pour",
            cardTitle: "Finaliser la commande",
            cta: "Passer commande",
            ctaLocked: "Completez votre selection d'abord",
            empty: "Choisir un parfum",
            errCity: "Veuillez choisir une ville.",
            errName: "Veuillez saisir votre nom.",
            errPhone: "Entrez un numero marocain valide.",
            errSelection: "Choisissez 5 parfums puis le cadeau.",
            filterAll: "Tous",
            filterFemme: "Femme",
            filterHomme: "Homme",
            footer: "© 2026 ELIE Parfum",
            gift: "Cadeau",
            giftLocked: "Disponible apres 5 slots",
            heading: "Choisissez 5 parfums du catalogue et recevez le 6eme en cadeau",
            helper: "Livraison gratuite et paiement a la livraison dans tout le Maroc",
            loading: "Envoi en cours...",
            pack: "Pack Mixte",
            searchPlaceholder: "Rechercher dans le catalogue",
            slot: "Case",
            slotsTitle: "Votre Coffret ELIE",
            summaryPrice: "Prix: DH 199",
            summaryDelivery: "Livraison gratuite",
            summaryPayment: "Paiement a la livraison",
            summaryGuide: "Choisissez 5 parfums puis le parfum cadeau",
            progressSelectMain: "Choisissez 5 parfums de votre choix",
            progressSelectGift: "Parfait - choisissez maintenant le parfum cadeau",
            progressReady: "Pret a confirmer la commande",
            viewCatalog: "Catalogue",
        };

    const activeSlotLabel = activeSlot === GIFT_SLOT_INDEX ? copy.gift : `${copy.slot} ${activeSlot + 1}`;

    const clearError = useCallback((field: FieldErrorKey) => {
        setErrors((current) => {
            if (!current[field]) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
    }, []);

    const updateCustomerField = useCallback((field: keyof CheckoutCustomer, value: string) => {
        setCustomer((current) => ({ ...current, [field]: value }));

        if (field === "name" || field === "phone" || field === "city") {
            clearError(field as FieldErrorKey);
        }
    }, [clearError]);

    const handleSlotClick = useCallback((index: number) => {
        if (index === GIFT_SLOT_INDEX && !firstFiveComplete && !slots[index]) {
            setSelectionError(copy.giftLocked);
            return;
        }

        setActiveSlot(index);
        setSelectionError("");
        scrollToSection(catalogRef.current);
    }, [copy.giftLocked, firstFiveComplete, slots]);

    const handlePerfumeSelect = useCallback((perfumeId: string) => {
        if (activeSlot === GIFT_SLOT_INDEX && !firstFiveComplete) {
            setSelectionError(copy.giftLocked);
            return;
        }

        const nextSlots = [...slots];
        nextSlots[activeSlot] = perfumeId;

        setSlots(nextSlots);
        setSelectionError("");

        const nextEmptySlot = findNextEmptySlotIndex(nextSlots, activeSlot);
        if (nextEmptySlot !== -1) {
            setActiveSlot(nextEmptySlot);
        }
    }, [activeSlot, copy.giftLocked, firstFiveComplete, slots]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitLockRef.current || submitting) {
            return;
        }

        setSubmitError("");
        setSelectionError("");

        const normalizedPhone = normalizeMoroccanPhone(customer.phone);
        const trimmedName = customer.name.trim();
        const trimmedPhone = normalizedPhone.trim();
        const trimmedCity = customer.city.trim();
        const submitSelection = getCheckoutSelectionProgress(slots);

        if (!submitSelection.isSelectionComplete) {
            setSelectionError(copy.errSelection);
            scrollToSection(selectionRef.current);
            return;
        }

        const nextErrors: Partial<Record<FieldErrorKey, string>> = {};

        if (!trimmedName) nextErrors.name = copy.errName;
        if (!customer.phone.trim()) {
            nextErrors.phone = copy.errPhone;
        } else if (!PHONE_REGEX.test(trimmedPhone)) {
            nextErrors.phone = copy.errPhone;
        }
        if (!trimmedCity) nextErrors.city = copy.errCity;

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            scrollToSection(checkoutRef.current);
            return;
        }

        const slotPerfumeNames = submitSelection.normalizedSlots.map((perfumeId) => {
            if (!perfumeId) return null;
            const perfume = perfumeById.get(perfumeId);
            return perfume?.name?.trim() || null;
        });

        if (slotPerfumeNames.some((name) => !name)) {
            setSelectionError(copy.errSelection);
            scrollToSection(selectionRef.current);
            return;
        }

        const [slot1, slot2, slot3, slot4, slot5, giftSlot] = slotPerfumeNames as string[];
        const selectedMainPerfumeNames = [slot1, slot2, slot3, slot4, slot5];
        const payloadTotalPerfumes = selectedMainPerfumeNames.length + 1;

        if (
            selectedMainPerfumeNames.length !== MAIN_SLOT_COUNT ||
            !giftSlot ||
            payloadTotalPerfumes !== TOTAL_SLOT_COUNT
        ) {
            setSelectionError(copy.errSelection);
            scrollToSection(selectionRef.current);
            return;
        }

        if (!idempotencyKeyRef.current) {
            idempotencyKeyRef.current = crypto.randomUUID();
        }

        const idempotencyKey = idempotencyKeyRef.current;
        const tracking = getTracking();
        submitLockRef.current = true;
        setSubmitting(true);

        try {
            const payload: ElieOSOrderPayload = {
                source: "pack_mixte_direct_conversion",
                locale: language as "ar" | "fr",
                offerType: "mixte",
                customerIntent: "للزوجين",
                slots: {
                    slot1,
                    slot2,
                    slot3,
                    slot4,
                    slot5,
                    giftSlot,
                },
                selected_perfumes: selectedMainPerfumeNames,
                gift_perfume: giftSlot,
                items: [...selectedMainPerfumeNames, giftSlot].map((perfumeName, index) => ({
                    slot: index + 1,
                    name: perfumeName,
                    free: index === GIFT_SLOT_INDEX,
                })),
                pricing: {
                    currency: "MAD",
                    total: PRICE_MAD,
                    delivery: 0,
                    paymentMethod: "cod",
                },
                customer: {
                    fullName: trimmedName,
                    phone: trimmedPhone,
                    city: trimmedCity,
                    address: "Order via Simplified 3-Field Form",
                },
                meta: {
                    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
                    timestamp: new Date().toISOString(),
                    page: "pack_mixte_direct_conversion",
                    utm_campaign: tracking.utm_campaign,
                    utm_adset: tracking.utm_adset,
                    utm_ad: tracking.utm_ad,
                    referrer: tracking.referrer,
                    idempotency_key: idempotencyKey,
                    checkout_security: {
                        selectedMainCount: selectedMainPerfumeNames.length,
                        giftSelected: Boolean(giftSlot),
                        totalPerfumes: payloadTotalPerfumes,
                    },
                },
            };

            const result = await submitOrderToElieOS(payload);

            if (!result.success || !result.orderId) {
                setSubmitError(result.error || "Erreur");
                return;
            }

            setSlots(createEmptySlots());
            setActiveSlot(0);
            setCustomer(EMPTY_CUSTOMER);
            setErrors({});
            setSelectionError("");
            idempotencyKeyRef.current = null;
            router.push(`/order-success?orderId=${encodeURIComponent(result.orderId)}`);
        } catch {
            setSubmitError(
                isArabic
                    ? "تعذر إرسال الطلب حالياً. حاول مرة أخرى."
                    : "Impossible d'envoyer la commande pour le moment."
            );
        } finally {
            setSubmitting(false);
            submitLockRef.current = false;
        }
    };

    const slotSelectorCopy = useMemo(
        () => ({
            active: copy.active,
            activeHint: copy.activeHint,
            empty: copy.empty,
            gift: copy.gift,
            locked: copy.giftLocked,
            slot: copy.slot,
        }),
        [copy.active, copy.activeHint, copy.empty, copy.gift, copy.giftLocked, copy.slot]
    );

    const renderedPerfumeCards = useMemo(() => {
        return filteredPerfumes.map((perfume) => {
            const isSelectedForActiveSlot = slots[activeSlot] === perfume.id;

            return (
                <button
                    key={perfume.id}
                    type="button"
                    onClick={() => handlePerfumeSelect(perfume.id)}
                    className={`group relative flex flex-col items-stretch overflow-hidden rounded-[24px] border bg-white text-left transition-all hover:shadow-xl ${
                        isSelectedForActiveSlot
                            ? "border-[#2F9E5B] ring-2 ring-[#2F9E5B]/20"
                            : "border-[#E6D6BE] hover:border-[#C9A86A]"
                    }`}
                >
                    <div className="aspect-square bg-[linear-gradient(180deg,#fffdf9_0%,#f7f1e8_100%)] p-4">
                        <div className="relative h-full w-full rounded-[20px] bg-white p-3 shadow-inner">
                            <Image
                                src={perfume.image}
                                alt={perfume.name}
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                className="object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                            />
                        </div>
                    </div>

                    <div className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                        <div className={`mb-2 flex flex-wrap items-center gap-1.5 ${isRTL ? "justify-end" : "justify-start"}`}>
                            <span className="rounded-full bg-[#FCF3E2] px-2.5 py-0.5 text-[9px] font-bold text-[#B88E42]">
                                {tierLabel(perfume.tier, language)}
                            </span>
                            <span className="text-[9px] font-medium text-[#8A7868]">{scentNotes(perfume, language)}</span>
                        </div>

                        <h4 className="min-h-[2.5em] line-clamp-2 text-[14px] font-bold leading-tight text-[#201A16]">
                            {perfume.name}
                        </h4>

                        <div className={`mt-4 flex h-10 w-full items-center justify-center rounded-xl border text-[11px] font-bold transition-all ${
                            isSelectedForActiveSlot
                                ? "border-[#2F9E5B] bg-[#2F9E5B] text-white"
                                : "border-[#2F9E5B] bg-white text-[#2F9E5B]"
                        }`}>
                            {isSelectedForActiveSlot ? (
                                <span className="flex items-center gap-1.5">
                                    <Check className="h-4 w-4" />
                                    {copy.active}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    {isArabic ? "إضافة" : "Ajouter"}
                                </span>
                            )}
                        </div>
                    </div>
                </button>
            );
        });
    }, [activeSlot, copy.active, filteredPerfumes, handlePerfumeSelect, isArabic, isRTL, language, slots]);

    if (!hasMounted) return null;

    return (
        <main className="min-h-screen overflow-x-clip bg-[#F7F1E8] text-[#201A16] pb-40">
            <header className="absolute inset-x-0 top-0 z-40">
                <div className="mx-auto flex h-[74px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="inline-flex items-center" aria-label="ELIE">
                        <Image
                            src="/catalogues/brand/logo-white.png"
                            alt="ELIE Parfum"
                            width={140}
                            height={42}
                            priority
                            className="h-8 w-auto sm:h-9"
                        />
                    </Link>

                    <div className="inline-flex items-center rounded-full border border-white/24 bg-black/24 p-1 text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-md">
                        <button
                            type="button"
                            onClick={() => setLanguage("fr")}
                            className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition ${language === "fr"
                                ? "bg-white text-[#201A16]"
                                : "text-white/74 hover:text-white"
                                }`}
                        >
                            FR
                        </button>
                        <button
                            type="button"
                            onClick={() => setLanguage("ar")}
                            className={`rounded-full px-4 py-2 text-[12px] font-bold transition ${language === "ar"
                                ? "bg-white text-[#201A16]"
                                : "text-white/74 hover:text-white"
                                }`}
                        >
                            عربي
                        </button>
                    </div>
                </div>
            </header>

            <section className="relative isolate min-h-[35svh] overflow-hidden sm:min-h-[40svh] lg:min-h-[45svh]">
                <div className="absolute inset-0 sm:hidden">
                    <Image src={packContent.heroMobile} alt="Pack Mixte" fill priority className="object-cover" />
                </div>
                <div className="absolute inset-0 hidden sm:block">
                    <Image src={packContent.heroDesktop} alt="Pack Mixte" fill priority className="object-cover" />
                </div>

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,13,11,0.15)_0%,rgba(16,13,11,0.5)_50%,rgba(16,13,11,0.85)_100%)]" />

                <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-center px-4 pb-10 pt-24 sm:px-6 lg:px-8">
                    <div className={`w-full max-w-[800px] ${isRTL ? "ml-auto text-right" : "mr-auto text-left"}`} dir={dir}>
                        <p className="text-[12px] font-bold uppercase tracking-[0.4em] text-[#E6C892]">Maison ELIE</p>
                        <h1 className={`mt-3 text-[30px] leading-[1.1] text-white sm:text-[38px] lg:text-[48px] ${isRTL ? "font-bold" : "font-[var(--font-display)] font-bold"}`}>
                            {copy.heading}
                        </h1>
                    </div>
                </div>
            </section>

            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8" dir={dir}>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

                    {/* LEFT COLUMN (Desktop) / TOP (Mobile) */}
                    <div className="lg:col-span-8 flex flex-col gap-8">

                        {/* 1. Slots Visualization */}
                        <section ref={selectionRef} className="rounded-[30px] border border-[#E6D6BE] bg-[#FFFDF9] p-5 shadow-[0_20px_46px_rgba(32,26,22,0.06)] sm:p-8">
                            <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isRTL ? "sm:flex-row-reverse" : ""}`}>
                                <div className={isRTL ? "text-right" : "text-left"}>
                                    <h2 className={`text-[24px] md:text-[28px] ${isRTL ? "font-bold" : "font-[var(--font-display)] font-bold"}`}>
                                        {copy.slotsTitle}
                                    </h2>
                                    <p className="mt-1 text-[13px] text-[#6F6257]">{isArabic ? "اضغط على خانة للاختيار أو اختر من الأسفل" : "Cliquez sur une case ou choisissez ci-dessous"}</p>
                                </div>

                                <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-bold ${isRTL ? "flex-row-reverse" : ""} ${activeSlot === GIFT_SLOT_INDEX && !firstFiveComplete
                                    ? "border-[#DFCBAA] bg-[#FFF7EC] text-[#A47A3E]"
                                    : "border-[#BFE0C8] bg-[#EEF8F1] text-[#2F9E5B]"
                                    }`}>
                                    {activeSlot === GIFT_SLOT_INDEX && !firstFiveComplete ? <Lock className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                    <span>{copy.activeHint}: {activeSlotLabel}</span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <SlotSelector
                                    activeSlot={activeSlot}
                                    copy={slotSelectorCopy}
                                    dir={dir}
                                    giftUnlocked={firstFiveComplete}
                                    isRTL={isRTL}
                                    onSlotClick={handleSlotClick}
                                    selectedPerfumes={selectedPerfumes}
                                />
                            </div>

                            {selectionError ? (
                                <div className={`mt-6 rounded-[20px] border border-[#E8D6B7] bg-[#FFF9EE] px-5 py-4 text-[14px] text-[#9A6D2B] font-bold ${isRTL ? "text-right" : "text-left"}`}>
                                    {selectionError}
                                </div>
                            ) : null}
                        </section>

                        {/* 2. Purchase Form (Shown here on Mobile) */}
                        <div className="lg:hidden" ref={mobileFormRef}>
                            <OrderForm
                                isArabic={isArabic}
                                isRTL={isRTL}
                                customer={customer}
                                updateCustomerField={updateCustomerField}
                                errors={errors}
                                copy={copy}
                                submitting={submitting}
                                submitError={submitError}
                                handleSubmit={handleSubmit}
                                selectedMainCount={selectionProgress.mainCount}
                                hasGiftSelected={selectionProgress.hasGiftSelected}
                                canSubmitOrder={canSubmitOrder}
                                formRef={checkoutRef}
                            />
                        </div>

                        {/* Mobile-Only Killer CTA */}
                        <div className={`lg:hidden fixed bottom-24 left-4 right-4 z-40 transition-opacity duration-300 ${isCoffretFull && !isFormVisible
                            ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none"
                            }`}>
                            <button
                                type="button"
                                onClick={() => scrollToSection(checkoutRef.current)}
                                className="w-full h-16 rounded-2xl bg-green-600 text-white font-bold text-lg shadow-2xl flex items-center justify-center gap-3 animate-[pulse_2s_ease-in-out_infinite]"
                            >
                                <span>{copy.cta}</span>
                                <ChevronDown className="h-5 w-5 animate-bounce" />
                            </button>
                        </div>

                        {/* 3. Permanent Catalog (Method A) */}
                        <section ref={catalogRef} className="space-y-6">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                                <div className={isRTL ? "text-right" : "text-left"}>
                                    <h2 className={`text-[24px] md:text-[28px] ${isRTL ? "font-bold" : "font-[var(--font-display)] font-bold"}`}>
                                        {copy.viewCatalog}
                                    </h2>
                                    <p className="mt-1 text-[14px] text-[#6F6257]">
                                        {isArabic ? "اختر عطورك مباشرة من هنا" : "Choisissez vos parfums directement ici"}
                                    </p>
                                </div>

                                <div className={`inline-flex rounded-full border border-[#E6D6BE] bg-white p-1`}>
                                    {[
                                        { value: "all" as const, label: copy.filterAll },
                                        { value: "femme" as const, label: copy.filterFemme },
                                        { value: "homme" as const, label: copy.filterHomme },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setCatalogFilter(option.value)}
                                            className={`rounded-full px-5 py-2 text-[12px] font-bold transition-all ${catalogFilter === option.value
                                                ? "bg-[#201A16] text-white"
                                                : "text-[#6F6257] hover:text-[#201A16]"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="relative">
                                <Search className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A7868] ${isRTL ? "right-5" : "left-5"}`} />
                                <input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder={copy.searchPlaceholder}
                                    className={`h-14 w-full rounded-[20px] border border-[#E6D6BE] bg-white px-14 text-[15px] text-[#201A16] outline-none transition focus:border-[#C9A86A] focus:ring-4 focus:ring-[#C9A86A]/5 ${isRTL ? "text-right" : "text-left"}`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                                {renderedPerfumeCards}
                            </div>

                            {!filteredPerfumes.length && (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#8A7868] shadow-sm">
                                        <Search className="h-8 w-8" />
                                    </div>
                                    <h4 className="mt-4 text-[18px] font-bold text-[#201A16]">{isArabic ? "لا توجد نتائج" : "Aucun résultat"}</h4>
                                    <p className="mt-1 text-[14px] text-[#6F6257]">{isArabic ? "جرّب البحث بكلمة أخرى" : "Essayez avec d'autres mots-clés."}</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* RIGHT COLUMN (Desktop only) */}
                    <aside className="hidden lg:block lg:col-span-4 lg:relative">
                        <div className="lg:sticky lg:top-24">
                            <OrderForm
                                isArabic={isArabic}
                                isRTL={isRTL}
                                customer={customer}
                                updateCustomerField={updateCustomerField}
                                errors={errors}
                                copy={copy}
                                submitting={submitting}
                                submitError={submitError}
                                handleSubmit={handleSubmit}
                                selectedMainCount={selectionProgress.mainCount}
                                hasGiftSelected={selectionProgress.hasGiftSelected}
                                canSubmitOrder={canSubmitOrder}
                                formRef={checkoutRef}
                            />
                        </div>
                    </aside>
                </div>
            </div>

            <footer className="mt-20 border-t border-[#E6D6BE] bg-[#FFF8EE] py-10 text-center text-[13px] text-[#6F6257]">
                {copy.footer}
            </footer>

            <FloatingWhatsAppButton />
        </main>
    );
}

/**
 * Sub-component for the Order Form to avoid duplication between mobile/desktop layouts
 */
interface OrderFormProps {
    isArabic: boolean;
    isRTL: boolean;
    customer: CheckoutCustomer;
    updateCustomerField: (field: keyof CheckoutCustomer, value: string) => void;
    errors: Partial<Record<FieldErrorKey, string>>;
    copy: CheckoutCopy;
    submitting: boolean;
    submitError: string;
    handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
    selectedMainCount: number;
    hasGiftSelected: boolean;
    canSubmitOrder: boolean;
    formRef: React.RefObject<HTMLFormElement | null>;
}

const OrderForm = memo(function OrderForm({
    isArabic,
    isRTL,
    customer,
    updateCustomerField,
    errors,
    copy,
    submitting,
    submitError,
    handleSubmit,
    selectedMainCount,
    hasGiftSelected,
    canSubmitOrder,
    formRef
}: OrderFormProps) {
    const progressText =
        selectedMainCount < MAIN_SLOT_COUNT
            ? copy.progressSelectMain
            : hasGiftSelected
                ? copy.progressReady
                : copy.progressSelectGift;
    const ctaLabel = canSubmitOrder ? copy.cta : copy.ctaLocked;

    return (
        <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="rounded-[30px] border border-[#E6D6BE] bg-white p-6 shadow-[0_30px_60px_rgba(32,26,22,0.12)] sm:p-8"
        >
            <div className="text-center">
                <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-[#B88E42]">{copy.pack}</p>
                <h2 className={`mt-3 text-[26px] ${isRTL ? "font-bold" : "font-[var(--font-display)] font-bold"}`}>
                    {copy.cardTitle}
                </h2>
                <p className={`mt-4 inline-flex items-center gap-2 rounded-full border border-[#D6EAD8] bg-[#F2FBF4] px-4 py-2 text-[13px] font-bold text-[#2F9E5B] ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Check className="h-4 w-4" />
                    <span>{progressText}</span>
                </p>
            </div>

            <div className="mt-6 rounded-[20px] border border-[#E6D6BE] bg-[#FFF8EE] px-5 py-4">
                <div className={`space-y-2 text-[13px] font-semibold text-[#6F6257] ${isRTL ? "text-right" : "text-left"}`}>
                    <p className="font-bold text-[#201A16]">{copy.summaryPrice}</p>
                    <p>{copy.summaryDelivery}</p>
                    <p>{copy.summaryPayment}</p>
                    <p>{copy.summaryGuide}</p>
                </div>
            </div>

            <div className="mt-8 space-y-5">
                <label className={`block ${isRTL ? "text-right" : "text-left"}`}>
                    <span className="mb-2 block text-[13px] font-bold text-[#6F6257]">{isArabic ? "الاسم" : "Nom"}</span>
                    <input
                        value={customer.name}
                        onChange={(event) => updateCustomerField("name", event.target.value)}
                        placeholder={isArabic ? "أدخل اسمك الكامل" : "Votre nom complet"}
                        className={`h-14 w-full rounded-[18px] border bg-[#F9F7F4] px-5 text-[15px] outline-none transition ${errors.name ? "border-[#E08A8A] ring-2 ring-[#E08A8A]/10" : "border-[#E6D6BE] focus:border-[#C9A86A] focus:ring-4 focus:ring-[#C9A86A]/5"
                            } ${isRTL ? "text-right" : "text-left"}`}
                    />
                    {errors.name ? <p className="mt-2 text-[12px] text-[#B44848] font-bold">{errors.name}</p> : null}
                </label>

                <label className={`block ${isRTL ? "text-right" : "text-left"}`}>
                    <span className="mb-2 block text-[13px] font-bold text-[#6F6257]">{isArabic ? "رقم الهاتف" : "Téléphone"}</span>
                    <input
                        value={customer.phone}
                        onChange={(event) => updateCustomerField("phone", event.target.value)}
                        type="tel"
                        inputMode="tel"
                        placeholder="0612345678"
                        className={`h-14 w-full rounded-[18px] border bg-[#F9F7F4] px-5 text-[15px] outline-none transition ${errors.phone ? "border-[#E08A8A] ring-2 ring-[#E08A8A]/10" : "border-[#E6D6BE] focus:border-[#C9A86A] focus:ring-4 focus:ring-[#C9A86A]/5"
                            } ${isRTL ? "text-right" : "text-left"}`}
                    />
                    {errors.phone ? <p className="mt-2 text-[12px] text-[#B44848] font-bold">{errors.phone}</p> : null}
                </label>

                <div className="space-y-2">
                    <CitySelector
                        value={customer.city}
                        onChange={(city) => updateCustomerField("city", city)}
                    />
                    {errors.city ? (
                        <p className={`mt-2 text-[12px] text-[#B44848] font-bold ${isRTL ? "text-right" : "text-left"}`}>
                            {errors.city}
                        </p>
                    ) : null}
                </div>
            </div>

            {submitError ? (
                <div className={`mt-6 rounded-[20px] border border-[#F0C7C7] bg-[#FDECEC] px-5 py-4 text-[14px] text-[#B44848] font-bold ${isRTL ? "text-right" : "text-left"}`}>
                    {submitError}
                </div>
            ) : null}

            <button
                type="submit"
                disabled={!canSubmitOrder}
                className="relative mt-8 group h-[76px] w-full items-center justify-center rounded-[22px] bg-green-600 text-[24px] font-bold text-white shadow-xl shadow-green-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:scale-100"
            >
                <span className="relative z-10">{submitting ? copy.loading : ctaLabel}</span>
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-[#2F9E5B] text-[13px] font-bold">
                <Check className="h-4 w-4" />
                <span>{copy.helper}</span>
            </div>
        </form>
    );
});

OrderForm.displayName = "OrderForm";
