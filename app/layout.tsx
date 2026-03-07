import type { Metadata } from "next";
import { Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

const notoKufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-kufi",
});

export const metadata: Metadata = {
  title: "ELIE Parfum | 5 عطور + 1 مجانا",
  description: "عرض رمضان الحصري من إيلي بارفان. توصيل مجاني والدفع عند الاستلام.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html dir="rtl" lang="ar" className={`${notoKufi.variable}`} suppressHydrationWarning>
      <body className="bg-black text-white antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
