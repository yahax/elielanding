"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, Search, TriangleAlert } from "lucide-react";
import { searchOs } from "@/lib/os/api";
import { NotificationBell } from "@/components/os/notifications/NotificationBell";
import { LiveStatusDot } from "@/components/os/live/LiveStatusDot";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import { useNotifications } from "@/hooks/useNotifications";

type SearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

const PAGE_TITLES: Record<string, string> = {
  "/os-admin/control": "War Room",
  "/os-admin/orders": "Commandes",
  "/os-admin/pipeline": "Pipeline",
  "/os-admin/notifications": "Alertes",
  "/os-admin/clients": "Clients",
  "/os-admin/settings": "Paramètres",
  "/os-admin/intelligence": "Business Signals",
  "/os-admin/inventory": "Stock",
  "/os-admin/products": "Produits",
};

const RESULT_TYPE_LABELS: Record<string, string> = {
  order: "Commande",
  client: "Client",
  city: "Ville",
  product: "Produit",
  notification: "Alerte",
  inventory: "Stock",
  pipeline: "Pipeline",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const key = Object.keys(PAGE_TITLES).find((candidate) => candidate !== "/os-admin/control" && pathname.startsWith(candidate));
  return key ? PAGE_TITLES[key] : "ELIE OS";
}

function resolveResultTypeLabel(type: string): string {
  return RESULT_TYPE_LABELS[type] || "Résultat";
}

function formatLastSync(lastSyncAt: string | null): string {
  if (!lastSyncAt) return "Sync en attente";

  const timestamp = new Date(lastSyncAt).getTime();
  if (!Number.isFinite(timestamp)) return "Sync récente";

  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 15) return "Sync à l'instant";
  if (diffSec < 60) return `Sync ${diffSec}s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Sync ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Sync ${diffHours} h`;

  return "Sync > 1j";
}

export function MobileTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { realtimeStatus, lastSyncAt } = useRealtimeFeed();
  const { notifications } = useNotifications();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchCacheRef = useRef<Map<string, SearchResult[]>>(new Map());
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const queryNormalized = query.trim().toLowerCase();
  const urgentCount = notifications.filter((item) => !item.read && item.severity === "critical").length;
  const title = useMemo(() => resolveTitle(pathname), [pathname]);
  const syncLabel = useMemo(() => formatLastSync(lastSyncAt), [lastSyncAt]);
  const shouldShowResultsPanel = searchOpen && queryNormalized.length >= 2;

  useEffect(() => {
    if (queryNormalized.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const cached = searchCacheRef.current.get(queryNormalized);
    if (cached) {
      setResults(cached);
      setLoading(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchOs(queryNormalized);
        if (!active) return;
        const nextResults = (response.results || []).slice(0, 8);
        setResults(nextResults);
        searchCacheRef.current.set(queryNormalized, nextResults);
        if (searchCacheRef.current.size > 30) {
          const firstKey = searchCacheRef.current.keys().next().value;
          if (firstKey) searchCacheRef.current.delete(firstKey);
        }
      } catch (error) {
        console.error("[MobileTopbar] Search failed", error);
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 240);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [queryNormalized]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchContainerRef.current) return;
      if (!searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 650);
  };

  return (
    <header className="os-mobile-topbar">
      <div className="os-mobile-topbar-safe">
        <div className="os-mobile-topbar-row">
          <div className="os-mobile-topbar-main">
            <span className="os-mobile-topbar-eyebrow">ELIE OS</span>
            <div className="os-mobile-topbar-title">{title}</div>
            <div className="os-mobile-topbar-meta">
              <LiveStatusDot status={realtimeStatus} compact />
              <span className="os-mobile-topbar-meta-divider" aria-hidden="true" />
              <span>{syncLabel}</span>
            </div>
          </div>

          <div className="os-mobile-topbar-actions">
            {urgentCount > 0 ? (
              <Link href="/os-admin/orders?status=to_confirm" className="os-mobile-urgent-chip">
                <TriangleAlert size={12} />
                <span>{urgentCount}</span>
              </Link>
            ) : null}

            <button type="button" className="btn-ghost btn-sm os-mobile-icon-btn" onClick={handleRefresh} aria-label="Rafraîchir">
              <RefreshCw size={14} className={refreshing ? "animate-spin" : undefined} />
            </button>

            <NotificationBell compact />
          </div>
        </div>

        <div className={`os-mobile-search${searchOpen ? " is-open" : ""}`} ref={searchContainerRef}>
          <Search size={15} className="os-mobile-search-icon" />
          <input
            type="text"
            className="filter-input os-mobile-search-input"
            placeholder="Rechercher..."
            aria-label="Recherche mobile ELIE OS"
            value={query}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => setQuery(event.target.value)}
          />

          {shouldShowResultsPanel ? (
            <div className="luxury-card os-mobile-search-results" role="listbox">
              {loading ? (
                <div className="os-mobile-search-empty">Recherche en cours...</div>
              ) : results.length === 0 ? (
                <div className="os-mobile-search-empty">Aucun résultat trouvé</div>
              ) : (
                results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="os-mobile-search-result"
                    onClick={() => {
                      router.push(result.href || "/os-admin/control");
                      setQuery("");
                      setResults([]);
                      setSearchOpen(false);
                    }}
                  >
                    <span className="os-mobile-search-result-main">
                      <span className="os-mobile-search-result-type">{resolveResultTypeLabel(result.type)}</span>
                      <span className="os-mobile-search-result-title">{result.title}</span>
                      <span className="os-mobile-search-result-sub">{result.subtitle}</span>
                    </span>
                    <ArrowRight size={14} className="os-mobile-search-result-arrow" />
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
