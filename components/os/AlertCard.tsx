'use client';

import Link from 'next/link';
import type { AlertItem } from '@/lib/os/dashboard.types';
import { PriorityBadge } from '@/components/os/PriorityBadge';

interface AlertCardProps {
    item: AlertItem;
}

export function AlertCard({ item }: AlertCardProps) {
    return (
        <article className={`alert-card alert-card-${item.urgency}`}>
            <div className="alert-card-top">
                <PriorityBadge urgency={item.urgency} />
                <span className="alert-card-volume">{item.volume}</span>
            </div>

            <div className="alert-card-title">{item.title}</div>
            <p className="alert-card-desc">{item.description}</p>
            {item.meta && <p className="alert-card-meta">{item.meta}</p>}

            <div className="alert-card-actions">
                <Link href={item.primaryAction.href} className="alert-card-cta">
                    {item.primaryAction.label} →
                </Link>
                {item.sectionHref && (
                    <Link href={item.sectionHref} className="alert-card-link">
                        Ouvrir section
                    </Link>
                )}
            </div>
        </article>
    );
}
