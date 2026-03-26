/**
 * Command Center data mappers.
 * Keep these builders pure so backend wiring can replace mocks without refactoring UI.
 */

import type { OverviewResponse, NormalizedOrder } from '@/lib/os/types';
import { buildClientsQuery, buildOrdersQuery, buildPipelineQuery, buildTrackingQuery } from '@/lib/os/domain/query-filters';
import type {
    AlertItem,
    ActivityItem,
    DashboardKpi,
    DashboardSnapshot,
    InsightItem,
    KpiTrend,
    QuickAction,
    SmartStatPillData,
    TopPerformer,
    UrgencyLevel,
} from '@/lib/os/dashboard.types';

const numberFormatter = new Intl.NumberFormat('fr-MA');

const SOURCE_LABELS: Record<string, string> = {
    meta_ads: 'Meta Ads',
    whatsapp: 'WhatsApp',
    direct: 'Direct',
    organic: 'Organic',
    landing_page: 'Landing Page',
    other: 'Autre',
};

export const STATIC_QUICK_ACTIONS: QuickAction[] = [
    {
        id: 'new-orders',
        label: 'Voir nouvelles commandes',
        sub: 'Flux entrant à traiter',
        href: buildOrdersQuery({ statuses: ['new'] }),
        icon: 'orders',
        variant: 'primary',
    },
    {
        id: 'urgent-orders',
        label: 'Voir commandes urgentes',
        sub: 'Priorité haute',
        href: buildOrdersQuery({ statuses: ['to_confirm'], onlyUrgent: true }),
        icon: 'urgent',
        variant: 'urgent',
    },
    {
        id: 'pipeline',
        label: 'Ouvrir pipeline',
        sub: 'Suivi logistique',
        href: buildPipelineQuery({ view: 'kanban' }),
        icon: 'pipeline',
        variant: 'default',
    },
    {
        id: 'vip',
        label: 'Voir clients VIP',
        sub: 'Fidélité et valeur',
        href: buildClientsQuery({ segment: 'vip' }),
        icon: 'vip',
        variant: 'default',
    },
    {
        id: 'stock',
        label: 'Ajuster stock',
        sub: 'Inventaire opérationnel',
        href: '/os-admin/inventory',
        icon: 'stock',
        variant: 'default',
    },
    {
        id: 'intelligence',
        label: 'Voir intelligence',
        sub: 'Analyses & diagnostics',
        href: '/os-admin/intelligence',
        icon: 'intelligence',
        variant: 'ghost',
    },
    {
        id: 'product-create',
        label: 'Créer produit',
        sub: 'Enrichir le catalogue',
        href: '/os-admin/products',
        icon: 'product',
        variant: 'ghost',
    },
    {
        id: 'tracking',
        label: 'Ouvrir tracking',
        sub: 'Suivi transporteurs',
        href: buildTrackingQuery({ range: '30d' }),
        icon: 'tracking',
        variant: 'ghost',
    },
];



function formatNumber(value: number): string {
    return numberFormatter.format(value);
}

function formatMad(value: number): string {
    return numberFormatter.format(Math.max(0, Math.round(value)));
}

function buildTrend(current: number, baseline: number, label: string): KpiTrend | undefined {
    if (baseline <= 0) return undefined;

    const delta = Math.round(((current - baseline) / baseline) * 100);
    if (Math.abs(delta) < 1) {
        return {
            value: '0%',
            direction: 'flat',
            label,
        };
    }

    return {
        value: `${delta > 0 ? '+' : ''}${delta}%`,
        direction: delta > 0 ? 'up' : 'down',
        label,
    };
}

function getTopSource(sourceBreakdown: Record<string, number> | undefined): { key: string; label: string; count: number } | null {
    if (!sourceBreakdown) return null;

    const top = Object.entries(sourceBreakdown)
        .sort((a, b) => b[1] - a[1])[0];

    if (!top) return null;

    return {
        key: top[0],
        label: SOURCE_LABELS[top[0]] ?? top[0],
        count: top[1],
    };
}

function hoursSince(date: string): number {
    const timestamp = new Date(date).getTime();
    if (Number.isNaN(timestamp)) return 0;
    return (Date.now() - timestamp) / (1000 * 60 * 60);
}

function formatRelativeTime(date: string): string {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60)));

    if (minutes < 1) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;

    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
}

