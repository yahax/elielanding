'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Settings, ArrowRight, Activity, Sparkles } from 'lucide-react';
import { searchOs } from '@/lib/os/api';

type SearchResult = {
    type: string;
    id: string;
    title: string;
    subtitle: string;
    href: string;
};

const PAGE_TITLES: Record<string, string> = {
    '/os': 'Dashboard',
    '/os/orders': 'Commandes',
    '/os/pipeline': 'Pipeline',
    '/os/inventory': 'Inventaire',
    '/os/products': 'Produits',
    '/os/clients': 'Clients',
    '/os/intelligence': 'Intelligence',
    '/os/tracking': 'Tracking',
    '/os/settings': 'Paramètres',
};

function LiveClock() {
    const [time, setTime] = useState('');

    useEffect(() => {
        const update = () => {
            setTime(new Date().toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' }));
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    return <span className="topbar-clock">{time}</span>;
}

export function TopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const title = useMemo(() => PAGE_TITLES[pathname] || 'Dashboard', [pathname]);

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await searchOs(query);
                setResults(response.results || []);
            } catch (error) {
                console.error('[TopBar] Search failed', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 220);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <header className="topbar">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <h1 className="topbar-title" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: 'serif' }}>{title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>OPÉRATIONS LIVE</span>
                    </div>
                    <span style={{ color: 'var(--border)', fontSize: 10 }}>•</span>
                    <LiveClock />
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: 520, position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', opacity: 0.6 }} />
                    <input
                        type="text"
                        className="filter-input"
                        placeholder="Rechercher client, téléphone, ville..."
                        style={{
                            width: '100%',
                            height: 48,
                            paddingLeft: 48,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '14px',
                            fontSize: 13,
                        }}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />

                    {(loading || results.length > 0 || query.trim().length >= 2) && (
                        <div className="luxury-card" style={{
                            position: 'absolute',
                            top: 56,
                            left: 0,
                            right: 0,
                            zIndex: 300,
                            padding: 8,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-lg)'
                        }}>
                            {loading ? (
                                <div style={{ padding: 16, fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>Recherche en cours...</div>
                            ) : results.length === 0 ? (
                                <div style={{ padding: 16, fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>Aucun résultat trouvé</div>
                            ) : (
                                results.map((result) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        type="button"
                                        onClick={() => {
                                            router.push(result.href || '/os');
                                            setQuery('');
                                            setResults([]);
                                        }}
                                        className="search-result-item"
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 8,
                                            border: 'none',
                                            background: 'transparent',
                                            color: 'inherit',
                                            padding: '12px 14px',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <span>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{result.title}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{result.subtitle}</div>
                                        </span>
                                        <ArrowRight size={14} style={{ color: 'var(--gold)', opacity: 0.6 }} />
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 12,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: '0.08em'
                }}>
                    <Activity size={14} />
                    <span>SYSTÈME OPÉRATIONNEL</span>
                </div>

                <div style={{ height: 24, width: 1, background: 'var(--border)' }} />

                <button className="btn-ghost" style={{ width: 44, height: 44, padding: 0, borderRadius: 14, background: 'var(--surface)' }}>
                    <Bell size={18} style={{ color: 'var(--text-muted)' }} />
                </button>

                <div className="topbar-avatar" style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: 'var(--gold-glow)',
                    border: '1px solid var(--gold-border)',
                    color: 'var(--gold)',
                    fontSize: 14,
                    fontWeight: 800
                }}>
                    A
                </div>
            </div>
        </header >
    );
}
