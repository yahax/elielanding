'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, Minus, AlertTriangle, RefreshCw,
    ArrowUpRight, ArrowDownRight, Package, TrendingUp,
    ShieldCheck, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import toast, { Toaster } from 'react-hot-toast';

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const loadInventory = useCallback(async (showToast = false) => {
        setLoading(true);
        try {
            const supabase = createClient();

            console.log('[Inventory] Executing query: .from("inventory").select("stock, low_stock_threshold, perfumes(id, name, gender, tier, is_active)")');

            // Join inventory with perfumes
            const { data, error } = await supabase
                .from('inventory')
                .select(`
                    stock,
                    low_stock_threshold,
                    perfumes (
                        id,
                        name,
                        gender,
                        tier,
                        is_active
                    )
                `);

            if (error) {
                console.error('[Inventory] Supabase return error:', error);
                throw error;
            }

            const mapped = (data || []).map((item: any) => ({
                id: item.perfumes?.id || 'unknown',
                name: item.perfumes?.name || 'Inconnu',
                category: item.perfumes?.gender || 'parfum',
                stock: item.stock,
                low_stock_threshold: item.low_stock_threshold,
                is_active: item.perfumes?.is_active ?? true,
                tier: item.perfumes?.tier || 'classic'
            })).filter((p: any) => {
                if (categoryFilter && p.category !== categoryFilter) return false;
                if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
                return true;
            });

            console.log(`[Inventory] Mapped ${mapped.length} items`);
            setProducts(mapped);
            if (showToast) toast.success('Inventaire à jour');
        } catch (err: any) {
            console.error('[Inventory] Error:', err);
            toast.error(err.message || 'Erreur chargement inventaire');
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, search]);

    useEffect(() => { loadInventory(); }, [loadInventory]);

    const adjustStock = async (id: string, currentStock: number, delta: number) => {
        const newStock = Math.max(0, currentStock + delta);
        if (newStock === currentStock) return;

        // Optimistic UI
        setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('inventory')
                .update({ stock: newStock, updated_at: new Date().toISOString() })
                .eq('perfume_id', id);

            if (error) throw error;
        } catch (err) {
            console.error('[Inventory] Update error:', err);
            toast.error('Échec mise à jour stock');
            loadInventory(); // Revert
        }
    };

    const categories = Array.from(new Set(products.map(p => p.category)));
    const lowStockCount = products.filter(p => p.stock <= p.low_stock_threshold).length;
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <Toaster position="top-right" />

            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 className="page-title">Gestion de l'Inventaire</h2>
                    <p className="page-subtitle">Surveillez et ajustez vos stocks de parfums premium</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" onClick={() => loadInventory(true)} style={{ height: 42 }}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Top Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
                <div className="card" style={{ padding: 24, background: 'var(--text)', color: '#FFF', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ opacity: 0.6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>STOCK TOTAL UNITÉS</div>
                    <div style={{ fontSize: 36, fontWeight: 900 }}>{totalStock}</div>
                    <Package style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.1, width: 100, height: 100 }} />
                </div>
                <div className="card" style={{ padding: 24, border: lowStockCount > 0 ? '1px solid #FECACA' : '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>RUPTURES POTENTIELLES</div>
                            <div style={{ fontSize: 36, fontWeight: 900, color: lowStockCount > 0 ? '#EF4444' : 'var(--text)' }}>{lowStockCount}</div>
                        </div>
                        {lowStockCount > 0 && (
                            <div style={{ background: '#FEF2F2', color: '#EF4444', padding: '8px 12px', borderRadius: 12, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertTriangle size={14} /> ACTION REQUISE
                            </div>
                        )}
                    </div>
                </div>
                <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #FFF 0%, #F9FAFB 100%)' }}>
                    <div style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={14} /> SUGGESTION IA
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: 'var(--text)' }}>
                        {lowStockCount > 0
                            ? `Réapprovisionnez vos ${lowStockCount} produits en alerte pour éviter une perte de CA de ~15% ce week-end.`
                            : "Niveaux de stocks optimaux. Prévoyez une hausse sur la collection Niche pour le Ramadan."
                        }
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 24, padding: 16 }}>
                <div className="filters-bar" style={{ gap: 12, margin: 0, display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            className="filter-input"
                            style={{ paddingLeft: 42, width: '100%', height: 42, background: 'var(--surface-2)', border: 'none', borderRadius: 12, fontSize: 14 }}
                            placeholder="Rechercher une référence…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ height: 42, background: 'var(--surface-2)', border: 'none', borderRadius: 12, padding: '0 16px', fontWeight: 600 }}>
                        <option value="">Toutes les catégories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Inventory List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                {products.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                        Aucun produit trouvé.
                    </div>
                ) : products.map(product => {
                    const isLow = product.stock <= product.low_stock_threshold;
                    return (
                        <div key={product.id} className="card group" style={{ padding: 24, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', border: isLow ? '1.5px solid #FECACA' : '1.5px solid transparent', background: '#FFF' }}>
                            <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: 20, background: 'var(--surface-2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                    border: '1px solid var(--border)'
                                }}>
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Package size={32} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>{product.category}</div>
                                    <h4 style={{ fontSize: 17, fontWeight: 900, marginBottom: 4, color: 'var(--text)' }}>{product.name}</h4>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>REF: {(product.slug || 'N/A').toUpperCase()}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: '#F9FAFB', padding: 16, borderRadius: 20 }}>
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>EN STOCK</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 28, fontWeight: 900, color: isLow ? '#EF4444' : 'var(--text)' }}>
                                            {product.stock}
                                        </span>
                                        {isLow && (
                                            <div style={{ background: '#EF4444', color: '#FFF', fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 6 }}>
                                                BAS
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', background: '#FFF', borderRadius: 14, padding: 4, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                    <button
                                        onClick={() => adjustStock(product.id, product.stock, -1)}
                                        style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text)' }}
                                    >
                                        <Minus size={16} strokeWidth={3} />
                                    </button>
                                    <div style={{ width: 1, height: 20, background: 'var(--border)', alignSelf: 'center', margin: '0 4px' }} />
                                    <button
                                        onClick={() => adjustStock(product.id, product.stock, 1)}
                                        style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text)' }}
                                    >
                                        <Plus size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                                    <AlertTriangle size={14} /> Seuil: {product.low_stock_threshold}
                                </div>
                                <div style={{ color: 'var(--gold)', fontSize: 14 }}>{(product.price || 0).toLocaleString()} MAD</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .card:hover {
                    box-shadow: 0 20px 40px rgba(0,0,0,0.08);
                    transform: translateY(-6px);
                }
                button:active {
                    transform: scale(0.95);
                }
            `}</style>
        </div>
    );
}
