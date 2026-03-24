'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { DayRangePicker } from '@/components/os/DayRangePicker';
import { SmartStatPill } from '@/components/os/SmartStatPill';
import type { SmartStatPillData } from '@/lib/os/dashboard.types';

interface CommandCenterHeroProps {
    range: 7 | 30;
    onRangeChange: (days: 7 | 30) => void;
    loading: boolean;
    onRefresh: () => void;
    pendingCount: number;
    pills: SmartStatPillData[];
}

function LivePulse() {
    return (
        <span className="cc-live-pulse">
            <span className="cc-live-dot" />
            <span>LIVE OPS</span>
        </span>
    );
}

export function CommandCenterHero({
    range,
    onRangeChange,
    loading,
    onRefresh,
    pendingCount,
    pills,
}: CommandCenterHeroProps) {
    const today = new Date().toLocaleDateString('fr-MA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <section className="cc-hero" aria-label="Command Center Hero">
            <div className="cc-hero-left">
                <div className="cc-hero-eyebrow">
                    <LivePulse />
                    <span className="cc-hero-date">{today}</span>
                </div>

                <h1 className="cc-hero-title">ELIE Command Center</h1>
                <p className="cc-hero-sub">
                    Vue stratégique temps réel pour prioriser les urgences et exécuter les actions à impact immédiat.
                </p>

                {pills.length > 0 && (
                    <div className="cc-hero-pill-row">
                        {pills.map((pill) => (
                            <SmartStatPill key={pill.id} item={pill} />
                        ))}
                    </div>
                )}
            </div>

            <div className="cc-hero-right">
                <DayRangePicker
                    value={range}
                    onChange={onRangeChange}
                    loading={loading}
                />

                <button
                    type="button"
                    className="btn btn-ghost cc-hero-refresh"
                    onClick={onRefresh}
                    disabled={loading}
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    Actualiser
                </button>

                <Link href="/os/orders?status=to_confirm" className="cc-hero-urgent-btn">
                    <span className="cc-hero-urgent-dot" />
                    Voir commandes urgentes
                    {pendingCount > 0 && (
                        <span className="cc-hero-urgent-count">{pendingCount}</span>
                    )}
                </Link>
            </div>
        </section>
    );
}
