'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, AlertTriangle, Sparkles } from 'lucide-react';
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
        <div className="os-page">
            <PageHeader
                title="Intelligence Opérationnelle"
                subtitle="Insights calculés à partir des données réelles commandes + stock"
                actions={
                    <button type="button" className="btn-ghost" style={{ height: 40 }} onClick={load}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                }
            />

            {loading ? <LoadingState label="Analyse des patterns de conversion et de stock." /> : null}
            {error ? <ErrorState message={error} onRetry={load} /> : null}

            {!loading && !error && data && data.stats.total_orders === 0 ? (
                <EmptyState
                    title="En attente de données"
                    copy="L&apos;intelligence ELIE OS se déclenche automatiquement dès les premières commandes validées."
                />
            ) : null}

            {!loading && !error && data && data.stats.total_orders > 0 ? (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {/* Executive Insight Hero */}
                    <div style={{
                        padding: '40px',
                        background: 'var(--gold-glow)',
                        borderRadius: 32,
                        border: '1px solid var(--gold-border)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                                <Sparkles size={18} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>RECOMMANDATION STRATÉGIQUE IA</span>
                        </div>
                        <h2 style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.4, color: 'var(--text)', margin: 0, maxWidth: '800px' }}>
                            {strategyText}
                        </h2>
                    </div>

                    {/* KPI Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                        <StatCard
                            label="Confirmation Rate"
                            value={`${data.confirmationRate}%`}
                            trend={{ value: '12%', isPositive: data.confirmationRate > 70 }}
                            accentColor="var(--success)"
                        />
                        <StatCard
                            label="Panier Moyen"
                            value={`${data.avgBasket} MAD`}
                            accentColor="var(--gold)"
                        />
                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.1em' }}>Ville Dominante</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>{topCity?.city || 'N/A'}</div>
                            <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700, marginTop: 4 }}>{topCity?.count || 0} commandes</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.1em' }}>Best-Seller</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>{topPerfume?.name || 'N/A'}</div>
                            <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, marginTop: 4 }}>{topPerfume?.count || 0} ventes</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                        {/* Stock Health */}
                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 32, padding: 32 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Santé du Stock</h3>
                                {data.lowStockAlerts.length > 0 && (
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900 }}>
                                        ALERTES ACTIVES
                                    </div>
                                )}
                            </div>

                            {data.lowStockAlerts.length === 0 ? (
                                <div style={{ padding: '40px 0', textAlign: 'center', opacity: 0.5, fontSize: 14, fontWeight: 600 }}>Tous les niveaux sont nominaux</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {data.lowStockAlerts.map((alert) => (
                                        <div key={alert.perfume_id} style={{
                                            padding: '16px 20px',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: 16,
                                            border: '1px solid var(--border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 10px #EF4444' }} />
                                                <span style={{ fontWeight: 800, fontSize: 14 }}>{alert.name}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 16, fontWeight: 900, color: '#EF4444' }}>{alert.stock}</div>
                                                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Unités</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Roadmap */}
                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 32, padding: 32 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, marginBottom: 24 }}>Objectifs Prioritaires</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {[
                                    { id: 1, text: "Optimiser le cycle de vie client par des relances SMS ciblées sur les commandes non confirmées.", icon: "01" },
                                    { id: 2, text: "Renforcer les stocks sur les best-sellers avant le pic saisonnier identifié par l'algorithme.", icon: "02" },
                                    { id: 3, text: "Consolider la logistique sur l'axe Casablanca-Rabat pour réduire les délais de livraison.", icon: "03" }
                                ].map(item => (
                                    <div key={item.id} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                                        <div style={{
                                            minWidth: 40, width: 40, height: 40, borderRadius: 12,
                                            background: 'var(--surface-3)', border: '1px solid var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, fontWeight: 900, color: 'var(--gold)'
                                        }}>
                                            {item.icon}
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dim)', lineHeight: 1.6, paddingTop: 6 }}>
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
