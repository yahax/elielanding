'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock, MessageCircle, X } from 'lucide-react';
import type { Customer, Order } from '@/lib/types';
import { fetchOrders } from '@/lib/os/api';
import toast from 'react-hot-toast';
import { OsToaster } from '@/components/ui/OsToaster';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, LoadingState } from '@/components/ui/States';

export default function ClientsPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<(Customer & { orders?: Order[] }) | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const loadCustomers = useCallback(async () => {
        setLoading(true);

        try {
            const { orders } = await fetchOrders({ limit: 1000 });

            // Group by phone
            const customerMap: Record<string, Customer & { orders: Order[] }> = {};

            (orders || []).forEach((order: Order) => {
                const phone = order.phone || 'inconnu';
                if (!customerMap[phone]) {
                    customerMap[phone] = {
                        id: order.id, // Proxy ID
                        name: order.customer_name || 'Anonyme',
                        phone: phone,
                        city: order.city,
                        address: order.address,
                        last_order_at: order.created_at,
                        total_orders: 0,
                        total_spent: 0,
                        orders: []
                    };
                }

                const c = customerMap[phone];
                c.total_orders += 1;
                c.total_spent += (order.price_mad || order.total_price || 0);
                c.orders.push(order);

                // Update last order if this one is newer
                if (new Date(order.created_at) > new Date(c.last_order_at || 0)) {
                    c.last_order_at = order.created_at;
                    c.name = order.customer_name || c.name;
                    c.city = order.city || c.city;
                    c.address = order.address || c.address;
                }
            });

            const clientList = Object.values(customerMap).sort((a, b) =>
                new Date(b.last_order_at || 0).getTime() - new Date(a.last_order_at || 0).getTime()
            );

            // Filter by search
            const filtered = clientList.filter(c => {
                if (!search.trim()) return true;
                const s = search.toLowerCase();
                return (
                    c.name.toLowerCase().includes(s) ||
                    c.phone.includes(s) ||
                    (c.city || '').toLowerCase().includes(s)
                );
            });

            setCustomers(filtered);
        } catch (err: unknown) {
            console.error('[CRM] CRM Load Error:', err);
            const message = err instanceof Error ? err.message : 'Erreur CRM (Sync orders)';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { loadCustomers(); }, [loadCustomers]);

    const openCustomerDetails = async (customer: Customer & { orders?: Order[] }) => {
        setSelectedCustomer(customer);
        setIsDrawerOpen(true);
    };

    const formatDate = (d: string | null) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="os-page" style={{ maxWidth: 1240 }}>
            <OsToaster />
            <PageHeader
                title="Gestion CRM"
                subtitle={`${customers.length} clients dans votre base opérationnelle`}
            />

            {/* Disciplined Search */}
            <div style={{ marginBottom: 40 }}>
                <div style={{ position: 'relative', maxWidth: 640 }}>
                    <Search size={18} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                        className="filter-input"
                        style={{
                            width: '100%',
                            paddingLeft: 56,
                            background: 'var(--surface-1)',
                            height: 52,
                            border: '1px solid var(--border)',
                            borderRadius: 14,
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--text)',
                            transition: 'all 0.3s ease'
                        }}
                        placeholder="Rechercher une identité client ou localisation..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <LoadingState label="Synchronisation du CRM..." />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24, paddingBottom: 60 }}>
                    {customers.length === 0 ? (
                        <div style={{ gridColumn: '1/-1' }}>
                            <EmptyState
                                title="Base client vide"
                                copy="Les profils clients sont générés automatiquement par l'analyse des flux de commandes."
                            />
                        </div>
                    ) : customers.map(customer => (
                        <div
                            key={customer.id}
                            className="luxury-card"
                            onClick={() => openCustomerDetails(customer)}
                            style={{
                                padding: 32,
                                background: 'var(--surface)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28 }}>
                                <div style={{
                                    width: 68,
                                    height: 68,
                                    borderRadius: 20,
                                    background: 'var(--bg-elevated)',
                                    color: 'var(--gold)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 24,
                                    fontWeight: 900,
                                    border: '1px solid var(--border)',
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    {customer.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.02em' }}>{customer.name}</h4>
                                    <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 800, letterSpacing: '0.02em' }}>{customer.phone}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>
                                    <MapPin size={16} style={{ color: 'var(--gold)', opacity: 0.6 }} /> {customer.city || 'Localisation non définie'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-dim)', fontWeight: 700 }}>
                                    <Clock size={16} /> <span style={{ opacity: 0.6 }}>DERNIER FLUX :</span> <span style={{ color: 'var(--text-muted)', fontWeight: 900 }}>{formatDate(customer.last_order_at)}</span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                                <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 16, border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 9, fontWeight: 950, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.12em' }}>VOLUME</div>
                                    <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)' }}>{customer.total_orders} <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>ORD</span></div>
                                </div>
                                <div style={{ background: 'var(--gold-glow)', padding: '16px', borderRadius: 16, border: '1px solid var(--gold-border)' }}>
                                    <div style={{ fontSize: 9, fontWeight: 950, color: 'var(--gold)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.12em' }}>VALEUR LTV</div>
                                    <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)' }}>{customer.total_spent} <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>MAD</span></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CRM Detail Drawer - Luxury Refinement */}
            {isDrawerOpen && selectedCustomer && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, transition: 'all 0.4s' }}
                        onClick={() => setIsDrawerOpen(false)}
                    />
                    <div style={{
                        position: 'fixed', top: 0, right: 0, height: '100vh', width: '100%', maxWidth: 580,
                        background: 'var(--surface)', zIndex: 1001, boxShadow: 'var(--shadow-2xl)',
                        display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        borderLeft: '1px solid var(--border)'
                    }}>
                        <div style={{ padding: '32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
                                <h3 style={{ fontSize: 14, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>Profil Exécutif Client</h3>
                            </div>
                            <button onClick={() => setIsDrawerOpen(false)} style={{ padding: 10, borderRadius: '50%', border: 'none', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-dim)' }}><X size={20} /></button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '48px 40px' }}>
                            {/* Executive Header */}
                            <div style={{ textAlign: 'center', marginBottom: 56 }}>
                                <div style={{
                                    width: 100, height: 100, borderRadius: 32, background: 'var(--bg-elevated)',
                                    color: 'var(--gold)', margin: '0 auto 24px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: 42, fontWeight: 900, border: '1px solid var(--border)',
                                    boxShadow: 'var(--shadow-lg)'
                                }}>
                                    {selectedCustomer.name.charAt(0)}
                                </div>
                                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.03em' }}>{selectedCustomer.name}</h2>
                                <p style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 16, letterSpacing: '0.02em' }}>{selectedCustomer.phone}</p>
                            </div>

                            {/* Key Performance Indicators */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 56 }}>
                                <div style={{ background: 'var(--surface-1)', padding: '24px', borderRadius: 24, border: '1px solid var(--border)' }}>
                                    <div style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 950, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>DÉPENSES CUMULÉES</div>
                                    <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)' }}>{selectedCustomer.total_spent} <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>MAD</span></div>
                                </div>
                                <div style={{ background: 'var(--surface-1)', padding: '24px', borderRadius: 24, border: '1px solid var(--border)' }}>
                                    <div style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 950, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>ENGAGEMENTS</div>
                                    <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)' }}>{selectedCustomer.total_orders} <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>UNITÉS</span></div>
                                </div>
                            </div>

                            {/* Lifecycle & Logistics */}
                            <div style={{ marginBottom: 56 }}>
                                <h4 style={{ fontSize: 12, fontWeight: 950, marginBottom: 24, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Loguer des Flux Logistiques</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {selectedCustomer.orders?.map(order => (
                                        <div key={order.id} style={{
                                            padding: '24px', borderRadius: 24, background: 'var(--bg-elevated)',
                                            border: '1px solid var(--border)', transition: 'all 0.2s'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                                <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--text)' }}>ORD-{order.id.slice(-6).toUpperCase()}</div>
                                                <div style={{ fontWeight: 900, fontSize: 11, color: 'var(--gold)', background: 'var(--gold-glow)', padding: '4px 10px', borderRadius: 8 }}>{formatDate(order.created_at)}</div>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {[
                                                    ...(Array.isArray(order.selected_perfumes) ? order.selected_perfumes : []),
                                                    ...(order.gift_perfume ? [order.gift_perfume] : []),
                                                ].map((perfume, perfumeIndex) => (
                                                    <span key={`${order.id}-${perfumeIndex}`} style={{
                                                        fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                                                        background: 'var(--surface-2)', padding: '6px 12px', borderRadius: 10,
                                                        border: '1px solid var(--border)'
                                                    }}>
                                                        {perfume}
                                                    </span>
                                                ))}
                                            </div>
                                            <div style={{ marginTop: 16, textAlign: 'right', fontWeight: 900, fontSize: 16, color: 'var(--text)' }}>
                                                {order.price_mad || order.total_price} <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>MAD</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '32px 40px', background: 'var(--surface-1)', borderTop: '1px solid var(--border)' }}>
                            <a
                                href={`https://wa.me/212${selectedCustomer.phone.replace(/^0/, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-primary"
                                style={{
                                    width: '100%', height: 58, borderRadius: 16, fontWeight: 950,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 12, textDecoration: 'none', fontSize: 15, letterSpacing: '0.05em'
                                }}
                            >
                                <MessageCircle size={20} /> OUVRIR CANAL WHATSAPP
                            </a>
                        </div>
                    </div>
                </>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}} />
        </div>
    );
}
