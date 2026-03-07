import { createClient } from './supabase';

export async function globalSearch(query: string) {
    if (!query || query.length < 2) return [];

    const supabase = createClient();
    const searchResults: any[] = [];
    const lowerQuery = query.toLowerCase();

    // 1. Search Perfumes inside Orders (order_items.perfume_name)
    // High Priority: People searching for perfume often want to see who bought it.
    const { data: itemOrders } = await supabase
        .from('order_items')
        .select('order_id, perfume_name, orders(id, customer_name, city, total_price, status, created_at)')
        .ilike('perfume_name', `%${query}%`)
        .limit(15);

    if (itemOrders) {
        itemOrders.forEach((item: any) => {
            if (item.orders && !searchResults.find(r => r.id === item.orders.id)) {
                // Determine if it's an exact match or partial
                const isExact = item.perfume_name.toLowerCase() === lowerQuery;
                searchResults.push({
                    ...item.orders,
                    type: 'order',
                    rank: isExact ? 1 : 2,
                    matchContext: `Parfum: ${item.perfume_name}`
                });
            }
        });
    }

    // 2. Search Orders Directly (by name, city, phone)
    const { data: orders } = await supabase
        .from('orders')
        .select('id, customer_name, city, total_price, status, created_at')
        .or(`customer_name.ilike.%${query}%,city.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(10);

    if (orders) {
        orders.forEach(o => {
            if (!searchResults.find(r => r.id === o.id)) {
                searchResults.push({ ...o, type: 'order', rank: 3 });
            }
        });
    }

    // 3. Search Products (V2 table)
    const { data: products } = await supabase
        .from('products')
        .select('id, name, category, stock')
        .ilike('name', `%${query}%`)
        .limit(5);

    if (products) {
        products.forEach(p => {
            searchResults.push({ ...p, type: 'product', rank: 4 });
        });
    }

    // Sort by rank
    return searchResults.sort((a, b) => a.rank - b.rank);
}
