'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MessageCircle, RefreshCw, Download, CheckCircle } from 'lucide-react';
import { StatusBadge } from '@/components/os/StatusBadge';
import type { Order, OrderStatus } from '@/lib/types';
import { STATUS_LABELS, STATUS_LIST } from '@/lib/types';
import { fetchOrders, updateOrderStatus, bulkUpdateOrderStatus } from '@/lib/os/api';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { OrderDetailDrawer } from '@/components/os/OrderDetailDrawer';
import { OsToaster } from '@/components/ui/OsToaster';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, LoadingState } from '@/components/ui/States';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [packFilter, setPackFilter] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    const loadOrders = useCallback(async (showToast = false) => {
        if (!showToast) setLoading(true);

        try {
            const { orders: fetchedOrders } = await fetchOrders({
                status: statusFilter,
                source: sourceFilter,
                pack: packFilter,
                search,
                limit: 500,
            });
            setOrders(fetchedOrders);

            setSelectedOrder(prev => {
                if (!prev) return prev;
                const refreshed = fetchedOrders.find((order) => order.id === prev.id);
                return refreshed || prev;
            });

            if (showToast) toast.success('Données actualisées');
        } catch (err: unknown) {
            console.error('[Orders] Full catch error:', err);
            const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, sourceFilter, packFilter, search]);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const exportToExcel = () => {
        const dataToExport = orders.map(o => ({
            'Date': new Date(o.created_at).toLocaleString('fr-MA'),
            'Client': o.customer_name,
            'Téléphone': o.phone,
            'Ville': o.city,
            'Pack': o.pack_type,
            'Parfums': [
                ...(o.selected_perfumes || []),
                ...(o.gift_perfume ? [o.gift_perfume + ' (Cadeau)'] : [])
            ].join(', '),
            'Prix (MAD)': o.price_mad || o.total_price,
            'Source': o.source,
            'Statut': STATUS_LABELS[o.status] || o.status,
            'Adresse': o.address || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Commandes');
        XLSX.writeFile(wb, `elie_orders_v2_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Export Excel terminé');
    };

    const updateStatus = async (id: string, status: OrderStatus) => {
        setUpdatingId(id);
        try {
            await updateOrderStatus(id, status);

            toast.success(`Statut mis à jour: ${STATUS_LABELS[status] || status}`);

            // Refresh robustly
            await loadOrders();
        } catch (err: unknown) {
            console.error('[Orders] Update error:', err);
            const message = err instanceof Error ? err.message : 'Erreur de mise à jour';
            toast.error(message);
            loadOrders(); // Refresh to get valid state
        } finally {
            setUpdatingId(null);
        }
    };

    const openOrderDetails = useCallback((order: Order) => {
        // Prevent opening if drawer is already transitioning
        if (isDrawerOpen && selectedOrder?.id === order.id) return;

        setSelectedOrder(order);
        setIsDrawerOpen(true);
    }, [isDrawerOpen, selectedOrder]);

    const closeDrawer = useCallback(() => {
        setIsDrawerOpen(false);
        // We keep selectedOrder for the exit animation, 
        // but it will be cleared or overwritten on next open.
    }, []);

    const bulkUpdateStatus = async (status: string) => {
        if (selectedIds.length === 0) return;
        setIsBulkUpdating(true);

        try {
            const { updatedCount } = await bulkUpdateOrderStatus(selectedIds, status as OrderStatus);
            const count = updatedCount || 0;

            toast.success(`${count} commandes mises à jour: ${STATUS_LABELS[status as OrderStatus]}`);
            if (count < selectedIds.length) {
                toast.error(`${selectedIds.length - count} échecs (transitions invalides)`);
            }
            setSelectedIds([]);
            loadOrders();
        } catch (err: unknown) {
            console.error('[Orders] Bulk error:', err);
            const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour groupée';
            toast.error(message);
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === orders.length && orders.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(orders.map(o => o.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="os-page">
            <OsToaster />

            <PageHeader
                title="Commandes ELIE"
                subtitle={`${orders.length} flux opérationnel${orders.length !== 1 ? 's' : ''} actif${orders.length !== 1 ? 's' : ''}`}
                actions={
                    <>
                        <button className="btn btn-ghost" onClick={() => loadOrders(true)} style={{ height: 42 }}>
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button className="btn btn-ghost" onClick={exportToExcel} disabled={orders.length === 0} style={{ height: 42 }}>
                            <Download size={16} /> Exporter
                        </button>
                    </>
                }
            />

            {/* Refined Filters */}
            <div style={{ marginBottom: 40, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
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
                        placeholder="Rechercher par nom, téléphone, ville..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ height: 48, minWidth: 180, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 14, padding: '0 20px', fontWeight: 900, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                        <option value="">Tous les statuts</option>
                        {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                    <select
                        className="filter-select"
                        value={sourceFilter}
                        onChange={e => setSourceFilter(e.target.value)}
                        style={{ height: 48, minWidth: 180, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 14, padding: '0 20px', fontWeight: 900, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                        <option value="">Toute source</option>
                        <option value="landing_page">Landing Page</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="direct">Direct</option>
                        <option value="meta_ads">Meta Ads</option>
                    </select>
                </div>
            </div>

            {/* Disciplined Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="luxury-card" style={{
                    marginBottom: 32,
                    padding: '20px 32px',
                    background: 'var(--surface-3)',
                    border: '1px solid var(--gold-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 20,
                    zIndex: 100,
                    boxShadow: 'var(--shadow-lg)',
                    backdropFilter: 'blur(20px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: 15 }}>
                                {selectedIds.length}
                            </div>
                            <span style={{ fontWeight: 900, color: 'var(--text)', fontSize: 13, letterSpacing: '0.05em' }}>COMMANDES SÉLECTIONNÉES</span>
                        </div>
                        <button onClick={() => setSelectedIds([])} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 11, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Désélectionner tout</button>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            className="btn btn-primary btn-sm"
                            disabled={isBulkUpdating}
                            onClick={() => bulkUpdateStatus('confirmed')}
                            style={{ height: 42, padding: '0 24px' }}
                        >
                            CONFIRMER LA SÉLECTION
                        </button>
                        <button
                            className="btn btn-ghost btn-sm"
                            disabled={isBulkUpdating}
                            onClick={() => bulkUpdateStatus('shipped')}
                            style={{ height: 42, padding: '0 24px', border: '1px solid var(--border)' }}
                        >
                            MARQUER COMME EXPÉDIÉ
                        </button>
                    </div>
                </div>
            )}

            {loading && orders.length === 0 ? (
                <LoadingState label="Synchronisation du cockpit..." />
            ) : orders.length === 0 ? (
                <EmptyState
                    title="Aucune commande"
                    copy="Les commandes apparaîtront ici dès la prochaine acquisition landing page ou canal direct."
                />
            ) : (
                <div style={{ background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ width: 64, padding: '24px 0 24px 32px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === orders.length && orders.length > 0}
                                        onChange={toggleSelectAll}
                                        style={{ cursor: 'pointer', width: 18, height: 18, borderRadius: 6, border: '2px solid var(--border)', accentColor: 'var(--gold)' }}
                                    />
                                </th>
                                <th style={{ textAlign: 'left', padding: '24px 16px', fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Identité Client</th>
                                <th style={{ textAlign: 'left', padding: '24px 16px', fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Localisation</th>
                                <th style={{ textAlign: 'left', padding: '24px 16px', fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Fiche Produit</th>
                                <th style={{ textAlign: 'left', padding: '24px 16px', fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Acquisition</th>
                                <th style={{ textAlign: 'left', padding: '24px 16px', fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>État Logistique</th>
                                <th style={{ textAlign: 'right', padding: '24px 32px 24px 0', fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Pilotage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const products = order.selected_perfumes || [];
                                const perfumes = order.gift_perfume ? [...products, order.gift_perfume] : products;
                                const perfumeSummary = perfumes.slice(0, 2).join(', ');
                                const extraCount = perfumes.length - 2;

                                return (
                                    <tr key={order.id}
                                        onClick={() => openOrderDetails(order)}
                                        className="table-row-hover"
                                        style={{
                                            cursor: 'pointer',
                                            opacity: updatingId === order.id ? 0.6 : 1,
                                            background: selectedIds.includes(order.id) ? 'var(--gold-glow)' : 'transparent',
                                            borderBottom: '1px solid var(--border)',
                                            transition: 'all 0.2s ease'
                                        }}>
                                        <td style={{ padding: '20px 0 20px 32px' }} onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(order.id)}
                                                onChange={() => toggleSelect(order.id)}
                                                style={{ cursor: 'pointer', width: 18, height: 18, borderRadius: 6, accentColor: 'var(--gold)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '20px 16px' }}>
                                            <div style={{ fontWeight: 900, color: 'var(--text)', fontSize: 14 }}>{order.customer_name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, fontWeight: 700 }}>{order.phone}</div>
                                        </td>
                                        <td style={{ padding: '20px 16px' }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)' }}>{order.city}</div>
                                        </td>
                                        <td style={{ padding: '20px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span className="surface-pill" style={{ fontSize: 9, background: 'var(--surface-2)', color: 'var(--gold)', borderColor: 'var(--gold-border)', padding: '2px 8px' }}>
                                                    {order.pack_type.toUpperCase()}
                                                </span>
                                                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>
                                                    {perfumeSummary}{extraCount > 0 ? ` +${extraCount}` : ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 16px' }}>
                                            <div style={{
                                                fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                color: order.source === 'whatsapp' ? 'var(--success)' : 'var(--text-dim)',
                                                display: 'flex', alignItems: 'center', gap: 6
                                            }}>
                                                {order.source === 'whatsapp' ? <MessageCircle size={10} /> : <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />}
                                                {order.source}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 16px' }}>
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td style={{ padding: '20px 32px 20px 0', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => updateStatus(order.id, 'confirmed')}
                                                    className="btn-ghost"
                                                    style={{ width: 40, height: 40, padding: 0, borderRadius: 12, background: 'var(--surface-1)', border: '1px solid var(--border)' }}
                                                    title="Confirmer"
                                                >
                                                    <CheckCircle size={16} color={order.status === 'confirmed' ? 'var(--success)' : 'var(--text-dim)'} />
                                                </button>
                                                <a
                                                    href={`https://wa.me/212${(order.phone || '').replace(/^0/, '')}`}
                                                    target="_blank"
                                                    style={{ width: 40, height: 40, padding: 0, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--success-soft)', border: '1px solid var(--success)', color: 'var(--success)' }}
                                                >
                                                    <MessageCircle size={16} />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <OrderDetailDrawer
                order={selectedOrder}
                isOpen={isDrawerOpen}
                onClose={closeDrawer}
                onUpdateStatus={updateStatus}
            />
        </div>
    );
}
