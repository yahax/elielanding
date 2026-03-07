/* =========================================================
   ELIE AI Commerce OS V2 — TypeScript types
   ========================================================= */

// ── Statuses ──────────────────────────────────────────────
export type OrderStatus =
    | 'new'
    | 'to_confirm'
    | 'confirmed'
    | 'shipped'
    | 'delivered'
    | 'canceled'
    | 'callback';

export type OrderSource = 'whatsapp' | 'direct' | 'meta_ads' | 'organic' | 'other' | 'landing_page' | string;
export type PackType = 'homme' | 'femme' | 'mixte';

// ── Product (Replacement for Perfume) ─────────────────────
export interface Product {
    id: string;
    name: string;
    slug?: string;
    category: string;
    tier: 'classic' | 'niche' | string;
    price?: number;
    stock: number;
    low_stock_threshold: number;
    image_url?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

// ── Customer (CRM) ────────────────────────────────────────
export interface Customer {
    id: string;
    name: string;
    phone: string;
    city: string | null;
    address: string | null;
    last_order_at: string | null;
    total_orders: number;
    total_spent: number;
    created_at?: string;
    updated_at?: string;
}

// ── Order ─────────────────────────────────────────────────
export interface Order {
    id: string;
    customer_id?: string | null;
    customer_name: string | null;
    phone: string | null;
    city: string | null;
    address: string | null;
    pack_type: PackType;
    total_price: number;
    price_mad?: number; // Real production column
    status: OrderStatus;
    source: OrderSource;
    notes: string | null;
    created_at: string;
    updated_at: string;
    confirmed_at: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    canceled_at: string | null;
    // Real production columns
    selected_perfumes?: string[] | null;
    gift_perfume?: string | null;
    offer_mode?: string | null;
    // Joined data (Deprecated - order_items table does not exist)
    items?: any[];
}

// ── Order Item (DEPRECATED - Table missing in prod) ──────────
/*
export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string | null;
    perfume_name: string;
    position: number;
    is_gift: boolean;
    created_at: string;
}
*/

// ── Event (Audit) ─────────────────────────────────────────
export interface BusinessEvent {
    id: string;
    type: string;
    entity_type: string;
    entity_id: string;
    payload: any;
    created_at: string;
}

// ── Dashboard Stats ───────────────────────────────────────
export interface DashboardStats {
    total_orders: number;
    confirmed: number;
    delivered: number;
    canceled: number;
    revenue: number;
    orders_per_hour: { hour: string; count: number }[];
    top_cities: { city: string; count: number }[];
    top_perfumes: { name: string; count: number }[];
    source_breakdown: Record<string, number>;
}

// ── Status labels (French) ──────────────────────────────────
export const STATUS_LABELS: Record<OrderStatus, string> = {
    new: 'Nouveau',
    to_confirm: 'À confirmer',
    confirmed: 'Confirmé',
    shipped: 'Expédié',
    delivered: 'Livré',
    canceled: 'Annulé',
    callback: 'À rappeler',
};

export const STATUS_LIST: OrderStatus[] = [
    'new', 'to_confirm', 'confirmed', 'shipped', 'delivered', 'canceled', 'callback'
];
