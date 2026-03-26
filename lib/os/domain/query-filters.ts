import type { ReadonlyURLSearchParams } from "next/navigation";
import type { QueryFilterState } from "@/lib/os/domain/types";

type SearchParamInput = URLSearchParams | ReadonlyURLSearchParams | Record<string, string | string[] | undefined>;

const LIST_SEPARATOR = ",";

function hasGet(input: SearchParamInput): input is URLSearchParams | ReadonlyURLSearchParams {
  return typeof (input as URLSearchParams | ReadonlyURLSearchParams).get === "function";
}

function hasGetAll(input: SearchParamInput): input is URLSearchParams | ReadonlyURLSearchParams {
  return typeof (input as URLSearchParams | ReadonlyURLSearchParams).getAll === "function";
}

function readParam(input: SearchParamInput, key: string): string | null {
  if (input instanceof URLSearchParams) return input.get(key);
  if (hasGet(input)) return input.get(key);

  const raw = input[key];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

function readParamValues(input: SearchParamInput, key: string): string[] {
  if (input instanceof URLSearchParams) return input.getAll(key);
  if (hasGetAll(input)) return input.getAll(key);

  const raw = input[key];
  if (Array.isArray(raw)) return raw;
  return raw == null ? [] : [raw];
}

function parseList(input: string | null): string[] {
  if (!input) return [];
  return input
    .split(LIST_SEPARATOR)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseBoolean(input: string | null): boolean {
  if (input == null) return false;
  return input === "1" || input.toLowerCase() === "true";
}

function pushList(params: URLSearchParams, key: string, values: string[] | undefined): void {
  if (!values || values.length === 0) return;
  const normalized = values.map((value) => value.trim()).filter((value) => value.length > 0);
  if (normalized.length === 0) return;
  params.set(key, normalized.join(LIST_SEPARATOR));
}

function pushString(params: URLSearchParams, key: string, value: string | undefined): void {
  if (!value) return;
  const normalized = value.trim();
  if (normalized.length === 0) return;
  params.set(key, normalized);
}

function pushBoolean(params: URLSearchParams, key: string, value: boolean | undefined): void {
  if (!value) return;
  params.set(key, "1");
}

function toQuery(params: URLSearchParams, basePath: string): string {
  const query = params.toString();
  return query.length > 0 ? `${basePath}?${query}` : basePath;
}

export interface OrdersDeepLinkFilters {
  search?: string;
  statuses?: string[];
  sources?: string[];
  cities?: string[];
  packs?: string[];
  operators?: string[];
  priorities?: string[];
  risks?: string[];
  clientTypes?: string[];
  onlyUrgent?: boolean;
  onlyHighValue?: boolean;
  onlyAtRisk?: boolean;
  includeArchived?: boolean;
  datePreset?: "today" | "7d" | "30d" | "90d" | "all";
  fromDate?: string;
  toDate?: string;
}

export interface ClientsDeepLinkFilters {
  search?: string;
  segment?: string;
  city?: string;
  relationship?: string;
  minSpent?: number;
  onlyAtRisk?: boolean;
}

export interface PipelineDeepLinkFilters {
  search?: string;
  source?: string;
  city?: string;
  operator?: string;
  priority?: string;
  clientType?: string;
  datePreset?: "today" | "7d" | "30d" | "90d" | "all";
  onlyUrgent?: boolean;
  view?: "kanban" | "list" | "focus" | "urgent";
}

export interface TrackingDeepLinkFilters {
  range?: "7d" | "30d";
  source?: string;
}

export function buildOrdersQuery(filters: OrdersDeepLinkFilters, basePath = "/os-admin/orders"): string {
  const params = new URLSearchParams();
  pushString(params, "q", filters.search);
  pushList(params, "status", filters.statuses);
  pushList(params, "source", filters.sources);
  pushList(params, "city", filters.cities);
  pushList(params, "pack", filters.packs);
  pushList(params, "operator", filters.operators);
  pushList(params, "priority", filters.priorities);
  pushList(params, "risk", filters.risks);
  pushList(params, "clientType", filters.clientTypes);
  pushBoolean(params, "urgent", filters.onlyUrgent);
  pushBoolean(params, "highValue", filters.onlyHighValue);
  pushBoolean(params, "atRisk", filters.onlyAtRisk);
  pushBoolean(params, "archived", filters.includeArchived);
  pushString(params, "date", filters.datePreset);
  pushString(params, "from", filters.fromDate);
  pushString(params, "to", filters.toDate);
  return toQuery(params, basePath);
}

export function parseOrdersFiltersFromSearchParams(searchParams: SearchParamInput): OrdersDeepLinkFilters {
  const statuses = parseList(readParam(searchParams, "status"));
  const sources = parseList(readParam(searchParams, "source"));
  const cities = parseList(readParam(searchParams, "city"));
  const packs = parseList(readParam(searchParams, "pack"));
  const operators = parseList(readParam(searchParams, "operator"));
  const priorities = parseList(readParam(searchParams, "priority"));
  const risks = parseList(readParam(searchParams, "risk"));
  const clientTypes = parseList(readParam(searchParams, "clientType"));

  const q = readParam(searchParams, "q") || undefined;
  const date = readParam(searchParams, "date");

  return {
    search: q,
    statuses,
    sources,
    cities,
    packs,
    operators,
    priorities,
    risks,
    clientTypes,
    onlyUrgent: parseBoolean(readParam(searchParams, "urgent")),
    onlyHighValue: parseBoolean(readParam(searchParams, "highValue")),
    onlyAtRisk: parseBoolean(readParam(searchParams, "atRisk")),
    includeArchived: parseBoolean(readParam(searchParams, "archived")),
    datePreset: date === "today" || date === "7d" || date === "30d" || date === "90d" || date === "all" ? date : undefined,
    fromDate: readParam(searchParams, "from") || undefined,
    toDate: readParam(searchParams, "to") || undefined,
  };
}

export function buildClientsQuery(filters: ClientsDeepLinkFilters, basePath = "/os-admin/clients"): string {
  const params = new URLSearchParams();
  pushString(params, "q", filters.search);
  pushString(params, "segment", filters.segment);
  pushString(params, "city", filters.city);
  pushString(params, "relationship", filters.relationship);
  if (typeof filters.minSpent === "number" && Number.isFinite(filters.minSpent) && filters.minSpent > 0) {
    params.set("minSpent", String(filters.minSpent));
  }
  pushBoolean(params, "atRisk", filters.onlyAtRisk);
  return toQuery(params, basePath);
}

export function parseClientsFiltersFromSearchParams(searchParams: SearchParamInput): ClientsDeepLinkFilters {
  const minSpentRaw = readParam(searchParams, "minSpent");
  const parsedMinSpent = minSpentRaw == null ? undefined : Number(minSpentRaw);

  return {
    search: readParam(searchParams, "q") || undefined,
    segment: readParam(searchParams, "segment") || undefined,
    city: readParam(searchParams, "city") || undefined,
    relationship: readParam(searchParams, "relationship") || undefined,
    minSpent: Number.isFinite(parsedMinSpent) ? parsedMinSpent : undefined,
    onlyAtRisk: parseBoolean(readParam(searchParams, "atRisk")),
  };
}

export function buildPipelineQuery(filters: PipelineDeepLinkFilters, basePath = "/os-admin/pipeline"): string {
  const params = new URLSearchParams();
  pushString(params, "q", filters.search);
  pushString(params, "source", filters.source);
  pushString(params, "city", filters.city);
  pushString(params, "operator", filters.operator);
  pushString(params, "priority", filters.priority);
  pushString(params, "clientType", filters.clientType);
  pushString(params, "date", filters.datePreset);
  pushBoolean(params, "urgent", filters.onlyUrgent);
  pushString(params, "view", filters.view);
  return toQuery(params, basePath);
}

export function parsePipelineFiltersFromSearchParams(searchParams: SearchParamInput): PipelineDeepLinkFilters {
  const view = readParam(searchParams, "view");
  const date = readParam(searchParams, "date");

  return {
    search: readParam(searchParams, "q") || undefined,
    source: readParam(searchParams, "source") || undefined,
    city: readParam(searchParams, "city") || undefined,
    operator: readParam(searchParams, "operator") || undefined,
    priority: readParam(searchParams, "priority") || undefined,
    clientType: readParam(searchParams, "clientType") || undefined,
    datePreset: date === "today" || date === "7d" || date === "30d" || date === "90d" || date === "all" ? date : undefined,
    onlyUrgent: parseBoolean(readParam(searchParams, "urgent")),
    view: view === "kanban" || view === "list" || view === "focus" || view === "urgent" ? view : undefined,
  };
}

export function buildTrackingQuery(filters: TrackingDeepLinkFilters, basePath = "/os-admin/tracking"): string {
  const params = new URLSearchParams();
  pushString(params, "range", filters.range);
  pushString(params, "source", filters.source);
  return toQuery(params, basePath);
}

export function parseTrackingFiltersFromSearchParams(searchParams: SearchParamInput): TrackingDeepLinkFilters {
  const range = readParam(searchParams, "range");

  return {
    range: range === "7d" || range === "30d" ? range : undefined,
    source: readParam(searchParams, "source") || undefined,
  };
}

export function queryStateToSearchParams(state: QueryFilterState): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(state)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      params.set(key, value.map(String).join(LIST_SEPARATOR));
      continue;
    }
    if (typeof value === "boolean") {
      if (value) params.set(key, "1");
      continue;
    }
    const serialized = String(value).trim();
    if (serialized.length === 0) continue;
    params.set(key, serialized);
  }

  return params;
}

export function parseListFromAnySearchParams(searchParams: SearchParamInput, key: string): string[] {
  const allValues = readParamValues(searchParams, key);
  if (allValues.length === 0) return [];

  const expanded: string[] = [];
  for (const value of allValues) {
    expanded.push(...parseList(value));
  }

  return expanded;
}
