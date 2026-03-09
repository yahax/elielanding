"use client";

import Link from "next/link";
import { MessageCircle, Shield, Truck } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export function TrustSupportSection() {
    const { dir, language } = useI18n();
    const stats = language === "ar"
        ? [
            { label: "+10,000 اختيار عميل", value: "موثوق" },
            { label: "توصيل إلى جميع المدن", value: "100%" },
            { label: "الدفع عند الاستلام", value: "COD" },
            { label: "تأكيد سريع للطلب", value: "< 15د" },
        ]
        : [
            { label: "10 000+ choix clients", value: "Trusted" },
            { label: "Livraison partout au Maroc", value: "100%" },
            { label: "Paiement a la livraison", value: "COD" },
            { label: "Confirmation rapide", value: "< 15 min" },
        ];

    return (
        <section className="bg-[#f8f2e9] py-14 sm:py-16" dir={dir}>
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className={`mb-6 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                    <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#b69257]">
                        {language === "ar" ? "ثقة وطمأنينة" : "Confiance ELIE"}
                    </p>
                    <h2 className={`mt-2 text-[30px] text-zinc-900 sm:text-[36px] ${dir === "rtl" ? "font-semibold" : "font-[var(--font-display)] font-semibold"}`}>
                        {language === "ar" ? "تجربة شراء مطمئنة من البداية للنهاية" : "Un parcours rassurant du debut a la livraison"}
                    </h2>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="rounded-[16px] border border-[#e4d6bf] bg-[#fffdf9] px-4 py-3 shadow-[0_10px_24px_rgba(26,16,6,0.05)]">
                            <p className={`text-[16px] font-semibold text-zinc-900 ${dir === "rtl" ? "text-right" : "text-left"}`}>{stat.value}</p>
                            <p className={`mt-1 text-[11px] text-zinc-600 ${dir === "rtl" ? "text-right" : "text-left"}`}>{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <article className="rounded-[24px] border border-[#e4d6bf] bg-white/86 p-5 shadow-[0_14px_34px_rgba(26,16,6,0.06)]">
                    <Truck className="h-5 w-5 text-[#2f8f5b]" />
                    <h3 className={`mt-3 text-[17px] font-semibold text-zinc-900 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                        {language === "ar" ? "توصيل مجاني داخل المغرب" : "Livraison gratuite au Maroc"}
                    </h3>
                    <p className={`mt-2 text-[13px] text-zinc-600 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                        {language === "ar"
                            ? "طلبك يتم تأكيده بسرعة مع متابعة واضحة حتى التوصل."
                            : "Confirmation rapide et suivi clair de votre commande jusqu'a la livraison."}
                    </p>
                </article>

                <article className="rounded-[24px] border border-[#e4d6bf] bg-white/86 p-5 shadow-[0_14px_34px_rgba(26,16,6,0.06)]">
                    <Shield className="h-5 w-5 text-[#2f8f5b]" />
                    <h3 className={`mt-3 text-[17px] font-semibold text-zinc-900 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                        {language === "ar" ? "طلب آمن وواضح" : "Commande claire et securisee"}
                    </h3>
                    <p className={`mt-2 text-[13px] text-zinc-600 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                        {language === "ar"
                            ? "ملخص العطور المختارة يظهر قبل إرسال الطلب النهائي."
                            : "Recapitulatif complet de vos parfums avant validation finale."}
                    </p>
                </article>

                <article className="rounded-[24px] border border-[#d3e4d9] bg-[#f4fbf7] p-5 shadow-[0_14px_34px_rgba(26,16,6,0.06)]">
                    <MessageCircle className="h-5 w-5 text-[#2f8f5b]" />
                    <h3 className={`mt-3 text-[17px] font-semibold text-zinc-900 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                        {language === "ar" ? "مساعدة فورية عبر واتساب" : "Aide rapide sur WhatsApp"}
                    </h3>
                    <p className={`mt-2 text-[13px] text-zinc-600 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                        {language === "ar"
                            ? "لو محتار في الاختيار، تواصل معنا وسنساعدك فوراً."
                            : "Besoin d'aide pour choisir ? Notre equipe vous repond rapidement."}
                    </p>
                    <Link
                        href="https://wa.me/212600000000"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex h-[50px] items-center justify-center rounded-[14px] border border-[#2f8f5b]/25 bg-[#2f8f5b] px-5 text-[14px] font-semibold text-white transition hover:bg-[#26764b]"
                    >
                        {language === "ar" ? "التواصل عبر واتساب" : "Contacter sur WhatsApp"}
                    </Link>
                </article>
                </div>
            </div>
        </section>
    );
}
