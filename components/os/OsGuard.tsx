'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function OsGuard({ children }: { children: React.ReactNode }) {
    const [authorized, setAuthorized] = useState(false);
    const [checked, setChecked] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = () => {
            const session = localStorage.getItem('elie_session');
            const expiry = localStorage.getItem('elie_session_expiry');

            const isAuthed = session === 'authenticated' && expiry && parseInt(expiry) > Date.now();

            if (!isAuthed && !pathname.includes('/os/login')) {
                router.push('/os/login');
            } else {
                setAuthorized(true);
            }
            setChecked(true);
        };

        checkAuth();
    }, [pathname, router]);

    if (!checked) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg)',
                gap: 20
            }}>
                <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--gold)', borderRadius: '50%' }} />
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--gold)', textTransform: 'uppercase' }}>Synchronisation du cockpit</div>
            </div>
        );
    }

    if (!authorized && !pathname.includes('/os/login')) {
        return null; // Preventing flash of content before router.push takes effect
    }

    return <>{children}</>;
}
