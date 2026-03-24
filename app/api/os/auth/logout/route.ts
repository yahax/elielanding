import { NextResponse } from 'next/server';
import { resolveActorFromRequest } from '@/lib/os/server/actor';
import { logAuditEntry } from '@/lib/os/audit/logger';
import { dispatchDomainEvent } from '@/lib/os/realtime/event-dispatcher';
import { getOsSessionCookieName } from '@/lib/os/server/session-token';

export async function POST(req: Request) {
    const actor = await resolveActorFromRequest(req);
    const response = NextResponse.json({ success: true });
    response.cookies.delete(getOsSessionCookieName());

    try {
        await logAuditEntry({
            actorId: actor.actorId,
            actorName: actor.actorName,
            actionType: 'auth.logout',
            entityType: 'system',
            entityId: 'auth',
            label: 'Déconnexion opérateur',
            details: 'Session ELIE OS fermée.',
        });

        await dispatchDomainEvent({
            type: 'audit.logged',
            entityType: 'audit',
            entityId: 'auth-logout',
            actorId: actor.actorId,
            actorName: actor.actorName,
            label: 'Déconnexion opérateur enregistrée',
            payload: {
                action: 'auth.logout',
            },
        });
    } catch (auditError) {
        console.warn('[OS/Auth] Unable to persist logout audit:', auditError);
    }

    return response;
}
