import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { DomainConflictError } from "@/lib/os/domain/errors";
import { normalizeOrderStatus } from "@/lib/types";
import type {
  OrderStorageFilters,
  OrderStoragePatch,
  OrderStorageRow,
  OrdersDataAdapter,
  OrderUpdateGuard,
} from "@/lib/os/orders/adapters/types";
import { ORDER_STORAGE_SELECT } from "@/lib/os/orders/adapters/types";

function normalizeLimit(value: number | undefined): number {
  if (!value || value <= 0) return 500;
  return Math.min(value, 1500);
}

function isSupabaseError(error: unknown): error is { message: string; code?: string } {
  return typeof error === "object" && error !== null && "message" in error;
}

function expandStatusFilters(statuses: string[]): string[] {
  const expanded = new Set<string>();

  for (const raw of statuses) {
    const normalized = normalizeOrderStatus(raw);
    if (normalized === "to_confirm") {
      expanded.add("to_confirm");
      expanded.add("pending");
      continue;
    }
    if (normalized === "canceled") {
      expanded.add("canceled");
      expanded.add("cancelled");
      continue;
    }
    expanded.add(normalized);
  }

  return Array.from(expanded);
}

export class SupabaseOrdersAdapter implements OrdersDataAdapter {
  async listOrders(filters: OrderStorageFilters = {}): Promise<OrderStorageRow[]> {
    const supabase = createServiceSupabaseClient();

    let query = supabase
      .from("orders")
      .select(ORDER_STORAGE_SELECT)
      .order("created_at", { ascending: false })
      .limit(normalizeLimit(filters.limit));

    if (filters.days && filters.days > 0) {
      const since = new Date(Date.now() - filters.days * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", since);
    }

    if (filters.pipeline) {
      query = query.not("status", "in", '("delivered","canceled","cancelled")');
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in("status", expandStatusFilters(filters.statuses));
    }

    if (filters.sources && filters.sources.length > 0) {
      query = query.in("source", filters.sources);
    }

    if (filters.packs && filters.packs.length > 0) {
      query = query.in("pack_type", filters.packs);
    }

    if (filters.cities && filters.cities.length > 0) {
      query = query.in("city", filters.cities);
    }

    if (filters.search && filters.search.trim().length > 0) {
      const search = filters.search.trim();
      query = query.or(`customer_name.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%,id.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data || []) as OrderStorageRow[];
  }

  async getOrderById(id: string): Promise<OrderStorageRow | null> {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase.from("orders").select(ORDER_STORAGE_SELECT).eq("id", id).maybeSingle();

    if (error) {
      throw error;
    }

    return (data as OrderStorageRow | null) ?? null;
  }

  async updateOrder(id: string, patch: OrderStoragePatch, guard?: OrderUpdateGuard): Promise<OrderStorageRow> {
    const supabase = createServiceSupabaseClient();
    let query = supabase.from("orders").update(patch).eq("id", id);

    if (guard?.expectedStatus) {
      query = query.eq("status", guard.expectedStatus);
    }
    if (guard && "expectedUpdatedAt" in guard) {
      if (guard.expectedUpdatedAt == null) {
        query = query.is("updated_at", null);
      } else {
        query = query.eq("updated_at", guard.expectedUpdatedAt);
      }
    }

    const { data, error } = await query.select(ORDER_STORAGE_SELECT).maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      throw new DomainConflictError("Commande modifiée par une autre opération. Réessayez.");
    }

    return data as OrderStorageRow;
  }
}

export function isMissingOrdersTableError(error: unknown): boolean {
  if (!isSupabaseError(error)) return false;
  return error.code === "42P01" || error.code === "PGRST205" || error.code === "PGRST204";
}
