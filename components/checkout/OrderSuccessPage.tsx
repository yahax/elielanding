"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useI18n } from "@/hooks/useI18n";

type OrderSuccessPageProps = {
    orderId?: string;
};

export function OrderSuccessPage({ orderId }: OrderSuccessPageProps) {
    const { language, dir, isRTL } = useI18n();

    const title = language === "ar"
        ? "تم إرسال طلبك بنجاح"
        : "Votre commande a été envoyée avec succès";

    const subtitle = language === "ar"
        ? "سيتواصل معك فريقنا قريباً لتأكيد الطلب."
        : "Notre équipe vous contactera rapidement pour confirmer votre commande.";

    const back = language === "ar"
        ? "العودة إلى الصفحة الرئيسية"
        : "Retour a la page d'accueil";

    const another = language === "ar"
        ? "طلب باك آخر"
        : "Commander un autre pack";

    return (
        <main className="min-h-screen bg-[#f8f2e9] pb-14 text-zinc-900">
            <SiteHeader />

            <section className="pt-24 sm:pt-28">
                <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className={`rounded-[28px] border border-[#d6e9df] bg-white p-8 text-center shadow-[0_18px_48px_rgba(26,16,6,0.08)] ${isRTL ? "text-right" : "text-left"}`} dir={dir}>
                        <CheckCircle2 className="mx-auto h-14 w-14 text-[#2f8f5b]" />
                        <h1 className="mt-4 text-[32px] font-semibold text-zinc-900">{title}</h1>
                        <p className={`mt-2 text-[15px] text-zinc-600 ${isRTL ? "text-right" : "text-left"}`}>{subtitle}</p>
                        {orderId && (
                            <p className={`mt-3 text-[12px] text-zinc-500 ${isRTL ? "text-right" : "text-left"}`}>
                                Order ID: {orderId}
                            </p>
                        )}

                        <Link href="/" className="cta-primary mt-6 inline-flex h-[56px] items-center justify-center px-7 text-[15px] font-bold">
                            {back}
                        </Link>
                        <Link href="/pack/mixte" className="mt-3 inline-flex h-[50px] items-center justify-center rounded-[14px] border border-[#d7c19c] bg-[#f7f0e4] px-6 text-[14px] font-semibold text-zinc-800">
                            {another}
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
