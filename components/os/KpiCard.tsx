'use client';

import Link from 'next/link';
import type { DashboardKpi, KpiTone } from '@/lib/os/dashboard.types';
import { SmartStatPill } from '@/components/os/SmartStatPill';

const TONE_CLASS: Record<KpiTone, string> = {
    gold: 'kpi-card-v2-gold',
    success: 'kpi-card-v2-success',
    warning: 'kpi-card-v2-warning',
    danger: 'kpi-card-v2-danger',
    info: 'kpi-card-v2-info',
};

type KpiCardProps = DashboardKpi;

export function KpiCard({
    label,
    value,
    unit,
    sub,
    urgency,
    trend,
    cta,
    tone = 'gold',
    statPill,
}: KpiCardProps) {
    return (
        <article className={`kpi-card-v2 ${TONE_CLASS[tone]}`}>
            <div className="kpi-card-v2-top">
                <span className="kpi-card-v2-label">{label}</span>
                {urgency && urgency !== 'low' && (
                    <span className={`kpi-dot kpi-dot-${urgency}`} />
                )}
            </div>

            <div className="kpi-card-v2-value-row">
                <span className="kpi-card-v2-value">{value}</span>
                {unit && <span className="kpi-card-v2-unit">{unit}</span>}
            </div>

            <div className="kpi-card-v2-bottom">
                <div className="kpi-card-v2-meta">
                    {trend ? (
                        <span className={`kpi-trend kpi-trend-${trend.direction}`}>
                            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '•'} {trend.value}
                            {trend.label && <span className="kpi-trend-label">{trend.label}</span>}
                        </span>
                    ) : (
                        sub && <span className="kpi-card-v2-sub">{sub}</span>
                    )}
                </div>

                {cta && (
                    <Link href={cta.href} className="kpi-cta">
                        {cta.label} →
                    </Link>
                )}
            </div>

            {statPill && <SmartStatPill item={statPill} className="kpi-stat-pill" />}
        </article>
    );
}
