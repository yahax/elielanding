const SESSION_COOKIE_NAME = "elie_os_token";
const SESSION_TTL_SECONDS = 60 * 60 * 24;

type SessionPayload = {
  sub: string;
  name: string;
  role: string;
  exp: number;
};

function base64UrlEncode(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function hmacSha256(secret: string, value: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

export async function createOsSessionToken(input: {
  secret: string;
  sub: string;
  name: string;
  role?: string;
  ttlSeconds?: number;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: input.sub,
    name: input.name,
    role: input.role ?? "admin",
    exp: now + (input.ttlSeconds ?? SESSION_TTL_SECONDS),
  };

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmacSha256(input.secret, payloadEncoded);

  return `${payloadEncoded}.${signature}`;
}

export async function verifyOsSessionToken(input: {
  secret: string;
  token?: string | null;
}): Promise<SessionPayload | null> {
  const token = input.token?.trim();
  if (!token) return null;

  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) return null;

  const expectedSignature = await hmacSha256(input.secret, payloadEncoded);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);

    if (!payload?.sub || !payload?.name || !payload?.exp) return null;
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

export function getOsSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getOsSessionMaxAge(ttlSeconds = SESSION_TTL_SECONDS): number {
  return ttlSeconds;
}
