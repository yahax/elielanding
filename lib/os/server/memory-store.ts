import type { AuditLogEntry, DomainEvent, UserPreferences } from "@/lib/os/domain/types";
import type { OrderStorageRow } from "@/lib/os/orders/adapters/types";

type OsMemoryStore = {
  orders: Map<string, OrderStorageRow>;
  auditLogs: AuditLogEntry[];
  domainEvents: DomainEvent[];
  preferences: Map<string, UserPreferences>;
  idempotency: Map<
    string,
    {
      requestHash: string;
      status: "pending" | "completed" | "failed";
      responseStatus: number | null;
      responseBody: Record<string, unknown> | null;
      createdAt: string;
      updatedAt: string;
      expiresAt: string;
    }
  >;
};

declare global {
  var __elieOsMemoryStore: OsMemoryStore | undefined;
}

function createStore(): OsMemoryStore {
  return {
    orders: new Map<string, OrderStorageRow>(),
    auditLogs: [],
    domainEvents: [],
    preferences: new Map<string, UserPreferences>(),
    idempotency: new Map(),
  };
}

export function getOsMemoryStore(): OsMemoryStore {
  if (!globalThis.__elieOsMemoryStore) {
    globalThis.__elieOsMemoryStore = createStore();
  }

  return globalThis.__elieOsMemoryStore;
}

export function pushMemoryAuditLog(entry: AuditLogEntry): void {
  const store = getOsMemoryStore();
  store.auditLogs.unshift(entry);
  store.auditLogs = store.auditLogs.slice(0, 3000);
}

export function pushMemoryDomainEvent(event: DomainEvent): void {
  const store = getOsMemoryStore();
  store.domainEvents.unshift(event);
  store.domainEvents = store.domainEvents.slice(0, 3000);
}
