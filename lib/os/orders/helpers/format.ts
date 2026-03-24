import type { Order } from "@/lib/types";

export function formatCurrencyMAD(value: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatCompactCurrencyMAD(value: number): string {
  return new Intl.NumberFormat("fr-MA", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "-";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDate(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "-";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

export function formatElapsedMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return "0m";

  if (minutes < 60) return `${Math.round(minutes)}m`;

  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);

  if (h < 24) return `${h}h ${m}m`;

  const d = Math.floor(h / 24);
  const hRemainder = h % 24;
  return `${d}j ${hRemainder}h`;
}

function retainDigits(input: string): string {
  let digits = "";
  for (const char of input) {
    if (char >= "0" && char <= "9") {
      digits += char;
    }
  }
  return digits;
}

export function normalizePhone(phone: string | null | undefined): string {
  if (phone == null || phone === "") return "";

  const digits = retainDigits(phone);
  if (digits.startsWith("212") && digits.length >= 12) {
    return `0${digits.slice(3)}`;
  }

  return digits;
}

export function whatsappHref(phone: string | null | undefined): string {
  const normalized = normalizePhone(phone);
  if (normalized === "") return "";

  const noLeadingZero = normalized.startsWith("0") ? normalized.slice(1) : normalized;
  return `https://wa.me/212${noLeadingZero}`;
}

export function phoneHref(phone: string | null | undefined): string {
  const normalized = normalizePhone(phone);
  if (normalized === "") return "";
  return `tel:${normalized}`;
}

export function getOrderValue(order: Pick<Order, "price_mad" | "total_price">): number {
  const raw = order.price_mad ?? order.total_price;
  const value = Number(raw ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export function startOfDayISO(dateLike = new Date()): string {
  const date = new Date(dateLike);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export function isSameDayISO(iso: string | null | undefined, reference = new Date()): boolean {
  if (iso == null || iso === "") return false;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;

  const ref = new Date(reference);
  return (
    date.getFullYear() === ref.getFullYear() &&
    date.getMonth() === ref.getMonth() &&
    date.getDate() === ref.getDate()
  );
}
