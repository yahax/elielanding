'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, Minus, AlertTriangle, RefreshCw,
    Package, Sparkles
} from 'lucide-react';
import type { Product } from '@/lib/types';
import { fetchCatalog, updateCatalogProduct } from '@/lib/os/api';
import toast from 'react-hot-toast';
import { OsToaster } from '@/components/ui/OsToaster';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const loadInventory = useCallback(async (showToast = false) => {
        setLoading(true);
        try {
            const { products } = await fetchCatalog();

            const mapped = (products || []).map((product) => ({
                ...product,
                slug: product.name.toLowerCase().replace(/\s+/g, '-'),
                price: 0,
            })).filter((p: Product) => {
                if (categoryFilter && p.category !== categoryFilter) return false;
                if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
                return true;
            });

            setProducts(mapped);
            if (showToast) toast.success('Inventaire à jour');
        } catch (err: unknown) {
            console.error('[Inventory] Error:', err);
            const message = err instanceof Error ? err.message : 'Erreur chargement inventaire';
            toast.error(message);
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
            const product = products.find((item) => item.id === id);
            if (!product) {
                throw new Error('Produit introuvable');
            }
            await updateCatalogProduct({
                id: product.id,
                name: product.name,
                category: product.category,
                tier: product.tier,
                is_active: product.is_active,
                stock: newStock,
                low_stock_threshold: product.low_stock_threshold,
            });
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
        <div className="os-page">
            <OsToaster />

            <PageHeader
                title="Gestion de l'Inventaire"
                subtitle="Surveillez et ajustez vos stocks de parfums premium"
                actions={
                    <button className="btn btn-ghost" onClick={() => loadInventory(true)} style={{ height: 42 }}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                }
            />

            {/* Top Stats - Luxury Refinement */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 40 }}>
                <div className="luxury-card" style={{
                    padding: 32,
                    background: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <div style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.12em' }}>STOCK TOTAL (UNITÉS)</div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em' }}>{totalStock}</div>
                    <Package style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.03, width: 120, height: 120 }} />
                </div>

                <div className="luxury-card" style={{
                    padding: 32,
                    background: lowStockCount > 0 ? 'rgba(239, 68, 68, 0.02)' : 'var(--surface)',
                    border: lowStockCount > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>RÉFÉRENCES CRITIQUES</div>
                        {lowStockCount > 0 && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, letterSpacing: '0.05em' }}>
                                ALERTÉ
                            </div>
                        )}
                    </div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: lowStockCount > 0 ? '#EF4444' : 'var(--text)', letterSpacing: '-0.04em' }}>{lowStockCount}</div>
                </div>

                <div className="luxury-card" style={{
                    padding: 32,
                    background: 'var(--gold-glow)',
                    border: '1px solid var(--gold-border)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.12em' }}>
                        <Sparkles size={14} /> INTELLIGENCE STOCKS
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                        {lowStockCount > 0
                            ? `Attention : ${lowStockCount} références sont passées sous le seuil critique. Risque de rupture de flux imminent.`
                            : "État de l'inventaire optimal. Votre autonomie opérationnelle estimée est de 14 jours sur l'ensemble du catalogue."
                        }
                    </div>
                </div>
            </div>

            {/* Disciplined Filters */}
            <div style={{ marginBottom: 40, display: 'flex', gap: 16 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                        className="filter-input"
                        style={{
                            paddingLeft: 52,
                            width: '100%',
                            height: 48,
                            background: 'var(--surface-1)',
                            border: '1px solid var(--border)',
                            borderRadius: 14,
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--text)',
                            transition: 'all 0.3s ease'
                        }}
                        placeholder="Filtrer par référence ou nom de parfum..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="filter-select"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    style={{ height: 48, minWidth: 220, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 14, padding: '0 20px', fontWeight: 900, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                >
                    <option value="">TOUTES LES COLLECTIONS</option>
                    {categories.map(c => <option key={c} value={c}>{String(c).toUpperCase()}</option>)}
                </select>
            </div>

            {/* Premium Inventory List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24, paddingBottom: 60 }}>
                {products.length === 0 ? (
                    <div style={{ gridColumn: '1/-1' }}>
                        <EmptyState
                            title="Inventaire vide"
                            copy="Aucune référence disponible pour l’instant. Ajoutez des produits pour activer le monitoring."
                        />
                    </div>
                ) : products.map(product => {
                    const isLow = product.stock <= product.low_stock_threshold;
                    return (
                        <div key={product.id} className="luxury-card" style={{
                            padding: 28,
                            background: 'var(--surface)',
                            border: isLow ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 32 }}>
                                <div style={{
                                    width: 96, height: 96, borderRadius: 20, background: 'var(--bg-elevated)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                    border: '1px solid var(--border)'
                                }}>
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Package size={36} style={{ color: 'var(--gold)', opacity: 0.2 }} />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 10, fontWeight: 950, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.15em' }}>{product.category}</div>
                                    <h4 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6, color: 'var(--text)', letterSpacing: '-0.02em' }}>{product.name}</h4>
                                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 800, letterSpacing: '0.05em' }}>REF: {(product.slug || 'N/A').toUpperCase()}</div>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'var(--bg-elevated)',
                                padding: '20px 24px',
                                borderRadius: 18,
                                border: '1px solid var(--border)'
                            }}>
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.12em' }}>STOCK DISPONIBLE</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 36, fontWeight: 900, color: isLow ? '#EF4444' : 'var(--text)', letterSpacing: '-0.04em' }}>
                                            {product.stock}
                                        </span>
                                        {isLow && (
                                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: 10, fontWeight: 950, padding: '3px 8px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)', letterSpacing: '0.05em' }}>
                                                CRITIQUE
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 14, padding: 6, border: '1px solid var(--border)' }}>
                                    <button
                                        onClick={() => adjustStock(product.id, product.stock, -1)}
                                        className="btn-stock-adjust"
                                        style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text)', transition: 'all 0.2s' }}
                                    >
                                        <Minus size={18} strokeWidth={3} />
                                    </button>
                                    <div style={{ width: 1, height: 28, background: 'var(--border)', alignSelf: 'center', margin: '0 8px' }} />
                                    <button
                                        onClick={() => adjustStock(product.id, product.stock, 1)}
                                        className="btn-stock-adjust"
                                        style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text)', transition: 'all 0.2s' }}
                                    >
                                        <Plus size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)', fontSize: 12, fontWeight: 900, letterSpacing: '0.05em' }}>
                                    <AlertTriangle size={14} style={{ color: isLow ? '#EF4444' : 'var(--text-dim)' }} />
                                    <span>SEUIL: {product.low_stock_threshold}</span>
                                </div>
                                <div style={{ color: 'var(--text)', fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em' }}>
                                    {(product.price || 0).toLocaleString()} <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>MAD</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
