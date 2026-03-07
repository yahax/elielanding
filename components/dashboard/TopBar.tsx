'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Settings, Search, User, Globe, Check, Clock, Package, MoveRight, ShoppingBag, Brain, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Order } from '@/lib/types';
import { globalSearch } from '@/lib/search';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';

const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/orders': 'Commandes',
    '/dashboard/pipeline': 'Pipeline',
    '/dashboard/inventory': 'Inventaire',
    '/dashboard/products': 'Produits',
    '/dashboard/clients': 'Clients',
    '/dashboard/intelligence': 'Intelligence',
    '/dashboard/tracking': 'Tracking',
    '/dashboard/settings': 'Paramètres',
};

interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'order' | 'system';
    read: boolean;
}

function LiveClock() {
    const [time, setTime] = useState('');
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' }));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);
    return <span className="topbar-clock">{time}</span>;
}

export function TopBar({ title: propTitle }: { title?: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const title = propTitle || PAGE_TITLES[pathname] || 'Dashboard';
    const [isRealtime, setIsRealtime] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL === "https://your-project.supabase.co";

    // Realtime Sync & Notifications
    useRealtimeOrders(() => {
        setIsRealtime(true);
    });

    useEffect(() => {
        if (isDemo) return;
        const supabase = createClient();
        const channel = supabase
            .channel('global-notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                const newOrder = payload.new;
                setNotifications(prev => [{
                    id: Math.random().toString(36).substr(2, 9),
                    title: 'Nouvelle commande',
                    message: `${newOrder.customer_name} de ${newOrder.city}`,
                    time: 'À l\'instant',
                    type: 'order',
                    read: false
                }, ...prev]);

                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("ELIE: Nouvelle Commande", { body: `${newOrder.customer_name} (${newOrder.city})` });
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
                const updatedOrder = payload.new;
                setNotifications(prev => [{
                    id: Math.random().toString(36).substr(2, 9),
                    title: 'Statut mis à jour',
                    message: `Commande de ${updatedOrder.customer_name}: ${updatedOrder.status}`,
                    time: 'À l\'instant',
                    type: 'system',
                    read: false
                }, ...prev]);
            })
            .subscribe((status) => {
                setIsRealtime(status === 'SUBSCRIBED');
            });

        return () => { supabase.removeChannel(channel); };
    }, [isDemo]);

    // Global Search Logic
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const handleSearch = async () => {
            setIsSearching(true);
            try {
                const results = await globalSearch(searchQuery);
                setSearchResults(results);
            } catch (err) {
                console.error("[Search] Global search error:", err);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(handleSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifs(false);
            }
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchQuery('');
                setSearchResults([]);
            }
        };
        window.addEventListener('mousedown', handleClick);
        return () => window.removeEventListener('mousedown', handleClick);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <header className="topbar">
            {/* Title Section */}
            <div style={{ minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 className="topbar-title">{title}</h1>
                    {isDemo && (
                        <span style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '2px 6px',
                            background: '#FEE2E2',
                            borderRadius: 4,
                            color: '#EF4444',
                            letterSpacing: '0.05em'
                        }}>DEMO MODE</span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <LiveClock />
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: isRealtime ? 'var(--success)' : 'var(--danger)',
                            boxShadow: isRealtime ? '0 0 8px var(--success)' : '0 0 8px var(--danger)',
                            transition: 'all 0.3s'
                        }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {isRealtime ? 'Live' : 'Connect...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Search Section */}
            <div style={{ flex: 1, maxWidth: 460, position: 'relative' }} ref={searchRef}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Recherche (CMD, Parfums, IA...)"
                    className="filter-input"
                    style={{ width: '100%', paddingLeft: 42, background: 'var(--surface-2)', border: 'none', height: 44, borderRadius: 12, fontSize: 14, fontWeight: 500 }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                {(searchResults.length > 0 || isSearching || (searchQuery.length >= 2 && !isSearching)) && (
                    <div className="card" style={{
                        position: 'absolute',
                        top: 52,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        padding: 8,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                        border: '1px solid var(--border)',
                        maxHeight: 450,
                        overflowY: 'auto',
                        borderRadius: 16
                    }}>
                        {isSearching ? (
                            <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Analyse en cours...</div>
                        ) : searchResults.length === 0 ? (
                            <div style={{ padding: 32, textAlign: 'center' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>Aucun résultat pour &quot;{searchQuery}&quot;</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>Essayez un nom de parfum, une ville ou un téléphone.</div>
                            </div>
                        ) : searchResults.map((res, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    if (res.type === 'order') router.push('/dashboard/orders');
                                    else if (res.type === 'product') router.push('/dashboard/products');
                                    else if (res.type === 'intelligence') router.push('/dashboard/intelligence');
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                style={{
                                    padding: '12px',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    transition: 'all 0.2s'
                                }}
                                className="search-result-item"
                            >
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: res.type === 'order' ? 'var(--gold-glow)' : res.type === 'intelligence' ? 'rgba(139, 92, 246, 0.1)' : 'var(--surface-2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: res.type === 'order' ? 'var(--gold)' : res.type === 'intelligence' ? '#8B5CF6' : 'var(--text-muted)'
                                }}>
                                    {res.type === 'order' ? <Package size={18} /> : res.type === 'intelligence' ? <Brain size={18} /> : <ShoppingBag size={18} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800 }}>{res.customer_name || res.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                                        {res.type === 'order' ? `Commande • ${res.city} ${res.matchContext ? `• ${res.matchContext}` : ''}` : res.type === 'product' ? 'Catalogue • Parfum' : `Intelligence IA • ${res.detail}`}
                                    </div>
                                </div>
                                <ArrowRight size={14} style={{ color: 'var(--border)', opacity: 0.5 }} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative' }} ref={notifRef}>
                    <button
                        className={`btn-ghost ${showNotifs ? 'active' : ''}`}
                        style={{ padding: 8, height: 40, width: 40 }}
                        onClick={() => setShowNotifs(!showNotifs)}
                    >
                        <div style={{ position: 'relative' }}>
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: -4,
                                    right: -4,
                                    minWidth: 14,
                                    height: 14,
                                    background: 'var(--danger)',
                                    borderRadius: 10,
                                    border: '2px solid var(--surface)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 8,
                                    fontWeight: 900,
                                    color: '#fff',
                                    padding: '0 2px'
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    </button>

                    {showNotifs && (
                        <div className="card" style={{
                            position: 'absolute',
                            top: 50,
                            right: 0,
                            width: 320,
                            zIndex: 1000,
                            padding: 0,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, fontSize: 14 }}>Notifications</span>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} style={{ fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Tout marquer lu</button>
                                )}
                            </div>
                            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <Bell size={32} style={{ opacity: 0.2, marginBottom: 16 }} />
                                        <div style={{ fontSize: 12 }}>Aucune notification</div>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} style={{
                                            padding: '16px 20px',
                                            borderBottom: '1px solid var(--border)',
                                            background: n.read ? 'transparent' : 'rgba(198, 163, 78, 0.05)',
                                            position: 'relative'
                                        }}>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <div style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    background: n.type === 'order' ? 'var(--gold-glow)' : 'var(--surface-3)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: n.type === 'order' ? 'var(--gold)' : 'var(--text-muted)'
                                                }}>
                                                    {n.type === 'order' ? <Package size={16} /> : <Settings size={16} />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{n.title}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Clock size={10} /> {n.time}
                                                    </div>
                                                </div>
                                            </div>
                                            {!n.read && <div style={{ position: 'absolute', right: 20, top: 16, width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />}
                                        </div>
                                    ))
                                )}
                            </div>
                            <div style={{ padding: 12, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                                <button style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', fontWeight: 600 }}>Voir toutes les notifications</button>
                            </div>
                        </div>
                    )}
                </div>

                <button className="btn-ghost" style={{ padding: 8, height: 40, width: 40 }}>
                    <Settings size={18} />
                </button>

                <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} className="user-chip">
                    <div className="topbar-avatar" style={{ fontWeight: 800 }}>A</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>Admin Elie</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Propriétaire</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
