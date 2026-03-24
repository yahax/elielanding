'use client';

import {
    CheckCheck,
    Clock3,
    PackageCheck,
    ShoppingBag,
    Sparkles,
    TriangleAlert,
    UserRoundCog,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { ActivityItem, ActivityType } from '@/lib/os/dashboard.types';

const ACTIVITY_ICONS: Record<ActivityType, ComponentType<{ size?: number }>> = {
    new_order: ShoppingBag,
    confirmed: CheckCheck,
    stock_adjusted: PackageCheck,
    stock_alert: TriangleAlert,
    vip_detected: Sparkles,
    operator_action: UserRoundCog,
    blocked_order: Clock3,
};

interface LiveActivityFeedProps {
    items: ActivityItem[];
}

export function LiveActivityFeed({ items }: LiveActivityFeedProps) {
    return (
        <div className="activity-feed">
            {items.map((item) => {
                const Icon = ACTIVITY_ICONS[item.type];

                return (
                    <article key={item.id} className={`activity-item activity-item-${item.type}${item.isNew ? ' activity-item-new' : ''}`}>
                        <div className={`activity-dot activity-dot-${item.type}`} />

                        <div className="activity-content">
                            <div className="activity-label">
                                <span className="activity-icon" aria-hidden="true">
                                    <Icon size={14} />
                                </span>
                                <span>{item.label}</span>
                                {item.isNew && <span className="activity-new-pill">NEW</span>}
                            </div>

                            {item.meta && <div className="activity-meta">{item.meta}</div>}
                            {item.actor && <div className="activity-actor">{item.actor}</div>}
                        </div>

                        <div className="activity-time">{item.time}</div>
                    </article>
                );
            })}
        </div>
    );
}
