"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import {
    X,
    MapPin,
    User,
    Phone,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Loader2,
} from "lucide-react";
import { Perfume } from "@/data/perfumes";
import { MAX_CHOSEN, PRICE_MAD } from "@/lib/offer-config";
import { useI18n } from "@/hooks/useI18n";
import { z } from "zod";
import { submitOrderToElieOS, ElieOSOrderPayload } from "@/lib/elie-os";
import { getTracking } from "@/lib/tracking";

// ── Constants ──────────────────────────────────────────────────────────────

const CITIES = [
    { label_ar: "الدار البيضاء", label_fr: "Casablanca", value: "Casablanca" },
    { label_ar: "الرباط", label_fr: "Rabat", value: "Rabat" },
    { label_ar: "مراكش", label_fr: "Marrakech", value: "Marrakech" },
    { label_ar: "طنجة", label_fr: "Tanger", value: "Tanger" },
    { label_ar: "فاس", label_fr: "Fes", value: "Fes" },
    { label_ar: "أكادير", label_fr: "Agadir", value: "Agadir" },
    { label_ar: "أخرى", label_fr: "Autre", value: "Other" },
];

/** Morocco phone: starts with 06 or 07, exactly 10 digits */
const PHONE_REGEX = /^0[67]\d{8}$/;

const checkoutSchema = z.object({
    name: z.string().min(2, "error_name"),
    phone: z.string().regex(PHONE_REGEX, "error_phone"),
    city: z.string().min(1, "error_city"),
    address: z.string().min(5, "error_address"),
});

type Screen = "form" | "success" | "error";

// ── Component ──────────────────────────────────────────────────────────────

