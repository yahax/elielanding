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

    const sourceData = useMemo(
        () =>
            Object.entries(data?.stats.source_breakdown || {}).map(([name, value]) => ({
                name,
                value,
            })),
        [data]
    );

    const topPerfumes = data?.stats.top_perfumes || [];
    const topCities = data?.stats.top_cities || [];

    const stats = data?.stats;

    return (
        <div className="os-page animate-fade-in">
            <PageHeader
                title="Centre de Pilotage ELIE OS"
                subtitle="Vue consolidée de votre activité opérationnelle en temps réel"
                actions={
                    <>
                        <div style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', padding: 4, borderRadius: 10 }}>
                            <button
                                type="button"
                                onClick={() => setRange(7)}
                                className="btn-ghost"
                                style={{ height: 34, padding: '0 12px', background: range === 7 ? 'var(--surface)' : 'transparent' }}
                            >
                                7 jours
                            </button>
                            <button
                                type="button"
                                onClick={() => setRange(30)}
                                className="btn-ghost"
                                style={{ height: 34, padding: '0 12px', background: range === 30 ? 'var(--surface)' : 'transparent' }}
                            >
                                30 jours
                            </button>
                        </div>
                        <button type="button" className="btn-ghost" onClick={() => load(range)} style={{ width: 40, height: 40, padding: 0 }}>
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </>
                }
            />

            {/* Executive Hero Section */}
            <div className="luxury-card" style={{
                marginBottom: 40,
                padding: '48px 40px',
                background: 'linear-gradient(135deg, var(--surface-1) 0%, var(--bg) 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ maxWidth: '640px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div className="surface-pill" style={{ color: 'var(--gold)', borderColor: 'var(--gold-border)', background: 'var(--gold-glow)' }}>
                            CENTRE DE PILOTAGE STRATÉGIQUE
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em' }}>
                            <Shield size={12} /> SÉCURISÉ
                        </div>
                    </div>

                    <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.03em' }}>
                        Bonjour, <span className="luxury-text-gradient">Admin Elie</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 500, lineHeight: 1.7 }}>
                        Votre écosystème de commerce de luxe est stable. L'activité opérationnelle est sous contrôle. Vos rapports consolidés sont prêts pour revue.
                    </p>

                    <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                        <button className="btn btn-primary" style={{ padding: '12px 28px' }}>
                            <Activity size={16} /> Flux Live
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '12px 28px' }}>
                            Archives Rapports
                        </button>
                    </div>
                </div>

                <div style={{ opacity: 0.1, pointerEvents: 'none' }}>
                    <Activity size={120} strokeWidth={1} style={{ color: 'var(--gold)' }} />
                </div>
            </div>

            {/* KPI Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
                <StatCard
                    label="Chiffre d'affaires"
                    value={`${stats?.revenue?.toLocaleString('fr-MA') || 0} MAD`}
                    icon={DollarSign}
                    sub="Total consolidé"
                    accentColor="var(--gold)"
                />
                <StatCard
                    label="Volume Commandes"
                    value={stats?.total_orders || 0}
                    icon={ShoppingBag}
                    sub="Unités validées"
                    accentColor="var(--info)"
                />
                <StatCard
                    label="Taux de Conversion"
                    value={`${data?.confirmationRate || 0}%`}
                    icon={Zap}
                    sub="Performance CRM"
                    accentColor="var(--success)"
                />
                <StatCard
                    label="Panier Moyen"
                    value={`${data?.avgBasket || 0} MAD`}
                    icon={Activity}
                    sub="Valeur par pack"
                    accentColor="var(--warning)"
                />
            </div>

            {/* Insights Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
                <div className="luxury-card" style={{ padding: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                            Tendances Géographiques
                        </h3>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold)' }}>LAST 30 DAYS</div>
                    </div>
                    {topCities.length === 0 ? (
                        <EmptyState title="Aucune donnée" copy="Les tendances apparaîtront ici." />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {topCities.slice(0, 5).map((city, idx) => (
                                <div key={city.city} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', width: 16 }}>0{idx + 1}</div>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{city.city}</span>
                                    </div>
                                    <strong style={{ fontSize: 14, fontWeight: 900 }}>{city.count} <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>CMD</span></strong>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="luxury-card" style={{ padding: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                            Collections Dominantes
                        </h3>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold)' }}>TOP SCALE</div>
                    </div>
                    {topPerfumes.length === 0 ? (
                        <EmptyState title="Aucune donnée" copy="Les best-sellers apparaîtront ici." />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {topPerfumes.slice(0, 5).map((perf, idx) => (
                                <div key={perf.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', width: 16 }}>0{idx + 1}</div>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perf.name}</span>
                                    </div>
                                    <strong style={{ fontSize: 14, fontWeight: 900 }}>{perf.count} <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>VDS</span></strong>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
