"use client";

import { BadgeCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export function LandingBenefits() {
    const { dir, language } = useI18n();

    const items =
        language === "ar"
            ? [
                { icon: Sparkles, title: "اختيار بسيط وواضح", body: "اختر الـ Pack ثم أكمل اختيار 5 عطور فقط بكل هدوء." },
                { icon: BadgeCheck, title: "ثقة +10,000 زبون", body: "عرض مبني على اختيارات عملائنا في مختلف مدن المغرب." },
                { icon: Truck, title: "توصيل مجاني سريع", body: "توصيل مجاني مع تأكيد سريع للطلب بعد الإرسال." },
                { icon: ShieldCheck, title: "الدفع عند الاستلام", body: "تطلب الآن وتدفع بعد التوصل بطلبيتك." },
            ]
            : [
                { icon: Sparkles, title: "Parcours simplifie", body: "Choisissez votre pack puis selectionnez 5 parfums en toute clarte." },
                { icon: BadgeCheck, title: "Plus de 10 000 clients", body: "Une offre basee sur les preferences reelles de nos clients au Maroc." },
                { icon: Truck, title: "Livraison gratuite", body: "Livraison rapide partout au Maroc sans frais supplementaires." },
                { icon: ShieldCheck, title: "Paiement a la livraison", body: "Vous commandez maintenant et reglez a la reception." },
            ];

    return (
        <section className="bg-[#f7efe4] py-12 sm:py-16">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8" dir={dir}>
                <div className={`mb-6 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                    <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#b69257]">
                        {language === "ar" ? "لماذا ELIE" : "Pourquoi ELIE"}
                    </p>
                    <h2 className={`mt-2 text-[30px] text-zinc-900 sm:text-[36px] ${dir === "rtl" ? "font-semibold" : "font-[var(--font-display)] font-semibold"}`}>
                        {language === "ar" ? "تجربة شراء أوضح وأفخم" : "Une experience plus claire et premium"}
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                {items.map((item) => (
                    <article
                        key={item.title}
                        dir={dir}
                        className="rounded-[24px] border border-[#e5d6bf] bg-white/78 p-5 shadow-[0_14px_34px_rgba(26,16,6,0.06)]"
                    >
                        <item.icon className="h-5 w-5 text-[#b69357]" />
                        <h3 className={`mt-3 text-[16px] font-semibold text-zinc-900 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                            {item.title}
                        </h3>
                        <p className={`mt-2 text-[13px] leading-relaxed text-zinc-600 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                            {item.body}
                        </p>
                    </article>
                ))}
                </div>
            </div>
        </section>
    );
}
