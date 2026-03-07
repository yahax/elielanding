'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Phone as PhoneIcon, MessageCircle, RefreshCw, Download, Filter, CheckCircle, X, MapPin, Package, Clock, ShoppingBag, ExternalLink, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import type { Order, OrderStatus } from '@/lib/types';
import { STATUS_LABELS, STATUS_LIST } from '@/lib/types';
import { createClient } from '@/lib/supabase';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';
import { OrderDetailDrawer } from '@/components/dashboard/OrderDetailDrawer';

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
        if (!showToast && loading) setLoading(true);

        try {
            const supabase = createClient();

            console.log('[Orders] Executing query: .from("orders").select("*").order("created_at", { ascending: false }).limit(500)');

            let query = supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(500);

            if (statusFilter) {
                console.log(`[Orders] Applying status filter: ${statusFilter}`);
                query = query.eq('status', statusFilter);
            }
            if (sourceFilter) {
                console.log(`[Orders] Applying source filter: ${sourceFilter}`);
                query = query.eq('source', sourceFilter);
            }
            if (packFilter) {
                console.log(`[Orders] Applying pack filter: ${packFilter}`);
                query = query.eq('pack_type', packFilter);
            }

            if (search.trim()) {
                console.log(`[Orders] Applying search: ${search}`);
                query = query.or(`customer_name.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[Orders] Supabase return error:', error);
                throw error;
            }

            console.log(`[Orders] Received ${data?.length || 0} orders`);
            const fetchedOrders = (data || []) as Order[];
            setOrders(fetchedOrders);

            // Sync selected order if open
            if (selectedOrder) {
                const refreshed = fetchedOrders.find(o => o.id === selectedOrder.id);
                if (refreshed) setSelectedOrder(refreshed);
            }

            if (showToast) toast.success('Données actualisées');
        } catch (err: any) {
            console.error('[Orders] Full catch error:', err);
            toast.error(err.message || 'Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, sourceFilter, packFilter, search, selectedOrder, loading]);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    // Live Sync V2.2
    useRealtimeOrders(() => loadOrders(false));

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
            const supabase = createClient();
            const { error } = await supabase.rpc('update_order_status_secure', {
                p_order_id: id,
                p_new_status: status
            });

            if (error) throw error;

            toast.success(`Statut mis à jour: ${STATUS_LABELS[status] || status}`);

            // Refresh robustly
            await loadOrders();
        } catch (err: any) {
            console.error('[Orders] Update error:', err);
            toast.error(err.message || 'Erreur de mise à jour');
            loadOrders(); // Refresh to get valid state
        } finally {
            setUpdatingId(null);
        }
    };

    const openOrderDetails = useCallback((order: Order) => {
        // Prevent opening if drawer is already transitioning
        if (isDrawerOpen && selectedOrder?.id === order.id) return;

        console.log(`[Orders] Opening details for ${order.id}`);
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
        const supabase = createClient();

        try {
            const { data: count, error } = await supabase.rpc('bulk_update_order_status', {
                p_order_ids: selectedIds,
                p_new_status: status
            });

            if (error) throw error;

            toast.success(`${count} commandes mises à jour: ${STATUS_LABELS[status as OrderStatus]}`);
            if (count < selectedIds.length) {
                toast.error(`${selectedIds.length - count} échecs (transitions invalides)`);
            }
            setSelectedIds([]);
            loadOrders();
        } catch (err) {
            console.error('[Orders] Bulk error:', err);
            toast.error('Erreur lors de la mise à jour groupée');
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
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <Toaster position="top-right" />

            <div className="page-header" style={{ marginBottom: 24 }}>
                <div>
                    <h2 className="page-title">Commandes ELIE V2</h2>
                    <p className="page-subtitle">{orders.length} flux opérationnel{orders.length !== 1 ? 's' : ''} actif{orders.length !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" onClick={() => loadOrders(true)} style={{ height: 42 }}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="btn btn-ghost" onClick={exportToExcel} disabled={orders.length === 0} style={{ height: 42 }}>
                        <Download size={16} /> Exporter
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 20, padding: 16 }}>
                <div className="filters-bar" style={{ gap: 12, margin: 0 }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            className="filter-input"
                            style={{ paddingLeft: 42, width: '100%', height: 42, background: 'var(--surface-2)', border: 'none' }}
                            placeholder="Chercher par nom, téléphone, ville..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: 42, background: 'var(--surface-2)', border: 'none' }}>
                        <option value="">Tous les statuts</option>
                        {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                    <select className="filter-select" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ height: 42, background: 'var(--surface-2)', border: 'none' }}>
                        <option value="">Toute source</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="direct">Direct</option>
                        <option value="meta_ads">Meta Ads</option>
                        <option value="organic">Organique</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div style={{
                    marginBottom: 20,
                    padding: '12px 24px',
                    background: 'var(--text)',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 16,
                    position: 'sticky',
                    top: 20,
                    zIndex: 100,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontWeight: 800 }}>{selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}</span>
                        <button onClick={() => setSelectedIds([])} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: 12, cursor: 'pointer', opacity: 0.7 }}>Désélectionner</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            className="btn"
                            disabled={isBulkUpdating}
                            onClick={() => bulkUpdateStatus('confirmed')}
                            style={{ background: 'var(--gold)', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12, height: 36, padding: '0 16px', borderRadius: 10 }}
                        >
                            CONFIRMER
                        </button>
                        <button
                            className="btn"
                            disabled={isBulkUpdating}
                            onClick={() => bulkUpdateStatus('shipped')}
                            style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 800, fontSize: 12, height: 36, padding: '0 16px', borderRadius: 10 }}
                        >
                            EXPÉDIER
                        </button>
                        <button
                            className="btn"
                            disabled={isBulkUpdating}
                            onClick={() => bulkUpdateStatus('canceled')}
                            style={{ background: 'none', color: '#EF4444', border: '1px solid #EF4444', fontWeight: 800, fontSize: 12, height: 36, padding: '0 16px', borderRadius: 10 }}
                        >
                            ANNULER
                        </button>
                    </div>
                </div>
            )}

            {loading && orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Chargement du cockpit…</div>
            ) : orders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Aucune commande</div>
                </div>
            ) : (
                <div className="table-wrap" style={{ border: 'none', boxShadow: 'var(--shadow)' }}>
                    <table className="data-table">
                        <thead>
                            <tr style={{ background: 'var(--surface-2)' }}>
                                <th style={{ width: 50, paddingLeft: 24 }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === orders.length && orders.length > 0}
                                        onChange={toggleSelectAll}
                                        style={{ cursor: 'pointer', width: 18, height: 18, borderRadius: 4 }}
                                    />
                                </th>
                                <th>Client</th>
                                <th>Localisation</th>
                                <th>Pack</th>
                                <th>Sélection Parfums</th>
                                <th>Source</th>
                                <th>Statut</th>
                                <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const products = order.selected_perfumes || [];
                                const perfumes = order.gift_perfume ? [...products, order.gift_perfume] : products;
                                const perfumeSummary = perfumes.slice(0, 3).join(', ');
                                const extraCount = perfumes.length - 3;

                                return (
                                    <tr key={order.id} onClick={() => openOrderDetails(order)} style={{ cursor: 'pointer', opacity: updatingId === order.id ? 0.6 : 1, background: selectedIds.includes(order.id) ? 'rgba(198, 163, 78, 0.05)' : '' }}>
                                        <td style={{ paddingLeft: 24 }} onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(order.id)}
                                                onChange={() => toggleSelect(order.id)}
                                                style={{ cursor: 'pointer', width: 18, height: 18, borderRadius: 4 }}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 800 }}>{order.customer_name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.phone}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{order.city}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: 10, background: 'var(--gold-glow)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 6, fontWeight: 800, textTransform: 'uppercase' }}>
                                                {order.pack_type}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 220 }}>
                                                {perfumeSummary}{extraCount > 0 ? ` +${extraCount}` : ''}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{
                                                fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                                                color: order.source === 'whatsapp' ? '#16A34A' : 'var(--text-muted)',
                                                display: 'flex', alignItems: 'center', gap: 4
                                            }}>
                                                {order.source === 'whatsapp' && <MessageCircle size={10} />}
                                                {order.source}
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td style={{ paddingRight: 24, textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => updateStatus(order.id, 'confirmed')}
                                                    disabled={order.status === 'confirmed' || updatingId === order.id}
                                                    className="btn-ghost"
                                                    style={{ width: 34, height: 34, padding: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}
                                                >
                                                    <CheckCircle size={14} style={{ color: order.status === 'confirmed' ? 'var(--success)' : 'inherit' }} />
                                                </button>
                                                <a href={`https://wa.me/212${(order.phone || '').replace(/^0/, '')}`} target="_blank" className="btn-success" style={{ width: 34, height: 34, padding: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#16A34A', color: '#FFF', border: 'none' }}>
                                                    <MessageCircle size={14} />
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
