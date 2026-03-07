"use client";

import React, { useEffect } from "react";
import { Hero } from "@/components/Hero";
import { OfferCards } from "@/components/OfferCards";
import { SlotsBuilder } from "@/components/SlotsBuilder";
import { PerfumeGrid2Rows } from "@/components/PerfumeGrid2Rows";
import { CatalogueCards } from "@/components/CatalogueCards";
import { CheckoutDrawer } from "@/components/CheckoutDrawer";
import { StickyBar } from "@/components/StickyBar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Chatbot2030 } from "@/components/Chatbot2030";
import { captureTracking } from "@/lib/tracking";

export default function Home() {
  // Capture UTM params & device info on first render
  useEffect(() => {
    captureTracking();
  }, []);

  return (
    /* Extra bottom padding on mobile: 80px sticky WA CTA + 72px StickyBar + safe area */
    <main className="min-h-screen pb-[172px] md:pb-40">

      {/* Header with Logo & Language Switcher */}
      <header className="fixed top-0 left-0 right-0 z-[60] py-4 transition-all duration-300">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex-1 hidden md:block" />

          <div className="flex-1 flex justify-center">
            <img
              src="/catalogues/brand/logo-noir.png"
              alt="ELIE"
              className="h-7 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `<div class="text-zinc-900 font-bold text-xl tracking-widest text-center">ELIE</div>`;
              }}
            />
          </div>

          <div className="flex-1 flex justify-end">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <Hero />
      <OfferCards />
      <SlotsBuilder />
      <PerfumeGrid2Rows />
      <CatalogueCards />
      <CheckoutDrawer />
      <StickyBar />
      <Chatbot2030 />

      {/* Footer */}
      <footer className="py-16 border-t border-white/5 text-center text-white/30 text-sm">
        <div className="mb-5">
          <img
            src="/catalogues/brand/logo-white.png"
            alt="ELIE Parfum"
            className="h-7 w-auto mx-auto opacity-20 brightness-75 grayscale"
          />
        </div>
        <p dir="rtl">© {new Date().getFullYear()} ELIE Parfum. جميع الحقوق محفوظة.</p>
        <p dir="rtl" className="mt-2 text-xs">ماركة مغربية مسجلة | الدار البيضاء</p>
      </footer>
    </main>
  );
}

