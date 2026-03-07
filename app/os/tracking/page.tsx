'use client';

import { useEffect, useState } from 'react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
} from 'recharts';
import { fetchOverview } from '@/lib/os/api';
import type { OverviewResponse } from '@/lib/os/types';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { PageHeader } from '@/components/ui/PageHeader';

const COLORS = ['#c8a76b', '#3a9d7a', '#4c7ba5', '#b4555f', '#7f87a7', '#c89245'];

export default function TrackingPage() {
    const [data, setData] = useState<OverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetchOverview(30);
                setData(response);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Impossible de charger le tracking';
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const stats = data?.stats;
    const total = stats?.total_orders || 0;
    const confirmed = stats?.confirmed || 0;
    const delivered = stats?.delivered || 0;
    const canceled = stats?.canceled || 0;

    const funnel = [
        { label: 'Total', value: total, color: '#4c7ba5' },
        { label: 'Confirmé', value: confirmed, color: '#3a9d7a' },
        { label: 'Livré', value: delivered, color: '#c8a76b' },
        { label: 'Annulé', value: canceled, color: '#b4555f' },
    ];

    const sourceData = Object.entries(stats?.source_breakdown || {}).map(([name, value]) => ({ name, value }));

    return (
        <div className="os-page">
            <PageHeader
                title="Tracking Opérationnel"
                subtitle="Analyse du tunnel et des sources sur les 30 derniers jours"
            />

            {loading ? <LoadingState label="Agrégation des signaux de conversion." /> : null}
            {error ? <ErrorState message={error} /> : null}

            {!loading && !error && total === 0 ? (
                <EmptyState
                    title="Aucune donnée pour le moment"
                    copy="Les indicateurs apparaissent automatiquement dès qu&apos;une commande est synchronisée."
                />
            ) : null}

            {!loading && !error && total > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, paddingBottom: 60 }}>
                    <div className="luxury-card" style={{ padding: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
                            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-dim)' }}>Tunnel de conversion</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {funnel.map((step) => {
                                const percentage = Math.max(2, Math.round((step.value / Math.max(total, 1)) * 100));
                                return (
                                    <div key={step.label} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 60px', alignItems: 'center', gap: 16 }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{step.label}</span>
                                        <div style={{ height: 18, borderRadius: 9, background: 'var(--bg-elevated)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                            <div style={{ width: `${percentage}%`, height: '100%', background: step.color, borderRadius: 9 }} />
                                        </div>
                                        <div style={{ textAlign: 'right', fontWeight: 900, fontSize: 16, color: 'var(--text)' }}>{step.value}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="luxury-card" style={{ padding: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
                            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-dim)' }}>Sources d&apos;acquisition</h3>
                        </div>
                        <div style={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sourceData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={4}
                                        stroke="none"
                                    >
                                        {sourceData.map((_, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="luxury-card" style={{ padding: 32, gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
                            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-dim)' }}>Performance Géographique (Top Villes)</h3>
                        </div>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.top_cities || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <XAxis
                                        dataKey="city"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-dim)', fontSize: 11, fontWeight: 800 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-dim)', fontSize: 11, fontWeight: 800 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    />
                                    <Bar dataKey="count" fill="var(--gold)" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
