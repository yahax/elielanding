'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    ShoppingCart,
    GitBranch,
    Package,
    Archive,
    Users,
    Brain,
    Radio,
    Bell,
    Settings,
    LogOut,
} from 'lucide-react';
import { SidebarNavItem } from '@/components/os/SidebarNavItem';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    subtitle?: string;
    badge?: string | number;
}

interface NavSectionConfig {
    label: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSectionConfig[] = [
    {
        label: 'Pilotage',
        items: [{ label: 'Dashboard', href: '/os/control', icon: LayoutDashboard, subtitle: 'Vue d’ensemble business' }],
    },
    {
        label: 'Opérations',
        items: [
            { label: 'Commandes', href: '/os/orders', icon: ShoppingCart, subtitle: 'Flux & priorisation' },
            { label: 'Pipeline', href: '/os/pipeline', icon: GitBranch, subtitle: 'Capacité en temps réel' },
            { label: 'Inventaire', href: '/os/inventory', icon: Package, subtitle: 'Niveaux & alertes stock' },
            { label: 'Produits', href: '/os/products', icon: Archive, subtitle: 'Catalogue premium' },
            { label: 'Clients', href: '/os/clients', icon: Users, subtitle: 'Segments & valeur client' },
        ],
    },
    {
        label: 'Intelligence',
        items: [
            { label: 'Business Signals', href: '/os/intelligence', icon: Brain, subtitle: 'Insights actionnables' },
            { label: 'Tracking', href: '/os/tracking', icon: Radio, subtitle: 'Performance acquisition' },
            { label: 'Notifications', href: '/os/notifications', icon: Bell, subtitle: 'Événements système' },
            { label: 'Paramètres', href: '/os/settings', icon: Settings, subtitle: 'Préférences opérateur' },
        ],
    },
];

function NavSection({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
    return (
        <section className="os-sidebar-section" aria-label={label}>
            <div className="sidebar-section-label os-sidebar-section-label">
                <span>{label}</span>
                <span>{items.length}</span>
            </div>

            <div className="os-sidebar-section-items">
                {items.map((item) => {
                    const isActive = item.href === '/os/control' ? pathname === '/os/control' : pathname.startsWith(item.href);
                    return (
                        <SidebarNavItem
                            key={item.href}
                            href={item.href}
                            label={item.label}
                            subtitle={item.subtitle}
                            badge={item.badge}
                            Icon={item.icon}
                            isActive={isActive}
                        />
                    );
                })}
            </div>
        </section>
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { unreadCount } = useNotifications();
    const { realtimeStatus } = useRealtimeFeed();

    const sidebarSections = useMemo<NavSectionConfig[]>(() => {
        const unreadBadge = unreadCount > 99 ? '99+' : unreadCount;
        return NAV_SECTIONS.map((section) => ({
            ...section,
            items: section.items.map((item) =>
                item.href === '/os/notifications' && unreadCount > 0 ? { ...item, badge: unreadBadge } : item,
            ),
        }));
    }, [unreadCount]);

    const statusLabel = useMemo(() => {
        switch (realtimeStatus) {
            case 'live':
                return 'Live';
            case 'polling':
                return 'Sync';
            case 'error':
                return 'Erreur';
            case 'disconnected':
            default:
                return 'Offline';
        }
    }, [realtimeStatus]);

    const handleLogout = async () => {
        await fetch('/api/os/auth/logout', { method: 'POST' });
        router.push('/os/login');
        router.refresh();
    };

    return (
        <nav className="sidebar os-sidebar" aria-label="Navigation principale ELIE OS">
            <div className="sidebar-logo os-sidebar-logo">
                <div className="os-sidebar-logo-main">
                    <span className="os-sidebar-logo-mark" aria-hidden="true">E</span>
                    <div>
                        <div className="sidebar-logo-text os-sidebar-logo-text">ELIE OS</div>
                        <div className="sidebar-logo-sub os-sidebar-logo-sub">Maison ELIE</div>
                    </div>
                </div>
                <span className="os-sidebar-logo-pill">Premium Suite</span>
            </div>

            <div className="sidebar-nav os-sidebar-nav">
                {sidebarSections.map((section) => (
                    <NavSection key={section.label} label={section.label} items={section.items} pathname={pathname} />
                ))}
            </div>

            <div className="sidebar-footer os-sidebar-footer">
                <div className="os-sidebar-operator">
                    <div className="os-sidebar-operator-avatar">A</div>
                    <div className="os-sidebar-operator-main">
                        <span className="os-sidebar-operator-name">Opérateur ELIE</span>
                        <span className={`os-sidebar-operator-status is-${realtimeStatus}`}>{statusLabel}</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="os-sidebar-logout"
                    aria-label="Se déconnecter"
                >
                    <LogOut size={15} />
                    <span>Déconnexion</span>
                </button>
            </div>
        </nav>
    );
}
