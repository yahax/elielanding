'use client';

import type { UrgencyLevel } from '@/lib/os/dashboard.types';

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; className: string }> = {
    critical: { label: 'CRITIQUE', className: 'priority-badge-critical' },
    high: { label: 'URGENT', className: 'priority-badge-high' },
    medium: { label: 'ATTENTION', className: 'priority-badge-medium' },
    low: { label: 'INFO', className: 'priority-badge-low' },
};

interface PriorityBadgeProps {
    urgency: UrgencyLevel;
    className?: string;
}

export function PriorityBadge({ urgency, className = '' }: PriorityBadgeProps) {
    const config = URGENCY_CONFIG[urgency];
    return (
        <span className={`priority-badge ${config.className} ${className}`}>
            {config.label}
        </span>
    );
}
