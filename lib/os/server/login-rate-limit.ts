interface LoginAttemptState {
  firstFailedAtMs: number;
  failedCount: number;
  lockedUntilMs: number;
  lastSeenAtMs: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 7;
const STALE_ENTRY_MS = 24 * 60 * 60 * 1000;

declare global {
  var __elieOsLoginAttempts: Map<string, LoginAttemptState> | undefined;
}

function getLoginAttemptsMap(): Map<string, LoginAttemptState> {
  if (!globalThis.__elieOsLoginAttempts) {
    globalThis.__elieOsLoginAttempts = new Map();
  }
  return globalThis.__elieOsLoginAttempts;
}

function cleanupStaleEntries(nowMs: number): void {
  const store = getLoginAttemptsMap();
  for (const [key, value] of store.entries()) {
    if (nowMs - value.lastSeenAtMs > STALE_ENTRY_MS) {
      store.delete(key);
    }
  }
}

function parseIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const cfIp = headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;
  return "ip:unknown";
}

function sanitizeToken(value: string | null): string {
  if (!value) return "unknown";
  return value.trim().slice(0, 120) || "unknown";
}

export function buildLoginRateLimitKey(headers: Headers, actorId: string | null): string {
  const ip = parseIp(headers);
  const actor = sanitizeToken(actorId);
  return `${ip}|${actor}`;
}

export function getLoginRateLimitState(key: string): { allowed: boolean; retryAfterSec: number } {
  const nowMs = Date.now();
  cleanupStaleEntries(nowMs);
  const store = getLoginAttemptsMap();
  const current = store.get(key);
  if (!current) return { allowed: true, retryAfterSec: 0 };

  current.lastSeenAtMs = nowMs;

  if (current.lockedUntilMs > nowMs) {
    const retryAfterSec = Math.ceil((current.lockedUntilMs - nowMs) / 1000);
    return { allowed: false, retryAfterSec };
  }

  if (nowMs - current.firstFailedAtMs > WINDOW_MS) {
    store.delete(key);
    return { allowed: true, retryAfterSec: 0 };
  }

  return { allowed: true, retryAfterSec: 0 };
}

export function registerLoginFailure(key: string): { locked: boolean; retryAfterSec: number } {
  const nowMs = Date.now();
  cleanupStaleEntries(nowMs);
  const store = getLoginAttemptsMap();
  const current = store.get(key);

  if (!current || nowMs - current.firstFailedAtMs > WINDOW_MS) {
    store.set(key, {
      firstFailedAtMs: nowMs,
      failedCount: 1,
      lockedUntilMs: 0,
      lastSeenAtMs: nowMs,
    });
    return { locked: false, retryAfterSec: 0 };
  }

  const nextCount = current.failedCount + 1;
  const lockedUntilMs = nextCount >= MAX_ATTEMPTS ? nowMs + LOCK_MS : 0;
  store.set(key, {
    firstFailedAtMs: current.firstFailedAtMs,
    failedCount: nextCount,
    lockedUntilMs,
    lastSeenAtMs: nowMs,
  });

  return {
    locked: lockedUntilMs > nowMs,
    retryAfterSec: lockedUntilMs > nowMs ? Math.ceil((lockedUntilMs - nowMs) / 1000) : 0,
  };
}

export function clearLoginFailures(key: string): void {
  const store = getLoginAttemptsMap();
  store.delete(key);
}
