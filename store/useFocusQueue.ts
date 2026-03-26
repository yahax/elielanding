"use client";

import { create } from "zustand";
import {
  cancelOrder as cancelOrderApi,
  fetchOrders,
  prepareOrderWhatsappRelaunch,
  updateOrderStatus,
} from "@/lib/os/api";
import { normalizePhone } from "@/lib/os/orders/helpers/format";
import type { NormalizedOrder } from "@/lib/os/types";
import type { OrderStatus } from "@/lib/types";

export type FocusTab = "direct" | "callbacks" | "history";
export type WhatsAppTemplateId = "confirmation" | "no_answer" | "callback" | "reminder";

export interface FocusOrderMeta {
  touchedAt?: string;
  messageSentAt?: string;
  messageTemplate?: WhatsAppTemplateId;
  messagePreview?: string;
  callbackAt?: string | null;
  cancelReason?: string | null;
}

interface FocusSelection {
  activeTab: FocusTab;
  activeOrderId: string | null;
}

interface StatusMutationInput {
  orderId: string;
  targetStatus: OrderStatus;
  reason?: string | null;
  callbackAt?: string | null;
}

interface FocusQueueState {
  hydrated: boolean;
  loading: boolean;
  preloading: boolean;
  error: string | null;
  activeTab: FocusTab;
  activeOrderId: string | null;
  directQueue: NormalizedOrder[];
  callbackQueue: NormalizedOrder[];
  historyToday: NormalizedOrder[];
  orderMeta: Record<string, FocusOrderMeta>;
  selectedTemplateByOrder: Record<string, WhatsAppTemplateId>;
  pendingOrderIds: Record<string, boolean>;
  page: number;
  hasMore: boolean;
  bootstrap: () => Promise<void>;
  preloadNext: (minimumReady?: number) => Promise<void>;
  setActiveTab: (tab: FocusTab) => void;
  setActiveOrder: (orderId: string | null) => void;
  nextOrder: () => void;
  setTemplate: (orderId: string, template: WhatsAppTemplateId) => void;
  sendWhatsApp: (orderId: string, template?: WhatsAppTemplateId) => string | null;
  buildWhatsAppMessage: (order: NormalizedOrder, template?: WhatsAppTemplateId) => string;
  confirmOrder: (orderId: string) => Promise<void>;
  callbackOrder: (orderId: string, callbackAt?: string | null) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string | null) => Promise<void>;
}

const LIVE_STATUS_QUERY = "new,to_confirm,callback";
const HISTORY_STATUS_QUERY = "confirmed,canceled";
const LIVE_PAGE_LIMIT = 50;
const PRELOAD_MINIMUM = 5;
const MAX_HISTORY_ENTRIES = 40;

const WHATSAPP_TEMPLATES: Record<WhatsAppTemplateId, string> = {
  confirmation: "Bonjour {{name}}, votre commande {{products}} pour {{city}} est prete. Total {{total}} MAD. Confirmation ?",
  no_answer:
    "Bonjour {{name}}, nous n'avons pas reussi a vous joindre pour votre commande {{products}} ({{total}} MAD). Repondez a ce message pour confirmer.",
  callback:
    "Bonjour {{name}}, nous vous rappelons {{callbackAt}} pour confirmer la commande {{products}}. Total {{total}} MAD.",
  reminder:
    "Rappel {{name}}: votre commande {{products}} vers {{city}} attend encore votre confirmation. Total {{total}} MAD.",
};

function timestampFromIso(iso: string | null | undefined): number {
  if (!iso) return 0;
  const time = new Date(iso).getTime();
  return Number.isFinite(time) ? time : 0;
}

function sortDirectQueue(orders: NormalizedOrder[]): NormalizedOrder[] {
  return [...orders].sort((a, b) => timestampFromIso(b.created_at) - timestampFromIso(a.created_at));
}

