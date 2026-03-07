'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    RefreshCw,
    DollarSign,
    ShoppingBag,
    Zap,
    Activity,
    Shield,
} from 'lucide-react';
import { fetchOverview } from '@/lib/os/api';
import type { OverviewResponse } from '@/lib/os/types';
import { StatCard } from '@/components/ui/StatCard';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { EmptyState } from '@/components/ui/States';
import { PageHeader } from '@/components/ui/PageHeader';

const SOURCE_COLORS = ['#c8a76b', '#3a9d7a', '#4c7ba5', '#b4555f', '#7f87a7', '#c89245'];

export default function DashboardHomePage() {
    const [range, setRange] = useState<7 | 30>(30);
    const [data, setData] = useState<OverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async (days: 7 | 30) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetchOverview(days);
            setData(response);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Impossible de charger le dashboard';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(range);
    }, [range]);

    const stats = data?.stats;

    if (loading) return <LoadingState label="Synchronisation du cockpit..." />;
    if (error) return <ErrorState message={error} onRetry={() => load(range)} />;

    return (
        <div className="os-page animate-fade-in" style={{ paddingBottom: 60 }}>
            <PageHeader
                title="Tableau de Bord Stratégique"
                subtitle="Pilotage opérationnel de la Maison ELIE"
                actions={
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 14, border: '1px solid var(--border)' }}>
                            {[7, 30].map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setRange(d as 7 | 30)}
                                    className={`btn-xs ${range === d ? 'btn-primary' : ''}`}
                                    style={{ borderRadius: 10, padding: '6px 16px', fontWeight: 800 }}
                                >
                                    {d} j
                                </button>
                            ))}
                        </div>
                        <button type="button" className="btn-ghost" onClick={() => load(range)} style={{ width: 40, height: 40, padding: 0, borderRadius: 14 }}>
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                }
            />

            {/* Primary Executive Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 32 }}>
                <div className="luxury-card" style={{ padding: 40, background: 'var(--surface)', borderLeft: '4px solid var(--gold)' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>Performance du Jour</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                        <div style={{ fontSize: 48, fontWeight: 950, letterSpacing: '-0.03em', color: 'var(--text)' }}>
                            {(data?.todayRevenue ?? 0).toLocaleString('fr-MA')} <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-muted)' }}>MAD</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--success)', background: 'var(--success-soft)', padding: '4px 12px', borderRadius: 10 }}>
                            Direct Cash
                        </div>
                    </div>
                    <div style={{ marginTop: 24, display: 'flex', gap: 40 }}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Commandes</div>
                            <div style={{ fontSize: 20, fontWeight: 900 }}>{data?.todayOrders ?? 0}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Panier Moyen</div>
                            <div style={{ fontSize: 20, fontWeight: 900 }}>{data?.avgBasket ?? 0} MAD</div>
                        </div>
                    </div>
                </div>

                <div className="luxury-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <Shield size={18} style={{ color: 'var(--success)' }} />
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Flux Confirmé</h3>
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>{stats?.confirmed || 0}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Validation opérationnelle active</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
                <StatCard
                    label="Volume Global"
                    value={stats?.total_orders || 0}
                    icon={ShoppingBag}
                    sub="Total historique"
                />
                <StatCard
                    label="Pertes (Annulées)"
                    value={stats?.canceled || 0}
                    icon={Shield}
                    accentColor="var(--danger)"
                    sub="Volume filtré"
                />
                <StatCard
                    label="Stock Critique"
                    value={data?.lowStockAlerts?.length || 0}
                    icon={Activity}
                    accentColor="var(--warning)"
                    sub="Actions requises"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, marginBottom: 32 }}>
                {/* Priority & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="luxury-card" style={{ padding: 40 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                            <Zap size={20} style={{ color: 'var(--gold)' }} />
                            <h3 style={{ fontSize: 20, fontWeight: 900, fontFamily: 'serif', color: 'var(--text)' }}>Priorité Opérationnelle</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                            <div style={{ padding: '32px 24px', background: 'var(--bg-elevated)', borderRadius: 22, border: '1px solid var(--border)', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', marginBottom: 12, letterSpacing: '0.12em' }}>À CONFIRMER</div>
                                <div style={{ fontSize: 42, fontWeight: 950, color: 'var(--gold)' }}>{data?.todayOrders || 0}</div>
                            </div>
                            <div style={{ padding: '32px 24px', background: 'var(--danger-soft)', borderRadius: 22, border: '1px solid var(--danger-soft)', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--danger)', marginBottom: 12, letterSpacing: '0.12em' }}>Alerte Stock</div>
                                <div style={{ fontSize: 42, fontWeight: 950, color: 'var(--danger)' }}>{data?.lowStockAlerts?.length || 0}</div>
                            </div>
                        </div>
                    </div>

                    <div className="luxury-card" style={{ padding: 40 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                            <Activity size={20} style={{ color: 'var(--gold)' }} />
                            <h3 style={{ fontSize: 20, fontWeight: 900, fontFamily: 'serif', color: 'var(--text)' }}>Pilotage Commercial</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                            <Link href="/os/orders" className="btn-ghost" style={{ padding: '32px 24px', height: 'auto', flexDirection: 'column', alignItems: 'flex-start', gap: 8, borderRadius: 22 }}>
                                <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: '-0.01em' }}>Confirmation Rapide</div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Traiter le flux entrant</div>
                            </Link>
                            <Link href="/os/pipeline" className="btn-ghost" style={{ padding: '32px 24px', height: 'auto', flexDirection: 'column', alignItems: 'flex-start', gap: 8, borderRadius: 22 }}>
                                <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: '-0.01em' }}>Suivi Logistique</div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Contrôle des expéditions</div>
                            </Link>
                            <Link href="/os/products" className="btn btn-primary" style={{ padding: '32px 24px', height: 'auto', flexDirection: 'column', alignItems: 'flex-start', gap: 8, borderRadius: 22, color: 'white' }}>
                                <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: '-0.01em' }}>Gestion Catalogue</div>
                                <div style={{ fontSize: 13, opacity: 0.9 }}>Mise à jour collections</div>
                            </Link>
                            <Link href="/os/inventory" className="btn-ghost" style={{ padding: '32px 24px', height: 'auto', flexDirection: 'column', alignItems: 'flex-start', gap: 8, borderRadius: 22 }}>
                                <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: '-0.01em' }}>Stocks & Alerts</div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Inventaire Maison</div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Performance Side */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="luxury-card" style={{ padding: 40 }}>
                        <h4 style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.15em', marginBottom: 24, textTransform: 'uppercase' }}>MAISON ELIE — TOP VILLES</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {stats?.top_cities && stats.top_cities.length > 0 ? stats.top_cities.slice(0, 5).map((city, i) => (
                                <div key={city.city} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{city.city}</span>
                                    <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--gold)' }}>{city.count} cmd</span>
                                </div>
                            )) : <EmptyState title="" copy="Données indisponibles" />}
                        </div>
                    </div>

                    <div className="luxury-card" style={{ padding: 40 }}>
                        <h4 style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.15em', marginBottom: 24, textTransform: 'uppercase' }}>MAISON ELIE — MEILLEURES VENTES</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {stats?.top_perfumes && stats.top_perfumes.length > 0 ? stats.top_perfumes.slice(0, 5).map((perf, i) => (
                                <div key={perf.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perf.name}</span>
                                    <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--gold)' }}>{perf.count} vds</span>
                                </div>
                            )) : <EmptyState title="" copy="Données indisponibles" />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
