"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchOrders, fetchOverview } from "@/lib/os/api";
import { buildCommandCenterSnapshot } from "@/lib/os/dashboard.mock";
import { enrichOrders } from "@/lib/os/orders/helpers/scoring";
import { loadOpsMeta } from "@/lib/os/orders/helpers/storage";
import type { OrderOperationalMetaMap } from "@/lib/os/orders/types";
import type { OverviewResponse, NormalizedOrder } from "@/lib/os/types";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNotifications } from "@/hooks/useNotifications";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { MobileKpiCarousel } from "@/components/os/mobile/MobileKpiCarousel";
import { MobileOrdersQueue } from "@/components/os/mobile/MobileOrdersQueue";
import { MobileQuickActions } from "@/components/os/mobile/MobileQuickActions";
import { MobileUrgencyBanner } from "@/components/os/mobile/MobileUrgencyBanner";
import { MobileUrgentQueue } from "@/components/os/mobile/MobileUrgentQueue";
import { MobileWarRoomPanel } from "@/components/os/mobile/MobileWarRoomPanel";
import { RealtimeFeedCard } from "@/components/os/live/RealtimeFeedCard";
import {
  Bell,
  Warehouse,
  RefreshCw,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Package,
  AlertTriangle,
  MapPin,
  Star,
  Megaphone,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

/* ────── Helpers ────── */

const fmt = new Intl.NumberFormat("fr-MA");
const fmtMad = (v: number) => fmt.format(Math.max(0, Math.round(v)));

const SOURCE_LABELS: Record<string, string> = {
  meta_ads: "Meta Ads",
  whatsapp: "WhatsApp",
  direct: "Direct",
  organic: "Organic",
  landing_page: "Landing Page",
  other: "Autre",
};

/* ────── Donut Chart (pure SVG) ────── */

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function DonutChart({ segments, size = 160 }: { segments: DonutSegment[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="bi-empty-chart" style={{ width: size, height: size }}>
        <span>Aucune donnée</span>
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg) => {
          const pct = seg.value / total;
          const dash = circumference * pct;
          const gap = circumference - dash;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle
              key={seg.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={size * 0.12}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease" }}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text)" fontSize={size * 0.14} fontWeight={800}>
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-dim)" fontSize={size * 0.075} fontWeight={700}>
          commandes
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {segments.filter((s) => s.value > 0).map((seg) => (
          <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>
              {seg.label}: <strong style={{ color: "var(--text)" }}>{seg.value}</strong>
              <span style={{ opacity: 0.6, marginLeft: 4 }}>({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────── Funnel Chart (pure SVG) ────── */

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {steps.map((step) => {
        const pct = Math.max(4, (step.value / max) * 100);
        return (
          <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", width: 90, textAlign: "right", flexShrink: 0 }}>
              {step.label}
            </span>
            <div style={{ flex: 1, height: 22, background: "var(--surface)", borderRadius: 6, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: step.color,
                  borderRadius: 6,
                  transition: "width 0.6s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 8,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 900, color: "#fff" }}>{step.value}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ────── Ranking List ────── */

function BiRankingList({ title, items, emptyMessage }: { title: string; items: { label: string; value: number; suffix?: string }[]; emptyMessage: string }) {
  return (
    <div className="bi-ranking-card">
      <div className="bi-ranking-title">{title}</div>
      {items.length === 0 ? (
        <div className="bi-empty-small">{emptyMessage}</div>
      ) : (
        <div className="bi-ranking-list">
          {items.slice(0, 5).map((item, i) => (
            <div key={item.label} className="bi-ranking-row">
              <span className="bi-ranking-rank">#{i + 1}</span>
              <span className="bi-ranking-label">{item.label}</span>
              <span className="bi-ranking-value">{fmt.format(item.value)}{item.suffix || ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────── KPI Card ────── */

interface BiKpiProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  tone?: "gold" | "success" | "warning" | "danger" | "info" | "neutral";
  sub?: string;
  href?: string;
}

function BiKpiCard({ label, value, unit, icon, tone = "neutral", sub, href }: BiKpiProps) {
  const content = (
    <div className={`bi-kpi-card bi-kpi-${tone}`}>
      <div className="bi-kpi-icon">{icon}</div>
      <div className="bi-kpi-body">
        <div className="bi-kpi-label">{label}</div>
        <div className="bi-kpi-value">
          {value}
          {unit && <span className="bi-kpi-unit"> {unit}</span>}
        </div>
        {sub && <div className="bi-kpi-sub">{sub}</div>}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>{content}</Link>;
  }
  return content;
}

/* ────── Urgent Table ────── */

function UrgentTable({ alerts }: { alerts: { id: string; label: string; count: number; tone: string; href: string }[] }) {
  const hasUrgent = alerts.some((a) => a.count > 0);

  return (
    <div className="bi-urgent-card">
      <div className="bi-section-title">
        <AlertTriangle size={14} style={{ color: "var(--warning)" }} />
        À traiter maintenant
      </div>
      {!hasUrgent ? (
        <div className="bi-empty-state">
          <CheckCircle2 size={20} style={{ color: "var(--success)", opacity: 0.7 }} />
          <span>Aucune urgence — tout est sous contrôle</span>
        </div>
      ) : (
        <div className="bi-urgent-list">
          {alerts.filter((a) => a.count > 0).map((alert) => (
            <Link key={alert.id} href={alert.href} className={`bi-urgent-row bi-urgent-${alert.tone}`}>
              <span className="bi-urgent-label">{alert.label}</span>
              <span className="bi-urgent-count">{alert.count}</span>
              <ArrowRight size={12} style={{ opacity: 0.5 }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────── Activity Feed ────── */

function RealActivityFeed({ items }: { items: { id: string; label: string; meta?: string; time: string; isNew?: boolean }[] }) {
  return (
    <div className="bi-activity-card">
      <div className="bi-section-title">
        <TrendingUp size={14} style={{ color: "var(--gold)" }} />
        Activité récente
      </div>
      {items.length === 0 ? (
        <div className="bi-empty-state">
          <Clock size={18} style={{ color: "var(--text-dim)", opacity: 0.5 }} />
          <span>Aucune activité récente</span>
        </div>
      ) : (
        <div className="bi-activity-list">
          {items.slice(0, 6).map((item) => (
            <div key={item.id} className={`bi-activity-row ${item.isNew ? "bi-activity-new" : ""}`}>
              <div className="bi-activity-dot" />
              <div style={{ flex: 1 }}>
                <div className="bi-activity-label">{item.label}</div>
                {item.meta && <div className="bi-activity-meta">{item.meta}</div>}
              </div>
              <div className="bi-activity-time">{item.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ════════════════════════════════════════════════════════════════════════ */

export default function DashboardHomePage() {
  const router = useRouter();
  const isMobile = useIsMobile(1024);
  const { unreadCount } = useNotifications();
  const { latestEvents } = useRealtimeFeed();

  const [range, setRange] = useState<7 | 30>(7);
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileOrders, setMobileOrders] = useState<NormalizedOrder[]>([]);
  const [opsMeta, setOpsMeta] = useState<OrderOperationalMetaMap>({});

  const load = async (days: 7 | 30) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchOverview(days);
      setData(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de charger le dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(range); }, [range]);
  useEffect(() => { setOpsMeta(loadOpsMeta()); }, []);
  useEffect(() => {
    if (!isMobile) return;
    fetchOrders({ days: 14, limit: 320 })
      .then((response) => setMobileOrders(response.orders))
      .catch(() => setMobileOrders([]));
  }, [isMobile]);

  /* ── Derived data ── */

  const enrichedMobileOrders = useMemo(() => enrichOrders(mobileOrders, opsMeta), [mobileOrders, opsMeta]);
  const urgentQueue = useMemo(
    () => [...enrichedMobileOrders].filter((o) => o.isUrgent && o.status !== "delivered" && o.status !== "canceled").sort((a, b) => b.priorityScore - a.priorityScore),
    [enrichedMobileOrders]
  );
  const newQueue = useMemo(
    () => [...enrichedMobileOrders].filter((o) => o.status === "new" || o.status === "to_confirm").sort((a, b) => b.priorityScore - a.priorityScore),
    [enrichedMobileOrders]
  );
  const callbackQueue = useMemo(
    () => [...enrichedMobileOrders].filter((o) => o.status === "callback").sort((a, b) => b.elapsedMinutes - a.elapsedMinutes),
    [enrichedMobileOrders]
  );
  const callbackOverdue = useMemo(() => callbackQueue.filter((o) => o.elapsedMinutes >= 180), [callbackQueue]);

  /* ── BI computed data ── */

  const biData = useMemo(() => {
    if (!data) return null;
    const { stats, todayOrders, todayRevenue, avgBasket, confirmationRate, lowStockAlerts, recentOrders } = data;

    const pendingConfirmations = Math.max(stats.total_orders - stats.confirmed - stats.canceled, 0);
    const callbacksOverdue = recentOrders.filter((o) => o.status === "callback").length;
    const blockedOrders = recentOrders.filter(
      (o) => ["new", "to_confirm", "callback"].includes(o.status) && (Date.now() - new Date(o.created_at).getTime()) >= 3 * 60 * 60 * 1000
    ).length;
    const highValueThreshold = Math.max(350, Math.round(avgBasket * 1.35));
    const highValueUnconfirmed = recentOrders.filter(
      (o) => ["new", "to_confirm", "callback"].includes(o.status) && o.total_price >= highValueThreshold
    ).length;

    const cancellationRate = stats.total_orders > 0 ? Math.round((stats.canceled / stats.total_orders) * 100) : 0;

    // Confirmed today
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const confirmedToday = recentOrders.filter((o) => o.status === "confirmed" && o.confirmed_at && o.confirmed_at >= todayStart.toISOString()).length;
    const canceledToday = recentOrders.filter((o) => o.status === "canceled" && o.canceled_at && o.canceled_at >= todayStart.toISOString()).length;

    // Top source
    const topSource = Object.entries(stats.source_breakdown || {}).sort((a, b) => b[1] - a[1])[0];

    // Status distribution for donut
    const statusSegments: DonutSegment[] = [
      { label: "En attente", value: pendingConfirmations, color: "#f59e0b" },
      { label: "Confirmées", value: stats.confirmed, color: "#10b981" },
      { label: "Livrées", value: stats.delivered, color: "#3b82f6" },
      { label: "Annulées", value: stats.canceled, color: "#ef4444" },
    ];

    // Funnel
    const shipped = recentOrders.filter((o) => o.status === "shipped").length;
    const funnelSteps: FunnelStep[] = [
      { label: "Reçues", value: stats.total_orders, color: "#6366f1" },
      { label: "Confirmées", value: stats.confirmed, color: "#10b981" },
      { label: "Expédiées", value: shipped, color: "#3b82f6" },
      { label: "Livrées", value: stats.delivered, color: "#0ea5e9" },
      { label: "Annulées", value: stats.canceled, color: "#ef4444" },
    ];

    // Top cities & products
    const topCities = stats.top_cities.map((c) => ({ label: c.city, value: c.count, suffix: " cmd" }));
    const topProducts = stats.top_perfumes.map((p) => ({ label: p.name, value: p.count, suffix: " vtes" }));

    // Activity from recent orders
    const activity = recentOrders.slice(0, 6).map((order) => ({
      id: `act-${order.id}`,
      label: order.status === "confirmed" ? "Commande confirmée" : order.status === "canceled" ? "Commande annulée" : order.status === "shipped" ? "Commande expédiée" : "Nouvelle commande",
      meta: `${order.city || "—"} · ${fmtMad(order.total_price)} MAD`,
      time: formatRelTime(order.created_at),
      isNew: (Date.now() - new Date(order.created_at).getTime()) < 30 * 60 * 1000,
    }));

    // Urgent alerts
    const urgentAlerts = [
      { id: "u-pending", label: "Commandes en attente", count: pendingConfirmations, tone: "warning", href: "/os/orders?status=to_confirm" },
      { id: "u-callbacks", label: "Callbacks à relancer", count: callbacksOverdue, tone: "warning", href: "/os/orders?status=callback" },
      { id: "u-blocked", label: "Commandes bloquées (+3h)", count: blockedOrders, tone: "danger", href: "/os/pipeline" },
      { id: "u-highvalue", label: "Haute valeur non traitée", count: highValueUnconfirmed, tone: "danger", href: "/os/orders?status=to_confirm" },
      { id: "u-stock", label: "Stock critique", count: lowStockAlerts.length, tone: "warning", href: "/os/inventory" },
    ];

    return {
      todayOrders, todayRevenue, avgBasket, confirmationRate, cancellationRate, confirmedToday, canceledToday,
      pendingConfirmations, lowStockAlerts,
      topSource: topSource ? { label: SOURCE_LABELS[topSource[0]] ?? topSource[0], count: topSource[1] } : null,
      topCity: stats.top_cities[0],
      topProduct: stats.top_perfumes[0],
      statusSegments, funnelSteps, topCities, topProducts, activity, urgentAlerts,
    };
  }, [data]);

  function formatRelTime(iso: string): string {
    const min = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
    if (min < 1) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
  }

  /* ── States ── */

  if (loading && !data) return <LoadingState label="Chargement du dashboard..." />;
  if (error && !data) return <ErrorState message={error} onRetry={() => load(range)} />;
  if (!biData || !data) return null;

  /* ─────────────────────────────────────── MOBILE ─────────────────────────────────────── */

  if (isMobile) {
    const kpiItems = [
      { id: "today-orders", label: "Aujourd'hui", value: biData.todayOrders, tone: "neutral" as const },
      { id: "urgent", label: "Urgentes", value: urgentQueue.length, tone: urgentQueue.length > 0 ? ("danger" as const) : ("neutral" as const) },
      { id: "to-confirm", label: "À confirmer", value: newQueue.length, tone: "warning" as const },
      { id: "confirm-rate", label: "Taux conf.", value: `${data.confirmationRate}%`, tone: "success" as const },
      { id: "stock", label: "Stock critique", value: data.lowStockAlerts.length, tone: data.lowStockAlerts.length > 0 ? ("warning" as const) : ("neutral" as const) },
    ];

    return (
      <div className="os-page" style={{ gap: 10, paddingBottom: 8 }}>
        <MobileWarRoomPanel urgentCountHint={urgentQueue.length}>
          <MobileUrgencyBanner urgentCount={urgentQueue.length} callbackOverdue={callbackOverdue.length} />
          <MobileKpiCarousel items={kpiItems} />
        </MobileWarRoomPanel>

        <MobileQuickActions
          newOrdersCount={newQueue.length}
          urgentCount={urgentQueue.length}
          callbackCount={callbackQueue.length}
          lowStockCount={data.lowStockAlerts.length}
        />

        <MobileUrgentQueue orders={urgentQueue} />

        <MobileOrdersQueue
          title="Nouvelles commandes"
          orders={newQueue.slice(0, 6)}
          onOpenOrder={(orderId) => {
            const order = newQueue.find((item) => item.id === orderId);
            router.push(`/os/orders?status=${order?.status || "new"}`);
          }}
        />

        <MobileOrdersQueue
          title="Callbacks à relancer"
          orders={callbackQueue.slice(0, 6)}
          onOpenOrder={(orderId) => {
            const order = callbackQueue.find((item) => item.id === orderId);
            router.push(`/os/orders?status=${order?.status || "callback"}`);
          }}
        />

        <section className="luxury-card" style={{ padding: 12, borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Warehouse size={14} style={{ color: "var(--warning)" }} />
              <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>Stock Critique</span>
            </div>
            <Link href="/os/inventory" style={{ fontSize: 11, fontWeight: 800, color: "var(--gold)", textDecoration: "none" }}>
              Ouvrir stock
            </Link>
          </div>
          {data.lowStockAlerts.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>Aucune alerte stock critique.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.lowStockAlerts.slice(0, 4).map((item) => (
                <div key={item.perfume_id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", background: "var(--surface)" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>{item.name}</div>
                  <div style={{ marginTop: 2, fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>
                    Stock: {item.stock} · Seuil: {item.low_stock_threshold}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="luxury-card" style={{ padding: 12, borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={14} style={{ color: "var(--gold)" }} />
              <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text)" }}>Notifications & Live Feed</span>
            </div>
            <Link href="/os/notifications" style={{ fontSize: 11, fontWeight: 900, color: "var(--gold)", textDecoration: "none" }}>
              {unreadCount} non lues
            </Link>
          </div>
          {latestEvents.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>Aucune activité live pour le moment.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {latestEvents.slice(0, 4).map((event) => (
                <RealtimeFeedCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  /* ─────────────────────────────────────── DESKTOP BI DASHBOARD ─────────────────────────────────────── */

  return (
    <div className="os-page bi-dashboard">
      {/* Header */}
      <div className="bi-header">
        <div>
          <h1 className="bi-title">Dashboard Opérationnel</h1>
          <p className="bi-subtitle">Vue temps réel · {range} derniers jours</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="day-range-tabs">
            {([7, 30] as const).map((v) => (
              <button key={v} type="button" className={v === range ? "btn btn-primary btn-sm" : "btn-ghost btn-sm"} onClick={() => setRange(v)}>
                {v}j
              </button>
            ))}
          </div>
          <button type="button" className="btn-ghost btn-icon btn-sm" onClick={() => load(range)} aria-label="Rafraîchir">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <section className="bi-kpi-strip">
        <BiKpiCard label="Commandes aujourd'hui" value={biData.todayOrders} icon={<ShoppingCart size={18} />} tone="gold" href="/os/orders" />
        <BiKpiCard label="En attente" value={biData.pendingConfirmations} icon={<Clock size={18} />} tone={biData.pendingConfirmations > 0 ? "warning" : "success"} href="/os/orders?status=to_confirm" />
        <BiKpiCard label="Confirmées aujourd'hui" value={biData.confirmedToday} icon={<CheckCircle2 size={18} />} tone="success" />
        <BiKpiCard label="Annulées aujourd'hui" value={biData.canceledToday} icon={<XCircle size={18} />} tone={biData.canceledToday > 0 ? "danger" : "neutral"} />
        <BiKpiCard label="CA estimé" value={fmtMad(biData.todayRevenue)} unit="MAD" icon={<DollarSign size={18} />} tone="gold" sub={`Panier moyen: ${fmtMad(biData.avgBasket)} MAD`} />
        <BiKpiCard label="Stock critique" value={biData.lowStockAlerts.length} icon={<Package size={18} />} tone={biData.lowStockAlerts.length > 0 ? "warning" : "success"} href="/os/inventory" />
      </section>

      {/* ── Charts Row ── */}
      <section className="bi-charts-row">
        <div className="bi-chart-card">
          <div className="bi-section-title">
            <span>Répartition par statut</span>
          </div>
          <DonutChart segments={biData.statusSegments} size={150} />
        </div>
        <div className="bi-chart-card">
          <div className="bi-section-title">
            <span>Funnel de conversion</span>
          </div>
          <FunnelChart steps={biData.funnelSteps} />
        </div>
      </section>

      {/* ── Quick Stats Row ── */}
      <section className="bi-quick-stats">
        <div className="bi-stat-pill">
          <MapPin size={13} />
          <span>Top ville: <strong>{biData.topCity?.city ?? "—"}</strong></span>
          {biData.topCity && <span className="bi-stat-count">{biData.topCity.count} cmd</span>}
        </div>
        <div className="bi-stat-pill">
          <Star size={13} />
          <span>Top produit: <strong>{biData.topProduct?.name ?? "—"}</strong></span>
          {biData.topProduct && <span className="bi-stat-count">{biData.topProduct.count} vtes</span>}
        </div>
        <div className="bi-stat-pill">
          <Megaphone size={13} />
          <span>Top source: <strong>{biData.topSource?.label ?? "—"}</strong></span>
          {biData.topSource && <span className="bi-stat-count">{biData.topSource.count} cmd</span>}
        </div>
        <div className="bi-stat-pill">
          <TrendingUp size={13} />
          <span>Taux confirmation: <strong>{biData.confirmationRate}%</strong></span>
          <span className="bi-stat-count">Annulation: {biData.cancellationRate}%</span>
        </div>
      </section>

      {/* ── Main Grid: Urgent + Activity + Rankings ── */}
      <section className="bi-main-grid">
        <div className="bi-main-col">
          <UrgentTable alerts={biData.urgentAlerts} />
          <div className="bi-rankings-row">
            <BiRankingList title="TOP VILLES" items={biData.topCities} emptyMessage="Données villes indisponibles" />
            <BiRankingList title="TOP PRODUITS" items={biData.topProducts} emptyMessage="Données produits indisponibles" />
          </div>
        </div>
        <aside className="bi-side-col">
          <RealActivityFeed items={biData.activity} />
        </aside>
      </section>
    </div>
  );
}
