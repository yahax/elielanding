'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
    href: string;
    label: string;
    Icon: LucideIcon;
    isActive: boolean;
    subtitle?: string;
    badge?: string | number;
}

export function SidebarNavItem({ href, label, Icon, isActive, subtitle, badge }: SidebarNavItemProps) {
    return (
        <Link href={href} className={`sidebar-item os-sidebar-item${isActive ? ' active' : ''}`}>
            <span className="os-sidebar-item-icon-wrap" aria-hidden="true">
                <Icon size={16} strokeWidth={isActive ? 2.45 : 2} className="sidebar-item-icon os-sidebar-item-icon" />
            </span>

            <span className="os-sidebar-item-main">
                <span className="os-sidebar-item-label">{label}</span>
                {subtitle ? <span className="os-sidebar-item-sub">{subtitle}</span> : null}
            </span>

            {badge != null ? <span className="sidebar-badge os-sidebar-badge">{badge}</span> : null}
            {isActive && <span className="sidebar-active-dot os-sidebar-active-dot" />}
        </Link>
    );
}
