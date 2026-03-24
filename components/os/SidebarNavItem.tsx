'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
    href: string;
    label: string;
    Icon: LucideIcon;
    isActive: boolean;
}

export function SidebarNavItem({ href, label, Icon, isActive }: SidebarNavItemProps) {
    return (
        <Link href={href} className={`sidebar-item${isActive ? ' active' : ''}`}>
            <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="sidebar-item-icon" />
            <span>{label}</span>
            {isActive && <span className="sidebar-active-dot" />}
        </Link>
    );
}
