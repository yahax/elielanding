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

export type OrderStatusInput = OrderStatus | 'pending' | 'cancelled';

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
    reference?: string;
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
    meta?: Record<string, unknown> | null;
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
    payload: unknown;
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

export const PUBLIC_ORDER_STATUS_LIST = [
    'new',
    'pending',
    'confirmed',
    'callback',
    'cancelled',
] as const;

const STATUS_ALIAS_TO_CANONICAL: Record<string, OrderStatus> = {
    new: 'new',
    pending: 'to_confirm',
    to_confirm: 'to_confirm',
    confirmed: 'confirmed',
    callback: 'callback',
    cancelled: 'canceled',
    canceled: 'canceled',
    shipped: 'shipped',
    delivered: 'delivered',
};

export function normalizeOrderStatus(value: unknown): OrderStatus {
    if (typeof value !== 'string') return 'new';
    const normalized = value.trim().toLowerCase();
    return STATUS_ALIAS_TO_CANONICAL[normalized] ?? 'new';
}

export function toPublicOrderStatus(status: unknown): (typeof PUBLIC_ORDER_STATUS_LIST)[number] {
    const canonical = normalizeOrderStatus(status);
    if (canonical === 'to_confirm') return 'pending';
    if (canonical === 'canceled') return 'cancelled';
    if (canonical === 'new' || canonical === 'confirmed' || canonical === 'callback') return canonical;
    return 'pending';
}

// ── Status labels (French) ──────────────────────────────────
export const STATUS_LABELS: Record<OrderStatusInput, string> = {
    new: 'Nouvelles',
    to_confirm: 'À confirmer',
    pending: 'À confirmer',
    confirmed: 'Confirmées',
    shipped: 'Expédiées',
    delivered: 'Livrées',
    canceled: 'Annulées',
    cancelled: 'Annulées',
    callback: 'Callbacks',
};

export const STATUS_LIST: OrderStatus[] = [
    'new', 'to_confirm', 'confirmed', 'shipped', 'delivered', 'canceled', 'callback'
];
