'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    GitBranch,
    Package,
    Archive,
    Users,
    Brain,
    Radio,
    Settings,
    LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/os', icon: LayoutDashboard },
    { label: 'Commandes', href: '/os/orders', icon: ShoppingCart },
    { label: 'Pipeline', href: '/os/pipeline', icon: GitBranch },
    { label: 'Inventaire', href: '/os/inventory', icon: Package },
    { label: 'Produits', href: '/os/products', icon: Archive },
    { label: 'Clients', href: '/os/clients', icon: Users },
    { label: 'Intelligence', href: '/os/intelligence', icon: Brain },
    { label: 'Tracking', href: '/os/tracking', icon: Radio },
    { label: 'Paramètres', href: '/os/settings', icon: Settings },
];

const OPERATIONS = new Set(['/os/orders', '/os/pipeline', '/os/inventory', '/os/products', '/os/clients']);
const INSIGHTS = new Set(['/os/intelligence', '/os/tracking', '/os/settings']);

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        localStorage.removeItem('elie_session');
        localStorage.removeItem('elie_session_expiry');
        router.push('/os/login');
    };

    return (
        <nav className="sidebar">
            <div className="sidebar-logo">
                <div
                    className="sidebar-logo-text"
                    style={{
                        fontSize: 20,
                        letterSpacing: '0.15em',
                        fontWeight: 700,
                        color: 'var(--gold)',
                        fontFamily: 'serif'
                    }}
                >
                    ELIE
                </div>
                <div className="sidebar-logo-sub" style={{ fontSize: 9, opacity: 0.6, letterSpacing: '0.05em', fontWeight: 800, color: 'var(--text-muted)' }}>MAISON ELIE</div>
            </div>

            <div className="sidebar-nav">
                <div className="sidebar-section-label">Pilotage</div>
                {NAV_ITEMS.filter((item) => item.href === '/os').map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === '/os';
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="sidebar-item-icon" />
                            <span>{item.label}</span>
                            {isActive && (
                                <div className="active-glow" style={{
                                    position: 'absolute',
                                    right: 12,
                                    width: 4,
                                    height: 4,
                                    background: 'var(--gold)',
                                    borderRadius: '50%'
                                }} />
                            )}
                        </Link>
                    );
                })}

                <div className="sidebar-section-label">Opérations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {NAV_ITEMS.filter((item) => OPERATIONS.has(item.href)).map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-item ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="sidebar-item-icon" />
                                <span>{item.label}</span>
                                {isActive && (
                                    <div className="active-glow" style={{
                                        position: 'absolute',
                                        right: 12,
                                        width: 4,
                                        height: 4,
                                        background: 'var(--gold)',
                                        borderRadius: '50%',
                                        boxShadow: '0 0 8px var(--gold-border)'
                                    }} />
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="sidebar-section-label">Intelligence</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {NAV_ITEMS.filter((item) => INSIGHTS.has(item.href)).map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-item ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="sidebar-item-icon" />
                                <span>{item.label}</span>
                                {isActive && (
                                    <div className="active-glow" style={{
                                        position: 'absolute',
                                        right: 12,
                                        width: 4,
                                        height: 4,
                                        background: 'var(--gold)',
                                        borderRadius: '50%'
                                    }} />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="sidebar-footer">
                <button
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
