'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import { fetchOverview } from '@/lib/os/api';
import type { OverviewResponse } from '@/lib/os/types';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';

export default function IntelligencePage() {
    const [data, setData] = useState<OverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetchOverview(30);
            setData(response);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Impossible de charger les insights');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const topPerfume = data?.stats.top_perfumes?.[0];
    const topCity = data?.stats.top_cities?.[0];

    const strategyText = useMemo(() => {
        if (!data || data.stats.total_orders === 0) return '';
        const confRate = data.confirmationRate;
        if (confRate < 50) {
            return 'Votre taux de confirmation est bas. Priorisez les relances sur les commandes "à confirmer" dans les 60 minutes.';
        }
        if (data.lowStockAlerts.length > 0) {
            return 'La conversion est correcte mais des stocks sont critiques. Réapprovisionnez les références en alerte pour éviter une rupture.';
        }
        return 'Performance stable. Vous pouvez amplifier les campagnes Meta Ads sur la meilleure combinaison ville/parfum.';
    }, [data]);

    return (
        <div className="os-page animate-fade-in" style={{ paddingBottom: 100 }}>
            <PageHeader
                title="Intelligence Opérationnelle"
                subtitle="Insights calculés en temps réel à partir des flux de commandes et de logistique Maison ELIE"
                actions={
                    <button type="button" className="btn-ghost" style={{ width: 44, height: 44, padding: 0, borderRadius: 14, background: 'var(--surface)' }} onClick={load}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                }
            />

            {loading ? <LoadingState label="Analyse algorithmique des patterns de conversion et de stock..." /> : null}
            {error ? <ErrorState message={error} onRetry={load} /> : null}

            {!loading && !error && data && data.stats.total_orders === 0 ? (
                <EmptyState
                    title="En attente de données critiques"
                    copy="L&apos;intelligence ELIE OS se déclenche automatiquement dès l&apos;acquisition des premiers flux confirmés."
                />
            ) : null}

            {!loading && !error && data && data.stats.total_orders > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                    {/* Executive Insight Hero */}
                    <div className="luxury-card" style={{
                        padding: '50px',
                        background: 'var(--gold-glow)',
                        borderRadius: 36,
                        border: '1px solid var(--gold-border)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                                <Sparkles size={20} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>RECOMMANDATION STRATÉGIQUE MAISON</span>
                        </div>
                        <h2 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.4, color: 'var(--text)', margin: 0, maxWidth: '900px', fontFamily: 'serif' }}>
                            {strategyText}
                        </h2>
                        <Sparkles style={{ position: 'absolute', right: -30, bottom: -30, width: 200, height: 200, color: 'var(--gold)', opacity: 0.05 }} />
                    </div>

                    {/* KPI Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
                        <StatCard
                            label="Ratio de Confirmation"
                            value={`${data.confirmationRate}%`}
                            trend={{ value: '12%', isPositive: data.confirmationRate > 70 }}
                            accentColor="var(--success)"
                        />
                        <StatCard
                            label="Revenu Moyen (AOV)"
                            value={`${data.avgBasket} MAD`}
                            accentColor="var(--gold)"
                        />
                        <div className="luxury-card" style={{ padding: 28, background: 'var(--surface)' }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.12em' }}>Bassin Dominant</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', fontFamily: 'serif' }}>{topCity?.city || 'N/A'}</div>
                            <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 800, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <TrendingUp size={14} /> {topCity?.count || 0} flux confirmés
                            </div>
                        </div>
                        <div className="luxury-card" style={{ padding: 28, background: 'var(--surface)' }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.12em' }}>Étendard du Catalogue</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', fontFamily: 'serif' }}>{topPerfume?.name || 'N/A'}</div>
                            <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 800, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Sparkles size={14} /> {topPerfume?.count || 0} acquisitions
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 32 }}>
                        {/* Stock Health */}
                        <div className="luxury-card" style={{ padding: 40, background: 'var(--surface)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <AlertTriangle size={20} style={{ color: data.lowStockAlerts.length > 0 ? 'var(--danger)' : 'var(--success)' }} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: 'serif' }}>Santé Logistique</h3>
                                </div>
                                {data.lowStockAlerts.length > 0 && (
                                    <div style={{ background: 'var(--danger-glow)', color: 'var(--danger)', padding: '6px 14px', borderRadius: 10, fontSize: 10, fontWeight: 900, letterSpacing: '0.05em' }}>
                                        ALERTES ACTIVES
                                    </div>
                                )}
                            </div>

                            {data.lowStockAlerts.length === 0 ? (
                                <div style={{ padding: '60px 0', textAlign: 'center', opacity: 0.5, fontSize: 15, fontWeight: 700 }}>Tous les niveaux opérationnels sont optimaux</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {data.lowStockAlerts.map((alert) => (
                                        <div key={alert.perfume_id} style={{
                                            padding: '20px 24px',
                                            background: 'var(--bg-elevated)',
                                            borderRadius: 20,
                                            border: '1px solid var(--border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 12px var(--danger)' }} />
                                                <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{alert.name}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--danger)' }}>{alert.stock}</div>
                                                <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unités en Stock</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Priorities */}
                        <div className="luxury-card" style={{ padding: 40, background: 'var(--surface)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <TrendingUp size={20} style={{ color: 'var(--gold)' }} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: 'serif' }}>Objectifs Prioritaires</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {[
                                    { id: 1, text: "Optimiser le cycle de vie client par des relances SMS ciblées sur les commandes non confirmées.", icon: "01" },
                                    { id: 2, text: "Renforcer les stocks sur les best-sellers avant le pic saisonnier identifié par l'algorithme Maison.", icon: "02" },
                                    { id: 3, text: "Consolider l'efficience logistique sur l'axe Casablanca-Rabat pour réduire les délais finaux.", icon: "03" }
                                ].map(item => (
                                    <div key={item.id} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                                        <div style={{
                                            minWidth: 44, width: 44, height: 44, borderRadius: 14,
                                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 13, fontWeight: 900, color: 'var(--gold)'
                                        }}>
                                            {item.icon}
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dim)', lineHeight: 1.6, paddingTop: 8 }}>
                                            {item.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
