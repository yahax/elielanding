'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, Edit3,
    Archive, Image as ImageIcon, X,
    Package, DollarSign, RefreshCw
} from 'lucide-react';
import type { Product } from '@/lib/types';
import { createCatalogProduct, fetchCatalog, updateCatalogProduct } from '@/lib/os/api';
import toast from 'react-hot-toast';
import { OsToaster } from '@/components/ui/OsToaster';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadProducts = useCallback(async (showToast = false) => {
        setLoading(true);
        try {
            const { products: data } = await fetchCatalog();

            const mapped = (data || []).map((p) => ({
                ...p,
                slug: p.name.toLowerCase().replace(/\s+/g, '-'),
                image_url: '',
                price: 0,
            })).filter((p: Product) => {
                if (categoryFilter && p.category !== categoryFilter) return false;
                if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
                return true;
            });

            setProducts(mapped as Product[]);
            if (showToast) toast.success('Catalogue synchronisé');
        } catch (err: unknown) {
            console.error('[Products] Error:', err);
            const message = err instanceof Error ? err.message : 'Erreur chargement catalogue';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, search]);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct?.name || !editingProduct?.category) {
            toast.error('Nom et catégorie requis');
            return;
        }

        setIsSaving(true);
        const payload = {
            id: editingProduct.id,
            name: editingProduct.name,
            category: editingProduct.category || 'mixte',
            tier: editingProduct.tier || 'classic',
            is_active: editingProduct.is_active ?? true,
            stock: editingProduct.stock || 0,
            low_stock_threshold: editingProduct.low_stock_threshold || 5,
        };

        try {
            if (editingProduct.id) {
                await updateCatalogProduct({
                    id: payload.id!,
                    name: payload.name || '',
                    category: payload.category,
                    tier: payload.tier,
                    is_active: payload.is_active,
                    stock: payload.stock,
                    low_stock_threshold: payload.low_stock_threshold,
                });
                toast.success('Parfum mis à jour');
            } else {
                await createCatalogProduct({
                    name: payload.name || '',
                    category: payload.category,
                    tier: payload.tier,
                    is_active: payload.is_active,
                    stock: payload.stock,
                    low_stock_threshold: payload.low_stock_threshold,
                });
                toast.success('Parfum créé');
            }
            setIsFormOpen(false);
            setEditingProduct(null);
            loadProducts();
        } catch (err) {
            console.error('[Products] Save error:', err);
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleArchive = async (product: Product) => {
        try {
            await updateCatalogProduct({
                id: product.id,
                name: product.name,
                category: product.category,
                tier: product.tier,
                is_active: !product.is_active,
                stock: product.stock || 0,
                low_stock_threshold: product.low_stock_threshold || 5,
            });
            toast.success(product.is_active ? 'Parfum archivé' : 'Parfum réactivé');
            loadProducts();
        } catch (err) {
            console.error('[Products] Archive error:', err);
            toast.error('Erreur modification statut');
        }
    };

    const categories = Array.from(new Set(products.map(p => p.category)));

    return (
        <div className="os-page">
            <OsToaster />

            {/* Header */}
            <PageHeader
                title="Catalogue Produits"
                subtitle={`${products.length} références actives dans votre boutique`}
                actions={
                    <>
                        <button className="btn btn-ghost" onClick={() => loadProducts(true)} style={{ height: 42 }}>
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => { setEditingProduct({ tier: 'classic', is_active: true }); setIsFormOpen(true); }}
                            style={{ height: 42, padding: '0 20px', fontWeight: 900, borderRadius: 12 }}
                        >
                            <Plus size={18} /> AJOUTER UN PRODUIT
                        </button>
                    </>
                }
            />

            {/* Disciplined Filters */}
            <div className="luxury-card" style={{ marginBottom: 40, padding: 24, background: 'var(--surface-1)' }}>
                <div className="filters-bar" style={{ gap: 16, margin: 0, display: 'flex' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <input
                            className="filter-input"
                            style={{
                                paddingLeft: 48,
                                width: '100%',
                                height: 48,
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border)',
                                borderRadius: 14,
                                fontSize: 14,
                                fontWeight: 700,
                                color: 'var(--text)',
                                transition: 'all 0.3s ease'
                            }}
                            placeholder="Filtrer par nom de parfum, collection ou slug..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="filter-select"
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        style={{
                            height: 48,
                            minWidth: 220,
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: 14,
                            padding: '0 20px',
                            fontWeight: 900,
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}
                    >
                        <option value="">TOUTES LES COLLECTIONS</option>
                        {categories.map(c => <option key={c} value={c}>{String(c).toUpperCase()}</option>)}
                    </select>
                </div>
            </div>

            {/* Premium Product Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24, paddingBottom: 60 }}>
                {products.length === 0 ? (
                    <div style={{ gridColumn: '1/-1' }}>
                        <EmptyState
                            title="Catalogue vide"
                            copy="Aucune référence active. Commencez par enrichir votre collection pour activer la boutique."
                        />
                    </div>
                ) : products.map(product => (
                    <div
                        key={product.id}
                        className="luxury-card"
                        style={{
                            padding: 28,
                            opacity: product.is_active ? 1 : 0.5,
                            transition: 'all 0.3s ease',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            position: 'relative'
                        }}
                    >
                        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 28 }}>
                            <div style={{
                                width: 92, height: 92, borderRadius: 20, background: 'var(--bg-elevated)',
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: 10, fontWeight: 950, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, display: 'block' }}>
                                        {product.category}
                                    </span>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            onClick={() => { setEditingProduct(product); setIsFormOpen(true); }}
                                            style={{ width: 34, height: 34, padding: 0, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={() => toggleArchive(product)}
                                            style={{ width: 34, height: 34, padding: 0, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', cursor: 'pointer', color: product.is_active ? 'var(--text-dim)' : 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Archive size={14} />
                                        </button>
                                    </div>
                                </div>
                                <h4 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8, color: 'var(--text)', letterSpacing: '-0.02em' }}>{product.name}</h4>
                                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em' }}>
                                    {(product.price || 0).toLocaleString()} <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>MAD</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                            <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 14, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>STOCK DISPONIBLE</div>
                                <div style={{ fontSize: 16, fontWeight: 900, color: (product.stock || 0) <= (product.low_stock_threshold || 5) ? '#EF4444' : 'var(--text)' }}>
                                    {product.stock || 0} <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.6 }}>UNITS</span>
                                </div>
                            </div>
                            <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 14, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>EXCLUSIVITÉ</div>
                                <div style={{ fontSize: 12, fontWeight: 950, textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.05em' }}>{product.tier}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Product Form Drawer - Luxury Refinement */}
            {isFormOpen && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000 }} onClick={() => setIsFormOpen(false)} />
                    <div style={{
                        position: 'fixed', top: 0, right: 0, height: '100vh', width: '100%', maxWidth: 580,
                        background: 'var(--surface)', zIndex: 1001, boxShadow: 'var(--shadow-2xl)',
                        display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        borderLeft: '1px solid var(--border)'
                    }}>
                        <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-1)' }}>
                            <div>
                                <h3 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{editingProduct?.id ? 'Édition Référence' : 'Nouvelle Référence'}</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 700, margin: '6px 0 0 0' }}>Configuration des flux et paramètres catalogue</p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} style={{ padding: 10, borderRadius: '50%', border: 'none', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-dim)' }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} style={{ flex: 1, overflowY: 'auto', padding: '48px 40px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

                                {/* Image Section */}
                                <div style={{ background: 'var(--bg-elevated)', padding: 32, borderRadius: 28, border: '1px solid var(--border)', textAlign: 'center' }}>
                                    <div style={{
                                        width: 140, height: 140, borderRadius: 28, background: 'var(--surface)', margin: '0 auto 24px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                        border: '1.5px dashed var(--border)', boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        {editingProduct?.image_url ? (
                                            <img src={editingProduct.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <ImageIcon size={48} style={{ color: 'var(--gold)', opacity: 0.15 }} />
                                        )}
                                    </div>
                                    <input
                                        className="filter-input" placeholder="Lien vers l'actif visuel..."
                                        value={editingProduct?.image_url || ''}
                                        onChange={e => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                                        style={{ height: 48, background: 'var(--surface)', width: '100%', textAlign: 'center', fontSize: 13, fontWeight: 700, borderRadius: 14 }}
                                    />
                                </div>

                                {/* Core Identity */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 950, marginBottom: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Appellation du Parfum</label>
                                        <input
                                            className="filter-input" required
                                            value={editingProduct?.name || ''}
                                            onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                            style={{ height: 52, background: 'var(--surface-1)', width: '100%', border: '1px solid var(--border)', borderRadius: 14, fontWeight: 900, padding: '0 20px', fontSize: 16 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 950, marginBottom: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Collection</label>
                                        <input
                                            className="filter-input" required
                                            value={editingProduct?.category || ''}
                                            onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                            style={{ height: 52, background: 'var(--surface-1)', width: '100%', border: '1px solid var(--border)', borderRadius: 14, fontWeight: 800, padding: '0 20px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 950, marginBottom: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Identifiant URL</label>
                                        <input
                                            className="filter-input" readOnly
                                            value={editingProduct?.slug || ''}
                                            style={{ height: 52, background: 'var(--bg-elevated)', width: '100%', border: '1px solid var(--border)', borderRadius: 14, fontWeight: 700, padding: '0 20px', opacity: 0.6, fontSize: 13 }}
                                        />
                                    </div>
                                </div>

                                {/* Financials & Inventory */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 32, background: 'var(--surface-1)', borderRadius: 28, border: '1px solid var(--border)' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 950, marginBottom: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Valeur Marchande (MAD)</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: 'var(--gold)', fontSize: 14 }}>$</div>
                                            <input
                                                type="number" className="filter-input" required
                                                value={editingProduct?.price || ''}
                                                onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                                                style={{ height: 52, background: 'var(--surface)', width: '100%', border: '1px solid var(--border)', borderRadius: 14, fontWeight: 900, paddingLeft: 36, fontSize: 16 }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 950, marginBottom: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Gamme Produit</label>
                                        <select
                                            className="filter-select"
                                            value={editingProduct?.tier || 'classic'}
                                            onChange={e => setEditingProduct({ ...editingProduct, tier: e.target.value })}
                                            style={{ height: 52, background: 'var(--surface)', width: '100%', border: '1px solid var(--border)', borderRadius: 14, fontWeight: 800, padding: '0 20px' }}
                                        >
                                            <option value="classic">Gamme Standard (Classic)</option>
                                            <option value="niche">Gamme Prestige (Niche)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 950, marginBottom: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Stock de Sécurité</label>
                                        <input
                                            type="number" className="filter-input" required
                                            value={editingProduct?.stock || 0}
                                            onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                                            style={{ height: 52, background: 'var(--surface)', width: '100%', border: '1px solid var(--border)', borderRadius: 14, fontWeight: 900, padding: '0 20px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 950, marginBottom: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Seuil d&apos;Alerte</label>
                                        <input
                                            type="number" className="filter-input" required
                                            value={editingProduct?.low_stock_threshold || 5}
                                            onChange={e => setEditingProduct({ ...editingProduct, low_stock_threshold: Number(e.target.value) })}
                                            style={{ height: 52, background: 'var(--surface)', width: '100%', border: '1px solid var(--border)', borderRadius: 14, fontWeight: 900, padding: '0 20px' }}
                                        />
                                    </div>
                                </div>

                            </div>
                        </form>

                        <div style={{ padding: '32px 40px', borderTop: '1px solid var(--border)', background: 'var(--surface-1)', display: 'flex', gap: 16 }}>
                            <button
                                type="button" className="btn btn-ghost" onClick={() => setIsFormOpen(false)}
                                style={{ flex: 1, height: 58, borderRadius: 16, fontWeight: 900, fontSize: 15 }}
                            >
                                ANNULER
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="btn btn-primary"
                                style={{ flex: 1.5, height: 58, borderRadius: 16, fontWeight: 950, fontSize: 15, letterSpacing: '0.05em' }}
                            >
                                {isSaving ? 'SYNCHRONISATION...' : (editingProduct?.id ? 'METTRE À JOUR' : 'CRÉER LA RÉFÉRENCE')}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
