"use client";

import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { useI18n } from "@/hooks/useI18n";

const WHATSAPP_NUMBER = "212669266486";

export function FloatingWhatsAppButton() {
    const { language } = useI18n();

    const label = language === "ar" ? "اطلب عبر واتساب" : "Commander par WhatsApp";
    const message = "السلام عليكم، بغيت نطلب عرض ELIE 5+1. ممكن تعاونوني نكمل الطلب؟";

    const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-[#25D366] px-4 py-2.5 text-white shadow-lg transition-all hover:scale-105 active:scale-95 scale-90 sm:scale-100"
            aria-label={label}
        >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#25D366]">
                <WhatsAppIcon className="h-4.5 w-4.5" />
            </div>

            <span className="text-[13px] font-bold whitespace-nowrap">
                {label}
            </span>
        </a>
    );
}