function sortCallbackQueue(orders: NormalizedOrder[], meta: Record<string, FocusOrderMeta>): NormalizedOrder[] {
  return [...orders].sort((a, b) => {
    const aCallback = timestampFromIso(meta[a.id]?.callbackAt ?? undefined);
    const bCallback = timestampFromIso(meta[b.id]?.callbackAt ?? undefined);
    const aTime = aCallback || timestampFromIso(a.updated_at) || timestampFromIso(a.created_at);
    const bTime = bCallback || timestampFromIso(b.updated_at) || timestampFromIso(b.created_at);
    return aTime - bTime;
  });
}

function sortHistoryQueue(orders: NormalizedOrder[]): NormalizedOrder[] {
  return [...orders].sort((a, b) => {
    const aTime = timestampFromIso(a.updated_at) || timestampFromIso(a.created_at);
    const bTime = timestampFromIso(b.updated_at) || timestampFromIso(b.created_at);
    return bTime - aTime;
  });
}

function dedupeById(orders: NormalizedOrder[]): NormalizedOrder[] {
  const map = new Map<string, NormalizedOrder>();
  for (const order of orders) {
    map.set(order.id, order);
  }
  return Array.from(map.values());
}

function isDirect(order: NormalizedOrder): boolean {
  return order.status === "new" || order.status === "to_confirm";
}

function isCallback(order: NormalizedOrder): boolean {
  return order.status === "callback";
}

function listForTab(tab: FocusTab, state: Pick<FocusQueueState, "directQueue" | "callbackQueue" | "historyToday">): NormalizedOrder[] {
  if (tab === "direct") return state.directQueue;
  if (tab === "callbacks") return state.callbackQueue;
  return state.historyToday;
}

function resolveSelection(input: {
  preferredTab: FocusTab;
  preferredOrderId: string | null;
  directQueue: NormalizedOrder[];
  callbackQueue: NormalizedOrder[];
  historyToday: NormalizedOrder[];
}): FocusSelection {
  let activeTab = input.preferredTab;
  let activeOrderId = input.preferredOrderId;

  if (activeTab === "direct" && input.directQueue.length === 0) {
    activeTab = input.callbackQueue.length > 0 ? "callbacks" : "history";
    activeOrderId = null;
  }

  if (activeTab === "callbacks" && input.callbackQueue.length === 0) {
    activeTab = input.directQueue.length > 0 ? "direct" : "history";
    activeOrderId = null;
  }

  if (activeTab === "history" && input.historyToday.length === 0) {
    if (input.directQueue.length > 0) activeTab = "direct";
    else if (input.callbackQueue.length > 0) activeTab = "callbacks";
    activeOrderId = null;
  }

  const pool = activeTab === "direct" ? input.directQueue : activeTab === "callbacks" ? input.callbackQueue : input.historyToday;

  if (!activeOrderId || !pool.some((order) => order.id === activeOrderId)) {
    activeOrderId = pool[0]?.id ?? null;
  }

  return { activeTab, activeOrderId };
}

function findOrder(state: Pick<FocusQueueState, "directQueue" | "callbackQueue" | "historyToday">, orderId: string): NormalizedOrder | null {
  return (
    state.directQueue.find((order) => order.id === orderId) ||
    state.callbackQueue.find((order) => order.id === orderId) ||
    state.historyToday.find((order) => order.id === orderId) ||
    null
  );
}

function toWhatsAppPhone(phone: string | null | undefined): string {
  const normalized = normalizePhone(phone);
  if (!normalized) return "";

  let payload = normalized;
  if (payload.startsWith("0")) payload = payload.slice(1);
  if (payload.startsWith("212")) payload = payload.slice(3);

  if (!payload) return "";
  return `212${payload}`;
}

function fallbackCallbackLabel(): string {
  return "dans 1 heure";
}

function formatCallbackLabel(iso: string | null | undefined): string {
  if (!iso) return fallbackCallbackLabel();
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallbackCallbackLabel();
  return new Intl.DateTimeFormat("fr-MA", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTotalMad(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(safe);
}

function extractOrderProducts(order: NormalizedOrder): string[] {
  const selected = Array.isArray(order.selected_perfumes) ? order.selected_perfumes : [];
  const cleanedSelected = selected.map((entry) => String(entry).trim()).filter(Boolean);
  const gift = typeof order.gift_perfume === "string" ? order.gift_perfume.trim() : "";

  if (gift && !cleanedSelected.includes(gift)) {
    return [...cleanedSelected, gift];
  }

  return cleanedSelected;
}

function compactProductsLabel(products: string[]): string {
  if (products.length === 0) return "votre commande";
  if (products.length === 1) return products[0];
  if (products.length === 2) return `${products[0]} + ${products[1]}`;
  return `${products[0]}, ${products[1]} +${products.length - 2}`;
}

function interpolateTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? "");
}

