import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../../globals.css';
import '../dashboard.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'ELIE OS — Connexion',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" dir="ltr" className={inter.variable}>
            <body className="dashboard-body">{children}</body>
        </html>
    );
}
