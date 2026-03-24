export interface TrackingMetric {
  id: string;
  label: string;
  value: number;
  valueLabel: string;
  sub: string;
  trend?: string;
  tone: "neutral" | "success" | "warning" | "danger" | "gold";
}

export interface TrackingBreakdownRow {
  id: string;
  label: string;
  orders: number;
  confirmed: number;
  canceled: number;
  confirmationRate: number;
  revenue: number;
}

export interface TrackingBreakdown {
  id: string;
  title: string;
  description: string;
  rows: TrackingBreakdownRow[];
}

export interface FunnelStage {
  id: string;
  label: string;
  count: number;
  rate: number;
  tone: "neutral" | "success" | "warning" | "danger";
}

export interface TopPerformer {
  label: string;
  value: number;
  suffix?: string;
}

export interface NarrativeInsight {
  id: string;
  title: string;
  body: string;
  tone: "neutral" | "success" | "warning" | "danger" | "gold";
  ctaLabel: string;
  ctaHref: string;
}

export interface TrackingSnapshot {
  metrics: TrackingMetric[];
  sourceBreakdown: TrackingBreakdown;
  cityBreakdown: TrackingBreakdown;
  productBreakdown: TrackingBreakdown;
  statusBreakdown: TrackingBreakdown;
  temporalBreakdown: TrackingBreakdown;
  funnel: FunnelStage[];
  topCities: TopPerformer[];
  topProducts: TopPerformer[];
  topSources: TopPerformer[];
  topCustomerSegments: TopPerformer[];
  narratives: NarrativeInsight[];
  hourlyHeatmap: Array<{ hour: string; orders: number }>;
}
