'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon?: any; // Using any for flexibilty with Lucide components
    trend?: {
        value: string;
        isPositive: boolean;
    };
    accentColor?: string;
}

export function StatCard({ label, value, sub, icon: Icon, trend, accentColor }: StatCardProps) {
    return (
        <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="stat-label">{label}</div>
                {Icon && (
                    <div style={{ color: accentColor || 'var(--gold)', opacity: 0.6 }}>
                        {typeof Icon === 'function' ? <Icon size={14} /> : Icon}
                    </div>
                )}
            </div>

            <div className="stat-value">{value}</div>

            {(sub || trend) && (
                <div className="stat-sub" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {trend && (
                        <span style={{
                            color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
                            fontWeight: 800,
                            fontSize: '11px',
                            background: trend.isPositive ? 'var(--success-soft)' : 'var(--danger-soft)',
                            padding: '2px 6px',
                            borderRadius: '6px'
                        }}>
                            {trend.isPositive ? '↑' : '↓'} {trend.value}
                        </span>
                    )}
                    {sub && <span style={{ opacity: 0.8 }}>{sub}</span>}
                </div>
            )}
        </div>
    );
}
