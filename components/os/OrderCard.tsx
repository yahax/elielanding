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
            className={`luxury-card ${isOverlay ? 'shadow-lg scale-102' : ''}`}
            style={{
                ...style,
                padding: '20px',
                border: isDragging ? '1.5px dashed var(--gold-border)' : '1px solid var(--border)',
                background: 'var(--card-bg)',
                marginBottom: 12,
                transition: 'all 0.2s ease',
                boxShadow: isOverlay ? 'var(--shadow-lg)' : 'var(--shadow-sm)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    <div style={{ fontWeight: 800, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: 4 }}>
                        #{order.id.slice(-6).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
                        {order.customer_name}
                    </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-dim)', background: 'var(--surface)', padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    {order.source.toUpperCase()}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={12} style={{ color: 'var(--gold)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{order.city}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={12} style={{ color: 'var(--gold)' }} />
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 800 }}>{order.pack_type.toUpperCase()}</span>
                </div>
            </div>

            <div style={{
                padding: '12px',
                background: 'var(--surface)',
                borderRadius: 12,
                border: '1px solid var(--border)',
                marginBottom: 16
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {allPerfumes.slice(0, 2).map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--gold)', opacity: 0.4 }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p}
                            </span>
                        </div>
                    ))}
                    {allPerfumes.length > 2 && (
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 800, paddingLeft: 12 }}>
                            + {allPerfumes.length - 2} ARTICLES
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, color: 'var(--text-dim)' }}>
                    <Clock size={12} /> {new Date(order.created_at).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit' })}
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
                    {order.price_mad || order.total_price} <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>MAD</span>
                </div>
            </div>
        </div>
    );
}
