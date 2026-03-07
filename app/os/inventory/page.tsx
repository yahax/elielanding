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
import { EmptyState, LoadingState } from '@/components/ui/States';

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const loadInventory = useCallback(async (showToast = false) => {
        setLoading(true);
        try {
            const { products: data } = await fetchCatalog();
            const filtered = (data || []).filter((p: Product) => {
                if (categoryFilter && p.category !== categoryFilter) return false;
                if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
                return true;
            });
            setProducts(filtered);
            if (showToast) toast.success('Inventaire à jour');
        } catch (err: unknown) {
            toast.error('Erreur chargement inventaire');
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
            if (!product) throw new Error('Produit introuvable');

            await updateCatalogProduct({
                ...product,
                stock: newStock
            });
        } catch (err) {
            toast.error('Échec mise à jour stock');
            loadInventory(); // Revert
        }
    };

    const categories = Array.from(new Set(products.map(p => p.category)));
    const lowStockCount = products.filter(p => p.stock <= (p.low_stock_threshold || 5)).length;
    const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);

    return (
        <div className="os-page animate-fade-in" style={{ paddingBottom: 100 }}>
            <OsToaster />

            <PageHeader
                title="Gestion des Stocks"
                subtitle="Surveillance stratégique et ajustement des inventaires Maison ELIE"
                actions={
                    <button className="btn-ghost" onClick={() => loadInventory(true)} style={{ width: 44, height: 44, padding: 0, borderRadius: 14, background: 'var(--surface)' }}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 40 }}>
                <div className="luxury-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Stock Global Disponible</div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>{totalStock} <span style={{ fontSize: 16, opacity: 0.5, fontWeight: 700 }}>unités</span></div>
                    <Package style={{ position: 'absolute', right: -20, bottom: -24, width: 140, height: 140, color: 'var(--gold)', opacity: 0.04 }} />
                </div>

                <div className="luxury-card" style={{ padding: 32, background: lowStockCount > 0 ? 'var(--danger-soft)' : 'var(--surface)', border: lowStockCount > 0 ? '1px solid var(--danger-soft)' : '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Alertes de Rupture</div>
                        {lowStockCount > 0 && <div style={{ background: 'var(--danger)', color: 'white', padding: '4px 10px', borderRadius: 8, fontSize: 9, fontWeight: 900, letterSpacing: '0.05em' }}>URGENT</div>}
                    </div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: lowStockCount > 0 ? 'var(--danger)' : 'var(--success)', letterSpacing: '-0.02em' }}>{lowStockCount}</div>
                </div>

                <div className="luxury-card" style={{ padding: 32, background: 'var(--gold-glow)', border: '1px solid var(--gold-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
                        <Sparkles size={16} fill="var(--gold)" fillOpacity={0.1} /> Analyste de Flux
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
                        {lowStockCount > 0
                            ? `Planification requise : ${lowStockCount} références ont atteint le seuil critique. Risque de perte de conversion immédiat.`
                            : "État de santé optimal. Le catalogue est entièrement disponible pour les opérations de vente en cours."
                        }
                    </p>
                </div>
            </div>

            <div style={{ marginBottom: 32, display: 'flex', gap: 16 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                        className="filter-input"
                        placeholder="Rechercher une référence produit..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 48, width: '100%', height: 52, borderRadius: 16, fontSize: 14 }}
                    />
                </div>
                <select
                    className="filter-select"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    style={{ width: 260, height: 52, borderRadius: 16, fontSize: 13, fontWeight: 800 }}
                >
                    <option value="">TOUTES LES COLLECTIONS</option>
                    {categories.map(c => <option key={c} value={c}>{String(c).toUpperCase()}</option>)}
                </select>
            </div>

            {loading && products.length === 0 ? (
                <LoadingState label="Synchronisation de l'inventaire..." />
            ) : products.length === 0 ? (
                <EmptyState title="Catalogue introuvable" copy="Ajustez vos filtres ou vérifiez la connexion Supabase." />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 28 }}>
                    {products.map(product => {
                        const isLow = (product.stock || 0) <= (product.low_stock_threshold || 5);
                        return (
                            <div key={product.id} className="luxury-card animate-scale-in" style={{ padding: 28, border: isLow ? '1.5px solid var(--danger-soft)' : '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', gap: 20, marginBottom: 28 }}>
                                    <div style={{ width: 80, height: 80, borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {product.image_url ? (
                                            <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : <Package size={24} style={{ color: 'var(--gold)', opacity: 0.2 }} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{product.category}</div>
                                        <h4 style={{ fontSize: 18, fontWeight: 800, margin: '6px 0', color: 'var(--text)', fontFamily: 'serif' }}>{product.name}</h4>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)' }}>ID: #{product.id.slice(-6).toUpperCase()}</div>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--bg-elevated)', padding: '24px', borderRadius: 20, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.08em' }}>Unités en Stock</div>
                                        <div style={{ fontSize: 36, fontWeight: 900, color: isLow ? 'var(--danger)' : 'var(--text)', letterSpacing: '-0.04em' }}>
                                            {product.stock || 0}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 6, borderRadius: 14, border: '1px solid var(--border)' }}>
                                        <button onClick={() => adjustStock(product.id, product.stock || 0, -1)} className="btn-ghost" style={{ width: 44, height: 44, borderRadius: 10 }}><Minus size={18} strokeWidth={2.5} /></button>
                                        <div style={{ width: 1, height: 24, background: 'var(--border)', alignSelf: 'center', margin: '0 6px' }} />
                                        <button onClick={() => adjustStock(product.id, product.stock || 0, 1)} className="btn-ghost" style={{ width: 44, height: 44, borderRadius: 10 }}><Plus size={18} strokeWidth={2.5} /></button>
                                    </div>
                                </div>

                                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: isLow ? 'var(--danger)' : 'var(--text-dim)' }}>
                                        <AlertTriangle size={16} />
                                        Seuil alerte: {product.low_stock_threshold || 5}
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)' }}>
                                        {product.price} <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 700 }}>MAD</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
