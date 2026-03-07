'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MessageCircle, RefreshCw, Download, CheckCircle, XCircle, Phone, Copy, MoreHorizontal, Eye, Clock, Calendar, Filter } from 'lucide-react';
import { StatusBadge } from '@/components/os/StatusBadge';
import { Order, OrderStatus, STATUS_LABELS, STATUS_LIST } from '@/lib/types';
import { fetchOrders, updateOrderStatus, bulkUpdateOrderStatus } from '@/lib/os/api';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { OrderDetailDrawer } from '@/components/os/OrderDetailDrawer';
import { OsToaster } from '@/components/ui/OsToaster';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, LoadingState } from '@/components/ui/States';
import Link from 'next/link';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [packFilter, setPackFilter] = useState('');
    const [daysFilter, setDaysFilter] = useState<number>(30);

    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
                days: daysFilter || 30,
                limit: 500,
            });
            setOrders(fetchedOrders);
            if (showToast) toast.success('Flux synchronisé');
        } catch (err: unknown) {
            toast.error('Erreur de synchronisation');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, sourceFilter, packFilter, search, daysFilter]);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copié`);
    };

    const updateStatus = async (id: string, status: OrderStatus) => {
        setUpdatingId(id);
        try {
            await updateOrderStatus(id, status);
            toast.success(`Statut: ${STATUS_LABELS[status]}`);
            loadOrders();
        } catch (err: unknown) {
            toast.error('Échec de la mise à jour');
        } finally {
            setUpdatingId(null);
        }
    };

    const openOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDrawerOpen(true);
    };

    return (
        <div className="os-page" style={{ paddingBottom: 100 }}>
            <OsToaster />
            <PageHeader
                title="Gestion des Commandes"
                subtitle="Acquisition et traitement du flux commercial Maison ELIE"
                actions={
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-ghost" onClick={() => loadOrders(true)} style={{ width: 44, height: 44, padding: 0, borderRadius: 14 }}>
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button className="btn btn-primary" onClick={() => { }} style={{ padding: '0 24px', height: 44, borderRadius: 14 }}>
                            Nouvelle Commande
                        </button>
                    </div>
                }
            />

            {/* Operational Filters */}
            <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                        <input
                            className="filter-input"
                            style={{ paddingLeft: 48, width: '100%', height: 52, borderRadius: 16 }}
                            placeholder="Recherche instantanée (Nom, Tel, Ville)..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="filter-select"
                        value={daysFilter}
                        onChange={e => setDaysFilter(Number(e.target.value))}
                        style={{ width: 180, height: 52, borderRadius: 16 }}
                    >
                        <option value={1}>Aujourd'hui</option>
                        <option value={7}>7 derniers jours</option>
                        <option value={30}>30 derniers jours</option>
                        <option value={90}>3 derniers mois</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                    <div style={{ display: 'flex', gap: 4, padding: '4px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setStatusFilter('')}
                            className={`btn-xs ${statusFilter === '' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ borderRadius: 10, padding: '8px 20px', fontWeight: 800 }}
                        >
                            Tous
                        </button>
                        {STATUS_LIST.map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`btn-xs ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ borderRadius: 10, padding: '8px 20px', fontWeight: 800 }}
                            >
                                {STATUS_LABELS[s]}
                            </button>
                        ))}
                    </div>

                    <select
                        className="filter-select"
                        value={sourceFilter}
                        onChange={e => setSourceFilter(e.target.value)}
                        style={{ height: 48, minWidth: 180, borderRadius: 14 }}
                    >
                        <option value="">Toutes les sources</option>
                        <option value="landing_page">Landing Page</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="meta_ads">Meta Ads</option>
                    </select>
                </div>
            </div>

            {loading && orders.length === 0 ? (
                <LoadingState label="Chargement du flux..." />
            ) : orders.length === 0 ? (
                <EmptyState title="Aucune commande" copy="Ajustez vos filtres ou lancez une nouvelle recherche." />
            ) : (
                <div className="luxury-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ textAlign: 'left', padding: '18px 24px', fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date & Client</th>
                                <th style={{ textAlign: 'left', padding: '18px', fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ville</th>
                                <th style={{ textAlign: 'left', padding: '18px', fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pack & Parfums</th>
                                <th style={{ textAlign: 'left', padding: '18px', fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Source</th>
                                <th style={{ textAlign: 'left', padding: '18px', fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Statut</th>
                                <th style={{ textAlign: 'right', padding: '18px 24px', fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actions Rapides</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} style={{ borderBottom: '1px solid var(--border)', opacity: updatingId === order.id ? 0.5 : 1 }}>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{order.customer_name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{order.phone}</span>
                                                <button onClick={() => copyToClipboard(order.phone || '', 'Téléphone')} style={{ color: 'var(--gold)', border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                <Calendar size={12} /> {new Date(order.created_at).toLocaleDateString('fr-MA')} — {new Date(order.created_at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 18px' }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>{order.city}</span>
                                    </td>
                                    <td style={{ padding: '20px 18px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <span className="badge" style={{ width: 'fit-content', fontSize: 10, background: 'var(--gold-glow)', color: 'var(--gold)', border: '1px solid var(--gold-border)', padding: '2px 8px' }}>
                                                PACK {order.pack_type.toUpperCase()}
                                            </span>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                                                {order.selected_perfumes?.join(' + ')}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 18px' }}>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)' }} />
                                            {order.source.toUpperCase()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 18px' }}>
                                        <StatusBadge status={order.status} />
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => updateStatus(order.id, 'confirmed')}
                                                className="btn-ghost"
                                                style={{ width: 40, height: 40, padding: 0, borderRadius: 12, color: 'var(--success)', background: 'var(--success-soft)', border: '1px solid transparent' }}
                                                title="Confirmer"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => updateStatus(order.id, 'callback')}
                                                className="btn-ghost"
                                                style={{ width: 40, height: 40, padding: 0, borderRadius: 12, color: 'var(--info)', background: 'var(--info-soft)', border: '1px solid transparent' }}
                                                title="À rappeler"
                                            >
                                                <Phone size={18} />
                                            </button>
                                            <button
                                                onClick={() => updateStatus(order.id, 'canceled')}
                                                className="btn-ghost"
                                                style={{ width: 40, height: 40, padding: 0, borderRadius: 12, color: 'var(--danger)', background: 'var(--danger-soft)', border: '1px solid transparent' }}
                                                title="Annuler"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                            <a
                                                href={`https://wa.me/212${(order.phone || '').replace(/^0/, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-ghost"
                                                style={{ width: 40, height: 40, padding: 0, borderRadius: 12, color: '#25D366', background: 'rgba(37, 211, 102, 0.08)', border: '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="WhatsApp"
                                            >
                                                <MessageCircle size={18} />
                                            </a>
                                            <button
                                                onClick={() => openOrderDetails(order)}
                                                className="btn-ghost"
                                                style={{ width: 40, height: 40, padding: 0, borderRadius: 12, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                                                title="Détails"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <OrderDetailDrawer
                order={selectedOrder}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onUpdateStatus={updateStatus}
            />
        </div>
    );
}
