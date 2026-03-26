import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "../globals.css";
import "./os-admin.css";
import { OsAdminLayoutClient } from "@/components/os/admin/OsAdminLayoutClient";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ELIE OS Admin",
  description: "Management dashboard (internal)",
};

export default function OsAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={manrope.variable}>
      <OsAdminLayoutClient>{children}</OsAdminLayoutClient>
    </div>
  );
}
