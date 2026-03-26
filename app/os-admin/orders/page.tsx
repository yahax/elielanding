"use client";

import { Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import type { NormalizedOrder } from "@/lib/os/types";
import {
  addOrderNote as addOrderNoteRequest,
  assignOrder,
  bulkUpdateOrderStatus,
  fetchAuditLog,
  fetchOrders,
  prepareOrderWhatsappRelaunch,
  updateOrderStatus,
} from "@/lib/os/api";
import {
  buildOrdersQuery,
  parseOrdersFiltersFromSearchParams,
  type OrdersDeepLinkFilters,
} from "@/lib/os/domain/query-filters";
import { buildOrderFilterOptions, buildOrdersSummaryStats, enrichOrders, applyOrderFilters, sortOrders } from "@/lib/os/orders/helpers/scoring";
import { phoneHref, whatsappHref } from "@/lib/os/orders/helpers/format";
import { loadOpsMeta, loadSavedViews, saveOpsMeta, saveSavedViews } from "@/lib/os/orders/helpers/storage";
import { extractOpsMetaFromOrders } from "@/lib/os/orders/helpers/ops-meta";
import {
  DEFAULT_OPERATORS,
  DEFAULT_ORDER_FILTERS_STATE,
  type EnrichedOrder,
  type OrderFiltersState,
  type OrderOperationalMetaMap,
  type OrderSavedView,
  type OrderSortField,
  type SortDirection,
  type SummaryMetricKey,
} from "@/lib/os/orders/types";
import { normalizeOrderStatus, STATUS_LIST, type OrderStatus } from "@/lib/types";
import { useIsMobile } from "@/hooks/useIsMobile";
import { OsToaster } from "@/components/ui/OsToaster";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { OrdersCommandBar } from "@/components/os/orders/OrdersCommandBar";
import { OrdersSummaryStrip } from "@/components/os/orders/OrdersSummaryStrip";
import { OrdersFilters } from "@/components/os/orders/OrdersFilters";
import { OrdersTable, type RowAction } from "@/components/os/orders/OrdersTable";
import { BulkActionsBar } from "@/components/os/orders/BulkActionsBar";
import { MobileOrderCard, type MobileOrderAction } from "@/components/os/orders/MobileOrderCard";
import { MobileOrderActionBar } from "@/components/os/orders/MobileOrderActionBar";
import { MobileOrdersFiltersDrawer } from "@/components/os/orders/MobileOrdersFiltersDrawer";
import { OrderDetailsDrawer } from "@/components/os/orders/OrderDetailsDrawer";
import { SaveViewDialog } from "@/components/os/orders/SaveViewDialog";
import { MobileUrgencyBanner } from "@/components/os/mobile/MobileUrgencyBanner";
import { MobileOrdersQueue } from "@/components/os/mobile/MobileOrdersQueue";
import { MobileWarRoomPanel } from "@/components/os/mobile/MobileWarRoomPanel";

type SortState = {
  field: OrderSortField;
  direction: SortDirection;
};

type DrawerAuditItem = {
  id: string;
  at: string;
  label: string;
  description?: string;
};

const INITIAL_RENDER_DESKTOP = 80;
const INITIAL_RENDER_MOBILE = 24;
const RENDER_STEP_DESKTOP = 80;
const RENDER_STEP_MOBILE = 24;

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

function createExportRows(orders: EnrichedOrder[]) {
  return orders.map((order) => ({
    commande: order.id,
    date: order.created_at,
    client: order.customer_name || "",
    telephone: order.phone || "",
    ville: order.city || "",
    pack: order.pack_type,
    source: order.source,
    valeur: order.estimatedValue,
    statut: order.status,
    priorite: order.priority,
    risque: order.risk,
    operateur: order.operator || "Non assigné",
    action_suivante: order.nextBestAction,
    sla_minutes: order.slaMinutes,
    elapsed_minutes: order.elapsedMinutes,
  }));
}

function buildSummaryScopeFilters(filters: OrderFiltersState): OrderFiltersState {
  return {
    ...filters,
    statuses: [],
    onlyUrgent: false,
  };
}

function mapDeepLinkToOrderFilters(parsed: OrdersDeepLinkFilters): Partial<OrderFiltersState> {
  const statusSet = new Set(STATUS_LIST);
  const acceptedStatusValues = new Set([
    "new",
    "pending",
    "to_confirm",
    "confirmed",
    "callback",
    "cancelled",
    "canceled",
    "shipped",
    "delivered",
  ]);
  const statuses = Array.from(
    new Set(
      (parsed.statuses ?? [])
        .map((status) => status.trim().toLowerCase())
        .filter((status) => acceptedStatusValues.has(status))
        .map((status) => normalizeOrderStatus(status))
        .filter((status): status is OrderStatus => statusSet.has(status))
    )
  );
  const hasUrgentStatusAlias = (parsed.statuses ?? []).includes("urgent");

  return {
    search: parsed.search ?? "",
    statuses,
    sources: parsed.sources ?? [],
    cities: parsed.cities ?? [],
    packs: parsed.packs ?? [],
    operators: parsed.operators ?? [],
    priorities: (parsed.priorities ?? []) as OrderFiltersState["priorities"],
    risks: (parsed.risks ?? []) as OrderFiltersState["risks"],
    clientTypes: (parsed.clientTypes ?? []) as OrderFiltersState["clientTypes"],
    onlyUrgent: Boolean(parsed.onlyUrgent || hasUrgentStatusAlias),
    onlyHighValue: Boolean(parsed.onlyHighValue),
    onlyAtRisk: Boolean(parsed.onlyAtRisk),
    includeArchived: Boolean(parsed.includeArchived),
    datePreset: parsed.datePreset ?? DEFAULT_ORDER_FILTERS_STATE.datePreset,
    fromDate: parsed.fromDate ?? null,
    toDate: parsed.toDate ?? null,
  };
}

function mapOrderFiltersToDeepLink(filters: OrderFiltersState): OrdersDeepLinkFilters {
  return {
    search: filters.search.trim() || undefined,
    statuses: filters.statuses.length > 0 ? filters.statuses : undefined,
    sources: filters.sources.length > 0 ? filters.sources : undefined,
    cities: filters.cities.length > 0 ? filters.cities : undefined,
    packs: filters.packs.length > 0 ? filters.packs : undefined,
    operators: filters.operators.length > 0 ? filters.operators : undefined,
    priorities: filters.priorities.length > 0 ? filters.priorities : undefined,
    risks: filters.risks.length > 0 ? filters.risks : undefined,
    clientTypes: filters.clientTypes.length > 0 ? filters.clientTypes : undefined,
    onlyUrgent: filters.onlyUrgent || undefined,
    onlyHighValue: filters.onlyHighValue || undefined,
    onlyAtRisk: filters.onlyAtRisk || undefined,
    includeArchived: filters.includeArchived || undefined,
    datePreset: filters.datePreset !== DEFAULT_ORDER_FILTERS_STATE.datePreset ? filters.datePreset : undefined,
    fromDate: filters.fromDate ?? undefined,
    toDate: filters.toDate ?? undefined,
  };
}

function parseAuditTimeline(entries: Array<Record<string, unknown>>): DrawerAuditItem[] {
  const parsed: DrawerAuditItem[] = [];

  entries.forEach((entry, index) => {
    const rawId = typeof entry.id === "string" ? entry.id : `audit-${index}`;
    const createdAt =
      typeof entry.createdAt === "string"
        ? entry.createdAt
        : typeof entry.created_at === "string"
          ? entry.created_at
          : null;
    if (!createdAt) return;

    const label =
      typeof entry.label === "string"
        ? entry.label
        : typeof entry.actionType === "string"
          ? entry.actionType
          : typeof entry.action_type === "string"
            ? entry.action_type
            : "Action opérateur";
    const details =
      typeof entry.details === "string"
        ? entry.details
        : typeof entry.metadata === "string"
          ? entry.metadata
          : undefined;

    parsed.push({
      id: `audit-${rawId}`,
      at: createdAt,
      label,
      description: details,
    });
  });

  return parsed.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

function OrdersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile(1024);

  const [orders, setOrders] = useState<NormalizedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<OrderFiltersState>(DEFAULT_ORDER_FILTERS_STATE);
  const [sort, setSort] = useState<SortState>({ field: "created_at", direction: "desc" });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMetric, setActiveMetric] = useState<SummaryMetricKey | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [opsMeta, setOpsMeta] = useState<OrderOperationalMetaMap>({});
  const [savedViews, setSavedViews] = useState<OrderSavedView[]>([]);
  const [savedViewsOpen, setSavedViewsOpen] = useState(false);
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [saveViewName, setSaveViewName] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [drawerAuditTimeline, setDrawerAuditTimeline] = useState<DrawerAuditItem[]>([]);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [renderCount, setRenderCount] = useState<number>(INITIAL_RENDER_DESKTOP);
  const hasLoadedRef = useRef(false);
  const lastQueryRef = useRef<string>("");

  const now = useMemo(() => new Date(nowTs), [nowTs]);
  const deferredSearch = useDeferredValue(filters.search);
  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      search: deferredSearch,
    }),
    [deferredSearch, filters]
  );

  useEffect(() => {
    setOpsMeta(loadOpsMeta());
    setSavedViews(loadSavedViews());
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => setNowTs(Date.now()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const query = searchParams.toString();
    lastQueryRef.current = query;
    const parsed = parseOrdersFiltersFromSearchParams(searchParams);
    const patch = mapDeepLinkToOrderFilters(parsed);

    setFilters((prev) => {
      const next: OrderFiltersState = {
        ...prev,
        ...patch,
      };
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });
  }, [searchParams]);

  useEffect(() => {
    const href = buildOrdersQuery(mapOrderFiltersToDeepLink(filters));
    const nextQuery = href.includes("?") ? href.split("?")[1] ?? "" : "";
    if (nextQuery === lastQueryRef.current) return;
    lastQueryRef.current = nextQuery;
    router.replace(href, { scroll: false });
  }, [filters, router]);

  const load = useCallback(async (showToast = false) => {
    if (!hasLoadedRef.current) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const { orders: fetched } = await fetchOrders({ limit: 300, days: 120 });
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
      if (showToast) toast.success("Flux commandes synchronisé");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur de chargement";
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const validIds = new Set(orders.map((order) => order.id));
    setSelectedIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [orders]);

  useEffect(() => {
    setRenderCount(isMobile ? INITIAL_RENDER_MOBILE : INITIAL_RENDER_DESKTOP);
  }, [isMobile, filters, sort.field, sort.direction]);

  useEffect(() => {
    if (!isDrawerOpen || !selectedOrderId) {
      setDrawerAuditTimeline([]);
      return;
    }

    let cancelled = false;
    const loadAudit = async () => {
      try {
        const response = await fetchAuditLog({
          entityType: "order",
          entityId: selectedOrderId,
          limit: 40,
        });

        if (!cancelled) {
          setDrawerAuditTimeline(parseAuditTimeline(response.entries));
        }
      } catch {
        if (!cancelled) {
          setDrawerAuditTimeline([]);
        }
      }
    };

    void loadAudit();
    return () => {
      cancelled = true;
    };
  }, [isDrawerOpen, selectedOrderId]);

  const upsertOpsMeta = useCallback((updater: (prev: OrderOperationalMetaMap) => OrderOperationalMetaMap) => {
    setOpsMeta((prev) => {
      const next = updater(prev);
      saveOpsMeta(next);
      return next;
    });
  }, []);

  const setOrdersStatusLocally = useCallback((ids: string[], nextStatus: OrderStatus) => {
    const idSet = new Set(ids);
    setOrders((prev) => prev.map((order) => (idSet.has(order.id) ? patchOrderStatus(order, nextStatus) : order)));
  }, []);

  const markOperatorTouch = useCallback(
    (ids: string[], nextStatus: OrderStatus) => {
      const nowIso = new Date().toISOString();
      upsertOpsMeta((prev) => {
        const next: OrderOperationalMetaMap = { ...prev };

        for (const id of ids) {
          const current = prev[id] || {};
          const callbackIncrement = nextStatus === "callback" ? 1 : 0;
          next[id] = {
            ...current,
            callbackCount: Number(current.callbackCount ?? 0) + callbackIncrement,
            attemptCount: Number(current.attemptCount ?? 0) + 1,
            lastTouchAt: nowIso,
          };
        }

        return next;
      });
    },
    [upsertOpsMeta]
  );

  const applySingleStatus = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      const previous = orders;
      setUpdatingIds((prev) => Array.from(new Set([...prev, orderId])));
      setOrdersStatusLocally([orderId], nextStatus);

      try {
        await updateOrderStatus(orderId, nextStatus);
        markOperatorTouch([orderId], nextStatus);
        toast.success(`Commande mise à jour: ${nextStatus}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur de mise à jour";
        toast.error(message);
        setOrders(previous);
      } finally {
        setUpdatingIds((prev) => prev.filter((id) => id !== orderId));
      }
    },
    [markOperatorTouch, orders, setOrdersStatusLocally]
  );

  const applyBulkStatus = useCallback(
    async (nextStatus: OrderStatus) => {
      if (selectedIds.length === 0) return;
      const previous = orders;

      setBulkLoading(true);
      setOrdersStatusLocally(selectedIds, nextStatus);
      try {
        await bulkUpdateOrderStatus(selectedIds, nextStatus);
        markOperatorTouch(selectedIds, nextStatus);
        toast.success(`${selectedIds.length} commandes mises à jour`);
        setSelectedIds([]);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur bulk action";
        toast.error(message);
        setOrders(previous);
      } finally {
        setBulkLoading(false);
      }
    },
    [markOperatorTouch, orders, selectedIds, setOrdersStatusLocally]
  );

  const assignOperator = useCallback(
    async (ids: string[], operator: string) => {
      if (ids.length === 0 || operator.trim() === "") return;
      const operatorId = operator.trim().toLowerCase().replace(/\s+/g, "_");
      const nowIso = new Date().toISOString();
      const previous = opsMeta;

      upsertOpsMeta((prev) => {
        const next: OrderOperationalMetaMap = { ...prev };
        for (const id of ids) {
          const current = prev[id] || {};
          next[id] = { ...current, operator, assignedAt: nowIso, lastTouchAt: nowIso };
        }
        return next;
      });
      try {
        await Promise.all(
          ids.map((id) =>
            assignOrder(id, {
              operatorId,
              operatorName: operator.trim(),
            })
          )
        );
        toast.success(`Assigné à ${operator}`);
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
      if (note.trim() === "") return;
      const nowIso = new Date().toISOString();
      const previous = opsMeta;

      upsertOpsMeta((prev) => {
        const current = prev[orderId] || {};
        return {
          ...prev,
          [orderId]: {
            ...current,
            notes: [...(current.notes || []), note],
            lastTouchAt: nowIso,
          },
        };
      });
      try {
        await addOrderNoteRequest(orderId, note.trim());
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

  const enrichedOrders = useMemo(() => enrichOrders(orders, opsMeta, now), [orders, opsMeta, now]);
  const filterOptions = useMemo(() => buildOrderFilterOptions(enrichedOrders), [enrichedOrders]);
  const summaryScope = useMemo(
    () => applyOrderFilters(enrichedOrders, buildSummaryScopeFilters(effectiveFilters), now),
    [effectiveFilters, enrichedOrders, now]
  );
  const summaryStats = useMemo(() => buildOrdersSummaryStats(summaryScope, now), [summaryScope, now]);

  const filteredOrders = useMemo(() => {
    const scoped = applyOrderFilters(enrichedOrders, effectiveFilters, now);
    return sortOrders(scoped, sort.field, sort.direction);
  }, [effectiveFilters, enrichedOrders, now, sort]);
  const renderedOrders = useMemo(() => filteredOrders.slice(0, renderCount), [filteredOrders, renderCount]);
  const hasMoreRenderedOrders = renderedOrders.length < filteredOrders.length;
  const remainingOrdersCount = Math.max(filteredOrders.length - renderedOrders.length, 0);

  const mobileUrgentQueue = useMemo(
    () =>
      [...filteredOrders]
        .filter((order) => order.isUrgent && order.status !== "delivered" && order.status !== "canceled")
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 8),
    [filteredOrders]
  );

  const mobileNextQueue = useMemo(
    () =>
      [...filteredOrders]
        .filter((order) => order.status === "new" || order.status === "to_confirm" || order.status === "callback")
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 8),
    [filteredOrders]
  );

  const callbackOverdueCount = useMemo(
    () => filteredOrders.filter((order) => order.status === "callback" && order.elapsedMinutes >= 180).length,
    [filteredOrders]
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const visibleSelectedCount = useMemo(() => filteredOrders.filter((order) => selectedSet.has(order.id)).length, [filteredOrders, selectedSet]);
  const allSelected = filteredOrders.length > 0 && visibleSelectedCount === filteredOrders.length;
  const selectedOrder = useMemo(
    () => (selectedOrderId ? enrichedOrders.find((order) => order.id === selectedOrderId) || null : null),
    [enrichedOrders, selectedOrderId]
  );

  const customerHistory = useMemo(() => {
    if (!selectedOrder) return [];
    if (selectedOrder.customerKey === "") return [selectedOrder];
    return [...enrichedOrders]
      .filter((order) => order.customerKey !== "" && order.customerKey === selectedOrder.customerKey)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [enrichedOrders, selectedOrder]);

  const quickFilters = useMemo(
    () => [
      {
        id: "q-to-confirm",
        label: "À confirmer",
        active: filters.statuses.includes("to_confirm"),
        onClick: () =>
          setFilters((prev) => ({
            ...prev,
            statuses: prev.statuses.includes("to_confirm") ? prev.statuses.filter((status) => status !== "to_confirm") : [...prev.statuses, "to_confirm"],
          })),
      },
      {
        id: "q-callback",
        label: "Callbacks",
        active: filters.statuses.includes("callback"),
        onClick: () =>
          setFilters((prev) => ({
            ...prev,
            statuses: prev.statuses.includes("callback") ? prev.statuses.filter((status) => status !== "callback") : [...prev.statuses, "callback"],
          })),
      },
      {
        id: "q-urgent",
        label: "Urgentes",
        active: filters.onlyUrgent,
        onClick: () => setFilters((prev) => ({ ...prev, onlyUrgent: !prev.onlyUrgent })),
      },
      {
        id: "q-high-value",
        label: "Forte valeur",
        active: filters.onlyHighValue,
        onClick: () => setFilters((prev) => ({ ...prev, onlyHighValue: !prev.onlyHighValue })),
      },
    ],
    [filters]
  );

  const handleMetricClick = useCallback((metric: SummaryMetricKey) => {
    if (activeMetric === metric) {
      setActiveMetric(null);
      setFilters((prev) => ({
        ...prev,
        statuses: [],
        onlyUrgent: false,
        datePreset: prev.datePreset === "today" ? "30d" : prev.datePreset,
      }));
      return;
    }

    setActiveMetric(metric);
    setFilters((prev) => {
      const next: OrderFiltersState = {
        ...prev,
        statuses: [],
        onlyUrgent: false,
      };

      switch (metric) {
        case "new_orders":
          next.statuses = ["new"];
          break;
        case "to_confirm":
          next.statuses = ["to_confirm"];
          break;
        case "callbacks":
          next.statuses = ["callback"];
          break;
        case "urgent":
          next.onlyUrgent = true;
          break;
        case "confirmed_today":
          next.statuses = ["confirmed"];
          next.datePreset = "today";
          break;
        case "canceled_today":
          next.statuses = ["canceled"];
          next.datePreset = "today";
          break;
        default:
          break;
      }

      return next;
    });
  }, [activeMetric]);

  const handleSortChange = useCallback((field: OrderSortField) => {
    setSort((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { field, direction: "desc" };
    });
  }, []);

  const handleRowAction = useCallback(
    async (order: EnrichedOrder, action: RowAction | MobileOrderAction) => {
      switch (action) {
        case "confirm":
          await applySingleStatus(order.id, "confirmed");
          break;
        case "callback":
          await applySingleStatus(order.id, "callback");
          break;
        case "shipped":
          await applySingleStatus(order.id, "shipped");
          break;
        case "cancel":
          await applySingleStatus(order.id, "canceled");
          break;
        case "whatsapp": {
          try {
            await prepareOrderWhatsappRelaunch(order.id);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Impossible de préparer WhatsApp";
            toast.error(message);
          }
          const href = whatsappHref(order.phone);
          if (href) {
            window.open(href, "_blank", "noopener,noreferrer");
          } else {
            toast.error("Téléphone indisponible");
          }
          break;
        }
        case "call": {
          const href = phoneHref(order.phone);
          if (href) {
            window.location.href = href;
          } else {
            toast.error("Téléphone indisponible");
          }
          break;
        }
        case "copy_phone":
          if (order.phone) {
            await navigator.clipboard.writeText(order.phone);
            toast.success("Téléphone copié");
          } else {
            toast.error("Téléphone indisponible");
          }
          break;
        case "details":
          setSelectedOrderId(order.id);
          setDrawerOpen(true);
          break;
        default:
          break;
      }
    },
    [applySingleStatus]
  );

  const openSaveCurrentViewDialog = useCallback(() => {
    setSaveViewName("");
    setSaveViewDialogOpen(true);
  }, []);

  const confirmSaveCurrentView = useCallback(() => {
    const normalized = saveViewName.trim();
    if (normalized === "") {
      toast.error("Nom de vue requis");
      return;
    }

    const nextView: OrderSavedView = {
      id: crypto.randomUUID(),
      name: normalized,
      filters,
      createdAt: new Date().toISOString(),
    };

    setSavedViews((prev) => {
      const next = [nextView, ...prev].slice(0, 12);
      saveSavedViews(next);
      return next;
    });
    setSaveViewDialogOpen(false);
    setSaveViewName("");
    toast.success("Vue sauvegardée");
  }, [filters, saveViewName]);

  const deleteSavedView = useCallback((viewId: string) => {
    setSavedViews((prev) => {
      const next = prev.filter((view) => view.id !== viewId);
      saveSavedViews(next);
      return next;
    });
  }, []);

  const exportSelection = useCallback(() => {
    const selected = filteredOrders.filter((order) => selectedSet.has(order.id));
    const exportOrders = selected.length > 0 ? selected : filteredOrders;

    if (exportOrders.length === 0) {
      toast.error("Aucune commande à exporter");
      return;
    }

    const rows = createExportRows(exportOrders);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "orders");

    XLSX.writeFile(workbook, `orders-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Export terminé");
  }, [filteredOrders, selectedSet]);

  if (loading && orders.length === 0) {
    return <LoadingState label="Chargement du moteur Orders..." />;
  }

  return (
    <div className="os-page os-orders-page" style={{ paddingBottom: isMobile ? 96 : 24 }}>
      <OsToaster />

      <OrdersCommandBar
        filteredCount={filteredOrders.length}
        search={filters.search}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        onRefresh={() => load(true)}
        refreshing={refreshing}
        quickFilters={quickFilters}
        hasSelection={selectedIds.length > 0}
        selectionCount={selectedIds.length}
        onOpenBulkActions={() => {
          if (selectedIds.length === 0) toast("Sélectionnez des commandes d'abord");
        }}
        onOpenSavedViews={() => setSavedViewsOpen((prev) => !prev)}
        onSaveCurrentView={openSaveCurrentViewDialog}
        onOpenMobileFilters={() => setMobileFiltersOpen(true)}
        isMobile={isMobile}
      />

      {savedViewsOpen ? (
        <div className="luxury-card os-card-subtle os-saved-views-panel" style={{ padding: 14, borderRadius: 16 }}>
          <div className="os-saved-views-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div className="os-saved-views-title" style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>Vues sauvegardées</div>
            <button type="button" className="btn-ghost btn-sm os-saved-views-create" onClick={openSaveCurrentViewDialog}>
              Sauver vue courante
            </button>
          </div>

          {savedViews.length === 0 ? (
            <div className="os-saved-views-empty" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>Aucune vue enregistrée pour le moment.</div>
          ) : (
            <div className="os-saved-views-list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {savedViews.map((view) => (
                <div key={view.id} className="os-card-interactive os-saved-view-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, border: "1px solid var(--border)", borderRadius: 12, padding: "8px 10px" }}>
                  <div className="os-saved-view-main" style={{ minWidth: 0 }}>
                    <div className="os-saved-view-name" style={{ fontWeight: 800, color: "var(--text)", fontSize: 13 }}>{view.name}</div>
                    <div className="os-saved-view-date" style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>{new Date(view.createdAt).toLocaleString("fr-MA")}</div>
                  </div>
                  <div className="os-saved-view-actions" style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="btn-ghost btn-sm os-saved-view-btn"
                      onClick={() => {
                        setFilters(view.filters);
                        setSavedViewsOpen(false);
                        toast.success(`Vue chargée: ${view.name}`);
                      }}
                    >
                      Appliquer
                    </button>
                    <button type="button" className="btn-ghost btn-sm os-saved-view-btn" onClick={() => deleteSavedView(view.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <OrdersSummaryStrip stats={summaryStats} activeMetric={activeMetric} onMetricClick={handleMetricClick} />

      {!isMobile ? (
        <OrdersFilters filters={filters} options={filterOptions} onChange={setFilters} onReset={() => setFilters(DEFAULT_ORDER_FILTERS_STATE)} />
      ) : null}

      <MobileOrdersFiltersDrawer isOpen={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)}>
        <OrdersFilters
          compact
          filters={filters}
          options={filterOptions}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_ORDER_FILTERS_STATE)}
        />
      </MobileOrdersFiltersDrawer>

      {filteredOrders.length === 0 ? (
        <EmptyState title="Aucune commande filtrée" copy="Ajustez les filtres ou la recherche pour voir les commandes à traiter." />
      ) : isMobile ? (
        <div className="os-orders-mobile-list" style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 80 }}>
          <MobileWarRoomPanel urgentCountHint={mobileUrgentQueue.length}>
            <MobileUrgencyBanner urgentCount={mobileUrgentQueue.length} callbackOverdue={callbackOverdueCount} />
          </MobileWarRoomPanel>

          <MobileOrdersQueue
            title="Queue à traiter ensuite"
            orders={mobileNextQueue}
            onOpenOrder={(orderId) => {
              const order = filteredOrders.find((item) => item.id === orderId);
              if (order) {
                setSelectedOrderId(order.id);
                setDrawerOpen(true);
              }
            }}
          />

          {renderedOrders.map((order) => (
            <MobileOrderCard key={order.id} order={order} selected={selectedSet.has(order.id)} onSelect={(id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))} onAction={handleRowAction} />
          ))}
        </div>
      ) : (
        <OrdersTable
          orders={renderedOrders}
          selectedIds={selectedSet}
          allSelected={allSelected}
          onToggleSelect={(orderId) =>
            setSelectedIds((prev) => (prev.includes(orderId) ? prev.filter((item) => item !== orderId) : [...prev, orderId]))
          }
          onToggleSelectAll={() => setSelectedIds(allSelected ? [] : filteredOrders.map((order) => order.id))}
          onSortChange={handleSortChange}
          sortField={sort.field}
          sortDirection={sort.direction}
          onAction={handleRowAction}
          isOrderUpdating={(orderId) => updatingIds.includes(orderId)}
        />
      )}

      {hasMoreRenderedOrders ? (
        <div className="os-orders-load-more" style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <button
            type="button"
            className="btn-ghost os-orders-load-more-btn"
            onClick={() => setRenderCount((prev) => prev + (isMobile ? RENDER_STEP_MOBILE : RENDER_STEP_DESKTOP))}
          >
            Afficher plus ({remainingOrdersCount} restantes)
          </button>
        </div>
      ) : null}

      {selectedIds.length > 0 ? (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          operatorOptions={Array.from(new Set([...DEFAULT_OPERATORS, ...filterOptions.operators]))}
          onClear={() => setSelectedIds([])}
          onAssignOperator={(operator) => assignOperator(selectedIds, operator)}
          onChangeStatus={applyBulkStatus}
          onMarkCallback={() => applyBulkStatus("callback")}
          onExport={exportSelection}
          onTag={() => {
            toast("Tagging bulk bientôt disponible");
          }}
          onArchive={() => {
            toast("Archivage bulk bientôt disponible");
          }}
          taggingEnabled={false}
          archivingEnabled={false}
          loading={bulkLoading}
        />
      ) : null}

      {isMobile ? (
        <MobileOrderActionBar
          selectedCount={selectedIds.length}
          onOpenFilters={() => setMobileFiltersOpen(true)}
          onOpenViews={() => setSavedViewsOpen((prev) => !prev)}
          onRefresh={() => load(true)}
          refreshing={refreshing}
        />
      ) : null}

      <SaveViewDialog
        isOpen={saveViewDialogOpen}
        name={saveViewName}
        onNameChange={setSaveViewName}
        onClose={() => setSaveViewDialogOpen(false)}
        onConfirm={confirmSaveCurrentView}
      />

      <OrderDetailsDrawer
        order={selectedOrder}
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateStatus={async (orderId, status) => {
          await applySingleStatus(orderId, status);
        }}
        onAssignOperator={(orderId, operator) => assignOperator([orderId], operator)}
        onAddNote={addNote}
        customerHistory={customerHistory}
        availableOperators={Array.from(new Set([...DEFAULT_OPERATORS, ...filterOptions.operators]))}
        auditTimeline={drawerAuditTimeline}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="os-page os-suspense-state" style={{ padding: 32, textAlign: "center", color: "var(--text-dim)" }}>Chargement moteur ordres...</div>}>
      <OrdersPageInner />
    </Suspense>
  );
}
