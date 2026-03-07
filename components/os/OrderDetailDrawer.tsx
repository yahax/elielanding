'use client';

import React, { useMemo } from 'react';
import {
    X, MapPin, Phone, MessageCircle,
    ShoppingBag, Calendar, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderStatus, STATUS_LABELS, STATUS_LIST } from '@/lib/types';
import { StatusBadge } from '@/components/os/StatusBadge';
import { normalizeOrderPerfumes } from '@/lib/order-utils';

interface OrderDetailDrawerProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (id: string, status: OrderStatus) => Promise<void>;
}

export function OrderDetailDrawer({ order, isOpen, onClose, onUpdateStatus }: OrderDetailDrawerProps) {
    const normalizedPerfumes = useMemo(() => {
        if (!order) return [];
        return normalizeOrderPerfumes(order);
    }, [order]);

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
                            damping: 32,
                            stiffness: 350,
                            mass: 0.9
                        }}
                        className="absolute top-0 right-0 h-full shadow-2xl overflow-hidden flex flex-col"
                        style={{
                            width: '100%',
                            maxWidth: 520,
                            background: 'var(--bg)',
                            borderLeft: '1px solid var(--border)'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '32px 24px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'var(--surface)',
                            flexShrink: 0
                        }}>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>
                                    COMMANDE #{order.id.slice(-6).toUpperCase()}
                                </div>
                                <h3 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text)', fontFamily: 'serif' }}>Détails de l'expédition</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="btn-ghost"
                                style={{ width: 44, height: 44, padding: 0, borderRadius: 14, color: 'var(--text-muted)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
                            {/* Status Section */}
                            <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <StatusBadge status={order.status} />
                                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 800, letterSpacing: '0.02em' }}>
                                    PASSÉE LE {new Date(order.created_at).toLocaleDateString('fr-MA', {
                                        day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
                                    }).toUpperCase()}
                                </div>
                            </div>

                            {/* Customer Card */}
                            <div style={{ marginBottom: 40 }}>
                                <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.1em' }}>
                                    INFORMATIONS CLIENT
                                </div>
                                <div className="luxury-card" style={{ padding: 28 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                                        <div style={{
                                            width: 60, height: 60, borderRadius: 18,
                                            background: 'var(--gold-glow)', color: 'var(--gold)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 24, fontWeight: 900, border: '1px solid var(--gold-border)'
                                        }}>
                                            {order.customer_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>{order.customer_name}</div>
                                            <div style={{ fontSize: 15, color: 'var(--gold)', fontWeight: 800, marginTop: 2 }}>{order.phone}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>
                                            <MapPin size={18} style={{ color: 'var(--gold)' }} />
                                            <span>{order.city}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, fontWeight: 600 }}>
                                            <Home size={18} style={{ marginTop: 2, flexShrink: 0, color: 'var(--gold)' }} />
                                            <span>{order.address || 'Pas d\'adresse spécifiée'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <button
                                            onClick={handlePhone}
                                            className="btn-ghost"
                                            style={{ height: 52, borderRadius: 14, fontWeight: 900, fontSize: 12, letterSpacing: '0.05em' }}
                                        >
                                            <Phone size={14} /> APPELER
                                        </button>
                                        <button
                                            onClick={handleWhatsApp}
                                            className="btn-ghost"
                                            style={{ height: 52, borderRadius: 14, fontWeight: 900, fontSize: 12, letterSpacing: '0.05em', color: '#25D366', background: 'rgba(37, 211, 102, 0.08)' }}
                                        >
                                            <MessageCircle size={14} /> WHATSAPP
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Order Selection */}
                            <div style={{ marginBottom: 40 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        SÉLECTION PARFUMS ({normalizedPerfumes.length})
                                    </div>
                                    <span style={{
                                        fontSize: 10, background: 'var(--gold-glow)', color: 'var(--gold)',
                                        padding: '4px 12px', borderRadius: 10, fontWeight: 900, textTransform: 'uppercase',
                                        border: '1px solid var(--gold-border)'
                                    }}>
                                        Pack {order.pack_type}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                                                        padding: '16px 20px',
                                                        background: isGift ? 'var(--gold-glow)' : 'var(--surface)',
                                                        borderRadius: 18,
                                                        border: isGift ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                        <div style={{
                                                            width: 26, height: 26, borderRadius: 8,
                                                            background: isGift ? 'var(--gold)' : 'var(--bg-elevated)',
                                                            color: isGift ? 'white' : 'var(--text-muted)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: 11, fontWeight: 900
                                                        }}>
                                                            {idx + 1}
                                                        </div>
                                                        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
                                                            {pName}
                                                        </span>
                                                    </div>
                                                    {isGift && (
                                                        <div style={{
                                                            fontSize: 9, fontWeight: 900, background: 'var(--gold)',
                                                            color: 'white', padding: '4px 10px', borderRadius: 8,
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            OFFERT 🎁
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', fontSize: 13, background: 'var(--bg-elevated)', borderRadius: 20, border: '1px dashed var(--border)', fontWeight: 600 }}>
                                            Aucun parfum sélectionné
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Totals & Meta */}
                            <div className="luxury-card" style={{
                                padding: 32,
                                background: 'var(--text)',
                                color: 'white',
                                border: 'none',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'var(--gold)', opacity: 0.1, borderRadius: '50%' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, position: 'relative', zIndex: 1 }}>
                                    <div>
                                        <div style={{ opacity: 0.5, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>PRIX TOTAL</div>
                                        <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em' }}>{order.price_mad || order.total_price} <span style={{ fontSize: 18, opacity: 0.6, fontWeight: 700 }}>MAD</span></div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ opacity: 0.5, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>ORIGINE</div>
                                        <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                                            {order.source}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 24, position: 'relative', zIndex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, opacity: 0.8 }}>
                                        <Calendar size={14} style={{ color: 'var(--gold)' }} /> {new Date(order.created_at).toLocaleDateString()}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, opacity: 0.8 }}>
                                        <ShoppingBag size={14} style={{ color: 'var(--gold)' }} /> {normalizedPerfumes.length} Éléments
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div style={{
                            padding: '24px',
                            background: 'var(--surface)',
                            borderTop: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            flexShrink: 0
                        }}>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => onUpdateStatus(order.id, 'confirmed')}
                                    disabled={order.status === 'confirmed'}
                                    className="btn btn-primary h-14 rounded-2xl font-black text-sm tracking-widest disabled:opacity-50"
                                    style={{ background: 'var(--success)', border: 'none', color: 'white' }}
                                >
                                    CONFIRMER
                                </button>
                                <button
                                    onClick={() => onUpdateStatus(order.id, 'canceled')}
                                    disabled={order.status === 'canceled'}
                                    className="btn-ghost h-14 rounded-2xl border-2 border-red-500/20 text-red-500 font-black text-sm tracking-widest disabled:opacity-50"
                                >
                                    ANNULER
                                </button>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <select
                                    className="filter-select h-12 w-full rounded-xl font-bold text-sm px-4 text-center cursor-pointer outline-none"
                                    value={order.status}
                                    onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                                >
                                    {STATUS_LIST.map(s => (
                                        <option key={s} value={s}>{STATUS_LABELS[s]} — Changer d'état</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
