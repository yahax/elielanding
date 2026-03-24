import { getOsSessionCookieName, verifyOsSessionToken } from "@/lib/os/server/session-token";

export interface ActorContext {
  actorId: string;
  actorName: string;
}

const DEFAULT_ACTOR: ActorContext = {
  actorId: "operator:default",
  actorName: "Operator ELIE",
};

function sanitize(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readCookieValue(headers: Headers, cookieName: string): string | null {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return null;

  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [rawKey, ...rest] = pair.split("=");
    const key = rawKey?.trim();
    if (!key || key !== cookieName) continue;
    const value = rest.join("=").trim();
    if (value.length === 0) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

export async function resolveActorFromHeaders(headers: Headers): Promise<ActorContext> {
  const secret = process.env.ELIE_OS_SECRET;
  const token = readCookieValue(headers, getOsSessionCookieName());
  const session = secret && token ? await verifyOsSessionToken({ secret, token }) : null;

  const allowHeaderOverride = process.env.ELIE_OS_ALLOW_ACTOR_HEADER_OVERRIDE === "1";
  const actorId = allowHeaderOverride ? sanitize(headers.get("x-os-actor-id")) : null;
  const actorName = allowHeaderOverride ? sanitize(headers.get("x-os-actor-name")) : null;

  if (session) {
    return {
      actorId: actorId ?? session.sub,
      actorName: actorName ?? session.name,
    };
  }

  if (!actorId && !actorName) return DEFAULT_ACTOR;

  return {
    actorId: actorId ?? DEFAULT_ACTOR.actorId,
    actorName: actorName ?? DEFAULT_ACTOR.actorName,
  };
}

export function resolveActorFromRequest(req: Request): Promise<ActorContext> {
  return resolveActorFromHeaders(req.headers);
}
