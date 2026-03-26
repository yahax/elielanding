'use client';

import Link from 'next/link';
import { Zap, Activity } from 'lucide-react';

interface PriorityCountsProps {
    toConfirm: number;
    stockAlerts: number;
}

interface OperationLink {
    href: string;
    label: string;
    sub: string;
    variant?: 'primary' | 'ghost';
}

const OPERATION_LINKS: OperationLink[] = [
    { href: '/os-admin/orders', label: 'Confirmation Rapide', sub: 'Traiter le flux entrant', variant: 'ghost' },
    { href: '/os-admin/pipeline', label: 'Suivi Logistique', sub: 'Contrôle des expéditions', variant: 'ghost' },
    { href: '/os-admin/products', label: 'Gestion Catalogue', sub: 'Mise à jour collections', variant: 'primary' },
    { href: '/os-admin/inventory', label: 'Stocks & Alerts', sub: 'Inventaire Maison', variant: 'ghost' },
];

export function OperationGrid({ toConfirm, stockAlerts }: PriorityCountsProps) {
    return (
        <div className="os-operation-col">
            {/* Priority */}
            <div className="luxury-card os-section-card">
                <div className="os-card-header">
                    <Zap size={20} className="os-card-icon-gold" />
                    <h3 className="os-card-title">Priorité Opérationnelle</h3>
                </div>
                <div className="priority-grid">
                    <div className="priority-card">
                        <div className="priority-card-label">À Confirmer</div>
                        <div className="priority-card-value">{toConfirm}</div>
                    </div>
                    <div className="priority-card priority-card-danger">
                        <div className="priority-card-label priority-card-label-danger">Alerte Stock</div>
                        <div className="priority-card-value priority-card-value-danger">{stockAlerts}</div>
                    </div>
                </div>
            </div>

            {/* Operations */}
            <div className="luxury-card os-section-card">
                <div className="os-card-header">
                    <Activity size={20} className="os-card-icon-gold" />
                    <h3 className="os-card-title">Pilotage Commercial</h3>
                </div>
                <div className="ops-link-grid">
                    {OPERATION_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`ops-link-btn${link.variant === 'primary' ? ' ops-link-btn-primary' : ''}`}
                        >
                            <div className="ops-link-label">{link.label}</div>
                            <div className="ops-link-sub">{link.sub}</div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
