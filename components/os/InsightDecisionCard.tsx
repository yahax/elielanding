'use client';

import Link from 'next/link';
import type { InsightItem, InsightType } from '@/lib/os/dashboard.types';

const TYPE_CONFIG: Record<InsightType, { label: string; className: string }> = {
    opportunity: { label: 'Opportunité', className: 'insight-badge-opportunity' },
    risk: { label: 'Risque', className: 'insight-badge-risk' },
    growth: { label: 'Croissance', className: 'insight-badge-growth' },
    urgent: { label: 'Urgent', className: 'insight-badge-urgent' },
};

interface InsightDecisionCardProps {
    item: InsightItem;
}

export function InsightDecisionCard({ item }: InsightDecisionCardProps) {
    const config = TYPE_CONFIG[item.type];

    return (
        <article className={`insight-decision-card insight-decision-card-${item.type}`}>
            <div className="insight-decision-top">
                <span className={`insight-type-badge ${config.className}`}>{config.label}</span>
                {item.metric && <span className="insight-metric">{item.metric}</span>}
            </div>
            <h3 className="insight-decision-title">{item.title}</h3>
            <p className="insight-decision-body">{item.body}</p>
            {item.cta && (
                <Link href={item.cta.href} className="insight-decision-cta">
                    {item.cta.label} →
                </Link>
            )}
        </article>
    );
}
