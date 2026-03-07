'use client';

import type { ReactNode } from 'react';

export function PageHeader({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}) {
    return (
        <div className="page-header">
            <div>
                <h2 className="page-title">{title}</h2>
                {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
            </div>
            {actions ? <div style={{ display: 'flex', gap: 10 }}>{actions}</div> : null}
        </div>
    );
}
