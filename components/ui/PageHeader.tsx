'use client';

import type { ReactNode } from 'react';

export function PageHeader({
    title,
    subtitle,
    actions,
    eyebrow,
    dense,
}: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    eyebrow?: string;
    dense?: boolean;
}) {
    return (
        <header className={`page-header ${dense ? 'page-header-dense' : ''}`}>
            <div className="page-header-main">
                {eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}
                <h1 className="page-title">{title}</h1>
                {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
            </div>
            {actions ? <div className="page-actions">{actions}</div> : null}
        </header>
    );
}
