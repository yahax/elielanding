import type { Order, DashboardStats } from './types';

export function calculateStats(orders: Order[]): DashboardStats {
    const total_orders = orders.length;
    const confirmed = orders.filter(o =>
        ['confirmed', 'shipped', 'delivered'].includes(o.status)
    ).length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const canceled = orders.filter(o => o.status === 'canceled').length;

    // Revenue from total_price
    const revenue = orders
        .filter(o => o.status !== 'canceled')
        .reduce((sum, o) => sum + (o.price_mad || o.total_price || 0), 0);

    // ── Orders per hour (today) ─────────────────────────────────
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const hourMap: Record<string, number> = {};
    for (let i = 0; i < 24; i++) hourMap[`${String(i).padStart(2, '0')}h`] = 0;

    orders.forEach(o => {
        const orderDate = new Date(o.created_at);
        if (orderDate.toISOString().slice(0, 10) === todayStr) {
            const h = orderDate.getHours();
            hourMap[`${String(h).padStart(2, '0')}h`]++;
        }
    });
    const orders_per_hour = Object.entries(hourMap).map(([hour, count]) => ({ hour, count }));

    // ── Top cities ──────────────────────────────────────────────
    const cityMap: Record<string, number> = {};
    orders.forEach(o => { if (o.city) cityMap[o.city] = (cityMap[o.city] || 0) + 1; });
    const top_cities = Object.entries(cityMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([city, count]) => ({ city, count }));

    // ── Top perfumes ───────────────────────────────
    const perfumeMap: Record<string, number> = {};
    orders.forEach(o => {
        // Collect from items (legacy)
        if (o.items && Array.isArray(o.items)) {
            o.items.forEach(item => {
                if (item.perfume_name) {
                    perfumeMap[item.perfume_name] = (perfumeMap[item.perfume_name] || 0) + 1;
                }
            });
        }
        // Collect from selected_perfumes (production)
        if (o.selected_perfumes && Array.isArray(o.selected_perfumes)) {
            o.selected_perfumes.forEach(p => {
                if (p) perfumeMap[p] = (perfumeMap[p] || 0) + 1;
            });
        }
        // Collect from gift_perfume (production)
        if (o.gift_perfume) {
            perfumeMap[o.gift_perfume] = (perfumeMap[o.gift_perfume] || 0) + 1;
        }
    });

    const top_perfumes = Object.entries(perfumeMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

    // ── Source breakdown ────────────────────────────────────────
    const sourceMap: Record<string, number> = {};
    orders.forEach(o => {
        const src = o.source || 'direct';
        sourceMap[src] = (sourceMap[src] || 0) + 1;
    });

    return {
        total_orders,
        confirmed,
        delivered,
        canceled,
        revenue,
        orders_per_hour,
        top_cities,
        top_perfumes,
        source_breakdown: sourceMap,
    };
}
