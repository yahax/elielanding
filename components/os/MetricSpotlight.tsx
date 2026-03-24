'use client';

import { Shield } from 'lucide-react';

interface MetricSpotlightProps {
    todayRevenue: number;
    todayOrders: number;
    avgBasket: number;
    confirmedCount: number;
}

export function MetricSpotlight({
    todayRevenue,
    todayOrders,
    avgBasket,
    confirmedCount,
}: MetricSpotlightProps) {
    return (
        <div className="os-primary-grid">
            {/* Revenue Hero */}
            <div className="luxury-card metric-spotlight-card">
                <div className="os-section-label">Performance du Jour</div>
                <div className="metric-spotlight-header">
                    <div className="metric-spotlight-value">
                        {todayRevenue.toLocaleString('fr-MA')}
                        <span className="metric-spotlight-currency">MAD</span>
                    </div>
                    <div className="badge badge-success-pill">Direct Cash</div>
                </div>
                <div className="metric-spotlight-sub">
                    <div className="os-mini-stat">
                        <div className="os-mini-label">Commandes</div>
                        <div className="os-mini-value">{todayOrders}</div>
                    </div>
                    <div className="os-mini-stat">
                        <div className="os-mini-label">Panier Moyen</div>
                        <div className="os-mini-value">{avgBasket} MAD</div>
                    </div>
                </div>
            </div>

            {/* Confirmed Flow */}
            <div className="luxury-card metric-confirmed-card">
                <div className="metric-confirmed-header">
                    <Shield size={18} className="metric-confirmed-icon" />
                    <h3 className="metric-confirmed-title">Flux Confirmé</h3>
                </div>
                <div className="metric-confirmed-value">{confirmedCount}</div>
                <div className="metric-confirmed-sub">Validation opérationnelle active</div>
            </div>
        </div>
    );
}
