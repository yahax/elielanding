
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
import { createOsSessionToken, getOsSessionCookieName, getOsSessionMaxAge, safeEqual } from "@/lib/os/server/session-token";
import { validateOsAuthEnv } from "@/lib/os/server/env-validation";

const loginSchema = z.object({
  password: z.string().min(1),
  actorName: z.string().trim().min(1).max(120).optional(),
  actorId: z.string().trim().min(1).max(120).optional(),
});



export async function POST(req: NextRequest) {
  try {
    const payload = loginSchema.parse(await req.json());
    const envCheck = validateOsAuthEnv();
    if (!envCheck.valid) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const expectedPassword = envCheck.elieOsPassword;
    const secret = envCheck.elieOsSecret;
    const rateLimitKey = buildLoginRateLimitKey(req.headers, payload.actorId ?? null);

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
    if (!safeEqual(providedPassword, expectedPassword)) {
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
      sameSite: "lax",
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
