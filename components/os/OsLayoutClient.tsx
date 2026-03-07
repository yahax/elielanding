"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/os/Sidebar";
import { TopBar } from "@/components/os/TopBar";
import { OsGuard } from "@/components/os/OsGuard";

export function OsLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/os/login";

  if (isLoginPage) {
    return (
      <div className="dashboard-body">
        <OsGuard>{children}</OsGuard>
      </div>
    );
  }

  return (
    <div className="dashboard-body" dir="ltr">
      <div className="dashboard-shell">
        <OsGuard>
          <Sidebar />
          <div className="dashboard-main">
            <TopBar />
            <main className="dashboard-content">
              <div className="animate-fade-in">{children}</div>
            </main>
          </div>
        </OsGuard>
      </div>
    </div>
  );
}
