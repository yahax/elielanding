'use client';

import {
    ShoppingCart, CheckCircle, Truck, XCircle, DollarSign,
    TrendingUp, Package, BarChart3, type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
    ShoppingCart, CheckCircle, Truck, XCircle, DollarSign,
    TrendingUp, Package, BarChart3,
};

interface KPICardProps {
    label: string;
    value: string | number;
    iconName: keyof typeof ICON_MAP;
    color: string;
    sub?: string;
    isRevenue?: boolean;
}

export function KPICard({ label, value, iconName, color, sub, isRevenue }: KPICardProps) {
    const Icon = ICON_MAP[iconName] ?? ShoppingCart;
    return (
        <div
            className="kpi-card"
            style={{ '--accent-color': color } as React.CSSProperties}
        >
            <div className="kpi-icon" style={{ background: `${color}1a` }}>
                <Icon size={16} style={{ color }} />
            </div>
            <div className="kpi-label">{label}</div>
            <div
                className="kpi-value"
                style={isRevenue ? { fontSize: 20, color } : { color }}
            >
                {value}
            </div>
            {sub && <div className="kpi-sub">{sub}</div>}
        </div>
    );
}
