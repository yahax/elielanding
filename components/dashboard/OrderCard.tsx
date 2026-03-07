'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MapPin, Package, Calendar, MessageCircle, Phone, CheckCircle, Clock } from 'lucide-react';
import { Order } from '@/lib/types';

interface OrderCardProps {
    order: Order;
    isOverlay?: boolean;
    onClick?: (order: Order) => void;
}

export function OrderCard({ order, isOverlay, onClick }: OrderCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: order.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        cursor: isOverlay ? 'grabbing' : 'grab',
    };

    const formatDate = (d: string) => {
        const dt = new Date(d);
        return dt.toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit' });
    };

    const perfumes = order.selected_perfumes || [];
    const gift = order.gift_perfume;
    const allPerfumes = gift ? [...perfumes, gift] : perfumes;

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            onClick={(e) => {
                if (onClick) {
                    e.stopPropagation();
                    onClick(order);
                }
            }}
            className={`card group hover:shadow-lg transition-all ${isOverlay ? 'shadow-2xl scale-105 rotate-2' : ''}`}
            style={{
                ...style,
                padding: 16,
                borderRadius: 16,
                border: '1px solid var(--border)',
                background: '#FFF',
                marginBottom: 12,
                position: 'relative'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 900, fontSize: 13, color: 'var(--text)' }}>{order.customer_name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800 }}>#{order.id.slice(-4).toUpperCase()}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    <MapPin size={12} style={{ color: 'var(--gold)' }} />
                    <span>{order.city}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>
                    <Package size={12} style={{ color: 'var(--gold)' }} />
                    <span style={{ color: 'var(--gold)' }}>{order.pack_type.toUpperCase()}</span>
                </div>
            </div>

            {/* Perfume mini list */}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', border: '1px solid #F0F0F2', padding: '8px 10px', borderRadius: 10, background: '#FBFBFB', marginBottom: 14 }}>
                {allPerfumes.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {allPerfumes.slice(0, 3).map((p, idx) => (
                            <div key={idx} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                • {p} {idx === allPerfumes.length - 1 && gift ? '🎁' : ''}
                            </div>
                        ))}
                        {allPerfumes.length > 3 && <div style={{ opacity: 0.6 }}>+ {allPerfumes.length - 3} autres</div>}
                    </div>
                ) : (
                    <div style={{ fontSize: 10, opacity: 0.5 }}>Aucun parfum sélectionné</div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>
                    <Clock size={10} />
                    {formatDate(order.created_at)}
                </div>
                <div style={{ fontWeight: 900, fontSize: 13, color: 'var(--text)' }}>
                    {order.price_mad || order.total_price} <span style={{ fontSize: 10 }}>MAD</span>
                </div>
            </div>
        </div>
    );
}
