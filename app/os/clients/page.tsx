'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock, MessageCircle, X, Users, TrendingUp, Calendar } from 'lucide-react';
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
            const customerMap: Record<string, Customer & { orders: Order[] }> = {};

            (orders || []).forEach((order: Order) => {
                const phone = order.phone || 'inconnu';
                if (!customerMap[phone]) {
                    customerMap[phone] = {
                        id: order.id,
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
            toast.error('Erreur CRM (Sync orders)');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { loadCustomers(); }, [loadCustomers]);

    const openCustomerDetails = (customer: Customer & { orders?: Order[] }) => {
        setSelectedCustomer(customer);
        setIsDrawerOpen(true);
    };

    const formatDate = (d: string | null) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const totalRevenue = customers.reduce((acc, c) => acc + c.total_spent, 0);
    const avgLtv = customers.length > 0 ? Math.round(totalRevenue / customers.length) : 0;

    return (
        <div className="os-page animate-fade-in" style={{ paddingBottom: 100 }}>
            <OsToaster />
            <PageHeader
                title="Management CRM"
                subtitle="Intelligence client et historique stratégique des engagements Maison ELIE"
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 40 }}>
                <div className="luxury-card" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gold-glow)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--gold-border)' }}>
                            <Users size={20} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-dim)' }}>Base Clients Finale</span>
                    </div>
                    <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>{customers.length} <span style={{ fontSize: 16, opacity: 0.5, fontWeight: 700 }}>profils</span></div>
                    <Users style={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, color: 'var(--gold)', opacity: 0.03 }} />
                </div>

                <div className="luxury-card" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gold-glow)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--gold-border)' }}>
                            <TrendingUp size={20} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-dim)' }}>Valeur Vie (LTV) Moyenne</span>
                    </div>
                    <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>{avgLtv} <span style={{ fontSize: 16, opacity: 0.5, fontWeight: 700 }}>MAD</span></div>
                    <TrendingUp style={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, color: 'var(--gold)', opacity: 0.03 }} />
                </div>
            </div>

            <div style={{ marginBottom: 32 }}>
                <div style={{ position: 'relative', maxWidth: 650 }}>
                    <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                        className="filter-input"
                        placeholder="Rechercher par identité, téléphone ou ville de résidence..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 48, width: '100%', height: 56, borderRadius: 16, fontSize: 15 }}
                    />
                </div>
            </div>

            {loading && customers.length === 0 ? (
                <LoadingState label="Synchronisation des flux CRM..." />
            ) : customers.length === 0 ? (
                <EmptyState title="Intelligence CRM vide" copy="Les profils sont générés automatiquement par l'analyse algorithmique des flux de commandes." />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 28 }}>
                    {customers.map(customer => (
                        <div
                            key={customer.phone}
                            className="luxury-card animate-scale-in"
                            onClick={() => openCustomerDetails(customer)}
                            style={{
                                padding: 28,
                                background: 'var(--surface)',
                                cursor: 'pointer',
                                border: '1px solid var(--border)',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: 18, background: 'var(--bg-elevated)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                                    fontWeight: 900, color: 'var(--gold)', border: '1px solid var(--border)'
                                }}>
                                    {customer.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text)', fontFamily: 'serif' }}>{customer.name}</h4>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)', marginTop: 2 }}>{customer.phone}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text)', fontWeight: 700 }}>
                                    <MapPin size={16} style={{ color: 'var(--gold)' }} /> {customer.city || 'Ville non spécifiée'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-dim)', fontWeight: 700 }}>
                                    <Calendar size={16} /> Dernier engagement: {formatDate(customer.last_order_at)}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Volume</div>
                                    <div style={{ fontSize: 18, fontWeight: 900 }}>{customer.total_orders} <span style={{ fontSize: 10, opacity: 0.6, fontWeight: 700 }}>FLUX</span></div>
                                </div>
                                <div style={{ padding: '12px', background: 'var(--gold-glow)', borderRadius: 14, border: '1px solid var(--gold-border)' }}>
                                    <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Valeur (LTV)</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)' }}>{customer.total_spent} <span style={{ fontSize: 10, opacity: 0.6, color: 'var(--text-dim)' }}>MAD</span></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isDrawerOpen && selectedCustomer && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(247, 243, 238, 0.8)', backdropFilter: 'blur(12px)', zIndex: 1000 }} onClick={() => setIsDrawerOpen(false)} />
                    <div className="drawer" style={{
                        position: 'fixed', top: 0, right: 0, height: '100vh', width: '100%', maxWidth: 520,
                        background: 'var(--bg)', zIndex: 1001, boxShadow: 'var(--shadow-2xl)', borderLeft: '1px solid var(--border)',
                        display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{ padding: '40px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
                            <div>
                                <h3 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text)', fontFamily: 'serif' }}>Profil Exécutif Client</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '6px 0 0 0', fontWeight: 600 }}>Curation des segments de conversion haute fidélité</p>
                            </div>
                            <button onClick={() => setIsDrawerOpen(false)} className="btn-ghost" style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: 40 }}>
                            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                                <div style={{ width: 96, height: 96, borderRadius: 28, background: 'var(--surface)', color: 'var(--gold)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900, border: '1px solid var(--border)' }}>
                                    {selectedCustomer.name.charAt(0)}
                                </div>
                                <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--text)', fontFamily: 'serif' }}>{selectedCustomer.name}</h2>
                                <p style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 18, marginTop: 4 }}>{selectedCustomer.phone}</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 48 }}>
                                <div style={{ background: 'var(--bg-elevated)', padding: 24, borderRadius: 22, border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>VALEUR À VIE (LTV)</div>
                                    <div style={{ fontSize: 28, fontWeight: 900 }}>{selectedCustomer.total_spent} <span style={{ fontSize: 14, opacity: 0.5, fontWeight: 700 }}>MAD</span></div>
                                </div>
                                <div style={{ background: 'var(--bg-elevated)', padding: 24, borderRadius: 22, border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>ENGAGEMENTS</div>
                                    <div style={{ fontSize: 28, fontWeight: 900 }}>{selectedCustomer.total_orders} <span style={{ fontSize: 14, opacity: 0.5, fontWeight: 700 }}>FLUX</span></div>
                                </div>
                            </div>

                            <h4 style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: 24, textAlign: 'center' }}>CHRONOLOGIE DES FLUX</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {selectedCustomer.orders?.map(order => (
                                    <div key={order.id} style={{ padding: 24, borderRadius: 22, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <span style={{ fontWeight: 900, fontSize: 15, color: 'var(--text)' }}>ORD-#{order.id.slice(-6).toUpperCase()}</span>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-dim)' }}>{formatDate(order.created_at)}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                            {(Array.isArray(order.selected_perfumes) ? order.selected_perfumes : []).map((p, idx) => (
                                                <span key={idx} style={{ fontSize: 11, fontWeight: 800, padding: '6px 14px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{p}</span>
                                            ))}
                                            {order.gift_perfume && <span style={{ fontSize: 11, fontWeight: 800, padding: '6px 14px', background: 'var(--gold-glow)', color: 'var(--gold)', borderRadius: 10, border: '1px solid var(--gold-border)' }}>🎁 GIFT: {order.gift_perfume}</span>}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
                                            <span style={{ fontSize: 11, fontWeight: 900, background: 'var(--gold-glow)', color: 'var(--gold)', padding: '4px 12px', borderRadius: 8, textTransform: 'uppercase' }}>{order.status}</span>
                                            <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)' }}>{order.price_mad || order.total_price} <span style={{ fontSize: 12, opacity: 0.5 }}>MAD</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: 32, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                            <a
                                href={`https://wa.me/212${selectedCustomer.phone.replace(/^0/, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-primary"
                                style={{ width: '100%', height: 60, borderRadius: 18, fontWeight: 900, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, textDecoration: 'none', letterSpacing: '0.05em' }}
                            >
                                <MessageCircle size={22} /> OUVRIR CANAL WHATSAPP
                            </a>
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
