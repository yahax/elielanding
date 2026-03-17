"use client";

import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type SiteHeaderProps = {
    darkLogo?: boolean;
};

export function SiteHeader({ darkLogo = true }: SiteHeaderProps) {
    return (
        <header className="fixed inset-x-0 top-0 z-[70] border-b border-[#d9c9b2]/50 bg-[#f8f2e8]/82 backdrop-blur-xl">
            <div className="mx-auto flex h-[78px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="inline-flex items-center" aria-label="ELIE">
                    <Image
                        src={darkLogo ? "/catalogues/brand/logo-noir.png" : "/catalogues/brand/logo-white.png"}
                        alt="ELIE Parfum"
                        width={140}
                        height={42}
                        className="h-8 w-auto sm:h-9"
                    />
                </Link>
                <LanguageSwitcher />
            </div>
        </header>
    );
}
