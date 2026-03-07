'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function DashboardGuard({ children }: { children: React.ReactNode }) {
    const [authorized, setAuthorized] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = () => {
            const session = localStorage.getItem('elie_session');
            const expiry = localStorage.getItem('elie_session_expiry');

            const isAuthed = session === 'authenticated' && expiry && parseInt(expiry) > Date.now();

            if (!isAuthed && !pathname.includes('/dashboard/login')) {
                router.push('/dashboard/login');
            } else {
                setAuthorized(true);
            }
        };

        checkAuth();
    }, [pathname, router]);

    if (!authorized && !pathname.includes('/dashboard/login')) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FFF'
            }}>
                <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #f3f3f3', borderTop: '3px solid var(--gold)', borderRadius: '50%' }} />
            </div>
        );
    }

    return <>{children}</>;
}
