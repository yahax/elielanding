"use client";

import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { useI18n } from "@/hooks/useI18n";

const WHATSAPP_NUMBER = "212669266486";

export function FloatingWhatsAppButton() {
    const { language } = useI18n();

    const label = language === "ar" ? "اطلب عبر واتساب" : "Commander via WhatsApp";
    const subLabel = language === "ar" ? "سريع ومباشر" : "Rapide et direct";
    const message = "السلام عليكم، بغيت نطلب عرض ELIE 5+1. ممكن تعاونوني نكمل الطلب؟";

    const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="fixed bottom-[calc(1rem+var(--safe-bottom))] right-3 z-50 flex w-fit max-w-[calc(100vw-1rem)] items-center gap-3 rounded-full border border-[#20B85A] bg-[#25D366] px-3 py-2.5 text-white shadow-[0_14px_28px_rgba(37,211,102,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(37,211,102,0.35)] active:scale-95 sm:right-6 sm:px-4 sm:scale-100"
            aria-label={label}
        >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#25D366]">
                <WhatsAppIcon className="h-4.5 w-4.5" />
            </div>

            <span className="flex flex-col leading-tight">
                <span className="text-[13px] font-bold whitespace-nowrap">{label}</span>
                <span className="hidden md:block text-[10px] font-semibold text-white/90 whitespace-nowrap">{subLabel}</span>
            </span>
        </a>
    );
}
