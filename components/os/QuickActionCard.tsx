'use client';

import Link from 'next/link';
import {
    AlertTriangle,
    Boxes,
    Brain,
    PackagePlus,
    PackageSearch,
    Sparkles,
    Truck,
    Workflow,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { QuickAction } from '@/lib/os/dashboard.types';

interface QuickActionCardProps {
    action: QuickAction;
}

const ICONS: Record<QuickAction['icon'], ComponentType<{ size?: number }>> = {
    orders: PackageSearch,
    urgent: AlertTriangle,
    pipeline: Workflow,
    vip: Sparkles,
    stock: Boxes,
    intelligence: Brain,
    product: PackagePlus,
    tracking: Truck,
};

export function QuickActionCard({ action }: QuickActionCardProps) {
    const Icon = ICONS[action.icon];

    return (
        <Link
            href={action.href}
            className={`quick-action-card quick-action-card-${action.variant ?? 'default'}`}
        >
            <span className="quick-action-icon" aria-hidden="true">
                <Icon size={18} />
            </span>
            <div className="quick-action-content">
                <div className="quick-action-label">{action.label}</div>
                {action.sub && <div className="quick-action-sub">{action.sub}</div>}
            </div>
            <span className="quick-action-arrow">→</span>
        </Link>
    );
}
