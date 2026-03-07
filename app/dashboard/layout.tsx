import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import './dashboard.css';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { DashboardGuard } from '@/components/dashboard/DashboardGuard';

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'ELIE OS — Dashboard',
    description: 'Système de gestion ELIE Parfum',
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" dir="ltr" className={inter.variable}>
            <body className="dashboard-body">
                <div className="dashboard-shell">
                    <DashboardGuard>
                        <Sidebar />
                        <div className="dashboard-main">
                            <TopBar />
                            <main className="dashboard-content">
                                <div className="animate-fade-in">
                                    {children}
                                </div>
                            </main>
                        </div>
                    </DashboardGuard>
                </div>
            </body>
        </html>
    );
}
