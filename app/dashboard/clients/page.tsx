'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Phone, ShoppingBag, Clock, TrendingUp, ExternalLink, Calendar, MessageCircle, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { Customer, Order } from '@/lib/types';
import toast, { Toaster } from 'react-hot-toast';

export default function ClientsPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<(Customer & { orders?: Order[] }) | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const loadCustomers = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            console.log('[CRM] Executing query: .from("orders").select("*").order("created_at", { ascending: false })');

            // Fetch all orders to build virtual CRM
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[CRM] Supabase return error:', error);
                throw error;
            }

            // Group by phone
            const customerMap: Record<string, Customer & { orders: Order[] }> = {};

            (orders || []).forEach((order: any) => {
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
                c.total_spent += (order.price_mad || order.price || 0);
                c.orders.push(order as Order);

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

            console.log(`[CRM] Processed ${filtered.length} customers`);
            setCustomers(filtered);
        } catch (err: any) {
            console.error('[CRM] CRM Load Error:', err);
            toast.error(err.message || 'Erreur CRM (Sync orders)');
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
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Toaster position="top-right" />
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h2 className="page-title">Gestion CRM V2</h2>
                    <p className="page-subtitle">{customers.length} clients dans votre base opérationnelle</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 24, padding: 16 }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="filter-input"
                        style={{ width: '100%', paddingLeft: 48, background: 'var(--surface-2)', height: 48, border: 'none', fontSize: 14 }}
                        placeholder="Rechercher un client (Nom, Tél, Ville)..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 100, color: 'var(--text-muted)' }}>Initialisation du CRM…</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customers.map(customer => (
                        <div
                            key={customer.id}
                            className="card group hover:shadow-xl transition-all cursor-pointer"
                            onClick={() => openCustomerDetails(customer)}
                            style={{ padding: 24, borderRadius: 24, border: '1px solid var(--border)', background: '#FFF' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--gold-glow)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900 }}>
                                    {customer.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--text)' }}>{customer.name}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{customer.phone}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                                    <MapPin size={16} /> {customer.city || '-'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                                    <Clock size={16} /> Dernier achat : {formatDate(customer.last_order_at)}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
                                <div style={{ flex: 1, background: 'var(--surface-2)', padding: '10px 12px', borderRadius: 12, textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 2 }}>COMMANDES</div>
                                    <div style={{ fontWeight: 900, fontSize: 15 }}>{customer.total_orders}</div>
                                </div>
                                <div style={{ flex: 1, background: 'var(--text)', color: '#FFF', padding: '10px 12px', borderRadius: 12, textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.6, marginBottom: 2 }}>VALEUR LTV</div>
                                    <div style={{ fontWeight: 900, fontSize: 15 }}>{customer.total_spent} <span style={{ fontSize: 10 }}>MAD</span></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CRM Detail Drawer */}
            {isDrawerOpen && selectedCustomer && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
                        onClick={() => setIsDrawerOpen(false)}
                    />
                    <div style={{
                        position: 'fixed', top: 0, right: 0, height: '100vh', width: '100%', maxWidth: 550,
                        background: '#FFF', zIndex: 1001, boxShadow: '-10px 0 50px rgba(0,0,0,0.1)',
                        display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s'
                    }}>
                        <div style={{ padding: 24, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: 18, fontWeight: 900 }}>Profil Client V2</h3>
                            <button onClick={() => setIsDrawerOpen(false)} style={{ padding: 8, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
                            {/* Header info */}
                            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                                <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--gold-glow)', color: 'var(--gold)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900 }}>
                                    {selectedCustomer.name.charAt(0)}
                                </div>
                                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{selectedCustomer.name}</h2>
                                <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{selectedCustomer.phone}</p>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
                                <div style={{ background: 'var(--surface-1)', padding: 20, borderRadius: 20, border: '1px solid var(--border)' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>TOTAL DÉPENSÉ</div>
                                    <div style={{ fontSize: 22, fontWeight: 900 }}>{selectedCustomer.total_spent} MAD</div>
                                </div>
                                <div style={{ background: 'var(--surface-1)', padding: 20, borderRadius: 20, border: '1px solid var(--border)' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>COMMANDES</div>
                                    <div style={{ fontSize: 22, fontWeight: 900 }}>{selectedCustomer.total_orders}</div>
                                </div>
                            </div>

                            {/* Order History */}
                            <div>
                                <h4 style={{ fontSize: 13, fontWeight: 900, marginBottom: 16, color: 'var(--text-muted)' }}>HISTORIQUE D'ACHATS</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {selectedCustomer.orders?.map(order => (
                                        <div key={order.id} style={{ border: '1px solid var(--border)', padding: 20, borderRadius: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <div style={{ fontWeight: 800, fontSize: 14 }}>{new Date(order.created_at).toLocaleDateString()}</div>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold)' }}>{order.total_price} MAD</span>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {order.items?.map(item => (
                                                    <span key={item.id} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: 8 }}>
                                                        {item.perfume_name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {!selectedCustomer.orders?.length && (
                                        <div style={{ textAlign: 'center', padding: 20, background: 'var(--surface-2)', borderRadius: 16, color: 'var(--text-muted)', fontSize: 13 }}>
                                            Aucune commande trouvée
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: 24, background: 'var(--surface-1)', borderTop: '1px solid var(--border)' }}>
                            <a
                                href={`https://wa.me/212${selectedCustomer.phone.replace(/^0/, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ width: '100%', height: 52, background: '#16A34A', color: '#FFF', borderRadius: 12, border: 'none', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, textDecoration: 'none', fontSize: 15 }}
                            >
                                <MessageCircle size={20} /> CONTACTER SUR WHATSAPP
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
