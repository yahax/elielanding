'use client';

import Link from 'next/link';

interface SectionHeaderProps {
    title: string;
    sub?: string;
    badge?: {
        label: string;
        count?: number;
        tone?: 'default' | 'danger' | 'warning' | 'success' | 'info';
    };
    action?: { label: string; href: string };
}

export function SectionHeader({ title, sub, badge, action }: SectionHeaderProps) {
    return (
        <header className="section-header">
            <div className="section-header-left">
                <div className="section-header-title-row">
                    <h3 className="section-header-title">{title}</h3>
                    {badge && (
                        <span className={`section-header-badge section-header-badge-${badge.tone ?? 'default'}`}>
                            {badge.count !== undefined && (
                                <span className="section-header-badge-count">{badge.count}</span>
                            )}
                            {badge.label}
                        </span>
                    )}
                </div>
                {sub && <p className="section-header-sub">{sub}</p>}
            </div>
            {action && (
                <Link href={action.href} className="section-header-action">
                    {action.label}
                </Link>
            )}
        </header>
    );
}
