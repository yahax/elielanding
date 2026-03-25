'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, RefreshCw, Search, Sparkles } from 'lucide-react';
import { searchOs } from '@/lib/os/api';
import { NotificationBell } from '@/components/os/notifications/NotificationBell';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import { LiveStatusDot } from '@/components/os/live/LiveStatusDot';
import { useNotifications } from '@/hooks/useNotifications';

type SearchResult = {
    type: string;
    id: string;
    title: string;
    subtitle: string;
    href: string;
};

type PageMeta = {
    section: string;
    title: string;
    subtitle: string;
};

const PAGE_META: Record<string, PageMeta> = {
    '/os': {
        section: 'Control Center',
        title: 'Dashboard',
        subtitle: 'Vision globale des opérations',
    },
    '/os/orders': {
        section: 'Operations',
        title: 'Commandes',
        subtitle: 'Priorités, relances et confirmations',
    },
    '/os/pipeline': {
        section: 'Operations',
        title: 'Pipeline',
        subtitle: 'Charge et capacité en temps réel',
    },
    '/os/inventory': {
        section: 'Operations',
        title: 'Inventaire',
        subtitle: 'Suivi des niveaux critiques',
    },
    '/os/products': {
        section: 'Operations',
        title: 'Produits',
        subtitle: 'Catalogue, disponibilité et prix',
    },
    '/os/clients': {
        section: 'Relations',
        title: 'Clients',
        subtitle: 'Segments, valeur et rétention',
    },
    '/os/intelligence': {
        section: 'Insights',
        title: 'Business Signals',
        subtitle: 'Insights business actionnables',
    },
    '/os/tracking': {
        section: 'Insights',
        title: 'Tracking',
        subtitle: 'Performance acquisition & conversions',
    },
    '/os/notifications': {
        section: 'System',
        title: 'Notifications',
        subtitle: 'Flux live et événements critiques',
    },
    '/os/settings': {
        section: 'System',
        title: 'Paramètres',
        subtitle: 'Préférences opérateur et système',
    },
};

const RESULT_TYPE_LABELS: Record<string, string> = {
    order: 'Commande',
    client: 'Client',
    city: 'Ville',
    product: 'Produit',
    notification: 'Alerte',
    inventory: 'Stock',
    pipeline: 'Pipeline',
};

function resolvePageMeta(pathname: string): PageMeta {
    if (PAGE_META[pathname]) return PAGE_META[pathname];

    const path = Object.keys(PAGE_META).find((candidate) => candidate !== '/os' && pathname.startsWith(candidate));
    if (!path) return PAGE_META['/os'];

    return PAGE_META[path];
}

function resolveResultTypeLabel(type: string): string {
    return RESULT_TYPE_LABELS[type] || 'Résultat';
}

function formatLastSync(lastSyncAt: string | null): string {
    if (!lastSyncAt) return 'Synchronisation en attente';

    const timestamp = new Date(lastSyncAt).getTime();
    if (!Number.isFinite(timestamp)) return 'Synchronisation récente';

    const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSec < 15) return 'Synchronisé à l’instant';
    if (diffSec < 60) return `Synchronisé il y a ${diffSec}s`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Synchronisé il y a ${diffMin} min`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Synchronisé il y a ${diffHours} h`;

    return `Dernière sync le ${new Date(lastSyncAt).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit' })}`;
}