function mapActivityType(status: string): ActivityItem['type'] {
    switch (status) {
    case 'new':
    case 'to_confirm':
        return 'new_order';
    case 'confirmed':
        return 'confirmed';
    case 'callback':
        return 'blocked_order';
    case 'shipped':
    case 'delivered':
        return 'operator_action';
    default:
        return 'operator_action';
    }
}

function mapActivityLabel(status: string): string {
    switch (status) {
    case 'new':
        return 'Nouvelle commande reçue';
    case 'to_confirm':
        return 'Commande en attente de confirmation';
    case 'confirmed':
        return 'Commande confirmée';
    case 'callback':
        return 'Callback planifié';
    case 'shipped':
        return 'Commande passée en expédition';
    case 'delivered':
        return 'Commande livrée';
    case 'canceled':
        return 'Commande annulée';
    default:
        return 'Mise à jour commande';
    }
}

function deriveUrgency(value: number, mediumThreshold: number, highThreshold: number, criticalThreshold: number): UrgencyLevel {
    if (value >= criticalThreshold) return 'critical';
    if (value >= highThreshold) return 'high';
    if (value >= mediumThreshold) return 'medium';
    return 'low';
}

function buildActivity(
    recentOrders: NormalizedOrder[],
    lowStockCount: number,
    highValueUnconfirmed: number,
): ActivityItem[] {
    const mappedOrders = recentOrders.slice(0, 6).map((order) => ({
        id: `activity-${order.id}`,
        type: mapActivityType(order.status),
        label: mapActivityLabel(order.status),
        meta: `${order.city ?? 'Ville non précisée'} · ${formatMad(order.total_price)} MAD`,
        time: formatRelativeTime(order.created_at),
        isNew: hoursSince(order.created_at) <= 0.5,
    }));

    const syntheticEvents: ActivityItem[] = [];

    if (lowStockCount > 0) {
        syntheticEvents.push({
            id: 'activity-stock-alert',
            type: 'stock_alert',
            label: 'Alerte stock critique',
            meta: `${lowStockCount} produit${lowStockCount > 1 ? 's' : ''} sous seuil`,
            time: 'il y a 12 min',
            isNew: true,
        });
    }

    if (highValueUnconfirmed > 0) {
        syntheticEvents.push({
            id: 'activity-vip-detected',
            type: 'vip_detected',
            label: 'Client VIP détecté',
            meta: `${highValueUnconfirmed} commande${highValueUnconfirmed > 1 ? 's' : ''} premium non confirmée${highValueUnconfirmed > 1 ? 's' : ''}`,
            time: 'il y a 17 min',
        });
    }

    const items = [...mappedOrders, ...syntheticEvents];
    return items.slice(0, 8);
}

