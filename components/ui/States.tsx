'use client';

import { AlertTriangle, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingState({ label = 'Chargement en cours…' }: { label?: string }) {
    return (
        <div className="os-state-card os-state-card-loading os-state-card-premium" role="status" aria-live="polite">
            <div className="os-state-spinner-wrap" aria-hidden>
                <div className="animate-spin os-loading-spinner" />
                <div className="os-state-spinner-ring" />
            </div>
            <div className="os-state-eyebrow">ELIE OS</div>
            <p className="os-state-copy">{label}</p>
            <p className="os-state-subcopy">Préparation de la vue opérateur premium</p>
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
            <div className="os-error-icon">
                <AlertTriangle size={22} />
            </div>
            <div className="os-state-error-main">
                <h4 className="os-error-title">{title}</h4>
                <p className="os-error-copy">{message}</p>
            </div>
            {onRetry ? (
                <button type="button" className="btn btn-ghost btn-sm os-state-error-retry" onClick={onRetry}>
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
        <div className="luxury-card os-state-card os-state-card-empty os-empty-state os-state-card-premium">
            <div className="os-empty-icon">
                <Inbox size={32} strokeWidth={1.5} />
            </div>
            <h3 className="os-empty-title">{title}</h3>
            <p className="os-empty-copy">
                {copy}
            </p>
            {action ? <div className="os-empty-action">{action}</div> : null}
        </div>
    );
}
