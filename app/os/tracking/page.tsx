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
    CartesianGrid
} from 'recharts';
import { fetchOverview } from '@/lib/os/api';
import type { OverviewResponse } from '@/lib/os/types';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { PageHeader } from '@/components/ui/PageHeader';
import { TrendingUp, Globe, MapPin, RefreshCw } from 'lucide-react';

const COLORS = ['#D4AF37', '#9CA3AF', '#4B5563', '#1F2937', '#D1D5DB', '#E5E7EB'];

export default function TrackingPage() {
    const [data, setData] = useState<OverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async (showToast = false) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetchOverview(30);
            setData(response);
            if (showToast) {
                // Not using toast here to avoid cluttering, but keeping the pattern
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Impossible de charger le tracking';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const stats = data?.stats;
    const total = stats?.total_orders || 0;
    const confirmed = stats?.confirmed || 0;
    const delivered = stats?.delivered || 0;
    const canceled = stats?.canceled || 0;

    const funnel = [
        { label: 'Flux Total', value: total, color: 'var(--text-dim)' },
        { label: 'Confirmé', value: confirmed, color: 'var(--gold)' },
        { label: 'Livré', value: delivered, color: 'var(--success)' },
        { label: 'Annulé', value: canceled, color: 'var(--danger)' },
    ];

    const sourceData = Object.entries(stats?.source_breakdown || {}).map(([name, value]) => ({ name, value }));

    return (
        <div className="os-page animate-fade-in" style={{ paddingBottom: 100 }}>
            <PageHeader
                title="Cockpit Analytique"
                subtitle="Intelligence stratégique des flux et monitoring de conversion Maison ELIE"
                actions={
                    <button className="btn-ghost" onClick={() => load(true)} style={{ width: 44, height: 44, padding: 0, borderRadius: 14, background: 'var(--surface)' }}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                }
            />

            {loading && !data ? <LoadingState label="Agrégation des signaux de performance..." /> : null}
            {error ? <ErrorState message={error} /> : null}

            {!loading && !error && total === 0 ? (
                <EmptyState
                    title="Aucune donnée synchronisée"
                    copy="Les indicateurs apparaissent automatiquement dès qu'une commande est enregistrée dans le système."
                />
            ) : data && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32 }}>
                    <div className="luxury-card" style={{ padding: 40, background: 'var(--surface)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gold-glow)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--gold-border)' }}>
                                <TrendingUp size={20} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-dim)' }}>Tunnel de Conversion</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                            {funnel.map((step) => {
                                const percentage = total > 0 ? Math.round((step.value / total) * 100) : 0;
                                return (
                                    <div key={step.label} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{step.label}</span>
                                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                                <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-dim)', opacity: 0.6 }}>{percentage}%</span>
                                                <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>{step.value}</span>
                                            </div>
                                        </div>
                                        <div style={{ height: 10, background: 'var(--bg-elevated)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                            <div style={{ width: `${Math.max(2, percentage)}%`, height: '100%', background: step.color, borderRadius: 5, transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="luxury-card" style={{ padding: 40, background: 'var(--surface)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gold-glow)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--gold-border)' }}>
                                <Globe size={20} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-dim)' }}>Curation des Sources</h3>
                        </div>
                        <div style={{ height: 280, position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sourceData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={80}
                                        outerRadius={115}
                                        paddingAngle={6}
                                        stroke="none"
                                    >
                                        {sourceData.map((_, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-xl)', fontWeight: 900, fontSize: 13, color: 'var(--text)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>{total}</div>
                                <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>FLUX TOTAL</div>
                            </div>
                        </div>
                    </div>

                    <div className="luxury-card" style={{ padding: 50, gridColumn: '1 / -1', background: 'var(--surface)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 50 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gold-glow)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--gold-border)' }}>
                                <MapPin size={20} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-dim)' }}>Segmentation Géographique</h3>
                        </div>
                        <div style={{ height: 360 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.top_cities || []} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                                    <XAxis
                                        dataKey="city"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-dim)', fontSize: 12, fontWeight: 800 }}
                                        dy={12}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-dim)', fontSize: 12, fontWeight: 800 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-xl)', fontWeight: 900, fontSize: 13 }}
                                        cursor={{ fill: 'var(--bg-elevated)', opacity: 0.5 }}
                                    />
                                    <Bar dataKey="count" fill="var(--gold)" radius={[8, 8, 0, 0]} barSize={54} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
