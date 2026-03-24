'use client';

import type { SmartStatPillData } from '@/lib/os/dashboard.types';

interface SmartStatPillProps {
    item: SmartStatPillData;
    className?: string;
}

export function SmartStatPill({ item, className = '' }: SmartStatPillProps) {
    return (
        <div className={`smart-stat-pill smart-stat-pill-${item.tone ?? 'neutral'} ${className}`.trim()}>
            <span className="smart-stat-pill-label">{item.label}</span>
            <span className="smart-stat-pill-value">{item.value}</span>
        </div>
    );
}
