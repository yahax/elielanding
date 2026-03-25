"use client";

import { Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import toast from "react-hot-toast";
import { OsToaster } from "@/components/ui/OsToaster";
import { EmptyState, LoadingState } from "@/components/ui/States";
import {
  addOrderNote as addOrderNoteRequest,
  assignOrder,
  fetchOrders,
  updateOrderStatus as updateOrderStatusRequest,
} from "@/lib/os/api";
import type { NormalizedOrder } from "@/lib/os/types";
import { buildFocusQueue, buildOrderFilterOptions, buildPipelineColumnStats, buildPipelineHealth, enrichOrders, applyOrderFilters, sortOrders } from "@/lib/os/orders/helpers/scoring";
import { loadOpsMeta, saveOpsMeta } from "@/lib/os/orders/helpers/storage";
import { extractOpsMetaFromOrders } from "@/lib/os/orders/helpers/ops-meta";
import {
  DEFAULT_OPERATORS,
  DEFAULT_ORDER_FILTERS_STATE,
  type EnrichedOrder,
  type OrderFiltersState,
  type OrderOperationalMetaMap,
  type OrderPriority,
} from "@/lib/os/orders/types";
import { PIPELINE_COLUMNS, getStatusLabel } from "@/lib/os/orders/helpers/status";
import { formatCurrencyMAD, formatDateTime } from "@/lib/os/orders/helpers/format";
import type { OrderStatus } from "@/lib/types";
import { STATUS_LIST } from "@/lib/types";
import { useIsMobile } from "@/hooks/useIsMobile";
import { buildPipelineQuery, parsePipelineFiltersFromSearchParams } from "@/lib/os/domain/query-filters";
import { PipelineHealthHeader } from "@/components/os/pipeline/PipelineHealthHeader";
import { PipelineColumn } from "@/components/os/pipeline/PipelineColumn";
import { PipelineCard } from "@/components/os/pipeline/PipelineCard";
import { OrderDetailsDrawer } from "@/components/os/orders/OrderDetailsDrawer";
import { NextBestActionChip } from "@/components/os/orders/NextBestActionChip";
import { PriorityScoreBadge } from "@/components/os/orders/PriorityScoreBadge";
import { RiskScoreBadge } from "@/components/os/orders/RiskScoreBadge";
import { SlaTimer } from "@/components/os/orders/SlaTimer";
import { RefreshCw, Search } from "lucide-react";

type ViewMode = "kanban" | "list" | "focus" | "urgent";

interface PipelineLocalFilters {
  search: string;
  source: string;
  city: string;
  operator: string;
  priority: "all" | OrderPriority;
  clientType: "all" | "new" | "returning";
  datePreset: OrderFiltersState["datePreset"];
  onlyUrgent: boolean;
}

const DEFAULT_PIPELINE_FILTERS: PipelineLocalFilters = {
  search: "",
  source: "all",
  city: "all",
  operator: "all",
  priority: "all",
  clientType: "all",
  datePreset: "30d",
  onlyUrgent: false,
};

function patchOrderStatus(order: NormalizedOrder, nextStatus: OrderStatus): NormalizedOrder {
  const now = new Date().toISOString();
  return {
    ...order,
    status: nextStatus,
    updated_at: now,
    confirmed_at: nextStatus === "confirmed" ? now : order.confirmed_at,
    shipped_at: nextStatus === "shipped" ? now : order.shipped_at,
    delivered_at: nextStatus === "delivered" ? now : order.delivered_at,
    canceled_at: nextStatus === "canceled" ? now : order.canceled_at,
  };
}

function mapPipelineFiltersToOrderFilters(filters: PipelineLocalFilters): OrderFiltersState {
  return {
    ...DEFAULT_ORDER_FILTERS_STATE,
    search: filters.search,
    sources: filters.source === "all" ? [] : [filters.source],
    cities: filters.city === "all" ? [] : [filters.city],
    operators: filters.operator === "all" ? [] : [filters.operator],
    priorities: filters.priority === "all" ? [] : [filters.priority],
    clientTypes: filters.clientType === "all" ? [] : [filters.clientType],
    datePreset: filters.datePreset,
    onlyUrgent: filters.onlyUrgent,
  };
}

function PipelinePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile(1024);

  const [orders, setOrders] = useState<NormalizedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [opsMeta, setOpsMeta] = useState<OrderOperationalMetaMap>({});
  const [filters, setFilters] = useState<PipelineLocalFilters>(DEFAULT_PIPELINE_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [movingOrderId, setMovingOrderId] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const hasLoadedRef = useRef(false);
  const lastQueryRef = useRef<string>("");

  const now = useMemo(() => new Date(nowTs), [nowTs]);
  const deferredSearch = useDeferredValue(filters.search);
  const orderFilters = useMemo(
    () =>
      mapPipelineFiltersToOrderFilters({
        ...filters,
        search: deferredSearch,
      }),
    [deferredSearch, filters]
  );

  useEffect(() => {
    setOpsMeta(loadOpsMeta());
  }, []);

  useEffect(() => {
    const query = searchParams.toString();
    lastQueryRef.current = query;

    const parsed = parsePipelineFiltersFromSearchParams(searchParams);
    setFilters((prev) => ({
      ...prev,
      search: parsed.search ?? "",
      source: parsed.source ?? "all",
      city: parsed.city ?? "all",
      operator: parsed.operator ?? "all",
      priority: (parsed.priority as PipelineLocalFilters["priority"] | undefined) ?? "all",
      clientType: (parsed.clientType as PipelineLocalFilters["clientType"] | undefined) ?? "all",
      datePreset: parsed.datePreset ?? "30d",
      onlyUrgent: Boolean(parsed.onlyUrgent),
    }));

    if (parsed.view) {
      setViewMode(parsed.view);
    }
  }, [searchParams]);

  useEffect(() => {
    const href = buildPipelineQuery({
      search: filters.search || undefined,
      source: filters.source !== "all" ? filters.source : undefined,
      city: filters.city !== "all" ? filters.city : undefined,
      operator: filters.operator !== "all" ? filters.operator : undefined,
      priority: filters.priority !== "all" ? filters.priority : undefined,
      clientType: filters.clientType !== "all" ? filters.clientType : undefined,
      datePreset: filters.datePreset,
      onlyUrgent: filters.onlyUrgent || undefined,
      view: viewMode,
    });

    const nextQuery = href.includes("?") ? href.split("?")[1] ?? "" : "";
    if (nextQuery === lastQueryRef.current) return;
    lastQueryRef.current = nextQuery;
    router.replace(href, { scroll: false });
  }, [filters, router, viewMode]);

  useEffect(() => {
    const tick = window.setInterval(() => setNowTs(Date.now()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (isMobile && viewMode === "kanban") {
      setViewMode("focus");
    }
  }, [isMobile, viewMode]);

  const load = useCallback(async (showToast = false) => {
    if (!hasLoadedRef.current) setLoading(true);
    else setRefreshing(true);

    try {
      const { orders: fetched } = await fetchOrders({ limit: 250, days: 120 });
      setOrders(fetched);
      setOpsMeta((prev) => {
        const next = {
          ...prev,
          ...extractOpsMetaFromOrders(fetched),
        };
        saveOpsMeta(next);
        return next;
      });
      hasLoadedRef.current = true;
      if (showToast) toast.success("Pipeline synchronisé");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur pipeline";
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upsertOpsMeta = useCallback((updater: (prev: OrderOperationalMetaMap) => OrderOperationalMetaMap) => {
    setOpsMeta((prev) => {
      const next = updater(prev);
      saveOpsMeta(next);
      return next;
    });
  }, []);

  const enrichedOrders = useMemo(() => enrichOrders(orders, opsMeta, now), [orders, opsMeta, now]);
  const filterOptions = useMemo(() => buildOrderFilterOptions(enrichedOrders), [enrichedOrders]);
  const filteredOrders = useMemo(() => sortOrders(applyOrderFilters(enrichedOrders, orderFilters, now), "priority", "desc"), [enrichedOrders, orderFilters, now]);
  const focusQueue = useMemo(() => buildFocusQueue(filteredOrders, 30), [filteredOrders]);
  const urgentQueue = useMemo(
    () =>
      [...filteredOrders]
        .filter((order) => order.isUrgent && order.status !== "delivered" && order.status !== "canceled")
        .sort((a, b) => b.priorityScore - a.priorityScore),
    [filteredOrders]
  );
  const health = useMemo(() => buildPipelineHealth(filteredOrders), [filteredOrders]);
  const columnStats = useMemo(() => buildPipelineColumnStats(filteredOrders), [filteredOrders]);

  const selectedOrder = useMemo(
    () => (selectedOrderId ? enrichedOrders.find((order) => order.id === selectedOrderId) || null : null),
    [enrichedOrders, selectedOrderId]
  );

  const activeOrder = useMemo(() => (activeId ? enrichedOrders.find((order) => order.id === activeId) || null : null), [activeId, enrichedOrders]);

  const customerHistory = useMemo(() => {
    if (!selectedOrder) return [];
    if (selectedOrder.customerKey === "") return [selectedOrder];
    return [...enrichedOrders]
      .filter((order) => order.customerKey !== "" && order.customerKey === selectedOrder.customerKey)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [enrichedOrders, selectedOrder]);

  const grouped = useMemo(() => {
    const map = new Map<OrderStatus, EnrichedOrder[]>();
    for (const status of PIPELINE_COLUMNS) map.set(status, []);
    for (const order of filteredOrders) {
      map.get(order.status)?.push(order);
    }
    return map;
  }, [filteredOrders]);

  const registerTouchFromStatusUpdate = useCallback(
    (orderId: string, nextStatus: OrderStatus) => {
      const nowIso = new Date().toISOString();
      upsertOpsMeta((prev) => {
        const current = prev[orderId] || {};
        return {
          ...prev,
          [orderId]: {
            ...current,
            callbackCount: Number(current.callbackCount ?? 0) + (nextStatus === "callback" ? 1 : 0),
            attemptCount: Number(current.attemptCount ?? 0) + 1,
            lastTouchAt: nowIso,
          },
        };
      });
    },
    [upsertOpsMeta]
  );

  const commitStatusMove = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      const previous = orders;
      setOrders((prev) => prev.map((order) => (order.id === orderId ? patchOrderStatus(order, nextStatus) : order)));
      setMovingOrderId(orderId);

      try {
        await updateOrderStatusRequest(orderId, nextStatus);
        registerTouchFromStatusUpdate(orderId, nextStatus);
        toast.success(`Statut changé: ${getStatusLabel(nextStatus)}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur de déplacement";
        toast.error(message);
        setOrders(previous);
      } finally {
        setMovingOrderId(null);
      }
    },
    [orders, registerTouchFromStatusUpdate]
  );

  const assignOperator = useCallback(
    async (orderId: string, operator: string) => {
      const normalizedOperator = operator.trim();
      if (normalizedOperator === "") return;
      const operatorId = normalizedOperator.toLowerCase().replace(/\s+/g, "_");
      const nowIso = new Date().toISOString();
      const previous = opsMeta;

      upsertOpsMeta((prev) => ({
        ...prev,
        [orderId]: {
          ...(prev[orderId] || {}),
          operator: normalizedOperator,
          assignedAt: nowIso,
          lastTouchAt: nowIso,
        },
      }));

      try {
        await assignOrder(orderId, {
          operatorId,
          operatorName: normalizedOperator,
        });
        toast.success(`Assigné à ${normalizedOperator}`);
      } catch (error) {
        setOpsMeta(previous);
        saveOpsMeta(previous);
        const message = error instanceof Error ? error.message : "Erreur d'assignation";
        toast.error(message);
      }
    },
    [opsMeta, upsertOpsMeta]
  );

  const addNote = useCallback(
    async (orderId: string, note: string) => {
      const normalizedNote = note.trim();
      if (normalizedNote === "") return;
      const nowIso = new Date().toISOString();
      const previous = opsMeta;

      upsertOpsMeta((prev) => ({
        ...prev,
        [orderId]: {
          ...(prev[orderId] || {}),
          notes: [...((prev[orderId]?.notes as string[] | undefined) || []), normalizedNote],
          lastTouchAt: nowIso,
        },
      }));

      try {
        await addOrderNoteRequest(orderId, normalizedNote);
        toast.success("Note ajoutée");
      } catch (error) {
        setOpsMeta(previous);
        saveOpsMeta(previous);
        const message = error instanceof Error ? error.message : "Erreur note";
        toast.error(message);
      }
    },
    [opsMeta, upsertOpsMeta]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const resolveDropStatus = useCallback(
    (overId: string): OrderStatus | null => {
      if (STATUS_LIST.includes(overId as OrderStatus)) return overId as OrderStatus;
      const overOrder = enrichedOrders.find((order) => order.id === overId);
      if (overOrder) return overOrder.status;
      return null;
    },
    [enrichedOrders]
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const over = event.over;
      const draggedId = String(event.active.id);
      setActiveId(null);
      if (!over) return;

      const targetStatus = resolveDropStatus(String(over.id));
      if (!targetStatus) return;

      const currentOrder = enrichedOrders.find((order) => order.id === draggedId);
      if (!currentOrder || currentOrder.status === targetStatus) return;

      await commitStatusMove(currentOrder.id, targetStatus);
    },
    [commitStatusMove, enrichedOrders, resolveDropStatus]
  );

  if (loading && orders.length === 0) {
    return <LoadingState label="Chargement du pipeline intelligent..." />;
  }

  return (
    <div className="os-page os-pipeline-page" style={{ height: "calc(100vh - 100px)", paddingBottom: isMobile ? 24 : 0 }}>
      <OsToaster />

      <PipelineHealthHeader
        health={health}
        onShowUrgent={() => {
          setFilters((prev) => ({ ...prev, onlyUrgent: true }));
          setViewMode("focus");
        }}
      />

      <div className="luxury-card os-card-subtle os-pipeline-toolbar">
        <div className="os-pipeline-filter-grid" style={{ gridTemplateColumns: isMobile ? "1fr" : "minmax(240px,1.2fr) repeat(6, minmax(0, 1fr)) auto auto" }}>
          <div className="os-pipeline-search">
            <Search size={14} className="os-pipeline-search-icon" />
            <input
              className="filter-input os-toolbar-search-input"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Recherche pipeline..."
              style={{ width: "100%", height: 38, paddingLeft: 36, minWidth: 0 }}
            />
          </div>

          <select className="filter-select os-pipeline-filter-select" value={filters.source} onChange={(event) => setFilters((prev) => ({ ...prev, source: event.target.value }))} style={{ height: 38 }}>
            <option value="all">Toutes sources</option>
            {filterOptions.sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>

          <select className="filter-select os-pipeline-filter-select" value={filters.city} onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))} style={{ height: 38 }}>
            <option value="all">Toutes villes</option>
            {filterOptions.cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select className="filter-select os-pipeline-filter-select" value={filters.operator} onChange={(event) => setFilters((prev) => ({ ...prev, operator: event.target.value }))} style={{ height: 38 }}>
            <option value="all">Tous opérateurs</option>
            {filterOptions.operators.map((operator) => (
              <option key={operator} value={operator}>
                {operator}
              </option>
            ))}
          </select>

          <select className="filter-select os-pipeline-filter-select" value={filters.priority} onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value as PipelineLocalFilters["priority"] }))} style={{ height: 38 }}>
            <option value="all">Toutes priorités</option>
            <option value="critical">Critique</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Faible</option>
          </select>

          <select className="filter-select os-pipeline-filter-select" value={filters.clientType} onChange={(event) => setFilters((prev) => ({ ...prev, clientType: event.target.value as PipelineLocalFilters["clientType"] }))} style={{ height: 38 }}>
            <option value="all">Tous clients</option>
            <option value="new">Nouveau client</option>
            <option value="returning">Récurrent</option>
          </select>

          <select className="filter-select os-pipeline-filter-select" value={filters.datePreset} onChange={(event) => setFilters((prev) => ({ ...prev, datePreset: event.target.value as PipelineLocalFilters["datePreset"] }))} style={{ height: 38 }}>
            <option value="today">Aujourd’hui</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="90d">90 jours</option>
            <option value="all">Tout</option>
          </select>

          <button
            type="button"
            className={filters.onlyUrgent ? "btn btn-primary btn-sm os-toolbar-btn" : "btn-ghost btn-sm os-toolbar-btn"}
            onClick={() => setFilters((prev) => ({ ...prev, onlyUrgent: !prev.onlyUrgent }))}
          >
            Urgentes
          </button>

          <button type="button" className="btn-ghost btn-sm os-toolbar-btn os-pipeline-refresh" onClick={() => load(true)}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="os-segmented os-pipeline-views">
          {(isMobile ? (["kanban", "focus", "urgent"] as ViewMode[]) : (["kanban", "list", "focus"] as ViewMode[])).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`os-segmented-btn ${viewMode === mode ? "is-active" : ""}`}
              onClick={() => setViewMode(mode)}
            >
              {mode === "kanban" ? (isMobile ? "Stages" : "Kanban") : mode === "list" ? "Liste" : mode === "focus" ? "Queue" : "Urgences"}
            </button>
          ))}
        </div>
      </div>

      {isMobile ? (
        <div className="os-pipeline-mobile-stats">
          {columnStats.map((column) => (
            <div key={column.status} className="os-chip">
              {getStatusLabel(column.status)} ({column.count})
            </div>
          ))}
        </div>
      ) : null}

      {filteredOrders.length === 0 ? (
        <EmptyState title="Pipeline vide" copy="Ajustez vos filtres pour afficher les commandes du pipeline." />
      ) : viewMode === "kanban" ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="os-pipeline-kanban">
            {PIPELINE_COLUMNS.map((status) => {
              const stats = columnStats.find((item) => item.status === status);
              const items = grouped.get(status) || [];
              return (
                <PipelineColumn
                  key={status}
                  status={status}
                  count={stats?.count || 0}
                  urgentCount={stats?.urgentCount || 0}
                  avgElapsedMinutes={stats?.avgElapsedMinutes || 0}
                  stagnationCount={stats?.stagnationCount || 0}
                >
                  <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                      <PipelineCard key={item.id} order={item} onOpenDetails={(order) => { setSelectedOrderId(order.id); setDrawerOpen(true); }} />
                    ))}
                  </SortableContext>
                </PipelineColumn>
              );
            })}
          </div>

          <DragOverlay>{activeOrder ? <PipelineCard order={activeOrder} onOpenDetails={() => undefined} isOverlay /> : null}</DragOverlay>
        </DndContext>
      ) : viewMode === "list" ? (
        <div className="table-wrap os-table-shell os-pipeline-list-shell">
          <table className="data-table os-pipeline-list-table">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Ville</th>
                <th>Valeur</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th>Risque</th>
                <th>SLA</th>
                <th>Action recommandée</th>
                <th className="os-pipeline-list-action-head">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className={`os-table-row-interactive ${movingOrderId === order.id ? "is-updating" : ""}`} style={{ opacity: movingOrderId === order.id ? 0.6 : 1 }}>
                  <td>
                    <div className="os-pipeline-list-meta">
                      <span className="os-pipeline-list-id">#{order.id.slice(-8).toUpperCase()}</span>
                      <span className="os-pipeline-list-sub">{formatDateTime(order.created_at)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="os-pipeline-list-meta os-pipeline-list-meta-customer">
                      <span className="os-pipeline-list-customer">{order.customer_name}</span>
                      <span className="os-pipeline-list-sub">{order.phone}</span>
                    </div>
                  </td>
                  <td>{order.city || "-"}</td>
                  <td className="os-pipeline-list-value">{formatCurrencyMAD(order.estimatedValue)}</td>
                  <td>{getStatusLabel(order.status)}</td>
                  <td>
                    <PriorityScoreBadge priority={order.priority} score={order.priorityScore} compact />
                  </td>
                  <td>
                    <RiskScoreBadge risk={order.risk} score={order.riskScore} compact />
                  </td>
                  <td>
                    <SlaTimer elapsedMinutes={order.elapsedMinutes} slaMinutes={order.slaMinutes} level={order.slaLevel} compact />
                  </td>
                  <td>
                    <NextBestActionChip action={order.nextBestAction} compact />
                  </td>
                  <td className="os-pipeline-list-action-cell">
                    <button type="button" className="btn btn-primary btn-sm os-table-open" onClick={() => { setSelectedOrderId(order.id); setDrawerOpen(true); }}>
                      Ouvrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewMode === "urgent" ? (
        <div className="os-pipeline-grid">
          {urgentQueue.map((order) => (
            <PipelineCard key={order.id} order={order} onOpenDetails={(item) => { setSelectedOrderId(item.id); setDrawerOpen(true); }} />
          ))}
          {urgentQueue.length === 0 ? (
            <div className="os-pipeline-grid-empty">
              Aucune urgence active dans les filtres courants.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="os-pipeline-grid">
          {focusQueue.map((order) => (
            <PipelineCard key={order.id} order={order} onOpenDetails={(item) => { setSelectedOrderId(item.id); setDrawerOpen(true); }} />
          ))}
        </div>
      )}

      <OrderDetailsDrawer
        order={selectedOrder}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateStatus={async (orderId, nextStatus) => {
          await commitStatusMove(orderId, nextStatus);
        }}
        onAssignOperator={assignOperator}
        onAddNote={addNote}
        customerHistory={customerHistory}
        availableOperators={Array.from(new Set([...DEFAULT_OPERATORS, ...filterOptions.operators]))}
      />
    </div>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={<div className="os-page os-suspense-state">Chargement pipeline...</div>}>
      <PipelinePageInner />
    </Suspense>
  );
}
