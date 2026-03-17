import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

const notoKufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-kufi",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "ELIE Parfum | Pack Mixte",
  description: "Pack Mixte ELIE Parfum: 5 parfums 30ml + 1 cadeau, livraison gratuite et paiement a la livraison au Maroc.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html dir="ltr" lang="fr" className={`${notoKufi.variable} ${cormorant.variable}`}>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
