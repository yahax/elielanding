"use client";

import type { ReactNode } from "react";
import { BottomTabBar } from "@/components/os/mobile/BottomTabBar";
import { MobileTopbar } from "@/components/os/mobile/MobileTopbar";

export function MobilePageShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <MobileTopbar />
      <main
        style={{
          flex: 1,
          padding: "10px 10px calc(96px + var(--safe-bottom))",
          overflowX: "hidden",
        }}
      >
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
