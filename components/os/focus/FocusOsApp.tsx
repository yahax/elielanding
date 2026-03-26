"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizePhone } from "@/lib/os/orders/helpers/format";
import { useOsLiveStore } from "@/store/useOsLiveStore";
import { FocusCard } from "./FocusCard";
import { FocusQuickModal } from "./FocusQuickModal";
import { FocusSidebar, type FocusView } from "./FocusSidebar";
import { useFocusQueue, type FocusTab } from "@/store/useFocusQueue";
import type { NormalizedOrder } from "@/lib/os/types";
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

function formatQueueTime(iso: string | null | undefined): string {
  if (!iso) return "--:--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("fr-MA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function matchOrder(order: NormalizedOrder, query: string): boolean {
  if (!query) return true;
  const token = query.toLowerCase();
  const fields = [order.customer_name, order.phone, order.city, order.id];
  return fields.some((entry) => String(entry ?? "").toLowerCase().includes(token));
}

function toFocusTab(value: string | null): FocusTab | null {
  if (value === "direct" || value === "callbacks" || value === "history") {
    return value;
  }
  return null;
}

function updateTabQuery(view: FocusView, searchParams: URLSearchParams): string {
  const next = new URLSearchParams(searchParams.toString());
  if (view === "direct") {
    next.delete("tab");
  } else {
    next.set("tab", view);
  }
  const query = next.toString();
  return query.length > 0 ? `/os?${query}` : "/os";
}

export function FocusOsApp() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const setActiveOrder = useFocusQueue((state) => state.setActiveOrder);
  const setTemplate = useFocusQueue((state) => state.setTemplate);
  const nextOrder = useFocusQueue((state) => state.nextOrder);
  const confirmOrder = useFocusQueue((state) => state.confirmOrder);
  const callbackOrder = useFocusQueue((state) => state.callbackOrder);
  const cancelOrder = useFocusQueue((state) => state.cancelOrder);
  const sendWhatsApp = useFocusQueue((state) => state.sendWhatsApp);
  const buildWhatsAppMessage = useFocusQueue((state) => state.buildWhatsAppMessage);

  const settings = useOsLiveStore((state) => state.settings);
  const warRoomPreference = useOsLiveStore((state) => state.warRoomPreference);
  const updateSettings = useOsLiveStore((state) => state.updateSettings);
  const setWarRoomPreference = useOsLiveStore((state) => state.setWarRoomPreference);

  const [showSettings, setShowSettings] = useState(false);
  const [queueSearch, setQueueSearch] = useState("");
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [customCallbackInput, setCustomCallbackInput] = useState<string>(toLocalDatetimeInputValue(nextHourIso()));
  const [logoutBusy, setLogoutBusy] = useState(false);

  const activeView: FocusView = showSettings ? "settings" : activeTab;

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const param = searchParams.get("tab");
    if (param === "settings") {
      setShowSettings(true);
      return;
    }

    const mappedTab = toFocusTab(param);
    if (mappedTab) {
      setShowSettings(false);
      const targetQueueSize =
        mappedTab === "direct" ? directQueue.length : mappedTab === "callbacks" ? callbackQueue.length : historyToday.length;
      if (targetQueueSize > 0 && mappedTab !== activeTab) {
        setActiveTab(mappedTab);
      }
      return;
    }

    if (showSettings) {
      setShowSettings(false);
    }
  }, [activeTab, callbackQueue.length, directQueue.length, historyToday.length, searchParams, setActiveTab, showSettings]);

  const activeQueue = useMemo(() => {
    if (activeTab === "direct") return directQueue;
    if (activeTab === "callbacks") return callbackQueue;
    return historyToday;
  }, [activeTab, callbackQueue, directQueue, historyToday]);

  const activeOrder = useMemo(() => {
    if (activeQueue.length === 0) return null;
    if (!activeOrderId) return activeQueue[0] ?? null;
    return activeQueue.find((order) => order.id === activeOrderId) ?? activeQueue[0] ?? null;
  }, [activeOrderId, activeQueue]);

  useEffect(() => {
    if (!activeOrder) return;
    if (activeOrder.id !== activeOrderId) {
      setActiveOrder(activeOrder.id);
    }
  }, [activeOrder, activeOrderId, setActiveOrder]);

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

  const visibleQueue = useMemo(() => {
    if (!queueSearch.trim()) return activeQueue;
    return activeQueue.filter((order) => matchOrder(order, queueSearch.trim()));
  }, [activeQueue, queueSearch]);

  const syncUrlView = useCallback(
    (view: FocusView) => {
      const href = updateTabQuery(view, new URLSearchParams(searchParams.toString()));
      router.replace(href, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (showSettings || isInputLike(event.target)) return;

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
  }, [activeOrder, activePending, activeTab, confirmOrder, nextOrder, showSettings]);

  useEffect(() => {
    setShowCallbackModal(false);
    setShowCancelModal(false);
  }, [activeOrderId, showSettings]);

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

  const handleReopen = async () => {
    if (!activeOrder || activeTab !== "history") return;
    await callbackOrder(activeOrder.id, nextHourIso());
    setActiveTab("callbacks");
    syncUrlView("callbacks");
  };

  const handleViewChange = (view: FocusView) => {
    if (view === "settings") {
      setShowSettings(true);
      syncUrlView("settings");
      return;
    }

    setShowSettings(false);
    setQueueSearch("");
    setActiveTab(view);
    syncUrlView(view);
  };

  return (
    <div className={styles.focusRoot}>
      <FocusSidebar
        activeView={activeView}
        directCount={directQueue.length}
        callbackCount={callbackQueue.length}
        historyCount={historyToday.length}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
      />

      <main className={styles.focusMain}>
        <header className={styles.focusHeader}>
          <div>
            <p className={styles.focusHeading}>Single-tasking agent execution</p>
            <h2 className={styles.focusSubHeading}>ELIE Focus OS</h2>
          </div>

          <div className={styles.runtimeMeta}>
            <span>{preloading ? "Preloading" : "Ready"}</span>
            <span>Live {directQueue.length + callbackQueue.length}</span>
            <span>Today {historyToday.length}</span>
          </div>
        </header>

        {error ? <div className={styles.errorBanner}>{error}</div> : null}

        {showSettings ? (
          <section className={styles.settingsPane}>
            <div className={styles.settingsHeader}>
              <h3 className={styles.settingsTitle}>Settings</h3>
              <p className={styles.settingsSubtitle}>Préférences minimales opérateur. Sauvegarde automatique.</p>
            </div>

            <div className={styles.settingsGroup}>
              <div className={styles.settingsRow}>
                <div className={styles.settingsLabelBlock}>
                  <p className={styles.settingsLabel}>Toasts live</p>
                  <p className={styles.settingsCaption}>Afficher les alertes temps réel</p>
                </div>
                <button
                  type="button"
                  className={styles.switchButton}
                  data-active={settings.toastsEnabled ? "true" : "false"}
                  onClick={() => updateSettings({ toastsEnabled: !settings.toastsEnabled })}
                >
                  {settings.toastsEnabled ? "On" : "Off"}
                </button>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingsLabelBlock}>
                  <p className={styles.settingsLabel}>Sons</p>
                  <p className={styles.settingsCaption}>Feedback audio sur événements critiques</p>
                </div>
                <button
                  type="button"
                  className={styles.switchButton}
                  data-active={settings.soundsEnabled ? "true" : "false"}
                  onClick={() => updateSettings({ soundsEnabled: !settings.soundsEnabled })}
                >
                  {settings.soundsEnabled ? "On" : "Off"}
                </button>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingsLabelBlock}>
                  <p className={styles.settingsLabel}>Refresh</p>
                  <p className={styles.settingsCaption}>Fréquence de synchronisation de la file</p>
                </div>
                <select
                  className={styles.selectControl}
                  value={settings.refreshIntervalSec}
                  onChange={(event) => updateSettings({ refreshIntervalSec: Number(event.target.value) })}
                >
                  {[30, 45, 60, 90, 120].map((value) => (
                    <option key={value} value={value}>
                      {value}s
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingsLabelBlock}>
                  <p className={styles.settingsLabel}>SLA warning</p>
                  <p className={styles.settingsCaption}>Seuil d’alerte avant retard</p>
                </div>
                <select
                  className={styles.selectControl}
                  value={settings.slaWarningMinutes}
                  onChange={(event) => updateSettings({ slaWarningMinutes: Number(event.target.value) })}
                >
                  {[30, 45, 60, 90].map((value) => (
                    <option key={value} value={value}>
                      {value} min
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingsLabelBlock}>
                  <p className={styles.settingsLabel}>Mode focus</p>
                  <p className={styles.settingsCaption}>Auto, forcé ou désactivé</p>
                </div>
                <div className={styles.segmentedControl}>
                  {(["auto", "on", "off"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={styles.segmentedBtn}
                      data-active={warRoomPreference === value ? "true" : "false"}
                      onClick={() => setWarRoomPreference(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {!showSettings && (!hydrated || loading) ? (
          <section className={styles.loadingPane}>
            <span className={styles.loaderDot} />
            <p>Chargement de la file...</p>
          </section>
        ) : null}

        {!showSettings && hydrated && !loading && !hasOrders ? (
          <section className={styles.emptyPane}>
            <h3>Aucune commande à traiter</h3>
          </section>
        ) : null}

        {!showSettings && hydrated && !loading && activeOrder ? (
          <section className={styles.workbench}>
            <aside className={styles.queuePanel}>
              <div className={styles.queuePanelHead}>
                <h3 className={styles.queuePanelTitle}>{queueLabel(activeTab)}</h3>
                <span className={styles.queuePanelCount}>{activeQueue.length}</span>
              </div>

              {(activeTab === "callbacks" || activeTab === "history") && (
                <input
                  type="search"
                  value={queueSearch}
                  onChange={(event) => setQueueSearch(event.target.value)}
                  className={styles.queueSearchInput}
                  placeholder={activeTab === "history" ? "Rechercher dans l'historique" : "Filtrer callbacks"}
                />
              )}

              <div className={styles.queueList}>
                {visibleQueue.map((order) => {
                  const isActive = order.id === activeOrder.id;
                  const callbackIso = orderMeta[order.id]?.callbackAt ?? order.updated_at;
                  const timeLabel = activeTab === "direct" ? formatQueueTime(order.created_at) : formatQueueTime(callbackIso);
                  return (
                    <button
                      key={order.id}
                      type="button"
                      className={styles.queueRow}
                      data-active={isActive ? "true" : "false"}
                      onClick={() => setActiveOrder(order.id)}
                    >
                      <span className={styles.queueRowMain}>
                        <strong>{order.customer_name || "Client inconnu"}</strong>
                        <span>{order.city || "Ville inconnue"}</span>
                      </span>
                      <span className={styles.queueRowMeta}>{timeLabel}</span>
                    </button>
                  );
                })}

                {visibleQueue.length === 0 ? <p className={styles.queueEmpty}>Aucun résultat</p> : null}
              </div>
            </aside>

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
                  onReopen={() => void handleReopen()}
                  onSwipeConfirm={() => void handleConfirm()}
                  onSwipeCancel={() => {
                    if (activeTab === "history") return;
                    void cancelOrder(activeOrder.id, "swipe cancel");
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </section>
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
