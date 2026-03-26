"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { fetchIntelligenceAnalytics } from "@/lib/os/api";
import { parseTrackingFiltersFromSearchParams, buildTrackingQuery } from "@/lib/os/domain/query-filters";
import { buildBusinessIntelligence } from "@/lib/os/intelligence/helpers";
import type { InsightCategory } from "@/lib/os/intelligence/types";
import { useIsMobile } from "@/hooks/useIsMobile";
import { LoadingSkeletonBlock } from "@/components/ui/LoadingSkeletonBlock";
import { DataStateWrapper } from "@/components/ui/DataStateWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { IntelligenceHero } from "@/components/os/intelligence/IntelligenceHero";
import { InsightCategoryTabs } from "@/components/os/intelligence/InsightCategoryTabs";
import { DecisionInsightCard } from "@/components/os/intelligence/DecisionInsightCard";
import { BusinessSignalGrid } from "@/components/os/intelligence/BusinessSignalGrid";

type Timeframe = 7 | 30;
type IntelligenceBundle = ReturnType<typeof buildBusinessIntelligence>;

function IntelligencePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile(1024);
  const [timeframe, setTimeframe] = useState<Timeframe>(30);
  const [lastQuery, setLastQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<InsightCategory | "all">("all");
  const [bundle, setBundle] = useState(() => buildBusinessIntelligence({ orders: [], customers: [], overview: null }));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchIntelligenceAnalytics(timeframe);
      setBundle({
        summary: response.snapshot.summary,
        insights: response.snapshot.insights,
        groupedInsights: response.snapshot.groupedInsights as IntelligenceBundle["groupedInsights"],
        signals: response.snapshot.signals,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de charger la couche intelligence");
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const query = searchParams.toString();
    setLastQuery(query);
    const parsed = parseTrackingFiltersFromSearchParams(searchParams);
    if (parsed.range === "7d") setTimeframe(7);
    if (parsed.range === "30d") setTimeframe(30);
  }, [searchParams]);

  useEffect(() => {
    const href = buildTrackingQuery({ range: timeframe === 7 ? "7d" : "30d" }, "/os-admin/intelligence");
    const query = href.includes("?") ? href.split("?")[1] ?? "" : "";
    if (query === lastQuery) return;
    setLastQuery(query);
    router.replace(href, { scroll: false });
  }, [lastQuery, router, timeframe]);

  const counts = useMemo(
    () => ({
      all: bundle.insights.length,
      urgent: bundle.groupedInsights.urgent.length,
      opportunity: bundle.groupedInsights.opportunity.length,
      risk: bundle.groupedInsights.risk.length,
      growth: bundle.groupedInsights.growth.length,
      retention: bundle.groupedInsights.retention.length,
    }),
    [bundle]
  );

  const visibleInsights = useMemo(() => {
    if (activeCategory === "all") return bundle.insights;
    return bundle.groupedInsights[activeCategory] ?? [];
  }, [activeCategory, bundle]);

  return (
    <div className="os-page animate-fade-in" style={{ paddingBottom: 96, gap: 12 }}>
      <PageHeader
        title="Business Signals"
        subtitle="Métriques actionnables : top sources, top villes, risques stock, taux conversion."
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <div className="day-range-tabs">
              {[7, 30].map((value) => (
                <button key={value} type="button" className={value === timeframe ? "btn btn-primary btn-sm" : "btn-ghost btn-sm"} onClick={() => setTimeframe(value as Timeframe)}>
                  {value}j
                </button>
              ))}
            </div>
            <button type="button" className="btn-ghost btn-icon btn-sm" onClick={load} aria-label="Rafraîchir">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {loading && bundle.insights.length > 0 ? <LoadingSkeletonBlock compact lines={2} /> : null}

      <DataStateWrapper
        loading={loading && bundle.insights.length === 0}
        error={error}
        empty={bundle.insights.length === 0}
        emptyTitle="Aucun insight disponible"
        emptyCopy="Ajoutez du volume de commandes pour activer les recommandations automatiques."
        loadingLabel="Calcul des insights métier..."
        onRetry={load}
        useSkeleton
      >
        <IntelligenceHero summary={bundle.summary} />
        <InsightCategoryTabs active={activeCategory} counts={counts} onChange={setActiveCategory} />
        <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {visibleInsights.map((insight) => (
            <DecisionInsightCard key={insight.id} insight={insight} />
          ))}
        </section>
        <BusinessSignalGrid signals={bundle.signals} />
      </DataStateWrapper>
    </div>
  );
}

export default function IntelligencePage() {
  return (
    <Suspense fallback={<div className="os-page" style={{ padding: 32, textAlign: "center", color: "var(--text-dim)" }}>Chargement Business Signals...</div>}>
      <IntelligencePageInner />
    </Suspense>
  );
}
