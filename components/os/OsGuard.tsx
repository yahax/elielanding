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

    if (!checked || (!authorized && !pathname.includes('/os/login'))) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg)'
            }}>
                <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--surface-2)', borderTop: '3px solid var(--gold)', borderRadius: '50%' }} />
            </div>
        );
    }

    return <>{children}</>;
}
