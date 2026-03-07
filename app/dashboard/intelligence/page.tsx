'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area, CartesianGrid
} from 'recharts';
import type { DashboardStats, Order } from '@/lib/types';
import { createClient } from '@/lib/supabase';
import { calculateStats } from '@/lib/analytics';
import { Brain, TrendingUp, Users, Target, Zap, Clock, ArrowRight, Sparkles, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';

export default function IntelligencePage() {
    const [stats7, setStats7] = useState<DashboardStats | null>(null);
    const [stats30, setStats30] = useState<DashboardStats | null>(null);
    const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

        try {
            // Fetch orders (no order_items join)
            const { data: orders, error: oError } = await supabase
                .from('orders')
                .select('*')
                .gte('created_at', since30)
                .order('created_at', { ascending: false });

            if (oError) throw oError;

            // Fetch perfumes for alerts
            const { data: perfumes, error: pError } = await supabase
                .from('perfumes')
                .select('id, name, is_active');

            if (pError) throw pError;

            // Fetch inventory for stock levels
            const { data: inv, error: iError } = await supabase
                .from('inventory')
                .select('*');

            if (iError) throw iError;

            const allOrders = (orders || []) as Order[];
            const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
            const orders7 = allOrders.filter(o => o.created_at >= since7);

            setStats7(calculateStats(orders7));
            setStats30(calculateStats(allOrders));

            // Map stock alerts
            const low = (inv || []).map(i => {
                const perfume = (perfumes || []).find(p => p.id === i.perfume_id);
                return {
                    name: perfume?.name || 'Inconnu',
                    stock: i.stock,
                    low_stock_threshold: i.low_stock_threshold
                };
            }).filter(p => p.stock <= p.low_stock_threshold).slice(0, 3);

            setLowStockProducts(low);

        } catch (err) {
            console.error('[Intelligence] Supabase error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="inline-block w-8 h-8 border-3 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
        );
    }

    const s7 = stats7 || { total_orders: 0, confirmed: 0, delivered: 0, canceled: 0, revenue: 0, orders_per_hour: [], top_cities: [], top_perfumes: [], source_breakdown: {} };
    const s30 = stats30 || { total_orders: 0, confirmed: 0, delivered: 0, canceled: 0, revenue: 0, orders_per_hour: [], top_cities: [], top_perfumes: [], source_breakdown: {} };

    const isEmpty = s30.total_orders === 0;

    // Derived Insights
    const confRate = s30.total_orders > 0 ? Math.round((s30.confirmed / s30.total_orders) * 100) : 0;
    const avgOrder = s30.total_orders > 0 ? Math.round(s30.revenue / s30.total_orders) : 0;
    const growth = s7.total_orders > 0 && s30.total_orders > s7.total_orders
        ? Math.round((s7.total_orders / (s30.total_orders - s7.total_orders || 1)) * 100) - 100
        : 0;

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ padding: '4px 8px', background: 'var(--gold-glow)', borderRadius: 6, color: 'var(--gold)', fontSize: 10, fontWeight: 900, letterSpacing: '0.05em' }}>AI ENGINE V2.1</div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Operational Insight Link active</span>
                    </div>
                    <h2 className="page-title">Intelligence & Stratégie</h2>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-ghost" onClick={loadData} style={{ height: 42 }}>
                        <RefreshCw size={16} />
                    </button>
                    <button className="btn" style={{ height: 42, background: 'var(--text)', color: '#FFF', border: 'none', padding: '0 20px', borderRadius: 12, fontWeight: 800 }}>
                        <Sparkles size={16} /> GÉNÉRER RAPPORT PDF
                    </button>
                </div>
            </div>

            {isEmpty ? (
                <div className="card" style={{ textAlign: 'center', padding: 80 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <Brain size={32} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>En attente de données</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 300, margin: '0 auto' }}>L&apos;IA ELIE a besoin de quelques commandes pour commencer à générer des insights stratégiques.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Strategy Block */}
                    <div className="card" style={{
                        padding: 0,
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #111 0%, #222 100%)',
                        color: '#FFF',
                        border: 'none',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', minHeight: 240, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 400 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold)', marginBottom: 16 }}>
                                    <Target size={20} />
                                    <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.1em' }}>STRATÉGIE DE LA SEMAINE</span>
                                </div>
                                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, maxWidth: 500 }}>
                                    Optimisation de la conversion à {s30.top_cities?.[0]?.city || 'Casablanca'}
                                </h3>
                                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 32, maxWidth: 600 }}>
                                    Nos analyses montrent une forte corrélation entre les commandes de {s30.top_perfumes?.[0]?.name || 'parfums femme'} et la source Meta Ads cette semaine.
                                    Nous recommandons de doubler le budget sur ce segment pour maximiser le ROI.
                                </p>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button className="btn" style={{ background: 'var(--gold)', color: '#000', padding: '0 24px', height: 48 }}>Appliquer la recommandation</button>
                                    <button className="btn btn-ghost" style={{ color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', height: 48, padding: '0 24px' }}>Détails de l&apos;analyse</button>
                                </div>
                            </div>
                            <div style={{ width: 300, background: 'rgba(255,255,255,0.03)', padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 4 }}>REVENU POTENTIEL</div>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold)' }}>+15,400 MAD</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 4 }}>CONFIANCE IA</div>
                                    <div style={{ fontSize: 28, fontWeight: 900 }}>94%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Insights Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <TrendingUp size={20} />
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: growth >= 0 ? 'var(--success)' : 'var(--danger)' }}>{growth >= 0 ? '↑' : '↓'} {Math.abs(growth)}%</div>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>CROISSANCE</div>
                            <div style={{ fontSize: 20, fontWeight: 900 }}>{s30.total_orders} CMD</div>
                        </div>
                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShoppingBag size={20} />
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Top Perfume</div>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>PANIER MOYEN</div>
                            <div style={{ fontSize: 20, fontWeight: 900 }}>{avgOrder} MAD</div>
                        </div>
                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Zap size={20} />
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>Optimal</div>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>TAUX CONFIRMATION</div>
                            <div style={{ fontSize: 20, fontWeight: 900 }}>{confRate}%</div>
                        </div>
                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={20} />
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Actif</div>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>FIDÉLITÉ</div>
                            <div style={{ fontSize: 20, fontWeight: 900 }}>1.4 <span style={{ fontSize: 12, fontWeight: 500 }}>achats/client</span></div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, flexWrap: 'wrap' }}>
                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 800 }}>Performance Temporelle</h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} /> Commandes
                                    </div>
                                </div>
                            </div>
                            <div style={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={s30.orders_per_hour}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                        <Area type="monotone" dataKey="count" stroke="var(--gold)" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div className="card" style={{ padding: 24, flex: 1 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Alertes Logistique</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {lowStockProducts.length > 0 ? lowStockProducts.map((p, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 12, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                            <AlertCircle size={18} style={{ color: '#EF4444', marginTop: 2 }} />
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: '#EF4444' }}>Stock Critique</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.name} est à {p.stock} unités.</div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune alerte stock active.</div>
                                    )}
                                    <div style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 12, background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                                        <Clock size={18} style={{ color: '#F59E0B', marginTop: 2 }} />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: '#F59E0B' }}>Délai Livraison</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Augmentation du délai vers Agadir (+24h).</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: 24, flex: 1, background: 'var(--gold-glow)', border: '1px solid var(--gold-soft)' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)', marginBottom: 12 }}>Prochaine étape</h3>
                                <p style={{ fontSize: 13, color: 'var(--gold)', opacity: 0.8, lineHeight: 1.5, marginBottom: 20 }}>
                                    L'analyse prédictive suggère de renforcer le stock de parfums &quot;Niche&quot;.
                                    Une croissance de 15% est prévue le week-end prochain.
                                </p>
                                <button className="btn" style={{ width: '100%', background: 'var(--gold)', color: '#000', border: 'none', height: 44, borderRadius: 12, fontWeight: 800 }}>
                                    Optimiser l&apos;inventaire
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
