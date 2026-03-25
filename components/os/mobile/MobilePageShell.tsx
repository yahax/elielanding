"use client";

import type { ReactNode } from "react";
import { BottomTabBar } from "@/components/os/mobile/BottomTabBar";
import { MobileTopbar } from "@/components/os/mobile/MobileTopbar";

export function MobilePageShell({ children }: { children: ReactNode }) {
  return (
    <div className="os-mobile-shell">
      <MobileTopbar />
      <main className="os-mobile-shell-content">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
