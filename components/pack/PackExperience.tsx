"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    MessageCircle,
    Search,
    ShieldCheck,
    Truck,
    X,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CitySelector } from "@/components/checkout/CitySelector";
import { useI18n } from "@/hooks/useI18n";
import { PACK_LIST, PACKS, PackSlug } from "@/lib/packs";
import { Perfume, PERFUMES } from "@/data/perfumes";
import { useStore } from "@/store/useStore";
import { captureTracking, getTracking } from "@/lib/tracking";
import { PRICE_MAD } from "@/lib/offer-config";
import { submitOrderToElieOS } from "@/lib/elie-os";

const PHONE_REGEX = /^0[67]\d{8}$/;
const TOTAL_SLOTS = 6;
const GIFT_SLOT = 5;
const WHATSAPP_NUMBER = "212669266486";

type TierFilter = "all" | "classic" | "niche";

type ScrollZone = "selection" | "catalog" | "checkout";

const FR_TAGS: Record<string, string> = {
    "حلو": "Gourmand",
    "منعش": "Frais",
    "خشبي": "Boise",
    "قوية": "Intense",
    "خفيفة": "Legere",
    "متوسطة": "Equilibree",
    "هدية": "Cadeau",
    "سهرة": "Soiree",
    "يومي": "Quotidien",
};

function cueForPerfume(perfume: Perfume, language: "ar" | "fr") {
    const tags = perfume.tags.slice(0, 2);
    if (language === "ar") return tags.join(" • ");
    return tags.map((tag) => FR_TAGS[tag] || tag).join(" • ");
}

function tierLabel(tier: "classic" | "niche", language: "ar" | "fr") {
    if (language === "ar") return tier === "classic" ? "كلاسيك" : "نيش";
    return tier === "classic" ? "Classique" : "Niche";
}

