import { DomainConflictError } from "@/lib/os/domain/errors";
import type {
  OrderStorageFilters,
  OrderStoragePatch,
  OrderStorageRow,
  OrdersDataAdapter,
  OrderUpdateGuard,
} from "@/lib/os/orders/adapters/types";
import { getOsMemoryStore } from "@/lib/os/server/memory-store";

function matchesSearch(row: OrderStorageRow, search: string): boolean {
  const token = search.trim().toLowerCase();
  if (token.length === 0) return true;

  return [row.id, row.customer_name, row.phone, row.city]
    .map((value) => (value ?? "").toLowerCase())
    .some((value) => value.includes(token));
}

export class MockOrdersAdapter implements OrdersDataAdapter {
  async listOrders(filters: OrderStorageFilters = {}): Promise<OrderStorageRow[]> {
    const store = getOsMemoryStore();
    let rows = [...store.orders.values()];

    if (filters.days && filters.days > 0) {
      const since = Date.now() - filters.days * 24 * 60 * 60 * 1000;
      rows = rows.filter((row) => new Date(row.created_at).getTime() >= since);
    }

    if (filters.pipeline) {
      rows = rows.filter((row) => row.status !== "delivered" && row.status !== "canceled");
    }

    if (filters.statuses && filters.statuses.length > 0) {
      const allowed = new Set(filters.statuses);
      rows = rows.filter((row) => allowed.has(row.status));
    }

    if (filters.sources && filters.sources.length > 0) {
      const allowed = new Set(filters.sources);
      rows = rows.filter((row) => allowed.has(row.source ?? ""));
    }

    if (filters.packs && filters.packs.length > 0) {
      const allowed = new Set(filters.packs);
      rows = rows.filter((row) => allowed.has(row.pack_type ?? ""));
    }

    if (filters.cities && filters.cities.length > 0) {
      const allowed = new Set(filters.cities);
      rows = rows.filter((row) => allowed.has(row.city ?? ""));
    }

    if (filters.search) {
      rows = rows.filter((row) => matchesSearch(row, filters.search || ""));
    }

    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 1500) : 500;
    return rows.slice(0, limit);
  }

  async getOrderById(id: string): Promise<OrderStorageRow | null> {
    const store = getOsMemoryStore();
    return store.orders.get(id) ?? null;
  }

  async updateOrder(id: string, patch: OrderStoragePatch, guard?: OrderUpdateGuard): Promise<OrderStorageRow> {
    const store = getOsMemoryStore();
    const current = store.orders.get(id);

    if (!current) {
      throw new Error(`Mock order not found: ${id}`);
    }
    if (guard?.expectedStatus && current.status !== guard.expectedStatus) {
      throw new DomainConflictError("Commande modifiée par une autre opération. Réessayez.");
    }
    if (guard && "expectedUpdatedAt" in guard) {
      const currentUpdatedAt = current.updated_at ?? null;
      const expectedUpdatedAt = guard.expectedUpdatedAt ?? null;
      if (currentUpdatedAt !== expectedUpdatedAt) {
        throw new DomainConflictError("Commande modifiée par une autre opération. Réessayez.");
      }
    }

    const updated: OrderStorageRow = {
      ...current,
      ...patch,
    };

    store.orders.set(id, updated);
    return updated;
  }
}
