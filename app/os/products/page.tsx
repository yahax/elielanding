'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, Edit3,
    Archive, Image as ImageIcon, X,
    Package, RefreshCw
} from 'lucide-react';
import type { Product } from '@/lib/types';
import { createCatalogProduct, fetchCatalog, updateCatalogProduct } from '@/lib/os/api';
import toast from 'react-hot-toast';
import { OsToaster } from '@/components/ui/OsToaster';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, LoadingState } from '@/components/ui/States';

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
            const filtered = (data || []).filter((p: Product) => {
                if (categoryFilter && p.category !== categoryFilter) return false;
                if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
                return true;
            });
            setProducts(filtered);
            if (showToast) toast.success('Catalogue synchronisé');
        } catch (err: unknown) {
            toast.error('Erreur de synchronisation');
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, search]);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct?.name || !editingProduct?.category) {
            toast.error('Données manquantes');
            return;
        }

        setIsSaving(true);
        try {
            if (editingProduct.id) {
                await updateCatalogProduct(editingProduct as Product);
                toast.success('Référence mise à jour');
            } else {
                await createCatalogProduct({
                    ...editingProduct,
                    is_active: true,
                    slug: editingProduct.name.toLowerCase().replace(/ /g, '-')
                } as Product);
                toast.success('Référence créée');
            }
            setIsFormOpen(false);
            setEditingProduct(null);
            loadProducts();
        } catch (err) {
            toast.error('Échec de l\'opération');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (product: Product) => {
        try {
            await updateCatalogProduct({ ...product, is_active: !product.is_active });
            toast.success(product.is_active ? 'Produit masqué' : 'Produit activé');
            loadProducts();
        } catch (err) {
            toast.error('Erreur de modification');
        }
    };

    const categories = Array.from(new Set(products.map(p => p.category)));

    return (
        <div className="os-page animate-fade-in" style={{ paddingBottom: 100 }}>
            <OsToaster />
            <PageHeader
                title="Management du Catalogue"
                subtitle="Gestion stratégique des fragrances, collections et tarifications ELIE"
                actions={
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-ghost" onClick={() => loadProducts(true)} style={{ width: 44, height: 44, padding: 0, borderRadius: 14, background: 'var(--surface)' }}>
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button className="btn btn-primary" onClick={() => { setEditingProduct({ is_active: true, tier: 'classic', stock: 0, low_stock_threshold: 5 }); setIsFormOpen(true); }} style={{ padding: '0 24px', height: 44, borderRadius: 14, fontWeight: 900, fontSize: 13, letterSpacing: '0.05em' }}>
                            <Plus size={18} style={{ marginRight: 8 }} /> AJOUTER RÉFÉRENCE
                        </button>
                    </div>
                }
            />

            <div style={{ marginBottom: 32, display: 'flex', gap: 16 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                        className="filter-input"
                        placeholder="Rechercher une fragrance ou référence..."
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
                <LoadingState label="Acquisition du catalogue..." />
            ) : products.length === 0 ? (
                <EmptyState title="Catalogue vide" copy="Ajoutez votre première référence pour commencer à vendre." />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 28 }}>
                    {products.map(product => (
                        <div key={product.id} className="luxury-card animate-scale-in" style={{ padding: 28, opacity: product.is_active ? 1 : 0.6, position: 'relative' }}>
                            <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                                <div style={{ width: 84, height: 84, borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {product.image_url ? (
                                        <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : <Package size={28} style={{ color: 'var(--gold)', opacity: 0.2 }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{product.category}</span>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => { setEditingProduct(product); setIsFormOpen(true); }} className="btn-ghost" style={{ width: 32, height: 32, padding: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={16} /></button>
                                            <button onClick={() => toggleStatus(product)} className="btn-ghost" style={{ width: 32, height: 32, padding: 0, borderRadius: 10, color: product.is_active ? 'var(--text-dim)' : 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Archive size={16} /></button>
                                        </div>
                                    </div>
                                    <h4 style={{ fontSize: 18, fontWeight: 800, margin: '6px 0', color: 'var(--text)', fontFamily: 'serif' }}>{product.name}</h4>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--gold)' }}>{product.price} <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700 }}>MAD</span></div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                                <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Stock Physique</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: (product.stock || 0) <= (product.low_stock_threshold || 5) ? 'var(--danger)' : 'var(--text)' }}>
                                        {product.stock || 0} <span style={{ fontSize: 10, opacity: 0.6, fontWeight: 700 }}>UNITÉS</span>
                                    </div>
                                </div>
                                <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Segmentation</div>
                                    <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{product.tier}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isFormOpen && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(247, 243, 238, 0.8)', backdropFilter: 'blur(12px)', zIndex: 1000 }} onClick={() => setIsFormOpen(false)} />
                    <div className="drawer" style={{
                        position: 'fixed', top: 0, right: 0, height: '100vh', width: '100%', maxWidth: 520,
                        background: 'var(--bg)', zIndex: 1001, boxShadow: 'var(--shadow-2xl)', borderLeft: '1px solid var(--border)',
                        display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{ padding: '40px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
                            <div>
                                <h3 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text)', fontFamily: 'serif' }}>Référence Produit</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '6px 0 0 0', fontWeight: 600 }}>Configuration stratégique du catalogue</p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="btn-ghost" style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: 40 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>DÉSIGNATION COMMERCIALE</label>
                                    <input className="filter-input" value={editingProduct?.name || ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} style={{ height: 56, fontSize: 16, fontWeight: 700 }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>COLLECTION</label>
                                        <input className="filter-input" value={editingProduct?.category || ''} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} style={{ height: 52, fontWeight: 700 }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>PRIX DE VENTE (MAD)</label>
                                        <input type="number" className="filter-input" value={editingProduct?.price || ''} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} style={{ height: 52, fontWeight: 800 }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>STOCK INITIAL</label>
                                        <input type="number" className="filter-input" value={editingProduct?.stock || 0} onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })} style={{ height: 52, fontWeight: 800 }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>SEUIL D'ALERTE</label>
                                        <input type="number" className="filter-input" value={editingProduct?.low_stock_threshold || 5} onChange={e => setEditingProduct({ ...editingProduct, low_stock_threshold: Number(e.target.value) })} style={{ height: 52, fontWeight: 800 }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>POSITIONNEMENT GAMME</label>
                                    <select className="filter-select" value={editingProduct?.tier || 'classic'} onChange={e => setEditingProduct({ ...editingProduct, tier: e.target.value as any })} style={{ height: 52, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: '0 20px', fontWeight: 800 }}>
                                        <option value="classic">Standard (Collection Classic)</option>
                                        <option value="niche">Prestige (Collection Niche)</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>ACTIF VISUEL (URL)</label>
                                    <input className="filter-input" placeholder="https://..." value={editingProduct?.image_url || ''} onChange={e => setEditingProduct({ ...editingProduct, image_url: e.target.value })} style={{ height: 52, fontWeight: 600 }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: 32, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, background: 'var(--surface)' }}>
                            <button onClick={() => setIsFormOpen(false)} className="btn-ghost" style={{ flex: 1, height: 56, borderRadius: 16, fontWeight: 900 }}>ANNULER</button>
                            <button onClick={handleSave} disabled={isSaving} className="btn btn-primary" style={{ flex: 2, height: 56, borderRadius: 16, fontWeight: 900, letterSpacing: '0.05em' }}>
                                {isSaving ? 'TRAITEMENT...' : editingProduct?.id ? 'METTRE À JOUR' : 'CRÉER LA RÉFÉRENCE'}
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
