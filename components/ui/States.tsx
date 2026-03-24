'use client';

import { AlertTriangle, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingState({ label = 'Chargement en cours…' }: { label?: string }) {
    return (
        <div className="os-state-card os-state-card-loading" role="status" aria-live="polite">
            <div style={{ position: 'relative', width: 44, height: 44, marginBottom: 24 }}>
                <div className="animate-spin" style={{ position: 'absolute', inset: 0, border: '2px solid var(--border)', borderTop: '2px solid var(--gold)', borderRadius: '50%' }} aria-hidden />
            </div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10 }}>ELIE OS</div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em' }}>{label.toUpperCase()}</p>
        </div>
    );
}

export function ErrorState({
    title = 'Erreur de chargement',
    message,
    onRetry,
}: {
    title?: string;
    message: string;
    onRetry?: () => void;
}) {
    return (
        <div className="luxury-card os-state-card os-state-card-error" role="alert">
            <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
                <AlertTriangle size={22} />
            </div>
            <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 900, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>{message}</p>
            </div>
            {onRetry ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry} style={{ height: 42, borderRadius: 12, fontWeight: 900 }}>
                    RÉESSAYER
                </button>
            ) : null}
        </div>
    );
}

export function EmptyState({
    title,
    copy,
    action,
}: {
    title: string;
    copy: string;
    action?: ReactNode;
}) {
    return (
        <div className="luxury-card os-state-card os-state-card-empty">
            <div style={{ width: 68, height: 68, borderRadius: 20, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                <Inbox size={32} strokeWidth={1.5} />
            </div>
            <h3 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em' }}>{title}</h3>
            <p style={{ margin: '0 0 32px', color: 'var(--text-dim)', fontSize: 15, fontWeight: 600, maxWidth: 460, lineHeight: 1.6 }}>
                {copy}
            </p>
            {action ? action : null}
        </div>
    );
}