export function CheckoutDrawer() {
    const {
        isDrawerOpen,
        setDrawerOpen,
        selectedPerfumes,
        selectedPackType,
        language,
        clearPerfumes,
    } = useStore();

    const { t, isRTL, dir } = useI18n();

    const [screen, setScreen] = useState<Screen>("form");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [globalError, setGlobalError] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);

    // ── Derived ───────────────────────────────────────────────────────────

    const filledPerfumes = useMemo(
        () => selectedPerfumes.filter(Boolean) as Perfume[],
        [selectedPerfumes]
    );

    // ── Effects ───────────────────────────────────────────────────────────

    useEffect(() => {
        const setVH = () =>
            document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
        setVH();
        window.addEventListener("resize", setVH);
        return () => window.removeEventListener("resize", setVH);
    }, []);

    useEffect(() => {
        if (isDrawerOpen) {
            setScreen("form");
            setGlobalError("");
            setErrors({});
            // Reset state with empty strings to avoid stale values or browser weirdness
            setName("");
            setPhone("");
            setCity("");
            setAddress("");
        }
    }, [isDrawerOpen]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 320);
    };

    // ── Submit Logic ─────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGlobalError("");
        setErrors({});

        // 1. Validate form
        const result = checkoutSchema.safeParse({ name, phone, city, address });
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                fieldErrors[issue.path[0]] = t(issue.message as any);
            });
            setErrors(fieldErrors);
            return;
        }

        if (filledPerfumes.length < MAX_CHOSEN) {
            setGlobalError(t('error_count'));
            return;
        }

        setSubmitting(true);

        // 2. Build Payload
        const tracking = getTracking();

        // Majority gender/intent detection simplified for the payload
        const customerIntent = selectedPackType === "homme" ? "له" : selectedPackType === "femme" ? "لها" : "للزوجين";

        const payload: ElieOSOrderPayload = {
            source: "landing_page",
            locale: language as "ar" | "fr",
            offerType: selectedPackType || "mixte",
            customerIntent: customerIntent as any,
            items: filledPerfumes.map((p, i) => ({
                slot: i + 1,
                name: p.name,
                free: i === 5
            })),
            pricing: {
                currency: "MAD",
                total: PRICE_MAD,
                delivery: 0,
                paymentMethod: "cod"
            },
            customer: {
                fullName: name.trim(),
                phone: phone.trim(),
                city: city,
                address: address.trim()
            },
            meta: {
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                page: "elie_landing",
                utm_campaign: tracking.utm_campaign,
                utm_adset: tracking.utm_adset,
                utm_ad: tracking.utm_ad,
                referrer: tracking.referrer
            }
        };

        // 3. Submit
        const { success, error, orderId } = await submitOrderToElieOS(payload);

        setSubmitting(false);

        if (success && orderId) {
            console.log("[ELIE] Order created successfully:", orderId);
            setScreen("success");
            clearPerfumes();
        } else {
            console.error("[ELIE] Order submission failed:", error || "No orderId returned");
            // During debugging, show the actual error message if available
            const displayError = error ? `${t('error_text_os')}: ${error}` : t('error_text_os');
            setGlobalError(displayError);
        }
    };

    // ── Render Helpers ───────────────────────────────────────────────────

    const renderFields = () => (
        <div className="space-y-4">
            <div className="relative group">
                <User className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-primary transition-colors`} />
                <input
                    required
                    type="text"
                    autoComplete="off"
                    name="elie_full_name"
                    placeholder={t('full_name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={handleFocus}
                    className={`w-full ${isRTL ? 'pr-12 pl-5 text-right' : 'pl-12 pr-5 text-left'} py-4 rounded-[1.5rem] bg-zinc-50 border ${errors.name ? 'border-red-300 ring-1 ring-red-100' : 'border-zinc-200'} focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium text-[16px] text-zinc-900`}
                    dir={dir}
                />
            </div>

            <div className="relative group">
                <Phone className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-primary transition-colors`} />
                <input
                    required
                    type="tel"
                    autoComplete="off"
                    name="elie_phone"
                    placeholder={t('phone')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={handleFocus}
                    className={`w-full ${isRTL ? 'pr-12 pl-5 text-right' : 'pl-12 pr-5 text-left'} py-4 rounded-[1.5rem] bg-zinc-50 border ${errors.phone ? 'border-red-300 ring-1 ring-red-100' : 'border-zinc-200'} focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium text-[16px] text-zinc-900`}
                    dir={dir}
                />
            </div>

            <div className="space-y-3">
                <label
                    className={`text-[11px] font-black text-zinc-900 px-1 ${isRTL ? 'justify-end' : 'justify-start'} uppercase tracking-[0.15em] flex items-center gap-2 mb-1`}
                    dir={dir}
                >
                    {isRTL ? (
                        <>
                            <span>{t('delivery_city')}</span>
                            <MapPin className="w-3.5 h-3.5 text-[#C9A86A]" />
                        </>
                    ) : (
                        <>
                            <MapPin className="w-3.5 h-3.5 text-[#C9A86A]" />
                            <span>{t('delivery_city')}</span>
                        </>
                    )}
                </label>

                <div className="grid grid-cols-4 gap-2">
                    {CITIES.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => setCity(c.value)}
                            className={`px-1 py-2.5 rounded-xl text-[11px] font-bold transition-all border ${city === c.value
                                ? "bg-primary border-primary text-white shadow-lg"
                                : "border-zinc-200 bg-white text-zinc-400 hover:border-primary/30"
                                }`}
                        >
                            {language === 'ar' ? c.label_ar : c.label_fr}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative group">
                <MapPin className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-4 w-5 h-5 text-zinc-300 group-focus-within:text-primary transition-colors`} />
                <textarea
                    required
                    autoComplete="off"
                    name="elie_address"
                    placeholder={t('address')}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onFocus={handleFocus as React.FocusEventHandler<HTMLTextAreaElement>}
                    rows={2}
                    className={`w-full ${isRTL ? 'pr-12 pl-5 text-right' : 'pl-12 pr-5 text-left'} py-4 rounded-[1.5rem] bg-zinc-50 border ${errors.address ? 'border-red-300 ring-1 ring-red-100' : 'border-zinc-200'} focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium text-[16px] text-zinc-900 resize-none`}
                    dir={dir}
                />
            </div>
        </div>
    );

    const renderPerfumeSection = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <label
                    className={`text-xs font-black text-zinc-400 px-1 ${isRTL ? 'justify-end' : 'justify-start'} uppercase tracking-widest flex items-center gap-2`}
                    dir={dir}
                >
                    <span>
                        {t('selected_perfumes_label')} ({filledPerfumes.length}/{MAX_CHOSEN})
                    </span>
                </label>

                <div className={`flex flex-wrap gap-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                    {filledPerfumes.map((p, i) => (
                        <span
                            key={`${p.id}-${i}`}
                            className={`text-[12px] rounded-xl px-4 py-2 font-bold flex items-center gap-2 shadow-sm ${i === 5
                                ? "bg-amber-100 border border-amber-200 text-amber-700"
                                : "bg-primary/10 border border-primary/20 text-primary"}`}
                        >
                            {i === 5 && <span className="text-sm">🎁 {t('gift')}</span>}
                            <span>{i + 1}. {p.name}</span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderSummary = () => (
        <div
            className={`p-6 rounded-[2rem] bg-zinc-900 text-white flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between shadow-xl shadow-zinc-900/10 border border-white/5`}
            dir={dir}
        >
            <div className={isRTL ? 'text-right' : 'text-left'}>
                <div className="text-[10px] text-white/40 mb-1 font-black uppercase tracking-[0.2em]">{t('total')}:</div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-[#C9A86A]">{PRICE_MAD}</span>
                    <span className="text-lg font-bold text-[#C9A86A]/80">DH</span>
                </div>
            </div>

            <div className={`${isRTL ? 'text-right' : 'text-left'} text-[10px] text-white/60 space-y-1.5 font-black uppercase tracking-widest`}>
                <div className={`flex items-center ${isRTL ? 'justify-end' : 'justify-start'} gap-2`}>
                    <div className="w-1 h-1 rounded-full bg-[#C9A86A]" />
                    <span>{t('free_delivery')}</span>
                </div>
                <div className={`flex items-center ${isRTL ? 'justify-end' : 'justify-start'} gap-2`}>
                    <div className="w-1 h-1 rounded-full bg-[#C9A86A]" />
                    <span>{t('payment_on_delivery')}</span>
                </div>
            </div>
        </div>
    );

    const renderSuccess = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-10 px-4 space-y-8"
        >
            <div className="relative">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                >
                    <CheckCircle2 className="w-24 h-24 text-primary drop-shadow-[0_0_20px_rgba(198,163,78,0.4)]" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -top-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg"
                >
                    <CheckCircle2 className="w-4 h-4" />
                </motion.div>
            </div>

            <div dir={dir} className="space-y-3">
                <h3 className="text-3xl font-black text-zinc-900">{t('success_title_os')}</h3>
                <p className="text-zinc-500 text-[16px] leading-relaxed max-w-sm mx-auto font-medium">
                    {t('success_text_os')}
                </p>
            </div>

            <div className="w-full pt-4">
                <button
                    onClick={() => setDrawerOpen(false)}
                    className="w-full py-5 rounded-[1.5rem] bg-zinc-900 text-white font-black text-lg shadow-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                    <span>{t('continue_browsing')}</span>
                    {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                </button>
            </div>
        </motion.div>
    );

    // ── Main Render ──────────────────────────────────────────────────────

    return (
        <AnimatePresence>
            {isDrawerOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !submitting && setDrawerOpen(false)}
                        className="fixed inset-0 z-[100] bg-zinc-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 32, stiffness: 320 }}
                        className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-[2.5rem] border-t border-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
                        style={{ maxHeight: "calc(var(--vh, 1vh) * 94)" }}
                    >
                        <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto mt-4 mb-1" />

                        <button
                            disabled={submitting}
                            onClick={() => setDrawerOpen(false)}
                            className="absolute top-4 left-4 p-2.5 rounded-full bg-zinc-50 border border-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div
                            ref={scrollRef}
                            className="overflow-y-auto overflow-x-visible custom-scrollbar"
                            style={{ maxHeight: "calc(var(--vh, 1vh) * 88)", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
                        >
                            <div className="max-w-lg mx-auto px-5 pb-12 pt-2 relative">
                                <div className="flex justify-center mb-8">
                                    <img
                                        src="/catalogues/brand/logo-noir.png"
                                        alt="ELIE"
                                        className="h-10 w-auto"
                                    />
                                </div>

                                {screen === "success" ? (
                                    renderSuccess()
                                ) : (
                                    <motion.form
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-6"
                                        dir={dir}
                                    >
                                        <div className="text-center mb-2">
                                            <h3 className="text-[28px] font-black tracking-tight text-zinc-900">
                                                {t('checkout_title')}
                                            </h3>
                                        </div>

                                        {renderPerfumeSection()}

                                        <div className="space-y-5">
                                            {renderFields()}
                                            {renderSummary()}
                                        </div>

                                        {(globalError || Object.keys(errors).length > 0) && (
                                            <div className={`p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600 text-[14px] font-bold ${isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    {globalError && <p>{globalError}</p>}
                                                    {Object.entries(errors).map(([key, msg]) => (
                                                        <p key={key}>{msg}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={submitting || filledPerfumes.length < MAX_CHOSEN}
                                            className="relative w-full h-[76px] rounded-[24px] bg-gradient-to-r from-[#C9A86A] to-[#B69559] text-white font-black text-[22px] flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(198,163,78,0.4)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 group disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed overflow-hidden"
                                        >
                                            {submitting && (
                                                <div className="absolute inset-0 bg-[#C9A86A] flex items-center justify-center z-10">
                                                    <Loader2 className="w-7 h-7 animate-spin" />
                                                    <span className="ml-3 font-bold">{t('sending_loader')}</span>
                                                </div>
                                            )}

                                            <span>{t('submit')}</span>
                                            {isRTL ? <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                                        </button>

                                        <div className="flex items-center justify-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-widest pb-4">
                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                            <span>SSL SECURE ORDER</span>
                                        </div>
                                    </motion.form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}