function buildAlerts(params: {
    pendingConfirmations: number;
    callbacksOverdue: number;
    blockedOrders: number;
    lowStockCount: number;
    highValueUnconfirmed: number;
    anomalyCount: number;
    highValueThreshold: number;
    cancellationRate: number;
}): AlertItem[] {
    return [
        {
            id: 'alert-pending',
            title: 'Nouvelles commandes non traitées',
            volume: params.pendingConfirmations,
            urgency: deriveUrgency(params.pendingConfirmations, 1, 6, 12),
            description: 'Commandes en backlog de confirmation à traiter immédiatement.',
            meta: 'SLA recommandé: < 15 min',
            primaryAction: { label: 'Voir backlog', href: buildOrdersQuery({ statuses: ['to_confirm'] }) },
            sectionHref: buildOrdersQuery({ statuses: ['to_confirm'] }),
        },
        {
            id: 'alert-callbacks',
            title: 'Callbacks en retard',
            volume: params.callbacksOverdue,
            urgency: deriveUrgency(params.callbacksOverdue, 1, 3, 6),
            description: 'Relances clients en attente au-delà du créneau attendu.',
            meta: 'Focus conversion téléphone',
            primaryAction: { label: 'Lancer callbacks', href: buildOrdersQuery({ statuses: ['callback'] }) },
            sectionHref: buildOrdersQuery({ statuses: ['callback'] }),
        },
        {
            id: 'alert-blocked',
            title: 'Commandes bloquées',
            volume: params.blockedOrders,
            urgency: deriveUrgency(params.blockedOrders, 1, 4, 7),
            description: 'Commandes sans progression depuis plus de 3 heures.',
            meta: 'Risque annulation élevé',
            primaryAction: { label: 'Débloquer', href: buildPipelineQuery({ view: 'focus' }) },
            sectionHref: buildPipelineQuery({ view: 'focus' }),
        },
        {
            id: 'alert-stock',
            title: 'Stock critique',
            volume: params.lowStockCount,
            urgency: deriveUrgency(params.lowStockCount, 1, 3, 5),
            description: 'Produits proches de la rupture impactant les confirmations.',
            meta: 'Réapprovisionnement prioritaire',
            primaryAction: { label: 'Ajuster stock', href: '/os-admin/inventory' },
            sectionHref: '/os-admin/inventory',
        },
        {
            id: 'alert-high-value',
            title: 'Commandes forte valeur non confirmées',
            volume: params.highValueUnconfirmed,
            urgency: deriveUrgency(params.highValueUnconfirmed, 1, 2, 4),
            description: `Commandes supérieures à ${formatMad(params.highValueThreshold)} MAD sans validation.`,
            meta: 'Impact CA immédiat',
            primaryAction: {
                label: 'Prioriser',
                href: buildOrdersQuery({ statuses: ['to_confirm'], onlyHighValue: true }),
            },
            sectionHref: buildOrdersQuery({ statuses: ['to_confirm'], onlyHighValue: true }),
        },
        {
            id: 'alert-anomaly',
            title: 'Anomalies opérationnelles',
            volume: params.anomalyCount,
            urgency: deriveUrgency(params.anomalyCount, 1, 2, 3),
            description: `Taux d'annulation actuel: ${params.cancellationRate}% sur la période.`,
            meta: 'Diagnostic recommandé',
            primaryAction: { label: 'Analyser causes', href: '/os-admin/intelligence' },
            sectionHref: '/os-admin/intelligence',
        },
    ];
}

function buildInsights(params: {
    topCity?: string;
    topCityCount?: number;
    topProduct?: string;
    topProductCount?: number;
    topSourceLabel?: string;
    topSourceKey?: string;
    topSourceCount?: number;
    peakHour?: string;
    peakHourVolume?: number;
    cancellationRate: number;
    confirmationRate: number;
    lowStockCount: number;
    pendingConfirmations: number;
    avgBasket: number;
    highValueUnconfirmed: number;
}): InsightItem[] {
    const cancellationRiskType = params.cancellationRate >= 18 ? 'urgent' : 'risk';
    const opsImprovementType = params.pendingConfirmations >= 8 ? 'urgent' : 'risk';

    return [
        {
            id: 'insight-best-city',
            type: 'growth',
            title: `Meilleure ville: ${params.topCity ?? 'Donnée indisponible'}`,
            body: params.topCity
                ? `${params.topCityCount ?? 0} commandes sur la période. Prioriser la capacité de confirmation et livraison locale.`
                : 'Activez plus de volume pour isoler une zone leader exploitable.',
            metric: params.topCity ? `${params.topCityCount ?? 0} cmd` : 'n/a',
            cta: {
                label: 'Explorer villes',
                href: params.topCity ? buildOrdersQuery({ cities: [params.topCity] }) : '/os-admin/intelligence',
            },
        },
        {
            id: 'insight-top-product',
            type: 'opportunity',
            title: `Top produit: ${params.topProduct ?? 'Donnée indisponible'}`,
            body: params.topProduct
                ? `${params.topProductCount ?? 0} ventes détectées. Renforcer stock + scripts de confirmation sur ce parfum.`
                : 'Le top produit apparaîtra automatiquement quand la donnée produit est suffisante.',
            metric: params.topProduct ? `${params.topProductCount ?? 0} ventes` : 'n/a',
            cta: { label: 'Voir catalogue', href: '/os-admin/products' },
        },
        {
            id: 'insight-source',
            type: 'growth',
            title: `Source la plus performante: ${params.topSourceLabel ?? 'Donnée indisponible'}`,
            body: params.topSourceLabel
                ? `${params.topSourceCount ?? 0} commandes issues de ce canal. Ajuster budget et scripts de qualification.`
                : 'Aucune source dominante détectée. Consolider les attributions marketing.',
            metric: params.topSourceLabel ? `${params.topSourceCount ?? 0} cmd` : 'n/a',
            cta: {
                label: 'Voir intelligence',
                href: params.topSourceKey ? buildTrackingQuery({ source: params.topSourceKey }) : '/os-admin/intelligence',
            },
        },
        {
            id: 'insight-peak-hour',
            type: 'opportunity',
            title: `Créneau horaire fort: ${params.peakHour ?? 'Donnée indisponible'}`,
            body: params.peakHour
                ? `${params.peakHourVolume ?? 0} commandes observées. Renforcer présence opérateur sur ce créneau.`
                : 'Les heures fortes seront suggérées dès que le trafic journalier augmente.',
            metric: params.peakHour ? `${params.peakHourVolume ?? 0} cmd` : 'n/a',
            cta: { label: 'Ajuster staffing', href: '/os-admin/settings' },
        },
        {
            id: 'insight-cancel-risk',
            type: cancellationRiskType,
            title: 'Risque d\'annulation',
            body: `Le taux d'annulation est à ${params.cancellationRate}%. Au-delà de 15%, la marge et le cashflow sont sous pression.`,
            metric: `${params.cancellationRate}%`,
            cta: { label: 'Réduire le risque', href: '/os-admin/intelligence' },
        },
        {
            id: 'insight-improvement-zone',
            type: opsImprovementType,
            title: 'Zone d\'amélioration prioritaire',
            body: params.pendingConfirmations > 0
                ? `${params.pendingConfirmations} commandes attendent confirmation. Optimiser scripts et relances dans l'heure.`
                : 'Backlog de confirmation sous contrôle. Maintenir le tempo actuel.',
            metric: `${params.pendingConfirmations} en attente`,
            cta: { label: 'Ouvrir backlog', href: buildOrdersQuery({ statuses: ['to_confirm'] }) },
        },
        {
            id: 'insight-growth-opportunity',
            type: 'growth',
            title: 'Opportunité de croissance',
            body: params.lowStockCount > 0
                ? `${params.lowStockCount} produits limitent le volume. Réapprovisionner pour capter davantage de demande.`
                : `Panier moyen à ${formatMad(params.avgBasket)} MAD. Proposer un upsell sur les commandes > ${formatMad(Math.round(params.avgBasket * 1.2))} MAD.`,
            metric: params.highValueUnconfirmed > 0
                ? `${params.highValueUnconfirmed} VIP en attente`
                : `${formatMad(params.avgBasket)} MAD`,
            cta: { label: 'Passer à l\'action', href: '/os-admin/inventory' },
        },
    ];
}

