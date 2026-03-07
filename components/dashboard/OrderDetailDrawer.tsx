'use client';

import React, { useMemo, useEffect } from 'react';
import {
    X, MapPin, Phone, MessageCircle, Clock,
    Package, ShoppingBag, CreditCard, ChevronRight,
    Calendar, User, Home, Map, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderStatus, STATUS_LABELS, STATUS_LIST } from '@/lib/types';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { normalizeOrderPerfumes } from '@/lib/order-utils';

interface OrderDetailDrawerProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (id: string, status: OrderStatus) => Promise<void>;
}

export function OrderDetailDrawer({ order, isOpen, onClose, onUpdateStatus }: OrderDetailDrawerProps) {
    // 1. Robust Data Normalization
    const normalizedPerfumes = useMemo(() => {
        if (!order) return [];
        const result = normalizeOrderPerfumes(order);
        console.log(`[OrderDetail] ID: ${order.id}`);
        console.log(`[OrderDetail] Raw Payload:`, order);
        console.log(`[OrderDetail] Normalized Perfumes:`, result);
        return result;
    }, [order]);

    // 2. Sync visual state
    useEffect(() => {
        if (isOpen && order) {
            console.log(`[OrderDetail] Drawer opened for order ${order.id}`);
        }
    }, [isOpen, order]);

    if (!order) return null;

    const handleWhatsApp = () => {
        if (!order.phone) return;
        const phone = order.phone.replace(/^0/, '');
        window.open(`https://wa.me/212${phone}`, '_blank');
    };

    const handlePhone = () => {
        if (!order.phone) return;
        window.location.href = `tel:${order.phone}`;
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0" style={{ zIndex: 1000 }}>
                    {/* Overlay - Simplified to avoid flicker */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 300,
                            mass: 0.8
                        }}
                        className="absolute top-0 right-0 h-full bg-white shadow-2xl overflow-hidden flex flex-col"
                        style={{
                            width: '100%',
                            maxWidth: 480,
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '24px',
                            borderBottom: '1px solid #F0F0F2',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#FFF',
                            flexShrink: 0
                        }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    COMMANDE #{order.id.slice(-6).toUpperCase()}
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 900, margin: '4px 0 0 0', color: 'var(--text)' }}>Détails de l'expédition</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
                            {/* Status Section */}
                            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <StatusBadge status={order.status} />
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                                    Passée le {new Date(order.created_at).toLocaleDateString('fr-MA', {
                                        day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            </div>

                            {/* Customer Card */}
                            <div style={{ marginBottom: 32 }}>
                                <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
                                    COORDONNÉES CLIENT
                                </div>
                                <div style={{
                                    background: '#F9FAFB',
                                    padding: 24,
                                    borderRadius: 24,
                                    border: '1px solid #F0F0F2'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                        <div style={{
                                            width: 54, height: 54, borderRadius: 16,
                                            background: 'var(--gold-glow)', color: 'var(--gold)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 22, fontWeight: 900
                                        }}>
                                            {order.customer_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)' }}>{order.customer_name}</div>
                                            <div style={{ fontSize: 14, color: 'var(--gold)', fontWeight: 700 }}>{order.phone}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600 }}>
                                            <MapPin size={18} style={{ color: 'var(--gold)' }} />
                                            <span>{order.city}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                            <Home size={18} style={{ marginTop: 2, flexShrink: 0 }} />
                                            <span>{order.address || 'Pas d\'adresse spécifiée'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-6">
                                        <button onClick={handlePhone} className="btn-secondary h-12 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm border border-gray-200 bg-white hover:bg-gray-50 transition-all">
                                            <Phone size={14} /> APPELER
                                        </button>
                                        <button onClick={handleWhatsApp} className="btn-whatsapp h-12 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm bg-green-600 text-white hover:bg-green-700 transition-all">
                                            <MessageCircle size={14} /> WHATSAPP
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Order Selection */}
                            <div style={{ marginBottom: 32 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        SÉLECTION PARFUMS ({normalizedPerfumes.length} UNITÉS)
                                    </div>
                                    <span style={{
                                        fontSize: 10, background: 'var(--gold-glow)', color: 'var(--gold)',
                                        padding: '4px 10px', borderRadius: 8, fontWeight: 900, textTransform: 'uppercase'
                                    }}>
                                        Pack {order.pack_type}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {normalizedPerfumes.length > 0 ? (
                                        normalizedPerfumes.map((pName, idx) => {
                                            const isGift = (idx === 5) || (idx === normalizedPerfumes.length - 1 && order.gift_perfume === pName);
                                            return (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '14px 18px',
                                                        background: isGift ? 'linear-gradient(90deg, #FDFCF8 0%, #FFF 100%)' : '#FFF',
                                                        borderRadius: 16,
                                                        border: isGift ? '1px solid var(--gold)' : '1px solid #F0F0F2',
                                                        boxShadow: isGift ? '0 4px 12px rgba(198, 163, 78, 0.08)' : 'none'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                        <div style={{
                                                            width: 24, height: 24, borderRadius: 6,
                                                            background: isGift ? 'var(--gold)' : '#F0F0F2',
                                                            color: isGift ? '#FFF' : 'var(--text-muted)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: 11, fontWeight: 900
                                                        }}>
                                                            {idx + 1}
                                                        </div>
                                                        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
                                                            {pName}
                                                        </span>
                                                    </div>
                                                    {isGift && (
                                                        <div style={{
                                                            fontSize: 10, fontWeight: 900, background: 'var(--gold)',
                                                            color: '#FFF', padding: '3px 8px', borderRadius: 8,
                                                            display: 'flex', alignItems: 'center', gap: 4
                                                        }}>
                                                            CADEAU 🎁
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13, background: '#F9FAFB', borderRadius: 16, border: '1px dashed #F0F0F2' }}>
                                            Aucun parfum trouvé pour cette commande.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Totals & Meta */}
                            <div style={{
                                background: 'var(--text)',
                                color: '#FFF',
                                padding: 24,
                                borderRadius: 24,
                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <div>
                                        <div style={{ opacity: 0.6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>PRIX TOTAL</div>
                                        <div style={{ fontSize: 32, fontWeight: 900 }}>{order.price_mad || order.total_price} <span style={{ fontSize: 16, opacity: 0.7 }}>MAD</span></div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ opacity: 0.6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>CANAL DE VENTE</div>
                                        <div style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: 8 }}>
                                            {order.source}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.8 }}>
                                        <Calendar size={14} /> {new Date(order.created_at).toLocaleDateString()}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.8 }}>
                                        <ShoppingBag size={14} /> {normalizedPerfumes.length} Parfums
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div style={{
                            padding: '24px',
                            background: '#F9FAFB',
                            borderTop: '1px solid #F0F0F2',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            flexShrink: 0
                        }}>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => onUpdateStatus(order.id, 'confirmed')}
                                    disabled={order.status === 'confirmed'}
                                    className="h-14 rounded-2xl bg-[#C6A34E] text-white font-black text-sm shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    CONFIRMER
                                </button>
                                <button
                                    onClick={() => onUpdateStatus(order.id, 'canceled')}
                                    disabled={order.status === 'canceled'}
                                    className="h-14 rounded-2xl border-2 border-red-500 text-red-500 font-black text-sm hover:bg-red-50 transition-all disabled:opacity-50"
                                >
                                    ANNULER
                                </button>
                            </div>

                            <select
                                className="h-12 w-full rounded-xl border-2 border-gray-100 bg-white font-bold text-sm px-4 text-center cursor-pointer outline-none focus:border-gold transition-colors"
                                value={order.status}
                                onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                            >
                                {STATUS_LIST.map(s => (
                                    <option key={s} value={s}>{STATUS_LABELS[s]} (Changer statut)</option>
                                ))}
                            </select>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
