import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ELIE OS — Connexion',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
