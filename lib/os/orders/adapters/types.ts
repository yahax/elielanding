import type { OrderStatus } from "@/lib/types";

export interface OrderStorageRow {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  pack_type: string | null;
  status: OrderStatus;
  source: string | null;
  selected_perfumes: string[] | null;
  gift_perfume: string | null;
  price: number | null;
  price_mad: number | null;
  notes: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  canceled_at: string | null;
}

export interface OrderStorageFilters {
  statuses?: string[];
  sources?: string[];
  packs?: string[];
  cities?: string[];
  search?: string;
  limit?: number;
  pipeline?: boolean;
  days?: number;
}

export interface OrderUpdateGuard {
  expectedStatus?: OrderStatus;
  expectedUpdatedAt?: string | null;
}

export type OrderStoragePatch = Partial<
  Pick<
    OrderStorageRow,
    | "status"
    | "notes"
    | "meta"
    | "updated_at"
    | "confirmed_at"
    | "shipped_at"
    | "delivered_at"
    | "canceled_at"
  >
>;

export interface OrdersDataAdapter {
  listOrders(filters?: OrderStorageFilters): Promise<OrderStorageRow[]>;
  getOrderById(id: string): Promise<OrderStorageRow | null>;
  updateOrder(id: string, patch: OrderStoragePatch, guard?: OrderUpdateGuard): Promise<OrderStorageRow>;
}

export const ORDER_STORAGE_SELECT =
  "id,customer_id,customer_name,phone,city,address,pack_type,status,source,selected_perfumes,gift_perfume,price,price_mad,notes,meta,created_at,updated_at,confirmed_at,shipped_at,delivered_at,canceled_at";
