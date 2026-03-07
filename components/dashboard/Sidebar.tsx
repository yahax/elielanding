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
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Commandes', href: '/dashboard/orders', icon: ShoppingCart },
    { label: 'Pipeline', href: '/dashboard/pipeline', icon: GitBranch },
    { label: 'Inventaire', href: '/dashboard/inventory', icon: Package },
    { label: 'Produits', href: '/dashboard/products', icon: Archive },
    { label: 'Clients', href: '/dashboard/clients', icon: Users },
    { label: 'Intelligence', href: '/dashboard/intelligence', icon: Brain },
    { label: 'Tracking', href: '/dashboard/tracking', icon: Radio },
    { label: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/dashboard/login');
    };

    return (
        <nav className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-text">ELIE AI</div>
                <div className="sidebar-logo-sub">Commerce OS v2.0</div>
            </div>

            <div className="sidebar-nav">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href) && item.href !== '/dashboard';
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-item ${isActive ? 'active' : ''}`}
                            style={{ position: 'relative', overflow: 'hidden' }}
                        >
                            <Icon className="sidebar-item-icon" />
                            {item.label}
                            {item.label === 'Intelligence' && (
                                <span style={{
                                    marginLeft: 'auto',
                                    fontSize: 8,
                                    fontWeight: 900,
                                    background: 'linear-gradient(135deg, var(--gold), #8B5CF6)',
                                    color: '#FFF',
                                    padding: '2px 6px',
                                    borderRadius: 10,
                                    letterSpacing: '0.05em',
                                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)'
                                }}>AI</span>
                            )}
                            {isActive && (
                                <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: '20%',
                                    height: '60%',
                                    width: 3,
                                    background: 'var(--gold)',
                                    borderRadius: '0 4px 4px 0'
                                }} />
                            )}
                        </Link>
                    );
                })}
            </div>

            <div className="sidebar-footer">
                <button
                    onClick={handleLogout}
                    className="sidebar-item"
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <LogOut className="sidebar-item-icon" />
                    Déconnexion
                </button>
            </div>
        </nav>
    );
}
