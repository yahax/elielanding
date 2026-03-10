"use client";

import { useStore } from "@/store/useStore";
import ar from "@/messages/ar.json";
import fr from "@/messages/fr.json";
import { useCallback } from "react";

// Flexible type for translation keys to avoid lint errors while developing
type TranslationKey = keyof typeof fr.common | (string & {});
type MessageCatalog = {
    common: Record<string, string>;
};

export function useI18n() {
    const language = useStore((state) => state.language);
    const setLanguage = useStore((state) => state.setLanguage);

    const t = useCallback((key: TranslationKey, variables?: Record<string, string | number>) => {
        const messages: MessageCatalog = language === "ar" ? ar : fr;
        const fallbackMessages: MessageCatalog = fr;
        let message = messages.common[key] || fallbackMessages.common[key] || key;

        if (variables) {
            Object.entries(variables).forEach(([k, v]) => {
                message = message.replace(`{${k}}`, String(v));
                message = message.replace(`x`, String(v)); // Simple replacement for (x/6)
            });
        }

        return message;
    }, [language]);

    const isRTL = language === "ar";
    const dir: "rtl" | "ltr" = isRTL ? "rtl" : "ltr";

    return { t, language, setLanguage, isRTL, dir };
}
