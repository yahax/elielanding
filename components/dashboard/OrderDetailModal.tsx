'use client';

import { StatusBadge } from './StatusBadge';
import { X, Phone, MapPin, Package, Calendar, Tag, MessageSquare } from 'lucide-react';

const STATUS_OPTIONS = ['new', 'to_confirm', 'confirmed', 'shipped', 'delivered', 'canceled'];
const STATUS_LABELS: Record<string, string> = {
    new: 'Nouveau',
    to_confirm: 'À confirmer',
    confirmed: 'Confirmé',
    shipped: 'Expédié',
    delivered: 'Livré',
    canceled: 'Annulé',
};

interface Order {
    id: string;
    customer_name: string;
    phone: string;
    city: string;
    pack: string;
    perfumes: string[];
    status: string;
    source: string;
    revenue: number;
    created_at: string;
    notes?: string;
}

interface Props {
    order: Order;
    onClose: () => void;
    onStatusChange: (id: string, status: string) => void;
}

export function OrderDetailModal({ order, onClose, onStatusChange }: Props) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <div className="modal-title">{order.customer_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            Commande #{order.id.slice(0, 8).toUpperCase()}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                        <InfoRow icon={Phone} label="Téléphone" value={order.phone} />
                        <InfoRow icon={MapPin} label="Ville" value={order.city} />
                        <InfoRow icon={Package} label="Pack" value={order.pack} bold />
                        <InfoRow icon={Calendar} label="Date" value={new Date(order.created_at).toLocaleString('fr-MA', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })} />
                        <InfoRow icon={Tag} label="Source" value={order.source} />
                        <InfoRow icon={Tag} label="CA" value={order.revenue > 0 ? `${order.revenue} MAD` : '—'} bold highlight />
                    </div>

                    {/* Perfumes list */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                            Parfums commandés
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {(order.perfumes || []).map((p, i) => (
                                <span
                                    key={i}
                                    style={{
                                        background: 'var(--gold-glow)',
                                        color: 'var(--gold)',
                                        border: '1px solid rgba(201,168,76,0.2)',
                                        padding: '3px 10px',
                                        borderRadius: 20,
                                        fontSize: 12,
                                    }}
                                >
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                                <MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />
                                Notes
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text)', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 8 }}>
                                {order.notes}
                            </div>
                        </div>
                    )}

                    {/* Status */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                            Statut actuel
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {STATUS_OPTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onStatusChange(order.id, s)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 20,
                                        border: order.status === s ? '1px solid var(--gold)' : '1px solid var(--border)',
                                        background: order.status === s ? 'var(--gold-glow)' : 'var(--surface-2)',
                                        color: order.status === s ? 'var(--gold)' : 'var(--text-muted)',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {STATUS_LABELS[s]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>Fermer</button>
                    <a
                        href={`https://wa.me/${order.phone.replace(/^0/, '212')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-success btn-sm"
                    >
                        WhatsApp
                    </a>
                </div>
            </div>
        </div>
    );
}

function InfoRow({
    icon: Icon,
    label,
    value,
    bold,
    highlight,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    bold?: boolean;
    highlight?: boolean;
}) {
    return (
        <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon size={10} />
                {label}
            </div>
            <div style={{ fontSize: 14, fontWeight: bold ? 700 : 400, color: highlight ? 'var(--gold)' : 'var(--text)' }}>
                {value}
            </div>
        </div>
    );
}
