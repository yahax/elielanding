import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import '../globals.css';
import './focus.css';
import { OsLayoutClient } from '@/components/os/OsLayoutClient';

const manrope = Manrope({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'ELIE Focus OS',
    description: 'Agent execution system',
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
