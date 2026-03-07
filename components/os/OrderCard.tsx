'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MapPin, Package, Clock } from 'lucide-react';
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
            className={`luxury-card ${isOverlay ? 'shadow-2xl scale-105 rotate-1' : ''}`}
            style={{
                ...style,
                padding: '24px',
                cursor: isOverlay ? 'grabbing' : 'grab',
                border: isDragging ? '1.5px dashed var(--gold-border)' : '1px solid var(--border)',
                background: isDragging ? 'transparent' : 'var(--surface)',
                marginBottom: 16
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: 13, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                        #{order.id.slice(-6).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                        {order.customer_name}
                    </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-dim)', background: 'var(--surface-1)', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                    {formatDate(order.created_at)}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={12} style={{ color: 'var(--gold)', opacity: 0.8 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{order.city}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                    <Package size={12} style={{ color: 'var(--gold)', opacity: 0.8 }} />
                    <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 900, letterSpacing: '0.05em' }}>{order.pack_type.toUpperCase()}</span>
                </div>
            </div>

            <div style={{
                padding: '16px',
                background: 'var(--bg-elevated)',
                borderRadius: 14,
                border: '1px solid var(--border)',
                marginBottom: 24
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {allPerfumes.slice(0, 2).map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--gold)', opacity: 0.4 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p} {idx === allPerfumes.length - 1 && gift ? '🎁' : ''}
                            </span>
                        </div>
                    ))}
                    {allPerfumes.length > 2 && (
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 900, paddingLeft: 14 }}>
                            + {allPerfumes.length - 2} ARTICLES SUPPLÉMENTAIRES
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
                    <Clock size={12} /> EN ATTENTE
                </div>
                <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                    {order.price_mad || order.total_price} <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>MAD</span>
                </div>
            </div>
        </div>
    );
}
