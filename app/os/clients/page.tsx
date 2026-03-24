"use client";

import { Suspense } from "react";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { fetchOrders } from "@/lib/os/api";
import {
  CUSTOMER_SEGMENT_LABELS,
  RELATIONSHIP_LABELS,
  buildClientInsights,
  buildCustomerKpis,
  buildCustomersFromOrders,
  filterCustomers,
  getUniqueCities,
} from "@/lib/os/crm/helpers";
import { DEFAULT_CUSTOMER_FILTERS, type Customer, type CustomerSegment, type CustomerFiltersState } from "@/lib/os/crm/types";
import { buildClientsQuery, parseClientsFiltersFromSearchParams } from "@/lib/os/domain/query-filters";
import { useIsMobile } from "@/hooks/useIsMobile";
import { OsToaster } from "@/components/ui/OsToaster";
import { LoadingSkeletonBlock } from "@/components/ui/LoadingSkeletonBlock";
import { DataStateWrapper } from "@/components/ui/DataStateWrapper";
import { ClientsCommandBar } from "@/components/os/clients/ClientsCommandBar";
import { ClientSegmentTabs } from "@/components/os/clients/ClientSegmentTabs";
import { ClientsKpiStrip } from "@/components/os/clients/ClientsKpiStrip";
import { ClientsTable } from "@/components/os/clients/ClientsTable";
import { ClientCard } from "@/components/os/clients/ClientCard";
import { ClientDetailDrawer } from "@/components/os/clients/ClientDetailDrawer";

type SegmentTab = "all" | CustomerSegment;

function exportCustomersCsv(customers: Customer[]) {
  const header = [
    "name",
    "phone",
    "city",
    "total_orders",
    "total_spent",
    "avg_basket",
    "segment",
    "relationship",
    "repurchase_probability",
    "next_action",
    "last_order_at",
  ];

  const rows = customers.map((customer) => [
    customer.name,
    customer.phone,
    customer.city || "",
    String(customer.totalOrders),
    String(customer.totalSpent),
    String(customer.avgBasket),
    customer.segments[0] || "new",
    customer.relationshipStatus,
    String(customer.repurchaseProbability),
    customer.nextAction,
    customer.lastOrderAt || "",
  ]);

  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(href);
}

function ClientsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile(1024);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [ordersCount, setOrdersCount] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filters, setFilters] = useState<CustomerFiltersState>(DEFAULT_CUSTOMER_FILTERS);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const load = useCallback(async (withToast = false) => {
    if (customers.length === 0) setOrdersLoading(true);
    else setRefreshing(true);

    setError("");
    try {
      const response = await fetchOrders({ limit: 1200, days: 365 });
      setOrdersCount(response.orders.length);
      const computedCustomers = buildCustomersFromOrders(response.orders);
      setCustomers(computedCustomers);
      if (withToast) toast.success("CRM clients synchronisé");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Impossible de charger le CRM clients";
      setError(message);
      if (withToast) toast.error(message);
    } finally {
      setOrdersLoading(false);
      setRefreshing(false);
    }
  }, [customers.length]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const query = searchParams.toString();
    setLastQuery(query);
    const parsed = parseClientsFiltersFromSearchParams(searchParams);

    setFilters((prev) => ({
      ...prev,
      search: parsed.search ?? "",
      segment: (parsed.segment as CustomerFiltersState["segment"] | undefined) ?? "all",
      city: parsed.city ?? "all",
      relationship: (parsed.relationship as CustomerFiltersState["relationship"] | undefined) ?? "all",
      minSpent: parsed.minSpent ?? 0,
      onlyAtRisk: Boolean(parsed.onlyAtRisk),
    }));
  }, [searchParams]);

  useEffect(() => {
    const href = buildClientsQuery({
      search: filters.search || undefined,
      segment: filters.segment !== "all" ? filters.segment : undefined,
      city: filters.city !== "all" ? filters.city : undefined,
      relationship: filters.relationship !== "all" ? filters.relationship : undefined,
      minSpent: filters.minSpent > 0 ? filters.minSpent : undefined,
      onlyAtRisk: filters.onlyAtRisk || undefined,
    });
    const query = href.includes("?") ? href.split("?")[1] ?? "" : "";
    if (query === lastQuery) return;
    setLastQuery(query);
    router.replace(href, { scroll: false });
  }, [filters, lastQuery, router]);

  const uniqueCities = useMemo(() => getUniqueCities(customers), [customers]);
  const filteredCustomers = useMemo(() => filterCustomers(customers, filters), [customers, filters]);
  const kpis = useMemo(() => buildCustomerKpis(customers), [customers]);
  const clientInsights = useMemo(() => buildClientInsights(filteredCustomers).slice(0, 3), [filteredCustomers]);

  const segmentCounts = useMemo(() => {
    const counts: Record<SegmentTab, number> = {
      all: customers.length,
      vip: 0,
      recurring: 0,
      new: 0,
      dormant: 0,
      to_relaunch: 0,
      at_risk: 0,
      cancel_prone: 0,
      high_value: 0,
    };

    for (const customer of customers) {
      for (const segment of customer.segments) {
        counts[segment] += 1;
      }
    }

    return counts;
  }, [customers]);

  useEffect(() => {
    if (!selectedCustomer) return;
    const fresh = customers.find((customer) => customer.id === selectedCustomer.id) ?? null;
    setSelectedCustomer(fresh);
    if (!fresh) setDrawerOpen(false);
  }, [customers, selectedCustomer]);

  const activeSegment = filters.segment;

  return (
    <div className="os-page animate-fade-in" style={{ paddingBottom: 96, gap: 12 }}>
      <OsToaster />

      <ClientsCommandBar
        totalCount={customers.length}
        filteredCount={filteredCustomers.length}
        search={filters.search}
        onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
        onRefresh={() => load(true)}
        onExport={() => {
          exportCustomersCsv(filteredCustomers);
          toast.success(`${filteredCustomers.length} clients exportés`);
        }}
        onShowVip={() => setFilters((prev) => ({ ...prev, segment: "vip" }))}
        refreshing={refreshing}
        compact={isMobile}
      />

      <ClientSegmentTabs
        active={activeSegment}
        counts={segmentCounts}
        onChange={(segment) => setFilters((prev) => ({ ...prev, segment }))}
      />

      <section
        className="luxury-card"
        style={{
          padding: 12,
          borderRadius: 16,
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 900 }}>Ville</span>
          <select
            className="filter-select"
            value={filters.city}
            onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))}
            style={{ height: 40, borderRadius: 10 }}
          >
            <option value="all">Toutes</option>
            {uniqueCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 900 }}>Relation</span>
          <select
            className="filter-select"
            value={filters.relationship}
            onChange={(event) => setFilters((prev) => ({ ...prev, relationship: event.target.value as CustomerFiltersState["relationship"] }))}
            style={{ height: 40, borderRadius: 10 }}
          >
            <option value="all">Toutes</option>
            {Object.entries(RELATIONSHIP_LABELS).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 900 }}>Segment</span>
          <select
            className="filter-select"
            value={filters.segment}
            onChange={(event) => setFilters((prev) => ({ ...prev, segment: event.target.value as CustomerFiltersState["segment"] }))}
            style={{ height: 40, borderRadius: 10 }}
          >
            <option value="all">Tous</option>
            {Object.entries(CUSTOMER_SEGMENT_LABELS).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 900 }}>Min dépense</span>
          <input
            className="filter-input"
            type="number"
            min={0}
            step={100}
            value={filters.minSpent}
            onChange={(event) => setFilters((prev) => ({ ...prev, minSpent: Math.max(0, Number(event.target.value) || 0) }))}
            style={{ height: 40, borderRadius: 10, minWidth: 0 }}
          />
        </label>

        <button
          type="button"
          className={filters.onlyAtRisk ? "btn btn-primary btn-sm" : "btn-ghost btn-sm"}
          onClick={() => setFilters((prev) => ({ ...prev, onlyAtRisk: !prev.onlyAtRisk }))}
          style={{ alignSelf: "end", height: 40, borderRadius: 10 }}
        >
          <AlertTriangle size={13} />
          À risque
        </button>

        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => setFilters(DEFAULT_CUSTOMER_FILTERS)}
          style={{ gridColumn: "auto", height: 40, borderRadius: 10 }}
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </section>

      <ClientsKpiStrip
        kpis={kpis}
        onSelect={(key) => {
          if (key === "all") {
            setFilters((prev) => ({ ...prev, segment: "all" }));
            return;
          }
          setFilters((prev) => ({ ...prev, segment: key }));
        }}
      />

      {clientInsights.length > 0 ? (
        <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          {clientInsights.map((insight) => (
            <article key={insight.id} className="luxury-card" style={{ padding: 12, borderRadius: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>{insight.title}</div>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-dim)", fontWeight: 700, lineHeight: 1.5 }}>{insight.message}</p>
              <div style={{ marginTop: 8 }}>
                <a href={insight.href} className="btn-ghost btn-sm" style={{ textDecoration: "none" }}>
                  {insight.actionLabel}
                </a>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {refreshing && !ordersLoading ? <LoadingSkeletonBlock compact lines={3} /> : null}

      <DataStateWrapper
        loading={ordersLoading}
        error={error}
        empty={filteredCustomers.length === 0}
        emptyTitle="Aucun client sur ce filtre"
        emptyCopy="Ajustez les filtres ou synchronisez de nouvelles commandes pour enrichir le CRM."
        loadingLabel="Chargement CRM clients..."
        onRetry={() => load(true)}
        useSkeleton
      >
        {isMobile ? (
          <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredCustomers.map((customer) => (
              <ClientCard
                key={customer.id}
                customer={customer}
                onOpen={() => {
                  setSelectedCustomer(customer);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </section>
        ) : (
          <ClientsTable
            customers={filteredCustomers}
            onOpenCustomer={(customer) => {
              setSelectedCustomer(customer);
              setDrawerOpen(true);
            }}
          />
        )}
      </DataStateWrapper>

      <ClientDetailDrawer open={drawerOpen} customer={selectedCustomer} onClose={() => setDrawerOpen(false)} />

      <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700, textAlign: "right", marginTop: 2 }}>
        {ordersCount} commandes agrégées pour générer ce CRM.
      </div>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="os-page" style={{ padding: 32, textAlign: "center", color: "var(--text-dim)" }}>Chargement CRM clients...</div>}>
      <ClientsPageInner />
    </Suspense>
  );
}
