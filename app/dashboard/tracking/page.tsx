'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import type { DashboardStats, Order } from '@/lib/types';
import { createClient } from '@/lib/supabase';
import { calculateStats } from '@/lib/analytics';

const COLORS = ['#c9a84c', '#10b981', '#8b5cf6', '#3b82f6', '#ef4444', '#f59e0b'];

const FUNNEL_STEPS: { key: string; label: string; color: string }[] = [
    { key: 'total_orders', label: 'Commandes', color: '#3b82f6' },
    { key: 'confirmed', label: 'Confirmés', color: '#10b981' },
    { key: 'delivered', label: 'Livrés', color: '#6ee7b7' },
    { key: 'canceled', label: 'Annulés', color: '#ef4444' },
];

export default function TrackingPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const supabase = createClient();
            const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

            try {
                const { data: orders, error } = await supabase
                    .from('orders')
                    .select('*')
                    .gte('created_at', since30)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setStats(calculateStats((orders || []) as Order[]));
            } catch (err) {
                console.error('[Tracking] Supabase error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Chargement…</div>;
    }

    const s = stats || { total_orders: 0, confirmed: 0, delivered: 0, canceled: 0, revenue: 0, orders_per_hour: [], top_cities: [], top_perfumes: [], source_breakdown: {} };
    const isEmpty = s.total_orders === 0;

    const funnelValues: Record<string, number> = {
        total_orders: s.total_orders,
        confirmed: s.confirmed,
        delivered: s.delivered,
        canceled: s.canceled,
    };

    const maxFunnel = Math.max(s.total_orders, 1);
    const sourceData = Object.entries(s.source_breakdown).map(([name, value]) => ({ name, value }));

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div>
                    <h2 className="page-title">Conversion & Performance</h2>
                    <p className="page-subtitle">Analyse du tunnel de vente — 30 derniers jours</p>
                </div>
            </div>

            {isEmpty ? (
                <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Aucune donnée pour le moment</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Les données apparaîtront dès la première commande</div>
                </div>
            ) : (
                <>
                    {/* Funnel */}
                    <div className="card" style={{ marginBottom: 24, padding: 24 }}>
                        <div className="card-title" style={{ marginBottom: 20 }}>Tunnel de conversion</div>
                        <div style={{ padding: '10px 0' }}>
                            {FUNNEL_STEPS.map((step) => {
                                const val = funnelValues[step.key] || 0;
                                const pct = Math.round((val / maxFunnel) * 100);
                                return (
                                    <div key={step.key} className="funnel-step" style={{ marginBottom: 16 }}>
                                        <div className="funnel-label" style={{ fontWeight: 700, fontSize: 13, width: 120 }}>{step.label}</div>
                                        <div className="funnel-bar-wrap" style={{ background: 'var(--surface-3)', borderRadius: 10, height: 28 }}>
                                            <div className="funnel-bar-fill" style={{
                                                width: `${Math.max(pct, 2)}%`,
                                                background: step.color,
                                                borderRadius: 8,
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '0 12px',
                                                fontSize: 11,
                                                fontWeight: 800,
                                                color: '#fff',
                                                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                                            }}>
                                                {pct}%
                                            </div>
                                        </div>
                                        <div className="funnel-value" style={{ width: 60, textAlign: 'right', fontWeight: 800, fontSize: 15 }}>{val}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: 32, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Taux de confirmation</span>
                                <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold)' }}>
                                    {s.total_orders ? Math.round((s.confirmed / s.total_orders) * 100) : 0}%
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Taux de livraison</span>
                                <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--success)' }}>
                                    {s.confirmed ? Math.round((s.delivered / s.confirmed) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Source Breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
                        <div className="card" style={{ padding: 24 }}>
                            <div className="card-title" style={{ marginBottom: 20 }}>Répartition des sources</div>
                            <div style={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} stroke="none">
                                            {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', fontSize: 12 }}
                                            itemStyle={{ color: '#fff', fontWeight: 700 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
                                {sourceData.map((s, i) => (
                                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: 'var(--surface-2)', padding: '6px 12px', borderRadius: 8 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{s.name}</span>
                                        <span style={{ fontWeight: 800 }}>{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card" style={{ padding: 24 }}>
                            <div className="card-title" style={{ marginBottom: 20 }}>Top destinations</div>
                            <div style={{ height: 340 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={s.top_cities} layout="vertical" margin={{ left: 20, right: 30 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="city" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }} width={100} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                            contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', fontSize: 12 }}
                                        />
                                        <Bar dataKey="count" fill="var(--gold)" radius={[0, 6, 6, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
