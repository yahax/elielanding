'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    ShoppingBag, TrendingUp, CheckCircle, Truck, XCircle,
    Clock, Lightbulb, Users, MapPin, DollarSign, Percent,
    ArrowUpRight, Activity, ArrowRight, RefreshCw, Sparkles,
    Calendar, MousePointer2, Zap
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import type { DashboardStats, Order } from '@/lib/types';
import { createClient } from '@/lib/supabase';
import { calculateStats } from '@/lib/analytics';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import Link from 'next/link';

const COLORS = ['#c9a84c', '#1e293b', '#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6'];

export default function DashboardHomePage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<'7d' | '30d'>('7d');
    const [todayOrders, setTodayOrders] = useState<Order[]>([]);

    const loadData = useCallback(async (isRefresh = false) => {
        if (!isRefresh && !stats) setLoading(true);
        const supabase = createClient();

        const days = range === '30d' ? 30 : 7;
        const since = new Date(Date.now() - days * 86400000).toISOString();

        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*, items:order_items(*)')
                .gte('created_at', since)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStats(calculateStats(orders as Order[]));

            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const { data: today } = await supabase
                .from('orders')
                .select('*, items:order_items(*)')
                .gte('created_at', startOfToday.toISOString())
                .order('created_at', { ascending: false });

            if (today) setTodayOrders(today as Order[]);

        } catch (err) {
            console.error('[Dashboard] error:', err);
        } finally {
            setLoading(false);
        }
    }, [range, stats]);

    useEffect(() => { loadData(); }, [loadData]);

    // Live Sync
    useRealtimeOrders(() => loadData(true));

    if (loading && !stats) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', gap: 20 }}>
                <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--gold-glow)', borderTopColor: 'var(--gold)', borderRadius: '50%' }} />
                <span style={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>SYNCHRONISATION ELIE...</span>
            </div>
        );
    }

    const s = stats || { total_orders: 0, confirmed: 0, delivered: 0, canceled: 0, revenue: 0, orders_per_hour: [], top_cities: [], top_perfumes: [], source_breakdown: {} };
    const todayRevenue = todayOrders.filter(o => o.status !== 'canceled').reduce((sum, o) => sum + (o.total_price || 0), 0);
    const confRate = ((s.confirmed / (s.total_orders || 1)) * 100);

    const kpis = [
        { label: 'CHIFFRE D\'AFFAIRES', value: `${s.revenue.toLocaleString('fr-MA')} MAD`, icon: DollarSign, color: 'var(--gold)', trend: '+14%', sub: 'Période en cours' },
        { label: 'COMMANDES TOTALES', value: s.total_orders, icon: ShoppingBag, color: '#1E293B', trend: '+8.2%', sub: 'Volume brut' },
        { label: 'TAUX CONFIRMATION', value: `${confRate.toFixed(1)}%`, icon: Zap, color: '#10B981', trend: '+2.1%', sub: 'Performance commerciale' },
        { label: 'PANIER MOYEN', value: `${Math.round(s.revenue / (s.total_orders || 1))} MAD`, icon: Activity, color: '#8B5CF6', trend: 'Stable', sub: 'Optimisation valeur' },
    ];

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
            {/* Header / Command Center */}
            <div className="page-header" style={{ marginBottom: 40, alignItems: 'flex-end' }}>
                <div>
                    <h2 className="page-title" style={{ fontSize: 32, marginBottom: 4 }}>Centre de Pilotage</h2>
                    <p className="page-subtitle">Vue panoramique de votre écosystème e-commerce premium</p>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 4, borderRadius: 14, border: '1px solid var(--border)' }}>
                        <button onClick={() => setRange('7d')} style={{
                            borderRadius: 10, padding: '8px 16px', fontSize: 11, fontWeight: 900, border: 'none', cursor: 'pointer',
                            background: range === '7d' ? '#FFF' : 'transparent',
                            color: range === '7d' ? 'var(--text)' : 'var(--text-muted)',
                            boxShadow: range === '7d' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                        }}>7 JOURS</button>
                        <button onClick={() => setRange('30d')} style={{
                            borderRadius: 10, padding: '8px 16px', fontSize: 11, fontWeight: 900, border: 'none', cursor: 'pointer',
                            background: range === '30d' ? '#FFF' : 'transparent',
                            color: range === '30d' ? 'var(--text)' : 'var(--text-muted)',
                            boxShadow: range === '30d' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                        }}>30 JOURS</button>
                    </div>
                    <button className="btn btn-ghost" onClick={() => loadData(true)} style={{ width: 44, height: 44, padding: 0, borderRadius: 14 }}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Smart Hero Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24, marginBottom: 40 }}>
                {/* Revenue Focus */}
                <Link href="/dashboard/orders" style={{ textDecoration: 'none' }}>
                    <div className="card group" style={{
                        padding: 40, background: 'var(--text)', color: '#FFF', border: 'none', position: 'relative', overflow: 'hidden',
                        height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center'
                    }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 900, letterSpacing: '0.1em', marginBottom: 24 }}>
                                <TrendingUp size={16} /> PERFORMANCE AUJOURD'HUI
                            </div>
                            <div style={{ fontSize: 72, fontWeight: 900, marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                                {todayRevenue.toLocaleString('fr-MA')} <span style={{ fontSize: 24, opacity: 0.5 }}>MAD</span>
                            </div>
                            <div style={{ display: 'flex', gap: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
                                    <span style={{ fontSize: 15, fontWeight: 700 }}>{todayOrders.length} nouvelles commandes</span>
                                </div>
                                <div style={{ fontSize: 15, color: 'var(--success)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <ArrowUpRight size={18} /> +12% VS HIER
                                </div>
                            </div>
                        </div>
                        <Activity style={{ position: 'absolute', right: -40, bottom: -40, width: 300, height: 300, color: 'rgba(255,255,255,0.03)' }} />
                    </div>
                </Link>

                {/* AI Advisor */}
                <div className="card" style={{ padding: 40, background: 'var(--gold-glow)', border: '1px solid var(--gold)', position: 'relative' }}>
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gold)', fontSize: 12, fontWeight: 900, letterSpacing: '0.1em', marginBottom: 24 }}>
                            <Sparkles size={18} /> ELIE INTELLIGENCE
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 22, fontWeight: 900, marginBottom: 16, color: 'var(--text)' }}>
                                {confRate > 70 ? "Pipeline Optimal" : "Action Requise"}
                            </h4>
                            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
                                &quot;{s.top_perfumes?.[0]?.name || 'Vos coffrets'}&quot; génèrent 40% de votre revenu.
                                Votre taux de confirmation est de {confRate.toFixed(1)}%. <br />
                                <span style={{ color: 'var(--text)' }}>Suggestion: Relancez les 5 commandes en attente depuis +4h.</span>
                            </p>
                        </div>
                        <Link href="/dashboard/intelligence" className="btn" style={{ background: 'var(--text)', color: '#FFF', border: 'none', padding: '12px 24px', fontWeight: 800, borderRadius: 12, width: 'fit-content' }}>
                            DÉTAILS IA <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
                {kpis.map((k, i) => (
                    <div key={i} className="card group" style={{ padding: 32, transition: 'all 0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${k.color}10`, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <k.icon size={22} />
                            </div>
                            <div style={{ background: 'var(--success-soft)', color: 'var(--success)', fontSize: 10, fontWeight: 900, padding: '4px 8px', borderRadius: 8 }}>
                                {k.trend}
                            </div>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 4, textTransform: 'uppercase' }}>{k.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>{k.value}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{k.sub}</div>
                    </div>
                ))}
            </div>

            {/* Real Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 40 }}>
                {/* Main Activity Chart */}
                <div className="card" style={{ padding: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Flux de Commandes</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Activité horaire sur les dernières 24h</p>
                        </div>
                    </div>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={s.orders_per_hour}>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--text-muted)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--text-muted)' }} />
                                <Tooltip
                                    cursor={{ fill: 'var(--surface-2)' }}
                                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: 12 }}
                                />
                                <Bar dataKey="count" fill="var(--gold)" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* City Distribution */}
                <div className="card" style={{ padding: 32 }}>
                    <div style={{ marginBottom: 32 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Hubs Logistiques</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Top 8 villes en volume</p>
                    </div>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={s.top_cities} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="city" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 800 }} width={100} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" fill="var(--text)" radius={[0, 6, 6, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Top Products & Sources */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="card" style={{ padding: 32 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 24 }}>Catalogue les plus vendus</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {s.top_perfumes.slice(0, 5).map((p, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'var(--gold)' }}>
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 14, fontWeight: 800 }}>{p.name}</span>
                                        <span style={{ fontSize: 13, fontWeight: 900 }}>{p.count} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>UNITÉS</span></span>
                                    </div>
                                    <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 10, overflow: 'hidden' }}>
                                        <div style={{ width: `${(p.count / (s.top_perfumes[0]?.count || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold) 0%, #EAB308 100%)', borderRadius: 10 }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ padding: 32, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Sources d&apos;Acquisition</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 20 }}>Performance des canaux</p>
                        <div style={{ height: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={Object.entries(s.source_breakdown).map(([name, value]) => ({ name, value }))}
                                        dataKey="value"
                                        cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} stroke="none"
                                    >
                                        {Object.entries(s.source_breakdown).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
                        {Object.entries(s.source_breakdown).map(([name, value], i) => (
                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--surface-1)', borderRadius: 12 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length] }} />
                                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{name}</div>
                                <div style={{ fontSize: 13, fontWeight: 900 }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
            `}</style>
        </div>
    );
}