export function PackExperience({ pack }: { pack: PackSlug }) {
    const router = useRouter();
    const { language, dir, isRTL } = useI18n();

    const checkoutPackType = useStore((state) => state.checkoutPackType);
    const checkoutSelectionSlots = useStore((state) => state.checkoutSelectionSlots);
    const checkoutCustomer = useStore((state) => state.checkoutCustomer);
    const setCheckoutPackType = useStore((state) => state.setCheckoutPackType);
    const setCheckoutSelectionSlots = useStore((state) => state.setCheckoutSelectionSlots);
    const setCheckoutCustomer = useStore((state) => state.setCheckoutCustomer);
    const clearCheckoutFlow = useStore((state) => state.clearCheckoutFlow);

    const [activeSlot, setActiveSlot] = useState(0);
    const [query, setQuery] = useState("");
    const [tier, setTier] = useState<TierFilter>("all");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [highlightedPerfumeId, setHighlightedPerfumeId] = useState<string | null>(null);
    const [catalogFlash, setCatalogFlash] = useState(false);
    const [feedbackPerfumeId, setFeedbackPerfumeId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState("");
    const [progressPulse, setProgressPulse] = useState(false);
    const [checkoutInView, setCheckoutInView] = useState(false);

    const selectionRef = useRef<HTMLElement | null>(null);
    const catalogRef = useRef<HTMLElement | null>(null);
    const checkoutRef = useRef<HTMLFormElement | null>(null);
    const previousCountRef = useRef(0);

    const packContent = PACKS[pack];

    useEffect(() => {
        captureTracking();
    }, []);

    useEffect(() => {
        setCheckoutPackType(pack);
        setActiveSlot(0);
    }, [pack, setCheckoutPackType]);

    const slots = useMemo(
        () => (checkoutPackType === pack ? checkoutSelectionSlots : Array(TOTAL_SLOTS).fill(null)),
        [checkoutPackType, pack, checkoutSelectionSlots]
    );

    const selectedPerfumes = useMemo(
        () =>
            slots.map((id) => {
                if (!id) return null;
                return PERFUMES.find((perfume) => perfume.id === id) || null;
            }),
        [slots]
    );

    const selectedCount = selectedPerfumes.filter(Boolean).length;
    const isSelectionComplete = selectedCount === TOTAL_SLOTS;
    const firstFiveComplete = slots.slice(0, GIFT_SLOT).every(Boolean);
    const isGiftSlotActive = activeSlot === GIFT_SLOT;
    const activeSlotPerfumeId = slots[activeSlot];

    useEffect(() => {
        if (activeSlot === GIFT_SLOT && !firstFiveComplete) {
            const nextMainEmpty = slots.slice(0, GIFT_SLOT).findIndex((id) => id === null);
            setActiveSlot(nextMainEmpty === -1 ? 0 : nextMainEmpty);
        }
    }, [activeSlot, firstFiveComplete, slots]);

    const pool = useMemo(() => {
        if (pack === "mixte") return PERFUMES;
        return PERFUMES.filter((perfume) => perfume.gender === pack);
    }, [pack]);

    const giftEligibleIds = useMemo(
        () => new Set(pool.filter((perfume) => perfume.tags.includes("هدية")).map((perfume) => perfume.id)),
        [pool]
    );

    const filteredPerfumes = useMemo(() => {
        let next = pool;
        if (isGiftSlotActive) {
            if (!firstFiveComplete) return [];
            next = next.filter((perfume) => giftEligibleIds.has(perfume.id));
        }
        if (tier !== "all") next = next.filter((perfume) => perfume.tier === tier);
        if (query.trim()) {
            const lowered = query.toLowerCase();
            next = next.filter((perfume) => perfume.name.toLowerCase().includes(lowered));
        }
        return next;
    }, [pool, tier, query, isGiftSlotActive, firstFiveComplete, giftEligibleIds]);

    const selectedIndexById = useMemo(() => {
        const map = new Map<string, number>();
        slots.forEach((id, index) => {
            if (id) map.set(id, index);
        });
        return map;
    }, [slots]);

    const headlineFr = pack === "mixte"
        ? "Pack Mixte — 5 parfums + 1 offert"
        : pack === "femme"
            ? "Pack Femme — selection feminine raffinee + 1 offert"
            : "Pack Homme — parfums masculins de caractere + 1 offert";

    const headlineAr = pack === "mixte"
        ? "باك مختلط — 5 عطور + 1 هدية"
        : pack === "femme"
            ? "باك نسائي — تشكيلة نسائية راقية + 1 هدية"
            : "باك رجالي — عطور رجالية قوية + 1 هدية";

    const copy = language === "ar"
        ? {
            headline: headlineAr,
            support: "اختر 5 عطورك وسنضيف لك العطر السادس هدية.",
            pills: ["30ml × 6", "توصيل مجاني", "الدفع عند الاستلام"],
            topCta: "ابدأ الاختيار",
            selectionTitle: "اختيار العطور",
            selectionLine: "اختر عطرك المفضل لكل خانة",
            giftActivationLocked: "الهديّة تتفعّل بعد إكمال 5 اختيارات.",
            giftActivationReady: "اختر الآن العطر السادس هدية 🎁",
            slotGiftLabel: "6 هدية 🎁",
            slotEmpty: "اختر عطراً",
            searchPlaceholder: "ابحث باسم العطر...",
            filterAll: "الكل",
            filterClassic: "كلاسيك",
            filterNiche: "نيش",
            giftEligible: "صالح كهدية",
            add: "إضافة",
            selected: "تم الاختيار",
            selectedGift: "تم اختيار الهدية",
            summaryTitle: "إتمام الطلب",
            selectedCount: `${selectedCount}/6`,
            compactSelected: `${selectedCount}/6 عطور مختارة`,
            viewDetail: "عرض التفاصيل",
            noResults: "لا توجد عطور مطابقة.",
            total: "المجموع",
            freeDelivery: "التوصيل مجاني",
            cod: "الدفع عند الاستلام",
            whatsapp: "مساعدة عبر واتساب",
            whatsappMessage: "السلام عليكم، أحتاج مساعدة لاختيار باك ELIE.",
            giftRow: "هدية",
            incompleteHint: "أكمل اختيار 6 عطور أولاً.",
            name: "الاسم الكامل",
            phone: "رقم الهاتف",
            address: "العنوان الكامل",
            cta: "اشترِ الآن",
            sending: "جارٍ إرسال الطلب...",
            errName: "يرجى إدخال الاسم الكامل.",
            errPhone: "يرجى إدخال رقم هاتف صحيح يبدأ بـ 06 أو 07.",
            errCity: "يرجى اختيار المدينة.",
            errAddress: "يرجى إدخال العنوان الكامل.",
            giftLockedError: "اختر 5 عطور أولاً قبل الهدية.",
            giftSlotBlocked: "خانة الهدية تتفعّل بعد إكمال 5 اختيارات.",
            giftDuplicateError: "اختر عطراً مختلفاً للهدية.",
            progressStart: "ابدأ باختيار عطرك الأول",
            progressMiddle: "أنت على الطريق الصحيح",
            progressFour: "بقي لك عطران",
            progressFive: "🎁 بقي عطر واحد وتحصل على الهدية",
            progressDone: "رائع! طلبك جاهز للإتمام",
            toastAdded: "تمت إضافة العطر",
            toastRemoved: "تم حذف العطر",
        }
        : {
            headline: headlineFr,
            support: "Choisissez 5 parfums, le 6eme est offert.",
            pills: ["30ml × 6", "Livraison gratuite", "Paiement a la livraison"],
            topCta: "Commencer la selection",
            selectionTitle: "Selection des parfums",
            selectionLine: "Selectionnez vos parfums slot par slot",
            giftActivationLocked: "Le cadeau s'active apres 5 choix.",
            giftActivationReady: "Choisissez maintenant votre cadeau offert 🎁",
            slotGiftLabel: "6 Offert 🎁",
            slotEmpty: "Choisir parfum",
            searchPlaceholder: "Rechercher un parfum...",
            filterAll: "Tous",
            filterClassic: "Classique",
            filterNiche: "Niche",
            giftEligible: "Eligible cadeau",
            add: "Ajouter",
            selected: "Selectionne",
            selectedGift: "Cadeau choisi",
            summaryTitle: "Finaliser la commande",
            selectedCount: `${selectedCount}/6`,
            compactSelected: `${selectedCount}/6 parfums selectionnes`,
            viewDetail: "Voir le detail",
            noResults: "Aucun parfum correspondant.",
            total: "Total",
            freeDelivery: "Livraison gratuite",
            cod: "Paiement a la livraison",
            whatsapp: "Aide sur WhatsApp",
            whatsappMessage: "Bonjour, j'ai besoin d'aide pour choisir mon pack ELIE.",
            giftRow: "Cadeau",
            incompleteHint: "Completez d'abord vos 6 parfums.",
            name: "Nom complet",
            phone: "Telephone",
            address: "Adresse complete",
            cta: "Acheter maintenant",
            sending: "Envoi en cours...",
            errName: "Veuillez saisir votre nom complet.",
            errPhone: "Entrez un numero valide commencant par 06 ou 07.",
            errCity: "Veuillez choisir une ville.",
            errAddress: "Veuillez saisir une adresse complete.",
            giftLockedError: "Choisissez d'abord 5 parfums avant le cadeau.",
            giftSlotBlocked: "Le slot cadeau sera disponible apres 5 choix.",
            giftDuplicateError: "Choisissez un parfum different pour le cadeau.",
            progressStart: "Commencez par votre premier parfum",
            progressMiddle: "Vous etes sur la bonne voie",
            progressFour: "Il reste 2 parfums",
            progressFive: "🎁 Plus qu'un parfum pour activer le cadeau",
            progressDone: "Parfait! Votre commande est prete",
            toastAdded: "Parfum ajoute",
            toastRemoved: "Parfum retire",
        };

    const progressMessage = useMemo(() => {
        if (selectedCount === 0) return copy.progressStart;
        if (selectedCount >= 1 && selectedCount <= 3) return copy.progressMiddle;
        if (selectedCount === 4) return copy.progressFour;
        if (selectedCount === 5) return copy.progressFive;
        return copy.progressDone;
    }, [selectedCount, copy.progressStart, copy.progressMiddle, copy.progressFour, copy.progressFive, copy.progressDone]);

    const whatsappHref = useMemo(
        () => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(copy.whatsappMessage)}`,
        [copy.whatsappMessage]
    );

    useEffect(() => {
        if (!toastMessage) return;
        const timer = window.setTimeout(() => setToastMessage(""), 1300);
        return () => window.clearTimeout(timer);
    }, [toastMessage]);

    useEffect(() => {
        if (!feedbackPerfumeId) return;
        const timer = window.setTimeout(() => setFeedbackPerfumeId(null), 650);
        return () => window.clearTimeout(timer);
    }, [feedbackPerfumeId]);

    useEffect(() => {
        if (previousCountRef.current === selectedCount) return;
        previousCountRef.current = selectedCount;
        setProgressPulse(true);
        const timer = window.setTimeout(() => setProgressPulse(false), 550);
        return () => window.clearTimeout(timer);
    }, [selectedCount]);

    useEffect(() => {
        if (!checkoutRef.current || typeof IntersectionObserver === "undefined") return;
        const observer = new IntersectionObserver(
            ([entry]) => setCheckoutInView(entry.isIntersecting),
            { threshold: 0.35 }
        );
        observer.observe(checkoutRef.current);
        return () => observer.disconnect();
    }, []);

    const flashCatalogZone = () => {
        setCatalogFlash(true);
        window.setTimeout(() => setCatalogFlash(false), 850);
    };

    const scrollToZone = (zone: ScrollZone) => {
        const map: Record<ScrollZone, HTMLElement | null> = {
            selection: selectionRef.current,
            catalog: catalogRef.current,
            checkout: checkoutRef.current,
        };
        const node = map[zone];
        if (!node) return;

        const offset = window.innerWidth < 1024 ? 88 : 104;
        const targetY = node.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });

        if (zone === "catalog") flashCatalogZone();
    };

    const focusPerfumeCard = (perfumeId: string) => {
        const node = document.getElementById(`perfume-card-${perfumeId}`);
        if (!node) return;
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedPerfumeId(perfumeId);
        window.setTimeout(() => {
            setHighlightedPerfumeId((prev) => (prev === perfumeId ? null : prev));
        }, 1200);
    };

    const assignPerfumeToSlot = (perfumeId: string) => {
        if (activeSlot === GIFT_SLOT && !firstFiveComplete) {
            setSubmitError(copy.giftLockedError);
            return;
        }

        const nextSlots = [...slots];
        if (activeSlot === GIFT_SLOT && nextSlots.slice(0, GIFT_SLOT).includes(perfumeId)) {
            setSubmitError(copy.giftDuplicateError);
            return;
        }

        const existingIndex = nextSlots.findIndex((id) => id === perfumeId);
        if (existingIndex !== -1) nextSlots[existingIndex] = null;

        nextSlots[activeSlot] = perfumeId;
        setCheckoutSelectionSlots(nextSlots);
        setSubmitError("");
        setFeedbackPerfumeId(perfumeId);
        setToastMessage(copy.toastAdded);

        const nextEmpty = nextSlots.findIndex((id) => id === null);
        if (nextEmpty !== -1) setActiveSlot(nextEmpty);
    };

    const clearSlot = (index: number, perfumeName?: string) => {
        const nextSlots = [...slots];
        nextSlots[index] = null;
        setCheckoutSelectionSlots(nextSlots);
        setActiveSlot(index);
        setSubmitError("");
        if (perfumeName) setToastMessage(copy.toastRemoved);
    };

    const handlePerfumeAction = (perfumeId: string, assignedIndex: number | undefined) => {
        if (assignedIndex !== undefined) {
            clearSlot(assignedIndex, perfumeId);
            return;
        }
        assignPerfumeToSlot(perfumeId);
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setErrors({});
        setSubmitError("");

        if (!isSelectionComplete) {
            setSubmitError(copy.incompleteHint);
            return;
        }

        const nextErrors: Record<string, string> = {};
        if (!checkoutCustomer.fullName.trim() || checkoutCustomer.fullName.trim().length < 2) nextErrors.fullName = copy.errName;
        if (!PHONE_REGEX.test(checkoutCustomer.phone.trim())) nextErrors.phone = copy.errPhone;
        if (!checkoutCustomer.city) nextErrors.city = copy.errCity;
        if (!checkoutCustomer.address.trim() || checkoutCustomer.address.trim().length < 5) nextErrors.address = copy.errAddress;

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        const readyPerfumes = selectedPerfumes.filter((perfume): perfume is Perfume => Boolean(perfume));
        if (readyPerfumes.length !== TOTAL_SLOTS) {
            setSubmitError(copy.incompleteHint);
            return;
        }

        const tracking = getTracking();
        const customerIntent = pack === "homme" ? "له" : pack === "femme" ? "لها" : "للزوجين";

        setSubmitting(true);
        try {
            const result = await submitOrderToElieOS({
                source: "pack_product_page",
                locale: language,
                offerType: pack,
                customerIntent,
                items: readyPerfumes.map((perfume, index) => ({
                    slot: index + 1,
                    name: perfume.name,
                    free: index === GIFT_SLOT,
                })),
                pricing: {
                    currency: "MAD",
                    total: PRICE_MAD,
                    delivery: 0,
                    paymentMethod: "cod",
                },
                customer: {
                    fullName: checkoutCustomer.fullName.trim(),
                    phone: checkoutCustomer.phone.trim(),
                    city: checkoutCustomer.city,
                    address: checkoutCustomer.address.trim(),
                },
                meta: {
                    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
                    timestamp: new Date().toISOString(),
                    page: `pack_page_${pack}`,
                    utm_campaign: tracking.utm_campaign,
                    utm_adset: tracking.utm_adset,
                    utm_ad: tracking.utm_ad,
                    referrer: tracking.referrer,
                },
            });

            if (!result.success || !result.orderId) {
                setSubmitError(result.error || "Erreur");
                return;
            }

            clearCheckoutFlow();
            router.push(`/order-success?orderId=${encodeURIComponent(result.orderId)}`);
        } catch (error) {
            console.error(error);
            setSubmitError(
                language === "ar"
                    ? "تعذر إرسال الطلب حالياً. حاول مرة أخرى."
                    : "Impossible d'envoyer la commande pour le moment."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F5EFE6] pb-[calc(84px+env(safe-area-inset-bottom,0px))] text-[#1F1A17] lg:pb-16">
            <SiteHeader />

            <section className="pt-22 sm:pt-28">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-3 flex flex-wrap items-center gap-2" dir={dir}>
                        {PACK_LIST.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition ${item.id === pack
                                    ? "border-[#2E9B57] bg-[#2E9B57] text-white"
                                    : "border-[#D9C6A7] bg-white text-[#6A6259] hover:border-[#C9A86A]"
                                    }`}
                            >
                                {language === "ar" ? item.titleAr : item.titleFr}
                            </Link>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.32fr_0.68fr]">
                        <section className="order-1 overflow-hidden rounded-[22px] border border-[#D8C5A7] bg-[#FFFCF7] shadow-[0_14px_34px_rgba(31,26,23,0.06)] lg:col-start-1" dir={dir}>
                            <picture>
                                <source media="(max-width: 767px)" srcSet={packContent.heroMobile} />
                                <img
                                    src={packContent.heroDesktop}
                                    alt={language === "ar" ? packContent.titleAr : packContent.titleFr}
                                    className="h-[158px] w-full object-cover sm:h-[220px]"
                                    loading="eager"
                                    decoding="async"
                                />
                            </picture>

                            <div className={`p-4 sm:p-5 ${isRTL ? "text-right" : "text-left"}`}>
                                <h1 className={`text-[25px] leading-tight text-[#1F1A17] sm:text-[32px] ${isRTL ? "font-semibold" : "font-[var(--font-display)] font-semibold"}`}>
                                    {copy.headline}
                                </h1>
                                <p className="mt-1.5 text-[13px] text-[#6A6259]">{copy.support}</p>

                                <div className={`mt-3 flex flex-wrap gap-1.5 ${isRTL ? "justify-end" : "justify-start"}`}>
                                    {copy.pills.map((pill) => (
                                        <span key={pill} className="rounded-full border border-[#D8C5A7] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#6A6259]">
                                            {pill}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => scrollToZone("catalog")}
                                    className="mt-3 inline-flex h-[48px] min-w-[208px] items-center justify-center gap-2 rounded-[14px] border border-[#2E9B57]/40 bg-[#EFF8F3] px-5 text-[14px] font-semibold text-[#1F1A17] transition hover:bg-[#E5F4EB]"
                                >
                                    <span>{copy.topCta}</span>
                                    {isRTL ? <ArrowLeft className="h-4 w-4 text-[#2E9B57]" /> : <ArrowRight className="h-4 w-4 text-[#2E9B57]" />}
                                </button>
                            </div>
                        </section>

                        <section
                            id="selection-zone"
                            ref={selectionRef}
                            className="order-2 rounded-[22px] border border-[#D8C5A7] bg-[#FFFCF7] p-4 shadow-[0_12px_30px_rgba(31,26,23,0.05)] sm:p-5 lg:col-start-1"
                            dir={dir}
                        >
                            <div className={`flex items-center justify-between gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                                <h2 className={`text-[20px] text-[#1F1A17] ${isRTL ? "font-semibold" : "font-[var(--font-display)] font-semibold"}`}>{copy.selectionTitle}</h2>
                                <span className={`rounded-full border border-[#D8C5A7] bg-white px-2.5 py-1 text-[11px] font-bold text-[#8C6A36] transition ${progressPulse ? "scale-105" : ""}`}>
                                    {selectedCount}/6
                                </span>
                            </div>
                            <p className={`mt-1 text-[12px] font-semibold text-[#6A6259] ${isRTL ? "text-right" : "text-left"}`}>{copy.selectionLine}</p>
                            <p className={`mt-1 text-[12px] font-semibold ${selectedCount === 6 ? "text-[#2E9B57]" : "text-[#8C6A36]"} ${isRTL ? "text-right" : "text-left"}`}>{progressMessage}</p>

                            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:grid lg:grid-cols-6 lg:overflow-visible">
                                {selectedPerfumes.map((perfume, index) => {
                                    const isGift = index === GIFT_SLOT;
                                    const isGiftLocked = isGift && !firstFiveComplete;
                                    const isActive = activeSlot === index;

                                    return (
                                        <div
                                            key={`slot-${index}`}
                                            className={`relative min-w-[106px] flex-1 rounded-[14px] border p-2 transition lg:min-w-0 ${isActive
                                                ? "border-[#2E9B57] bg-[#EEF8F2]"
                                                : isGift
                                                    ? "border-[#C9A86A] bg-[#FBF3E6]"
                                                    : "border-[#E5D8C5] bg-white"
                                                } ${isGiftLocked ? "opacity-65" : ""}`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (isGiftLocked) {
                                                        setSubmitError(copy.giftSlotBlocked);
                                                        return;
                                                    }
                                                    setSubmitError("");
                                                    setActiveSlot(index);
                                                    if (perfume) focusPerfumeCard(perfume.id);
                                                }}
                                                className={`w-full ${isRTL ? "text-right" : "text-left"}`}
                                            >
                                                <p className={`text-[10px] font-semibold ${isGift ? "text-[#8C6A36]" : "text-[#6A6259]"}`}>
                                                    {isGift ? copy.slotGiftLabel : index + 1}
                                                </p>

                                                {perfume ? (
                                                    <div className={`mt-1.5 flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                                                        <img
                                                            src={perfume.image}
                                                            alt={perfume.name}
                                                            className="h-9 w-9 rounded-[10px] border border-[#E5D8C5] bg-[#FBF7EF] object-contain p-1"
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                        <span className={`inline-flex h-5 min-w-[22px] items-center justify-center rounded-full text-[10px] font-semibold ${isGift ? "bg-[#F1E1C7] text-[#8C6A36]" : "bg-[#EAF7F0] text-[#2E9B57]"}`}>
                                                            ✓
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className={`mt-2 text-[10px] ${isGiftLocked ? "text-[#B49A74]" : "text-[#9B9388]"}`}>{copy.slotEmpty}</p>
                                                )}
                                            </button>

                                            {perfume && (
                                                <button
                                                    type="button"
                                                    onClick={() => clearSlot(index, perfume.name)}
                                                    className={`absolute top-1.5 ${isRTL ? "left-1.5" : "right-1.5"} inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#E5D8C5] bg-white text-[#8E7F6B]`}
                                                    aria-label="clear"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section
                            id="catalog-zone"
                            ref={catalogRef}
                            className={`order-3 rounded-[22px] border border-[#D8C5A7] bg-[#FFFCF7] p-4 shadow-[0_12px_30px_rgba(31,26,23,0.05)] sm:p-5 lg:col-start-1 transition ${catalogFlash ? "ring-2 ring-[#C9A86A]/50" : ""}`}
                            dir={dir}
                        >
                            <div className={`flex flex-col gap-2 sm:flex-row ${isRTL ? "sm:flex-row-reverse" : ""}`}>
                                <div className="relative flex-1">
                                    <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B9388] ${isRTL ? "right-3" : "left-3"}`} />
                                    <input
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder={copy.searchPlaceholder}
                                        className={`h-11 w-full rounded-[12px] border border-[#D8C5A7] bg-white px-10 text-[13px] text-[#1F1A17] outline-none transition focus:border-[#C9A86A] ${isRTL ? "text-right" : "text-left"}`}
                                    />
                                </div>
                                <div className={`inline-flex h-11 rounded-[12px] border border-[#D8C5A7] bg-white p-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                                    {[
                                        { value: "all" as const, label: copy.filterAll },
                                        { value: "classic" as const, label: copy.filterClassic },
                                        { value: "niche" as const, label: copy.filterNiche },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setTier(option.value)}
                                            className={`rounded-[9px] px-2.5 text-[11px] font-semibold transition ${tier === option.value
                                                ? "bg-[#2E9B57] text-white"
                                                : "text-[#6A6259] hover:bg-[#F6F0E6]"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isGiftSlotActive && (
                                <p className={`mt-2 text-[12px] font-semibold ${firstFiveComplete ? "text-[#2E9B57]" : "text-[#8C6A36]"} ${isRTL ? "text-right" : "text-left"}`}>
                                    {firstFiveComplete ? copy.giftActivationReady : copy.giftActivationLocked}
                                </p>
                            )}

                            {!filteredPerfumes.length && (
                                <div className={`mt-3 rounded-[12px] border border-[#E8DCC9] bg-white p-3 text-[12px] text-[#6A6259] ${isRTL ? "text-right" : "text-left"}`}>
                                    {isGiftSlotActive && !firstFiveComplete ? copy.giftSlotBlocked : copy.noResults}
                                </div>
                            )}

                            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredPerfumes.map((perfume) => {
                                    const assignedIndex = selectedIndexById.get(perfume.id);
                                    const isAssigned = assignedIndex !== undefined;
                                    const isGiftAssigned = assignedIndex === GIFT_SLOT;
                                    const isInMainSlots = slots.slice(0, GIFT_SLOT).includes(perfume.id);
                                    const isGiftEligible = giftEligibleIds.has(perfume.id);
                                    const disableGiftPick = isGiftSlotActive && isInMainSlots && !isGiftAssigned;
                                    const isFocusedCard = highlightedPerfumeId === perfume.id || activeSlotPerfumeId === perfume.id;
                                    const hasFeedback = feedbackPerfumeId === perfume.id;

                                    return (
                                        <article
                                            key={perfume.id}
                                            id={`perfume-card-${perfume.id}`}
                                            className={`rounded-[14px] border bg-white p-2.5 transition ${isAssigned
                                                ? isGiftAssigned
                                                    ? "border-[#C9A86A] ring-1 ring-[#E8D5B6]"
                                                    : "border-[#2E9B57] ring-1 ring-[#D4EEDB]"
                                                : "border-[#E8DCC9] hover:border-[#D5BC92]"
                                                } ${isFocusedCard ? "ring-2 ring-[#C9A86A]/55" : ""} ${disableGiftPick ? "opacity-60" : ""}`}
                                        >
                                            <div className="rounded-[10px] border border-[#F0E6D8] bg-[#FBF8F2] p-1.5">
                                                <img
                                                    src={perfume.image}
                                                    alt={perfume.name}
                                                    className="mx-auto h-20 w-full object-contain"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            </div>

                                            <div className={`mt-2 ${isRTL ? "text-right" : "text-left"}`} dir={dir}>
                                                <h3 className="line-clamp-2 text-[12px] font-semibold text-[#1F1A17]">{perfume.name}</h3>
                                                <p className="mt-0.5 text-[10px] text-[#6A6259]">
                                                    {tierLabel(perfume.tier, language)} • {cueForPerfume(perfume, language)}
                                                </p>
                                            </div>

                                            {isGiftSlotActive && firstFiveComplete && isGiftEligible && (
                                                <p className={`mt-1 text-[10px] font-semibold text-[#8C6A36] ${isRTL ? "text-right" : "text-left"}`}>{copy.giftEligible}</p>
                                            )}

                                            <button
                                                type="button"
                                                disabled={disableGiftPick}
                                                onClick={() => handlePerfumeAction(perfume.id, assignedIndex)}
                                                className={`mt-2 inline-flex h-9 w-full items-center justify-center rounded-[10px] border text-[11px] font-semibold transition disabled:cursor-not-allowed ${isAssigned
                                                    ? isGiftAssigned
                                                        ? "border-[#C9A86A] bg-[#C9A86A] text-white"
                                                        : "border-[#2E9B57] bg-[#2E9B57] text-white"
                                                    : "border-[#D8C5A7] bg-white text-[#1F1A17] hover:bg-[#F8F2E8]"
                                                    } ${hasFeedback ? "scale-[0.98]" : ""}`}
                                            >
                                                {isAssigned ? (isGiftAssigned ? copy.selectedGift : copy.selected) : copy.add}
                                            </button>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>

                        <aside className="order-4 lg:col-start-2 lg:row-span-3 lg:row-start-1">
                            <div className="lg:sticky lg:top-24">
                                <form
                                    id="checkout-form"
                                    ref={checkoutRef}
                                    onSubmit={handleSubmit}
                                    className="rounded-[22px] border border-[#D8C5A7] bg-[#FFFCF7] p-4 shadow-[0_12px_30px_rgba(31,26,23,0.05)] sm:p-5"
                                    dir={dir}
                                >
                                    <div className={`flex items-center justify-between gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                                        <h3 className={`text-[20px] font-semibold text-[#1F1A17] ${isRTL ? "text-right" : "text-left"}`}>{copy.summaryTitle}</h3>
                                        <span className={`rounded-full border border-[#E4D4BD] bg-white px-3 py-1 text-[11px] font-semibold text-[#8C6A36] transition ${progressPulse ? "scale-105" : ""}`}>
                                            {copy.selectedCount}
                                        </span>
                                    </div>

                                    <div className="mt-3 rounded-[12px] border border-[#E8DCC9] bg-white p-3">
                                        <p className={`text-[11px] font-semibold text-[#6A6259] ${isRTL ? "text-right" : "text-left"}`}>{copy.compactSelected}</p>
                                        <div className="mt-2 grid grid-cols-6 gap-1.5">
                                            {selectedPerfumes.map((perfume, index) => {
                                                const isGift = index === GIFT_SLOT;
                                                return (
                                                    <div
                                                        key={`compact-${index}`}
                                                        className={`relative flex h-10 items-center justify-center overflow-hidden rounded-[9px] border ${isGift ? "border-[#C9A86A] bg-[#FBF3E6]" : "border-[#E5D8C5] bg-[#FBF7EF]"}`}
                                                    >
                                                        {perfume ? (
                                                            <img src={perfume.image} alt={perfume.name} className="h-7 w-7 object-contain" loading="lazy" decoding="async" />
                                                        ) : (
                                                            <span className={`text-[9px] font-semibold ${isGift ? "text-[#A6834E]" : "text-[#9B9388]"}`}>{isGift ? "🎁" : index + 1}</span>
                                                        )}
                                                        {perfume && (
                                                            <span className={`absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full text-[9px] font-semibold ${isGift ? "bg-[#C9A86A] text-white" : "bg-[#2E9B57] text-white"}`}>
                                                                {isGift ? "🎁" : "✓"}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <details className="mt-2">
                                            <summary className={`cursor-pointer text-[11px] font-semibold text-[#6A6259] ${isRTL ? "text-right" : "text-left"}`}>{copy.viewDetail}</summary>
                                            <div className="mt-2 space-y-1">
                                                {selectedPerfumes.map((perfume, index) => (
                                                    <p key={`detail-${index}`} className={`line-clamp-1 text-[11px] ${perfume ? "text-[#1F1A17]" : "text-[#9B9388]"} ${isRTL ? "text-right" : "text-left"}`}>
                                                        {index === GIFT_SLOT ? `${copy.giftRow}: ` : `${index + 1}. `}
                                                        {perfume ? perfume.name : copy.slotEmpty}
                                                    </p>
                                                ))}
                                            </div>
                                        </details>
                                    </div>

                                    <div className="mt-3 rounded-[14px] border border-[#D8C5A7] bg-[#F6EBDD] p-3.5">
                                        <div className={`flex items-end justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                                            <span className="text-[12px] text-[#6A6259]">{copy.total}</span>
                                            <span className="text-[27px] font-semibold text-[#1F1A17]">{PRICE_MAD} DH</span>
                                        </div>
                                        <div className={`mt-1.5 space-y-1 text-[12px] text-[#6A6259] ${isRTL ? "text-right" : "text-left"}`}>
                                            <p className={`inline-flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}><Truck className="h-3.5 w-3.5 text-[#2E9B57]" />{copy.freeDelivery}</p>
                                            <p className={`inline-flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}><ShieldCheck className="h-3.5 w-3.5 text-[#2E9B57]" />{copy.cod}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <label className={`${isRTL ? "text-right" : "text-left"}`}>
                                                <span className="mb-1 block text-[12px] text-[#6A6259]">{copy.name}</span>
                                                <input
                                                    value={checkoutCustomer.fullName}
                                                    onChange={(event) => setCheckoutCustomer({ fullName: event.target.value })}
                                                    className={`h-11 w-full rounded-[12px] border border-[#D8C5A7] bg-white px-3 text-[13px] text-[#1F1A17] outline-none transition focus:border-[#C9A86A] ${isRTL ? "text-right" : "text-left"}`}
                                                />
                                            </label>
                                            <label className={`${isRTL ? "text-right" : "text-left"}`}>
                                                <span className="mb-1 block text-[12px] text-[#6A6259]">{copy.phone}</span>
                                                <input
                                                    value={checkoutCustomer.phone}
                                                    onChange={(event) => setCheckoutCustomer({ phone: event.target.value })}
                                                    className={`h-11 w-full rounded-[12px] border border-[#D8C5A7] bg-white px-3 text-[13px] text-[#1F1A17] outline-none transition focus:border-[#C9A86A] ${isRTL ? "text-right" : "text-left"}`}
                                                />
                                            </label>
                                        </div>

                                        <CitySelector
                                            value={checkoutCustomer.city}
                                            onChange={(city) => setCheckoutCustomer({ city })}
                                        />

                                        <label className={`${isRTL ? "text-right" : "text-left"}`}>
                                            <span className="mb-1 block text-[12px] text-[#6A6259]">{copy.address}</span>
                                            <textarea
                                                rows={3}
                                                value={checkoutCustomer.address}
                                                onChange={(event) => setCheckoutCustomer({ address: event.target.value })}
                                                className={`w-full rounded-[12px] border border-[#D8C5A7] bg-white px-3 py-2.5 text-[13px] text-[#1F1A17] outline-none transition focus:border-[#C9A86A] ${isRTL ? "text-right" : "text-left"}`}
                                            />
                                        </label>
                                    </div>

                                    {!isSelectionComplete && (
                                        <p className={`mt-3 rounded-[10px] border border-[#E9D8B9] bg-[#FBF4E8] px-3 py-2 text-[12px] font-semibold text-[#8C6A36] ${isRTL ? "text-right" : "text-left"}`}>
                                            {copy.incompleteHint}
                                        </p>
                                    )}

                                    {(submitError || Object.keys(errors).length > 0) && (
                                        <div className={`mt-3 rounded-[12px] border border-red-200 bg-red-50 p-3 text-[12px] text-red-700 ${isRTL ? "text-right" : "text-left"}`}>
                                            {submitError && <p>{submitError}</p>}
                                            {Object.values(errors).map((error) => (
                                                <p key={error}>{error}</p>
                                            ))}
                                        </div>
                                    )}

                                    <a
                                        href={whatsappHref}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-4 inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-[12px] border border-[#2E9B57]/35 bg-white text-[13px] font-semibold text-[#2E9B57] transition hover:bg-[#EFF8F3]"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        <span>{copy.whatsapp}</span>
                                    </a>

                                    <button
                                        type="submit"
                                        disabled={submitting || !isSelectionComplete}
                                        className="cta-primary mt-3 inline-flex h-[56px] w-full items-center justify-center gap-2 text-[15px] font-bold disabled:opacity-50"
                                    >
                                        <span>{submitting ? copy.sending : copy.cta}</span>
                                        {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                                    </button>
                                </form>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            {toastMessage && (
                <div className="pointer-events-none fixed inset-x-0 bottom-[86px] z-[70] flex justify-center px-4 lg:hidden">
                    <div className="rounded-full border border-[#D8C5A7] bg-white px-4 py-2 text-[12px] font-semibold text-[#1F1A17] shadow-[0_10px_24px_rgba(31,26,23,0.16)]">
                        {toastMessage}
                    </div>
                </div>
            )}

            <div className={`fixed inset-x-0 bottom-0 z-[65] border-t border-[#D8C5A7] bg-[#FFF9F0]/95 p-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] backdrop-blur-xl transition lg:hidden ${checkoutInView ? "translate-y-[110%] opacity-0" : "translate-y-0 opacity-100"}`}>
                <div className={`mx-auto flex w-full max-w-3xl items-center gap-2.5 ${isRTL ? "flex-row-reverse" : ""}`} dir={dir}>
                    <div className={`min-w-0 flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                        <p className={`text-[12px] font-bold text-[#8C6A36] transition ${progressPulse ? "scale-[1.02]" : ""}`}>{selectedCount}/6</p>
                        <p className="line-clamp-1 text-[11px] text-[#6A6259]">{progressMessage}</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            if (selectedCount === TOTAL_SLOTS) {
                                scrollToZone("checkout");
                                return;
                            }
                            scrollToZone("catalog");
                        }}
                        className="cta-primary inline-flex h-[52px] min-w-[168px] items-center justify-center gap-2 px-4 text-[14px] font-bold"
                    >
                        <span>{selectedCount === 0 ? copy.topCta : copy.cta}</span>
                        {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    </button>
                </div>
            </div>
        </main>
    );
}
