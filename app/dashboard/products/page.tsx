'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, Filter, MoreVertical, Edit3,
    Archive, Image as ImageIcon, Check, X,
    Package, Tag, DollarSign, Layers,
    Save, Trash2, ArrowLeft, ExternalLink, RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import toast, { Toaster } from 'react-hot-toast';

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
            const supabase = createClient();

            console.log('[Products] Executing query: .from("perfumes").select("*").order("name", { ascending: true })');

            const { data, error } = await supabase
                .from('perfumes')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.error('[Products] Supabase return error:', error);
                throw error;
            }

            const mapped = (data || []).map((p: any) => ({
                ...p,
                category: p.gender || 'unisex'
            })).filter((p: any) => {
                if (categoryFilter && p.category !== categoryFilter) return false;
                if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
                return true;
            });

            console.log(`[Products] Synchronized ${mapped.length} references`);
            setProducts(mapped as Product[]);
            if (showToast) toast.success('Catalogue synchronisé');
        } catch (err: any) {
            console.error('[Products] Error:', err);
            toast.error(err.message || 'Erreur chargement catalogue');
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
        const supabase = createClient();

        const payload = {
            name: editingProduct.name,
            gender: editingProduct.category,
            tier: editingProduct.tier || 'classic',
            is_active: editingProduct.is_active ?? true
        };

        try {
            if (editingProduct.id) {
                const { error } = await supabase
                    .from('perfumes')
                    .update(payload)
                    .eq('id', editingProduct.id);
                if (error) throw error;
                toast.success('Parfum mis à jour');
            } else {
                const { error } = await supabase
                    .from('perfumes')
                    .insert([payload]);
                if (error) throw error;
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
        const supabase = createClient();
        try {
            const { error } = await supabase
                .from('perfumes')
                .update({ is_active: !product.is_active })
                .eq('id', product.id);

            if (error) throw error;
            toast.success(product.is_active ? 'Parfum archivé' : 'Parfum réactivé');
            loadProducts();
        } catch (err) {
            console.error('[Products] Archive error:', err);
            toast.error('Erreur modification statut');
        }
    };

    const categories = Array.from(new Set(products.map(p => p.category)));

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <Toaster position="top-right" />

            {/* Header */}
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 className="page-title">Catalogue Produits</h2>
                    <p className="page-subtitle">{products.length} références actives dans votre boutique</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-ghost" onClick={() => loadProducts(true)} style={{ height: 42 }}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        className="btn"
                        onClick={() => { setEditingProduct({ tier: 'classic', is_active: true }); setIsFormOpen(true); }}
                        style={{ height: 42, background: 'var(--text)', color: '#FFF', border: 'none', padding: '0 20px', fontWeight: 800, borderRadius: 12 }}
                    >
                        <Plus size={18} /> AJOUTER UN PRODUIT
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 32, padding: 16 }}>
                <div className="filters-bar" style={{ gap: 12, margin: 0, display: 'flex' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            className="filter-input"
                            style={{ paddingLeft: 42, width: '100%', height: 44, background: 'var(--surface-2)', border: 'none', borderRadius: 12 }}
                            placeholder="Rechercher par nom, catégorie ou slug..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="filter-select"
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        style={{ height: 44, background: 'var(--surface-2)', border: 'none', borderRadius: 12, padding: '0 16px', fontWeight: 600 }}
                    >
                        <option value="">Toutes les catégories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Product Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                {products.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
                        <Package size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <div style={{ fontWeight: 800 }}>Aucun produit ne correspond à vos critères</div>
                    </div>
                ) : products.map(product => (
                    <div
                        key={product.id}
                        className="card group"
                        style={{
                            padding: 24,
                            opacity: product.is_active ? 1 : 0.6,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: '#FFF',
                            border: '1px solid var(--border)'
                        }}
                    >
                        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                            <div style={{
                                width: 88, height: 88, borderRadius: 20, background: 'var(--surface-2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                border: '1px solid var(--border)'
                            }}>
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <ImageIcon size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {product.category}
                                    </span>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button
                                            onClick={() => { setEditingProduct(product); setIsFormOpen(true); }}
                                            className="btn-ghost" style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }}
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={() => toggleArchive(product)}
                                            className="btn-ghost" style={{ width: 32, height: 32, padding: 0, borderRadius: 8, color: product.is_active ? 'var(--text-muted)' : 'var(--success)' }}
                                        >
                                            <Archive size={14} />
                                        </button>
                                    </div>
                                </div>
                                <h4 style={{ fontSize: 18, fontWeight: 900, margin: '4px 0', color: 'var(--text)' }}>{product.name}</h4>
                                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)' }}>{(product.price || 0).toLocaleString()} MAD</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 0', borderTop: '1px solid var(--border)' }}>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>STOCK ACTUEL</div>
                                <div style={{ fontSize: 16, fontWeight: 900, color: (product.stock || 0) <= (product.low_stock_threshold || 5) ? '#EF4444' : 'var(--text)' }}>{product.stock || 0} Unités</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>GAMME</div>
                                <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', background: 'var(--surface-2)', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>{product.tier}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Product Form Drawer */}
            {isFormOpen && (
                <>
                    <div className="modal-overlay" onClick={() => setIsFormOpen(false)} style={{ zIndex: 1000 }} />
                    <div style={{
                        position: 'fixed', top: 0, right: 0, height: '100vh', width: '100%', maxWidth: 540,
                        background: '#FFF', zIndex: 1001, boxShadow: '-10px 0 50px rgba(0,0,0,0.1)',
                        display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease-out'
                    }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>{editingProduct?.id ? 'Modifier Produit' : 'Nouveau Produit'}</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Configurez les détails et inventaire de votre référence</p>
                            </div>
                            <button className="btn-ghost" onClick={() => setIsFormOpen(false)} style={{ padding: 10, borderRadius: '50%' }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} style={{ flex: 1, overflowY: 'auto', padding: 40 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                                {/* Image Preview & URL */}
                                <div style={{ background: 'var(--surface-1)', padding: 24, borderRadius: 24, border: '1px solid var(--border)', textAlign: 'center' }}>
                                    <div style={{
                                        width: 120, height: 120, borderRadius: 24, background: '#FFF', margin: '0 auto 16px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                        border: '1.5px dashed var(--border)'
                                    }}>
                                        {editingProduct?.image_url ? (
                                            <img src={editingProduct.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <ImageIcon size={40} style={{ opacity: 0.2 }} />
                                        )}
                                    </div>
                                    <input
                                        className="filter-input" placeholder="Image URL (Optionnel)"
                                        value={editingProduct?.image_url || ''}
                                        onChange={e => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                                        style={{ height: 42, background: '#FFF', width: '100%', textAlign: 'center', fontSize: 13 }}
                                    />
                                </div>

                                {/* General Info */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--text-muted)' }}>NOM DU PRODUIT</label>
                                        <input
                                            className="filter-input" required
                                            value={editingProduct?.name || ''}
                                            onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                            style={{ height: 48, background: 'var(--surface-2)', width: '100%', border: 'none', borderRadius: 12, fontWeight: 700, padding: '0 20px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--text-muted)' }}>CATÉGORIE</label>
                                        <input
                                            className="filter-input" required
                                            value={editingProduct?.category || ''}
                                            onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                            style={{ height: 48, background: 'var(--surface-2)', width: '100%', border: 'none', borderRadius: 12, fontWeight: 700, padding: '0 20px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--text-muted)' }}>SLUG (Auto)</label>
                                        <input
                                            className="filter-input" readOnly
                                            value={editingProduct?.slug || ''}
                                            style={{ height: 48, background: 'var(--surface-1)', width: '100%', border: 'none', borderRadius: 12, fontWeight: 600, padding: '0 20px', opacity: 0.7 }}
                                        />
                                    </div>
                                </div>

                                {/* Pricing & Stock */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: 24, background: '#F9FAFB', borderRadius: 24 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--text-muted)' }}>PRIX (MAD)</label>
                                        <div style={{ position: 'relative' }}>
                                            <DollarSign size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                            <input
                                                type="number" className="filter-input" required
                                                value={editingProduct?.price || ''}
                                                onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                                                style={{ height: 48, background: '#FFF', width: '100%', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, paddingLeft: 36 }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--text-muted)' }}>GAMME</label>
                                        <select
                                            className="filter-select"
                                            value={editingProduct?.tier || 'classic'}
                                            onChange={e => setEditingProduct({ ...editingProduct, tier: e.target.value as any })}
                                            style={{ height: 48, background: '#FFF', width: '100%', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 700 }}
                                        >
                                            <option value="classic">Classic</option>
                                            <option value="niche">Niche / Luxury</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--text-muted)' }}>STOCK INITIAL</label>
                                        <input
                                            type="number" className="filter-input" required
                                            value={editingProduct?.stock || 0}
                                            onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                                            style={{ height: 48, background: '#FFF', width: '100%', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, padding: '0 20px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--text-muted)' }}>SEUIL ALERTE</label>
                                        <input
                                            type="number" className="filter-input" required
                                            value={editingProduct?.low_stock_threshold || 5}
                                            onChange={e => setEditingProduct({ ...editingProduct, low_stock_threshold: Number(e.target.value) })}
                                            style={{ height: 48, background: '#FFF', width: '100%', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, padding: '0 20px' }}
                                        />
                                    </div>
                                </div>

                            </div>
                        </form>

                        <div style={{ padding: 32, borderTop: '1px solid var(--border)', background: '#F9FAFB', display: 'flex', gap: 12 }}>
                            <button
                                type="button" className="btn btn-ghost" onClick={() => setIsFormOpen(false)}
                                style={{ flex: 1, height: 52, borderRadius: 16, fontWeight: 800 }}
                            >
                                ANNULER
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="btn"
                                style={{ flex: 2, height: 52, background: 'var(--text)', color: '#FFF', border: 'none', borderRadius: 16, fontWeight: 900, fontSize: 15 }}
                            >
                                {isSaving ? 'ENREGISTREMENT...' : 'SAUVEGARDER'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.06);
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
