export type InsightCategory = "urgent" | "opportunity" | "risk" | "growth" | "retention";

export type InsightPriority = "low" | "medium" | "high" | "critical";

export interface BusinessInsight {
  id: string;
  title: string;
  explanation: string;
  category: InsightCategory;
  priority: InsightPriority;
  impactLabel: string;
  impactValue: number;
  ctaLabel: string;
  ctaHref: string;
  metricLabel?: string;
  metricValue?: string;
}

export interface BusinessSignal {
  id: string;
  label: string;
  value: string;
  sub: string;
  tone: "neutral" | "success" | "warning" | "danger" | "gold";
}

export interface IntelligenceSummary {
  totalInsights: number;
  urgentCount: number;
  opportunityCount: number;
  riskCount: number;
  growthCount: number;
  retentionCount: number;
  headline: string;
}
