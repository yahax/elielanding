import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import '../globals.css';
import './os.css';
import { OsLayoutClient } from '@/components/os/OsLayoutClient';

const manrope = Manrope({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'ELIE FOCUS OS 2026',
    description: 'Interface Focus haute performance ELIE',
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={manrope.variable}>
            <OsLayoutClient>{children}</OsLayoutClient>
        </div>
    );
}
