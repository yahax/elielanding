import { DomainNotFoundError } from "@/lib/os/domain/errors";
import type { DomainOrder } from "@/lib/os/domain/types";
import { MockOrdersAdapter } from "@/lib/os/orders/adapters/mock-orders-adapter";
import { SupabaseOrdersAdapter, isMissingOrdersTableError } from "@/lib/os/orders/adapters/supabase-orders-adapter";
import type {
  OrderStorageFilters,
  OrderStoragePatch,
  OrderStorageRow,
  OrdersDataAdapter,
  OrderUpdateGuard,
} from "@/lib/os/orders/adapters/types";
import { mapDomainOrderToNormalizedOrder, mapStorageOrderToDomainOrder } from "@/lib/os/orders/server/mappers";
import type { NormalizedOrder } from "@/lib/os/types";

export interface OrdersRepositoryFilters extends OrderStorageFilters {
  status?: string;
  source?: string;
  pack?: string;
  city?: string;
}

let forceMockOrdersAdapter = false;

function normalizeFilters(filters: OrdersRepositoryFilters = {}): OrderStorageFilters {
  const statuses = filters.statuses && filters.statuses.length > 0 ? filters.statuses : filters.status ? [filters.status] : [];
  const sources = filters.sources && filters.sources.length > 0 ? filters.sources : filters.source ? [filters.source] : [];
  const packs = filters.packs && filters.packs.length > 0 ? filters.packs : filters.pack ? [filters.pack] : [];
  const cities = filters.cities && filters.cities.length > 0 ? filters.cities : filters.city ? [filters.city] : [];

  return {
    ...filters,
    statuses,
    sources,
    packs,
    cities,
  };
}

export class OrdersRepository {
  private readonly supabaseAdapter: OrdersDataAdapter;
  private readonly mockAdapter: OrdersDataAdapter;

  constructor() {
    this.supabaseAdapter = new SupabaseOrdersAdapter();
    this.mockAdapter = new MockOrdersAdapter();
  }

  private async withFallback<T>(
    supabaseOperation: (adapter: OrdersDataAdapter) => Promise<T>,
    mockOperation: (adapter: OrdersDataAdapter) => Promise<T>
  ): Promise<T> {
    if (forceMockOrdersAdapter) {
      return mockOperation(this.mockAdapter);
    }

    try {
      return await supabaseOperation(this.supabaseAdapter);
    } catch (error) {
      if (isMissingOrdersTableError(error)) {
        forceMockOrdersAdapter = true;
        console.warn("[ORDERS/REPO] orders table unavailable, switching to mock adapter.");
        return mockOperation(this.mockAdapter);
      }

      throw error;
    }
  }

  async listStorageOrders(filters: OrdersRepositoryFilters = {}): Promise<OrderStorageRow[]> {
    const normalized = normalizeFilters(filters);

    return this.withFallback(
      (adapter) => adapter.listOrders(normalized),
      (adapter) => adapter.listOrders(normalized)
    );
  }

  async listDomainOrders(filters: OrdersRepositoryFilters = {}): Promise<DomainOrder[]> {
    const rows = await this.listStorageOrders(filters);
    return rows.map((row) => mapStorageOrderToDomainOrder(row));
  }

  async listNormalizedOrders(filters: OrdersRepositoryFilters = {}): Promise<NormalizedOrder[]> {
    const domainOrders = await this.listDomainOrders(filters);
    return domainOrders.map((order) => mapDomainOrderToNormalizedOrder(order));
  }

  async getStorageOrderById(id: string): Promise<OrderStorageRow | null> {
    return this.withFallback(
      (adapter) => adapter.getOrderById(id),
      (adapter) => adapter.getOrderById(id)
    );
  }

  async getStorageOrderByIdOrThrow(id: string): Promise<OrderStorageRow> {
    const row = await this.getStorageOrderById(id);
    if (!row) {
      throw new DomainNotFoundError(`Commande introuvable: ${id}`);
    }

    return row;
  }

  async getDomainOrderByIdOrThrow(id: string): Promise<DomainOrder> {
    const row = await this.getStorageOrderByIdOrThrow(id);
    return mapStorageOrderToDomainOrder(row);
  }

  async updateStorageOrder(id: string, patch: OrderStoragePatch, guard?: OrderUpdateGuard): Promise<OrderStorageRow> {
    return this.withFallback(
      (adapter) => adapter.updateOrder(id, patch, guard),
      (adapter) => adapter.updateOrder(id, patch, guard)
    );
  }

  async updateStorageOrderAndMapDomain(id: string, patch: OrderStoragePatch, guard?: OrderUpdateGuard): Promise<DomainOrder> {
    const row = await this.updateStorageOrder(id, patch, guard);
    return mapStorageOrderToDomainOrder(row);
  }
}

export const ordersRepository = new OrdersRepository();
