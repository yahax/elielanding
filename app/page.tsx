"use client";

import React, { useEffect } from "react";
import { captureTracking } from "@/lib/tracking";
import { SiteHeader } from "@/components/site/SiteHeader";
import { LandingHero } from "@/components/site/LandingHero";
import { LandingBenefits } from "@/components/site/LandingBenefits";
import { PackCardsSection } from "@/components/site/PackCardsSection";
import { useI18n } from "@/hooks/useI18n";

export default function Home() {
  const { language } = useI18n();

  useEffect(() => {
    captureTracking();
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f2e9] text-zinc-900">
      <SiteHeader />
      <LandingHero />
      <PackCardsSection />
      <LandingBenefits />
      <footer className="border-t border-[#e7d9c3] bg-[#f6ede1] py-10 text-center text-[13px] text-zinc-600">
        <p dir={language === "ar" ? "rtl" : "ltr"}>
          {language === "ar"
            ? "© 2026 ELIE Parfum. جميع الحقوق محفوظة."
            : "© 2026 ELIE Parfum. Tous droits réservés."}
        </p>
      </footer>
    </main>
  );
}
