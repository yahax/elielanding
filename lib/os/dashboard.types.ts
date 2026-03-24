// ─── Dashboard Command Center Types ─────────────────────────────────────────

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';
export type InsightType = 'opportunity' | 'risk' | 'growth' | 'urgent';
export type KpiTone = 'gold' | 'success' | 'warning' | 'danger' | 'info';
export type SmartPillTone = 'accent' | 'neutral' | 'good' | 'warning' | 'danger';

export type ActivityType =
    | 'new_order'
    | 'confirmed'
    | 'stock_adjusted'
    | 'stock_alert'
    | 'vip_detected'
    | 'operator_action'
    | 'blocked_order';

export interface ActionLink {
    label: string;
    href: string;
}

export interface SmartStatPillData {
    id: string;
    label: string;
    value: string;
    tone?: SmartPillTone;
}

export interface KpiTrend {
    value: string;
    direction: 'up' | 'down' | 'flat';
    label?: string;
}

export interface DashboardKpi {
    id: string;
    label: string;
    value: number | string;
    unit?: string;
    sub?: string;
    urgency?: UrgencyLevel;
    trend?: KpiTrend;
    cta?: ActionLink;
    tone?: KpiTone;
    priorityLabel?: string;
    statPill?: SmartStatPillData;
}

export interface AlertItem {
    id: string;
    title: string;
    volume: number | string;
    urgency: UrgencyLevel;
    description: string;
    meta?: string;
    primaryAction: ActionLink;
    sectionHref?: string;
}

export interface InsightItem {
    id: string;
    type: InsightType;
    title: string;
    body: string;
    metric?: string;
    cta?: ActionLink;
}

export interface ActivityItem {
    id: string;
    type: ActivityType;
    label: string;
    meta?: string;
    time: string;
    actor?: string;
    isNew?: boolean;
}

export interface QuickAction {
    id: string;
    label: string;
    sub?: string;
    href: string;
    icon: 'orders' | 'urgent' | 'pipeline' | 'vip' | 'stock' | 'intelligence' | 'product' | 'tracking';
    variant?: 'default' | 'primary' | 'urgent' | 'ghost';
}

export interface TopPerformer {
    label: string;
    value: number;
    suffix?: string;
    rank?: number;
    delta?: number;
}

export interface DashboardSnapshot {
    kpis: DashboardKpi[];
    alerts: AlertItem[];
    insights: InsightItem[];
    quickActions: QuickAction[];
    activity: ActivityItem[];
    topCities: TopPerformer[];
    topProducts: TopPerformer[];
    heroPills: SmartStatPillData[];
}