function createWhatsappMessage(
  order: NormalizedOrder,
  template: WhatsAppTemplateId,
  meta: FocusOrderMeta | undefined
): string {
  const products = extractOrderProducts(order);
  const values = {
    name: order.customer_name?.trim() || "Client",
    city: order.city?.trim() || "votre ville",
    total: formatTotalMad(order.total_price),
    products: compactProductsLabel(products),
    callbackAt: formatCallbackLabel(meta?.callbackAt),
  };

  return interpolateTemplate(WHATSAPP_TEMPLATES[template], values);
}

function nextInQueue(queue: NormalizedOrder[], activeId: string | null): string | null {
  if (queue.length === 0) return null;
  if (!activeId) return queue[0]?.id ?? null;

  const index = queue.findIndex((order) => order.id === activeId);
  if (index < 0) return queue[0]?.id ?? null;
  return queue[index + 1]?.id ?? null;
}

export const useFocusQueue = create<FocusQueueState>((set, get) => {
  const runStatusMutation = async (input: StatusMutationInput): Promise<void> => {
    const snapshot = get();

    if (snapshot.pendingOrderIds[input.orderId]) {
      return;
    }

    const sourceOrder = findOrder(snapshot, input.orderId);
    if (!sourceOrder) {
      return;
    }

    const nowIso = new Date().toISOString();
    const nextMetaEntry: FocusOrderMeta = {
      ...snapshot.orderMeta[input.orderId],
      touchedAt: nowIso,
      callbackAt: input.targetStatus === "callback" ? input.callbackAt ?? snapshot.orderMeta[input.orderId]?.callbackAt ?? null : snapshot.orderMeta[input.orderId]?.callbackAt,
      cancelReason: input.targetStatus === "canceled" ? input.reason ?? snapshot.orderMeta[input.orderId]?.cancelReason ?? null : snapshot.orderMeta[input.orderId]?.cancelReason,
    };

    const optimisticOrder: NormalizedOrder = {
      ...sourceOrder,
      status: input.targetStatus,
      updated_at: nowIso,
      confirmed_at: input.targetStatus === "confirmed" ? sourceOrder.confirmed_at ?? nowIso : sourceOrder.confirmed_at,
      canceled_at: input.targetStatus === "canceled" ? sourceOrder.canceled_at ?? nowIso : sourceOrder.canceled_at,
    };

    const directWithout = snapshot.directQueue.filter((order) => order.id !== input.orderId);
    const callbackWithout = snapshot.callbackQueue.filter((order) => order.id !== input.orderId);
    const historyWithout = snapshot.historyToday.filter((order) => order.id !== input.orderId);

    const mergedMeta = {
      ...snapshot.orderMeta,
      [input.orderId]: nextMetaEntry,
    };

    const nextDirect = directWithout;
    let nextCallback = callbackWithout;

    if (input.targetStatus === "callback") {
      nextCallback = sortCallbackQueue(dedupeById([...callbackWithout, optimisticOrder]), mergedMeta);
    }

    const nextHistory = sortHistoryQueue(dedupeById([optimisticOrder, ...historyWithout])).slice(0, MAX_HISTORY_ENTRIES);

    const tentativeSelection = resolveSelection({
      preferredTab: snapshot.activeTab,
      preferredOrderId: snapshot.activeOrderId === input.orderId ? null : snapshot.activeOrderId,
      directQueue: sortDirectQueue(nextDirect),
      callbackQueue: nextCallback,
      historyToday: nextHistory,
    });

    set((state) => ({
      directQueue: sortDirectQueue(nextDirect),
      callbackQueue: nextCallback,
      historyToday: nextHistory,
      orderMeta: mergedMeta,
      activeTab: tentativeSelection.activeTab,
      activeOrderId: tentativeSelection.activeOrderId,
      pendingOrderIds: {
        ...state.pendingOrderIds,
        [input.orderId]: true,
      },
      error: null,
    }));

    try {
      if (input.targetStatus === "canceled") {
        await cancelOrderApi(input.orderId, input.reason ?? undefined);
      } else {
        await updateOrderStatus(input.orderId, input.targetStatus);
      }

      set((state) => ({
        pendingOrderIds: {
          ...state.pendingOrderIds,
          [input.orderId]: false,
        },
      }));

      void get().preloadNext(PRELOAD_MINIMUM);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action impossible pour le moment";

      set((state) => ({
        directQueue: snapshot.directQueue,
        callbackQueue: snapshot.callbackQueue,
        historyToday: snapshot.historyToday,
        orderMeta: snapshot.orderMeta,
        activeTab: snapshot.activeTab,
        activeOrderId: snapshot.activeOrderId,
        error: message,
        pendingOrderIds: {
          ...state.pendingOrderIds,
          [input.orderId]: false,
        },
      }));
    }
  };

  return {
    hydrated: false,
    loading: false,
    preloading: false,
    error: null,
    activeTab: "direct",
    activeOrderId: null,
    directQueue: [],
    callbackQueue: [],
    historyToday: [],
    orderMeta: {},
    selectedTemplateByOrder: {},
    pendingOrderIds: {},
    page: 0,
    hasMore: true,

    bootstrap: async () => {
      if (get().loading) return;

      set({ loading: true, error: null });

      try {
        const [live, history] = await Promise.all([
          fetchOrders({
            status: LIVE_STATUS_QUERY,
            page: 1,
            limit: LIVE_PAGE_LIMIT,
            days: 21,
            pipeline: true,
          }),
          fetchOrders({
            status: HISTORY_STATUS_QUERY,
            page: 1,
            limit: 30,
            days: 1,
          }),
        ]);

        const directQueue = sortDirectQueue(live.orders.filter(isDirect));
        const callbackQueue = sortCallbackQueue(live.orders.filter(isCallback), get().orderMeta);
        const historyToday = sortHistoryQueue(history.orders).slice(0, MAX_HISTORY_ENTRIES);

        const selection = resolveSelection({
          preferredTab: "direct",
          preferredOrderId: null,
          directQueue,
          callbackQueue,
          historyToday,
        });

        set({
          hydrated: true,
          loading: false,
          directQueue,
          callbackQueue,
          historyToday,
          page: 1,
          hasMore: live.hasMore,
          activeTab: selection.activeTab,
          activeOrderId: selection.activeOrderId,
        });

        void get().preloadNext(PRELOAD_MINIMUM);
      } catch (error) {
        set({
          loading: false,
          hydrated: true,
          error: error instanceof Error ? error.message : "Impossible de charger la file Focus",
        });
      }
    },

    preloadNext: async (minimumReady = PRELOAD_MINIMUM) => {
      if (get().preloading || !get().hasMore) return;

      set({ preloading: true });

      try {
        while (true) {
          const snapshot = get();
          const available = snapshot.directQueue.length + snapshot.callbackQueue.length;

          if (available >= minimumReady || !snapshot.hasMore) break;

          const nextPage = snapshot.page + 1;
          const response = await fetchOrders({
            status: LIVE_STATUS_QUERY,
            page: nextPage,
            limit: LIVE_PAGE_LIMIT,
            days: 21,
            pipeline: true,
          });

          set((state) => {
            const mergedLive = dedupeById([...state.directQueue, ...state.callbackQueue, ...response.orders]);
            const nextDirect = sortDirectQueue(mergedLive.filter(isDirect));
            const nextCallback = sortCallbackQueue(mergedLive.filter(isCallback), state.orderMeta);
            const selection = resolveSelection({
              preferredTab: state.activeTab,
              preferredOrderId: state.activeOrderId,
              directQueue: nextDirect,
              callbackQueue: nextCallback,
              historyToday: state.historyToday,
            });

            return {
              directQueue: nextDirect,
              callbackQueue: nextCallback,
              page: nextPage,
              hasMore: response.hasMore,
              activeTab: selection.activeTab,
              activeOrderId: selection.activeOrderId,
            };
          });

          if (!response.hasMore || response.orders.length === 0) {
            break;
          }
        }
      } catch {
        // Keep current queue if preloading fails.
      } finally {
        set({ preloading: false });
      }
    },

    setActiveTab: (tab) => {
      set((state) => {
        const list = listForTab(tab, state);
        return {
          activeTab: tab,
          activeOrderId: list[0]?.id ?? null,
        };
      });
      void get().preloadNext(PRELOAD_MINIMUM);
    },

    setActiveOrder: (orderId) => {
      set({ activeOrderId: orderId });
    },

    nextOrder: () => {
      set((state) => {
        if (state.activeTab === "direct") {
          const nextId = nextInQueue(state.directQueue, state.activeOrderId);
          if (nextId) return { activeOrderId: nextId };

          if (state.callbackQueue.length > 0) {
            return { activeTab: "callbacks" as FocusTab, activeOrderId: state.callbackQueue[0].id };
          }

          if (state.historyToday.length > 0) {
            return { activeTab: "history" as FocusTab, activeOrderId: state.historyToday[0].id };
          }

          return { activeOrderId: null };
        }

        if (state.activeTab === "callbacks") {
          const nextId = nextInQueue(state.callbackQueue, state.activeOrderId);
          if (nextId) return { activeOrderId: nextId };

          if (state.directQueue.length > 0) {
            return { activeTab: "direct" as FocusTab, activeOrderId: state.directQueue[0].id };
          }

          if (state.historyToday.length > 0) {
            return { activeTab: "history" as FocusTab, activeOrderId: state.historyToday[0].id };
          }

          return { activeOrderId: null };
        }

        const nextId = nextInQueue(state.historyToday, state.activeOrderId);
        return { activeOrderId: nextId ?? state.historyToday[0]?.id ?? null };
      });

      void get().preloadNext(PRELOAD_MINIMUM);
    },

    setTemplate: (orderId, template) => {
      set((state) => ({
        selectedTemplateByOrder: {
          ...state.selectedTemplateByOrder,
          [orderId]: template,
        },
      }));
    },

    sendWhatsApp: (orderId, selectedTemplate) => {
      const state = get();
      const order = findOrder(state, orderId);
      if (!order) return null;

      const template = selectedTemplate ?? state.selectedTemplateByOrder[orderId] ?? "confirmation";
      const message = createWhatsappMessage(order, template, state.orderMeta[order.id]);
      const phone = toWhatsAppPhone(order.phone);

      if (!phone) return null;

      const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      const sentAt = new Date().toISOString();

      set((prev) => ({
        selectedTemplateByOrder: {
          ...prev.selectedTemplateByOrder,
          [orderId]: template,
        },
        orderMeta: {
          ...prev.orderMeta,
          [orderId]: {
            ...prev.orderMeta[orderId],
            messageSentAt: sentAt,
            messageTemplate: template,
            messagePreview: message,
            touchedAt: sentAt,
          },
        },
      }));

      if (typeof window !== "undefined") {
        window.open(href, "_blank", "noopener,noreferrer");
      }

      void prepareOrderWhatsappRelaunch(orderId, template).catch(() => undefined);
      return href;
    },

    buildWhatsAppMessage: (order, selectedTemplate) => {
      const template = selectedTemplate ?? get().selectedTemplateByOrder[order.id] ?? "confirmation";
      return createWhatsappMessage(order, template, get().orderMeta[order.id]);
    },

    confirmOrder: async (orderId) => {
      await runStatusMutation({ orderId, targetStatus: "confirmed" });
    },

    callbackOrder: async (orderId, callbackAt) => {
      await runStatusMutation({ orderId, targetStatus: "callback", callbackAt });
    },

    cancelOrder: async (orderId, reason) => {
      await runStatusMutation({ orderId, targetStatus: "canceled", reason });
    },
  };
});