function LiveClock() {
    const [time, setTime] = useState('');

    useEffect(() => {
        const update = () => {
            setTime(new Date().toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' }));
        };
        update();
        const timer = setInterval(update, 15_000);
        return () => clearInterval(timer);
    }, []);

    return <span className="topbar-clock os-topbar-clock">{time}</span>;
}

export function TopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const searchCacheRef = useRef<Map<string, SearchResult[]>>(new Map());
    const searchContainerRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    const { realtimeStatus, lastSyncAt } = useRealtimeFeed();
    const { unreadCount } = useNotifications();

    const pageMeta = useMemo(() => resolvePageMeta(pathname), [pathname]);
    const syncLabel = useMemo(() => formatLastSync(lastSyncAt), [lastSyncAt]);
    const queryNormalized = query.trim().toLowerCase();
    const shouldShowResultsPanel = searchOpen && queryNormalized.length >= 2;
    const unreadLabel = unreadCount > 99 ? '99+' : unreadCount;

    useEffect(() => {
        if (queryNormalized.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        const cached = searchCacheRef.current.get(queryNormalized);
        if (cached) {
            setResults(cached);
            setLoading(false);
            return;
        }

        let active = true;
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await searchOs(queryNormalized);
                if (!active) return;
                const nextResults = (response.results || []).slice(0, 10);
                setResults(nextResults);
                searchCacheRef.current.set(queryNormalized, nextResults);
                if (searchCacheRef.current.size > 40) {
                    const firstKey = searchCacheRef.current.keys().next().value;
                    if (firstKey) searchCacheRef.current.delete(firstKey);
                }
            } catch (error) {
                console.error('[TopBar] Search failed', error);
                if (active) setResults([]);
            } finally {
                if (active) setLoading(false);
            }
        }, 260);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [queryNormalized]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!searchContainerRef.current) return;
            if (!searchContainerRef.current.contains(event.target as Node)) {
                setSearchOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                searchInputRef.current?.focus();
                setSearchOpen(true);
                return;
            }

            if (event.key === 'Escape') {
                setSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        setSearchOpen(false);
    }, [pathname]);

    const handleRefresh = () => {
        setRefreshing(true);
        router.refresh();
        window.setTimeout(() => setRefreshing(false), 650);
    };

    return (
        <header className="topbar os-topbar">
            <div className="os-topbar-left">
                <span className="os-topbar-eyebrow">{pageMeta.section}</span>
                <div className="topbar-title os-topbar-title">{pageMeta.title}</div>

                <div className="os-topbar-meta">
                    <LiveStatusDot status={realtimeStatus} compact />
                    <span className="os-topbar-meta-divider" aria-hidden="true" />
                    <span className="os-topbar-meta-text os-topbar-meta-subtitle">{pageMeta.subtitle}</span>
                    <span className="os-topbar-meta-divider" aria-hidden="true" />
                    <span className="os-topbar-meta-text os-topbar-meta-sync">{syncLabel}</span>
                    <span className="os-topbar-meta-divider" aria-hidden="true" />
                    <LiveClock />
                </div>
            </div>

            <div className="os-topbar-center">
                <div className={`os-global-search${searchOpen ? ' is-open' : ''}`} ref={searchContainerRef}>
                    <Search size={15} className="os-global-search-icon" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="filter-input os-global-search-input"
                        placeholder="Rechercher client, commande, ville..."
                        aria-label="Recherche globale ELIE OS"
                        value={query}
                        onFocus={() => setSearchOpen(true)}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                    <span className="os-global-search-shortcut" aria-hidden="true">
                        ⌘K
                    </span>

                    {shouldShowResultsPanel ? (
                        <div className="luxury-card os-search-results os-global-search-results" role="listbox">
                            {loading ? (
                                <div className="os-global-search-empty">Recherche en cours...</div>
                            ) : results.length === 0 ? (
                                <div className="os-global-search-empty">Aucun résultat trouvé</div>
                            ) : (
                                results.map((result) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        type="button"
                                        role="option"
                                        aria-selected={false}
                                        onClick={() => {
                                            router.push(result.href || '/os');
                                            setQuery('');
                                            setResults([]);
                                            setSearchOpen(false);
                                        }}
                                        className="search-result-item os-search-result-item os-global-search-item"
                                    >
                                        <span className="os-global-search-item-main">
                                            <span className="os-global-search-item-type">{resolveResultTypeLabel(result.type)}</span>
                                            <span className="os-global-search-item-title">{result.title}</span>
                                            <span className="os-global-search-item-sub">{result.subtitle}</span>
                                        </span>
                                        <ArrowRight size={14} className="os-global-search-item-arrow" />
                                    </button>
                                ))
                            )}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="os-topbar-right">
                <button
                    type="button"
                    className="btn-ghost os-topbar-action-btn"
                    onClick={handleRefresh}
                    aria-label="Rafraîchir les données"
                >
                    <RefreshCw size={15} className={refreshing ? 'animate-spin' : undefined} />
                </button>

                <Link href="/os/orders?status=to_confirm" className="os-topbar-priority-link">
                    <Sparkles size={13} />
                    <span>Priorités</span>
                    {unreadCount > 0 ? <span className="os-topbar-priority-count">{unreadLabel}</span> : null}
                </Link>

                <NotificationBell />

                <button type="button" className="topbar-avatar os-topbar-avatar" aria-label="Profil opérateur">
                    A
                </button>
            </div>
        </header>
    );
}
