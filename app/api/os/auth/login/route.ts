import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEntry } from "@/lib/os/audit/logger";
import { dispatchDomainEvent } from "@/lib/os/realtime/event-dispatcher";
import {
  buildLoginRateLimitKey,
  clearLoginFailures,
  getLoginRateLimitState,
  registerLoginFailure,
} from "@/lib/os/server/login-rate-limit";
import { createOsSessionToken, getOsSessionCookieName, getOsSessionMaxAge } from "@/lib/os/server/session-token";

const loginSchema = z.object({
  password: z.string().min(1),
  actorName: z.string().trim().min(1).max(120).optional(),
  actorId: z.string().trim().min(1).max(120).optional(),
});

function safeStringEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(req: NextRequest) {
  try {
    const payload = loginSchema.parse(await req.json());
    const expectedPassword = process.env.ELIE_OS_PASSWORD;
    const secret = process.env.ELIE_OS_SECRET;
    const rateLimitKey = buildLoginRateLimitKey(req.headers, payload.actorId ?? null);

    if (!expectedPassword || !secret) {
      console.error("[OS/Auth] ELIE_OS_PASSWORD or ELIE_OS_SECRET not configured.");
      return NextResponse.json({ error: "Erreur de configuration serveur." }, { status: 500 });
    }

    const limitState = getLoginRateLimitState(rateLimitKey);
    if (!limitState.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez plus tard.", retryAfterSec: limitState.retryAfterSec },
        {
          status: 429,
          headers: {
            "retry-after": String(limitState.retryAfterSec),
          },
        }
      );
    }

    const providedPassword = payload.password.trim();
    if (!safeStringEquals(providedPassword, expectedPassword)) {
      const failureState = registerLoginFailure(rateLimitKey);
      await new Promise((resolve) => setTimeout(resolve, 220));
      return NextResponse.json(
        {
          error: "Mot de passe incorrect.",
          retryAfterSec: failureState.locked ? failureState.retryAfterSec : undefined,
        },
        {
          status: failureState.locked ? 429 : 401,
          headers: failureState.locked
            ? {
                "retry-after": String(failureState.retryAfterSec),
              }
            : undefined,
        }
      );
    }

    clearLoginFailures(rateLimitKey);

    const actorId = payload.actorId?.trim() || "operator:session";
    const actorName = payload.actorName?.trim() || "Operator ELIE";
    const token = await createOsSessionToken({
      secret,
      sub: actorId,
      name: actorName,
      role: "admin",
    });

    const response = NextResponse.json({
      success: true,
      actor: { actorId, actorName },
    });

    response.cookies.set(getOsSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: getOsSessionMaxAge(),
      path: "/",
    });

    try {
      await logAuditEntry({
        actorId,
        actorName,
        actionType: "auth.login",
        entityType: "system",
        entityId: "auth",
        label: "Connexion opérateur",
        details: "Session ELIE OS ouverte.",
      });

      await dispatchDomainEvent({
        type: "audit.logged",
        entityType: "audit",
        entityId: "auth-login",
        actorId,
        actorName,
        label: "Connexion opérateur enregistrée",
        payload: {
          action: "auth.login",
        },
      });
    } catch (auditError) {
      console.warn("[OS/Auth] Unable to persist login audit:", auditError);
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
}
