"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchTrackingAnalytics } from "@/lib/os/api";
import { buildTrackingQuery, parseTrackingFiltersFromSearchParams } from "@/lib/os/domain/query-filters";
import type { TrackingSnapshot } from "@/lib/os/tracking/types";
import { useIsMobile } from "@/hooks/useIsMobile";
import { LoadingSkeletonBlock } from "@/components/ui/LoadingSkeletonBlock";
import { DataStateWrapper } from "@/components/ui/DataStateWrapper";
import { TrackingHero } from "@/components/os/tracking/TrackingHero";
import { FunnelCard } from "@/components/os/tracking/FunnelCard";
import { PerformanceBreakdownCard } from "@/components/os/tracking/PerformanceBreakdownCard";
import { NarrativeInsightCard } from "@/components/os/tracking/NarrativeInsightCard";

type Timeframe = 7 | 30;

const EMPTY_SNAPSHOT: TrackingSnapshot = {
  metrics: [],
  sourceBreakdown: { id: "source", title: "", description: "", rows: [] },
  cityBreakdown: { id: "city", title: "", description: "", rows: [] },
  productBreakdown: { id: "product", title: "", description: "", rows: [] },
  statusBreakdown: { id: "status", title: "", description: "", rows: [] },
  temporalBreakdown: { id: "temporal", title: "", description: "", rows: [] },
  funnel: [],
  topCities: [],
  topProducts: [],
  topSources: [],
  topCustomerSegments: [],
  narratives: [],
  hourlyHeatmap: [],
};

function TrackingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile(1024);
  const [timeframe, setTimeframe] = useState<Timeframe>(30);
  const [lastQuery, setLastQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<TrackingSnapshot>(EMPTY_SNAPSHOT);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchTrackingAnalytics(timeframe);
      setSnapshot(response.snapshot.snapshot);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de charger le tracking");
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
    const href = buildTrackingQuery({ range: timeframe === 7 ? "7d" : "30d" });
    const query = href.includes("?") ? href.split("?")[1] ?? "" : "";
    if (query === lastQuery) return;
    setLastQuery(query);
    router.replace(href, { scroll: false });
  }, [lastQuery, router, timeframe]);

  const hasData = useMemo(() => snapshot.metrics[0]?.value > 0, [snapshot]);

  return (
    <div className="os-page animate-fade-in" style={{ paddingBottom: 96, gap: 12 }}>
      <TrackingHero periodDays={timeframe} onPeriodChange={setTimeframe} onRefresh={load} refreshing={loading} metrics={snapshot.metrics} />

      {loading && hasData ? <LoadingSkeletonBlock compact lines={2} /> : null}

      <DataStateWrapper
        loading={loading && !hasData}
        error={error}
        empty={!hasData}
        emptyTitle="Aucune donnée tracking"
        emptyCopy="Le tracking s'active automatiquement dès les premières commandes."
        loadingLabel="Agrégation des métriques business..."
        onRetry={load}
        useSkeleton
      >
        <>
          <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            {snapshot.metrics.map((metric) => (
              <div key={metric.id} className="luxury-card" style={{ padding: 12, borderRadius: 14 }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", fontWeight: 900 }}>
                  {metric.label}
                </div>
                <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900, color: "var(--text)" }}>{metric.valueLabel}</div>
                <div style={{ marginTop: 5, fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>{metric.sub}</div>
              </div>
            ))}
          </section>

          <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.15fr 1fr", gap: 10 }}>
            <FunnelCard stages={snapshot.funnel} />
            <section className="luxury-card" style={{ padding: 16, borderRadius: 18 }}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-dim)",
                  fontWeight: 900,
                  marginBottom: 10,
                }}
              >
                Heatmap horaire
              </div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={snapshot.hourlyHeatmap}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                    <XAxis dataKey="hour" tick={{ fill: "var(--text-dim)", fontSize: 11, fontWeight: 700 }} interval={2} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--text-dim)", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "var(--text)",
                      }}
                    />
                    <Bar dataKey="orders" fill="var(--gold)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <PerformanceBreakdownCard breakdown={snapshot.sourceBreakdown} />
            <PerformanceBreakdownCard breakdown={snapshot.cityBreakdown} />
            <PerformanceBreakdownCard breakdown={snapshot.productBreakdown} />
            <PerformanceBreakdownCard breakdown={snapshot.statusBreakdown} />
            <PerformanceBreakdownCard breakdown={snapshot.temporalBreakdown} />
          </section>

          <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
            <div className="luxury-card" style={{ padding: 12, borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 900 }}>Top villes</div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {snapshot.topCities.slice(0, 5).map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text)", fontWeight: 800 }}>
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="luxury-card" style={{ padding: 12, borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 900 }}>Top produits</div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {snapshot.topProducts.slice(0, 5).map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text)", fontWeight: 800 }}>
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="luxury-card" style={{ padding: 12, borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 900 }}>Top sources</div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {snapshot.topSources.slice(0, 5).map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text)", fontWeight: 800 }}>
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="luxury-card" style={{ padding: 12, borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 900 }}>Top segments clients</div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {snapshot.topCustomerSegments.slice(0, 5).map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text)", fontWeight: 800 }}>
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            {snapshot.narratives.map((narrative) => (
              <NarrativeInsightCard key={narrative.id} item={narrative} />
            ))}
          </section>
        </>
      </DataStateWrapper>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="os-page" style={{ padding: 32, textAlign: "center", color: "var(--text-dim)" }}>Chargement tracking...</div>}>
      <TrackingPageInner />
    </Suspense>
  );
}
