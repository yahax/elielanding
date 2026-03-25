'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon?: LucideIcon | ReactNode;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    accentColor?: string;
}

export function StatCard({ label, value, sub, icon: Icon, trend, accentColor }: StatCardProps) {
    return (
        <div className="stat-card os-kpi-card os-kpi-tone-neutral">
            <div className="os-kpi-head" style={{ justifyContent: 'space-between', marginBottom: 2 }}>
                <div className="stat-label">{label}</div>
                {Icon && (
                    <div style={{ color: accentColor || 'var(--gold)', opacity: 0.6 }}>
                        {typeof Icon === 'function' ? <Icon size={14} /> : Icon}
                    </div>
                )}
            </div>

            <div className="stat-value os-kpi-value">{value}</div>

            {(sub || trend) && (
                <div className="stat-sub os-kpi-meta" style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {trend && (
                        <span
                            className="os-chip"
                            style={{
                                color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
                                borderColor: trend.isPositive ? 'rgba(47, 143, 99, 0.32)' : 'rgba(201, 106, 106, 0.3)',
                                background: trend.isPositive ? 'var(--success-soft)' : 'var(--danger-soft)',
                                minHeight: 24,
                                padding: '0 8px',
                            }}
                        >
                            {trend.isPositive ? '↑' : '↓'} {trend.value}
                        </span>
                    )}
                    {sub && <span style={{ opacity: 0.8 }}>{sub}</span>}
                </div>
            )}
        </div>
    );
}
