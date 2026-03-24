'use client';

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

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

const PILOTAGE: NavItem[] = [
    { label: 'Dashboard', href: '/os', icon: LayoutDashboard },
];

const OPERATIONS: NavItem[] = [
    { label: 'Commandes', href: '/os/orders', icon: ShoppingCart },
    { label: 'Pipeline', href: '/os/pipeline', icon: GitBranch },
    { label: 'Inventaire', href: '/os/inventory', icon: Package },
    { label: 'Produits', href: '/os/products', icon: Archive },
    { label: 'Clients', href: '/os/clients', icon: Users },
];

const INSIGHTS: NavItem[] = [
    { label: 'Business Signals', href: '/os/intelligence', icon: Brain },
    { label: 'Tracking', href: '/os/tracking', icon: Radio },
    { label: 'Notifications', href: '/os/notifications', icon: Bell },
    { label: 'Paramètres', href: '/os/settings', icon: Settings },
];

function NavSection({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
    return (
        <>
            <div className="sidebar-section-label">{label}</div>
            {items.map((item) => {
                const isActive = item.href === '/os' ? pathname === '/os' : pathname.startsWith(item.href);
                return (
                    <SidebarNavItem
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        Icon={item.icon}
                        isActive={isActive}
                    />
                );
            })}
        </>
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/os/auth/logout', { method: 'POST' });
        router.push('/os/login');
        router.refresh();
    };

    return (
        <nav className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-text">ELIE</div>
                <div className="sidebar-logo-sub">MAISON ELIE</div>
            </div>

            <div className="sidebar-nav">
                <NavSection label="Pilotage" items={PILOTAGE} pathname={pathname} />
                <NavSection label="Opérations" items={OPERATIONS} pathname={pathname} />
                <NavSection label="Insights" items={INSIGHTS} pathname={pathname} />
            </div>

            <div className="sidebar-footer">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="sidebar-item"
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8 }}
                >
                    <LogOut size={16} className="sidebar-item-icon" />
                    <span>Déconnexion</span>
                </button>
            </div>
        </nav>
    );
}
