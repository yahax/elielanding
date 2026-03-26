"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { normalizePhone } from "@/lib/os/orders/helpers/format";
import { FocusCard } from "./FocusCard";
import { FocusQuickModal } from "./FocusQuickModal";
import { FocusSidebar } from "./FocusSidebar";
import { useFocusQueue, type FocusTab } from "@/store/useFocusQueue";
import styles from "./focus-os.module.css";

const CALLBACK_MODAL_OPTIONS = [
  { id: "1h", label: "1h", caption: "Rappel rapide", tone: "warning" as const },
  { id: "tomorrow", label: "Tomorrow", caption: "Rappel demain", tone: "warning" as const },
  { id: "custom", label: "Custom", caption: "Choisir date + heure", tone: "neutral" as const },
];

const CANCEL_MODAL_OPTIONS = [
  { id: "faux numero", label: "Faux numero", tone: "danger" as const },
  { id: "trop cher", label: "Trop cher", tone: "danger" as const },
  { id: "hors zone", label: "Hors zone", tone: "danger" as const },
  { id: "change d'avis", label: "Change d'avis", tone: "danger" as const },
];

function toLocalDatetimeInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDatetimeInputValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function nextHourIso(): string {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

function tomorrowMorningIso(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

function queueLabel(tab: FocusTab): string {
  if (tab === "direct") return "Direct Queue";
  if (tab === "callbacks") return "Callbacks";
  return "History Today";
}

function isInputLike(target: EventTarget | null): boolean {
  const node = target as HTMLElement | null;
  if (!node) return false;

  const tag = node.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return node.isContentEditable;
}

export function FocusOsApp() {
  const router = useRouter();
  const hydrated = useFocusQueue((state) => state.hydrated);
  const loading = useFocusQueue((state) => state.loading);
  const error = useFocusQueue((state) => state.error);
  const activeTab = useFocusQueue((state) => state.activeTab);
  const activeOrderId = useFocusQueue((state) => state.activeOrderId);
  const directQueue = useFocusQueue((state) => state.directQueue);
  const callbackQueue = useFocusQueue((state) => state.callbackQueue);
  const historyToday = useFocusQueue((state) => state.historyToday);
  const orderMeta = useFocusQueue((state) => state.orderMeta);
  const templateByOrder = useFocusQueue((state) => state.selectedTemplateByOrder);
  const pendingOrderIds = useFocusQueue((state) => state.pendingOrderIds);
  const preloading = useFocusQueue((state) => state.preloading);

  const bootstrap = useFocusQueue((state) => state.bootstrap);
  const setActiveTab = useFocusQueue((state) => state.setActiveTab);
  const setTemplate = useFocusQueue((state) => state.setTemplate);
  const nextOrder = useFocusQueue((state) => state.nextOrder);
  const confirmOrder = useFocusQueue((state) => state.confirmOrder);
  const callbackOrder = useFocusQueue((state) => state.callbackOrder);
  const cancelOrder = useFocusQueue((state) => state.cancelOrder);
  const sendWhatsApp = useFocusQueue((state) => state.sendWhatsApp);
  const buildWhatsAppMessage = useFocusQueue((state) => state.buildWhatsAppMessage);

  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [customCallbackInput, setCustomCallbackInput] = useState<string>(toLocalDatetimeInputValue(nextHourIso()));
  const [logoutBusy, setLogoutBusy] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const activeQueue = useMemo(() => {
    if (activeTab === "direct") return directQueue;
    if (activeTab === "callbacks") return callbackQueue;
    return historyToday;
  }, [activeTab, callbackQueue, directQueue, historyToday]);

  const activeOrder = useMemo(() => {
    if (!activeOrderId) return null;
    return activeQueue.find((order) => order.id === activeOrderId) ?? null;
  }, [activeOrderId, activeQueue]);

  const loyaltyCountByPhone = useMemo(() => {
    const counts = new Map<string, number>();
    const all = [...directQueue, ...callbackQueue, ...historyToday];

    for (const order of all) {
      const phone = normalizePhone(order.phone);
      if (!phone) continue;
      counts.set(phone, (counts.get(phone) ?? 0) + 1);
    }

    return counts;
  }, [callbackQueue, directQueue, historyToday]);

  const selectedTemplate = activeOrder ? templateByOrder[activeOrder.id] ?? "confirmation" : "confirmation";
  const activeMeta = activeOrder ? orderMeta[activeOrder.id] : undefined;
  const messagePreview = activeOrder ? buildWhatsAppMessage(activeOrder, selectedTemplate) : "";
  const activePending = activeOrder ? Boolean(pendingOrderIds[activeOrder.id]) : false;

  const loyalOrders = useMemo(() => {
    if (!activeOrder) return 1;
    const phone = normalizePhone(activeOrder.phone);
    if (!phone) return 1;
    return loyaltyCountByPhone.get(phone) ?? 1;
  }, [activeOrder, loyaltyCountByPhone]);

  const hasOrders = directQueue.length + callbackQueue.length + historyToday.length > 0;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInputLike(event.target)) return;

      const key = event.key.toLowerCase();

      if (key === " ") {
        event.preventDefault();
        nextOrder();
        return;
      }

      if (!activeOrder || activePending) return;

      if (key === "c") {
        event.preventDefault();
        if (activeTab !== "history") {
          void confirmOrder(activeOrder.id);
        }
        return;
      }

      if (key === "r") {
        event.preventDefault();
        if (activeTab !== "history") {
          setShowCallbackModal(true);
        }
        return;
      }

      if (key === "a") {
        event.preventDefault();
        if (activeTab !== "history") {
          setShowCancelModal(true);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeOrder, activePending, activeTab, callbackOrder, cancelOrder, confirmOrder, nextOrder]);

  useEffect(() => {
    setShowCallbackModal(false);
    setShowCancelModal(false);
  }, [activeOrderId]);

  const handleLogout = async () => {
    if (logoutBusy) return;
    setLogoutBusy(true);

    try {
      await fetch("/api/os/auth/logout", { method: "POST" });
    } finally {
      router.push("/os/login");
      router.refresh();
      setLogoutBusy(false);
    }
  };

  const triggerCall = () => {
    if (!activeOrder?.phone || typeof window === "undefined") return;
    window.location.href = `tel:${activeOrder.phone}`;
  };

  const triggerWhatsApp = () => {
    if (!activeOrder) return;
    sendWhatsApp(activeOrder.id, selectedTemplate);
  };

  const handleConfirm = async () => {
    if (!activeOrder || activeTab === "history") return;
    await confirmOrder(activeOrder.id);
  };

  const handleCallbackPreset = async (presetId: string) => {
    if (!activeOrder || activeTab === "history") return;

    if (presetId === "custom") {
      if (!customCallbackInput) {
        setCustomCallbackInput(toLocalDatetimeInputValue(nextHourIso()));
      }
      return;
    }

    const callbackAt = presetId === "tomorrow" ? tomorrowMorningIso() : nextHourIso();
    setShowCallbackModal(false);
    await callbackOrder(activeOrder.id, callbackAt);
  };

  const handleCustomCallback = async () => {
    if (!activeOrder || activeTab === "history") return;
    const customIso = fromLocalDatetimeInputValue(customCallbackInput);
    if (!customIso) return;

    setShowCallbackModal(false);
    await callbackOrder(activeOrder.id, customIso);
  };

  const handleCancelReason = async (reason: string) => {
    if (!activeOrder || activeTab === "history") return;
    setShowCancelModal(false);
    await cancelOrder(activeOrder.id, reason);
  };

  return (
    <div className={styles.focusRoot}>
      <FocusSidebar
        activeTab={activeTab}
        directCount={directQueue.length}
        callbackCount={callbackQueue.length}
        historyCount={historyToday.length}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <main className={styles.focusMain}>
        <header className={styles.focusHeader}>
          <div>
            <p className={styles.focusHeading}>1 order at a time. 0 distraction.</p>
            <h2 className={styles.focusSubHeading}>ELIE FOCUS OS 2026</h2>
          </div>

          <div className={styles.runtimeMeta}>
            <span>{preloading ? "Preloading next 5" : "Ready"}</span>
            <span>Queue {directQueue.length + callbackQueue.length}</span>
            <span>Today {historyToday.length}</span>
          </div>
        </header>

        {error ? <div className={styles.errorBanner}>{error}</div> : null}

        {!hydrated || loading ? (
          <section className={styles.loadingPane}>
            <span className={styles.loaderDot} />
            <p>Chargement de la file...</p>
          </section>
        ) : null}

        {hydrated && !loading && !hasOrders ? (
          <section className={styles.emptyPane}>
            <h3>Aucune commande à traiter</h3>
          </section>
        ) : null}

        {hydrated && !loading && activeOrder ? (
          <AnimatePresence mode="wait">
            <motion.div key={`${activeOrder.id}-${activeOrder.updated_at}-${activeTab}`} className={styles.cardHost}>
              <FocusCard
                order={activeOrder}
                queueLabel={queueLabel(activeTab)}
                loyalOrders={loyalOrders}
                messageTemplate={selectedTemplate}
                messagePreview={messagePreview}
                meta={activeMeta}
                pending={activePending}
                isHistory={activeTab === "history"}
                onSelectTemplate={(template) => setTemplate(activeOrder.id, template)}
                onCall={triggerCall}
                onWhatsApp={triggerWhatsApp}
                onConfirm={() => void handleConfirm()}
                onOpenCallback={() => setShowCallbackModal(true)}
                onOpenCancel={() => setShowCancelModal(true)}
                onSwipeConfirm={() => void handleConfirm()}
                onSwipeCancel={() => {
                  if (activeTab === "history") return;
                  void cancelOrder(activeOrder.id, "swipe cancel");
                }}
              />
            </motion.div>
          </AnimatePresence>
        ) : null}
      </main>

      <FocusQuickModal
        open={showCallbackModal && !!activeOrder && activeTab !== "history"}
        title="Callback"
        description="Choisir un rappel"
        options={CALLBACK_MODAL_OPTIONS}
        onClose={() => setShowCallbackModal(false)}
        onSelect={(id) => {
          void handleCallbackPreset(id);
        }}
        footer={
          <div className={styles.modalCustomRow}>
            <input
              type="datetime-local"
              value={customCallbackInput}
              onChange={(event) => setCustomCallbackInput(event.target.value)}
              className={styles.modalInput}
            />
            <button type="button" className={styles.modalApplyBtn} onClick={() => void handleCustomCallback()}>
              Appliquer
            </button>
          </div>
        }
      />

      <FocusQuickModal
        open={showCancelModal && !!activeOrder && activeTab !== "history"}
        title="Cancel"
        description="Selectionner une raison"
        options={CANCEL_MODAL_OPTIONS}
        onClose={() => setShowCancelModal(false)}
        onSelect={(reason) => {
          void handleCancelReason(reason);
        }}
      />

      {logoutBusy ? <div className={styles.logoutOverlay}>Logging out...</div> : null}
    </div>
  );
}
