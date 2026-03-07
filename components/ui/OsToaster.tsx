'use client';

import { Toaster } from 'react-hot-toast';

export function OsToaster() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 3400,
                style: {
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(17,18,24,0.96)',
                    color: '#f5f1e8',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
                    padding: '10px 12px',
                    fontSize: '13px',
                    maxWidth: '420px',
                },
                success: {
                    iconTheme: {
                        primary: '#3a9d7a',
                        secondary: '#f5f1e8',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#b4555f',
                        secondary: '#f5f1e8',
                    },
                },
            }}
        />
    );
}