export function buildKpis(data: OverviewResponse, range: 7 | 30): DashboardKpi[] {
    const { stats, todayOrders, todayRevenue, avgBasket, confirmationRate, lowStockAlerts, recentOrders } = data;

    const pendingConfirmations = Math.max(stats.total_orders - stats.confirmed - stats.canceled, 0);
    const lowStockCount = lowStockAlerts.length;
    const callbacksOverdue = recentOrders.filter((order) => order.status === 'callback' && hoursSince(order.created_at) >= 1).length;
    const blockedOrders = recentOrders.filter(
        (order) => ['new', 'to_confirm', 'callback'].includes(order.status) && hoursSince(order.created_at) >= 3,
    ).length;

    const highValueThreshold = Math.max(350, Math.round(avgBasket * 1.35));
    const highValueUnconfirmed = recentOrders.filter(
        (order) => ['new', 'to_confirm', 'callback'].includes(order.status) && order.total_price >= highValueThreshold,
    ).length;

    const urgentOrders = pendingConfirmations + callbacksOverdue + blockedOrders + highValueUnconfirmed;
    const avgDailyOrders = range > 0 ? stats.total_orders / range : 0;
    const avgDailyRevenue = range > 0 ? stats.revenue / range : 0;
    const topCity = stats.top_cities[0];
    const topPerfume = stats.top_perfumes[0];

    return [
        {
            id: 'kpi-orders-today',
            label: 'Commandes aujourd\'hui',
            value: formatNumber(todayOrders),
            sub: 'Entrées depuis minuit',
            tone: 'gold',
            urgency: deriveUrgency(todayOrders, 8, 16, 30),
            trend: buildTrend(todayOrders, avgDailyOrders, `vs rythme moyen ${range}j`),
            statPill: {
                id: 'pill-orders',
                label: 'Pace',
                value: avgDailyOrders > 0 ? `${Math.round(todayOrders / avgDailyOrders * 100)}%` : 'n/a',
                tone: todayOrders >= avgDailyOrders ? 'good' : 'warning',
            },
            cta: { label: 'Voir commandes', href: buildOrdersQuery({ datePreset: 'today' }) },
        },
        {
            id: 'kpi-pending',
            label: 'Confirmations en attente',
            value: formatNumber(pendingConfirmations),
            sub: `Backlog sur ${range} jours`,
            tone: pendingConfirmations > 0 ? 'danger' : 'success',
            urgency: deriveUrgency(pendingConfirmations, 1, 6, 12),
            trend: buildTrend(pendingConfirmations, Math.max(1, stats.total_orders * 0.12), 'vs seuil opérationnel'),
            statPill: {
                id: 'pill-pending',
                label: 'SLA',
                value: pendingConfirmations > 0 ? 'à traiter' : 'stable',
                tone: pendingConfirmations > 8 ? 'danger' : pendingConfirmations > 0 ? 'warning' : 'good',
            },
            cta: { label: 'Traiter', href: buildOrdersQuery({ statuses: ['to_confirm'] }) },
        },
        {
            id: 'kpi-urgent-orders',
            label: 'Commandes urgentes',
            value: formatNumber(urgentOrders),
            sub: 'Backlog + blocages + callbacks',
            tone: urgentOrders > 0 ? 'warning' : 'success',
            urgency: deriveUrgency(urgentOrders, 1, 5, 10),
            statPill: {
                id: 'pill-urgent',
                label: 'Priorité',
                value: urgentOrders >= 10 ? 'critique' : urgentOrders > 0 ? 'active' : 'sous contrôle',
                tone: urgentOrders >= 10 ? 'danger' : urgentOrders > 0 ? 'warning' : 'good',
            },
            cta: { label: 'Voir urgences', href: buildOrdersQuery({ statuses: ['to_confirm', 'callback'], onlyUrgent: true }) },
        },
        {
            id: 'kpi-confirmation-rate',
            label: 'Taux de confirmation',
            value: `${confirmationRate}%`,
            sub: `Cible recommandée: 70%+`,
            tone: confirmationRate >= 70 ? 'success' : 'danger',
            urgency: confirmationRate < 55 ? 'high' : confirmationRate < 70 ? 'medium' : 'low',
            trend: buildTrend(confirmationRate, 70, 'vs objectif'),
            statPill: {
                id: 'pill-conf',
                label: 'Qualité',
                value: confirmationRate >= 70 ? 'solide' : 'à optimiser',
                tone: confirmationRate >= 70 ? 'good' : 'warning',
            },
            cta: { label: 'Analyser', href: '/os-admin/intelligence' },
        },
        {
            id: 'kpi-revenue',
            label: 'Chiffre d\'affaires estimé',
            value: formatMad(stats.revenue),
            unit: 'MAD',
            sub: `${range} derniers jours`,
            tone: 'success',
            trend: buildTrend(todayRevenue, avgDailyRevenue, 'vs revenu journalier moyen'),
            statPill: {
                id: 'pill-aov',
                label: 'Panier moyen',
                value: `${formatMad(avgBasket)} MAD`,
                tone: 'accent',
            },
        },
        {
            id: 'kpi-stock-critical',
            label: 'Stock critique',
            value: formatNumber(lowStockCount),
            sub: 'Produits sous seuil minimum',
            tone: lowStockCount > 0 ? 'warning' : 'success',
            urgency: deriveUrgency(lowStockCount, 1, 3, 5),
            statPill: {
                id: 'pill-stock',
                label: 'Rupture',
                value: lowStockCount > 0 ? 'risque actif' : 'safe',
                tone: lowStockCount > 0 ? 'warning' : 'good',
            },
            cta: { label: 'Inventaire', href: '/os-admin/inventory' },
        },
        {
            id: 'kpi-top-city',
            label: 'Top ville',
            value: topCity?.city ?? '—',
            sub: topCity ? `${topCity.count} commandes` : 'Données insuffisantes',
            tone: 'info',
            statPill: {
                id: 'pill-top-city',
                label: 'Zone',
                value: topCity?.city ?? 'n/a',
                tone: 'neutral',
            },
            cta: {
                label: 'Détails villes',
                href: topCity ? buildOrdersQuery({ cities: [topCity.city] }) : '/os-admin/intelligence',
            },
        },
        {
            id: 'kpi-top-perfume',
            label: 'Top parfum',
            value: topPerfume?.name ?? '—',
            sub: topPerfume ? `${topPerfume.count} ventes` : 'Données insuffisantes',
            tone: 'gold',
            statPill: {
                id: 'pill-top-product',
                label: 'Momentum',
                value: topPerfume ? `${topPerfume.count}x` : 'n/a',
                tone: 'accent',
            },
            cta: { label: 'Voir produits', href: '/os-admin/products' },
        },
    ];
}

export function buildCommandCenterSnapshot(data: OverviewResponse, range: 7 | 30): DashboardSnapshot {
    const { stats, avgBasket, lowStockAlerts, recentOrders, confirmationRate } = data;

    const topSource = getTopSource(stats.source_breakdown);
    const topHour = stats.orders_per_hour
        .filter((hour) => hour.count > 0)
        .sort((a, b) => b.count - a.count)[0];

    const pendingConfirmations = Math.max(stats.total_orders - stats.confirmed - stats.canceled, 0);
    const callbacksOverdue = recentOrders.filter((order) => order.status === 'callback' && hoursSince(order.created_at) >= 1).length;
    const blockedOrders = recentOrders.filter(
        (order) => ['new', 'to_confirm', 'callback'].includes(order.status) && hoursSince(order.created_at) >= 3,
    ).length;

    const highValueThreshold = Math.max(350, Math.round(avgBasket * 1.35));
    const highValueUnconfirmed = recentOrders.filter(
        (order) => ['new', 'to_confirm', 'callback'].includes(order.status) && order.total_price >= highValueThreshold,
    ).length;

    const cancellationRate = stats.total_orders > 0
        ? Math.round((stats.canceled / stats.total_orders) * 100)
        : 0;

    const anomalyCount = cancellationRate >= 25
        ? 3
        : cancellationRate >= 18
            ? 2
            : cancellationRate >= 12
                ? 1
                : 0;

    const alerts = buildAlerts({
        pendingConfirmations,
        callbacksOverdue,
        blockedOrders,
        lowStockCount: lowStockAlerts.length,
        highValueUnconfirmed,
        anomalyCount,
        highValueThreshold,
        cancellationRate,
    });

    const insights = buildInsights({
        topCity: stats.top_cities[0]?.city,
        topCityCount: stats.top_cities[0]?.count,
        topProduct: stats.top_perfumes[0]?.name,
        topProductCount: stats.top_perfumes[0]?.count,
        topSourceLabel: topSource?.label,
        topSourceKey: topSource?.key,
        topSourceCount: topSource?.count,
        peakHour: topHour?.hour,
        peakHourVolume: topHour?.count,
        cancellationRate,
        confirmationRate,
        lowStockCount: lowStockAlerts.length,
        pendingConfirmations,
        avgBasket,
        highValueUnconfirmed,
    });

    const topCities: TopPerformer[] = stats.top_cities.map((city, index) => ({
        label: city.city,
        value: city.count,
        suffix: ' cmd',
        rank: index + 1,
    }));

    const topProducts: TopPerformer[] = stats.top_perfumes.map((product, index) => ({
        label: product.name,
        value: product.count,
        suffix: ' vtes',
        rank: index + 1,
    }));

    const heroPills: SmartStatPillData[] = [
        {
            id: 'hero-pending',
            label: 'Backlog',
            value: `${pendingConfirmations} confirmations`,
            tone: pendingConfirmations > 8 ? 'danger' : pendingConfirmations > 0 ? 'warning' : 'good',
        },
        {
            id: 'hero-top-source',
            label: 'Top source',
            value: topSource ? `${topSource.label} (${topSource.count})` : 'En cours de calcul',
            tone: 'accent',
        },
        {
            id: 'hero-aov',
            label: 'Panier moyen',
            value: `${formatMad(avgBasket)} MAD`,
            tone: 'neutral',
        },
        {
            id: 'hero-risk',
            label: 'Risque annulation',
            value: `${cancellationRate}%`,
            tone: cancellationRate >= 18 ? 'danger' : cancellationRate >= 12 ? 'warning' : 'good',
        },
    ];

    return {
        kpis: buildKpis(data, range),
        alerts,
        insights,
        quickActions: STATIC_QUICK_ACTIONS,
        activity: buildActivity(recentOrders, lowStockAlerts.length, highValueUnconfirmed),
        topCities,
        topProducts,
        heroPills,
    };
}
