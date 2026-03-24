# ELIE OS Backend/DB Audit - 2026-03-23

## Scope audited
- API routes under `app/api/os/*`
- Domain/repository adapters in `lib/os/*`
- Existing SQL files in `supabase/*.sql`

## Key findings

### Data model and schema
1. `orders` had partial business fields in code (`meta`), but no guaranteed indexed columns for:
- `assigned_operator_id`
- `customer_phone`
- scoring/action hints (`risk_score`, `priority_score`, `next_best_action`, `tags`)

2. Status/source normalization risk:
- Legacy values (`cancelled`, variant sources) could bypass normalized analytics and filters.

3. Missing operational persistence tables:
- `os_notifications`
- `os_inventory_adjustments`
- `os_idempotency_keys`

4. Existing extension SQL only partially covered:
- `os_user_preferences`
- `os_audit_logs`
- `os_domain_events`

### Index/performance
5. Critical indexes were incomplete or inconsistent for target use cases:
- orders list/search (`status`, `created_at`, `city`, `source`, `assigned_operator_id`, `customer_phone`, `updated_at`)
- notifications unread feed
- audit/event timelines
- idempotency claim/replay lookup

### Security/RLS
6. `/api/os/*` endpoints were previously not all middleware-protected.
7. Table-level protections were too permissive/heterogeneous (public read patterns on sensitive tables).
8. Audit/domain-events tables lacked DB-level append-only enforcement.
9. Idempotency storage had no dedicated protected table.

### Mutation hardening / reliability
10. Critical mutations needed stronger safeguards:
- idempotency for repeated submissions
- no-op handling for same status updates
- compare-and-set style guard for concurrent writes
- notifications read should avoid duplicate side effects when already read
- login needed brute-force mitigation

## Remediation delivered

### Code hardening
- Middleware protects both `/os/*` and `/api/os/*` with signed session verification.
- Auth actor resolution bound to session token by default.
- Idempotent mutation framework implemented (`lib/os/server/idempotency.ts`).
- Critical routes hardened (status, bulk status, confirm/cancel, stock/catalog patch, notifications read, preferences, settings).
- Additional order actions wrapped with idempotent execution (assign/callback/ship/notes/whatsapp).
- Compare-and-set guards in repository adapter update path.
- Status mutation no-op when status already applied.
- Login brute-force guard (window + lockout) added.

### SQL hardening
- New migration: `supabase/migrations/20260323_0001_os_backend_hardening.sql`
- Covers:
  - Orders schema extensions + normalized constraints + sync trigger + indexes
  - New tables: notifications, inventory adjustments, idempotency keys
  - RLS policy baseline for operational tables
  - Append-only triggers for audit/events/inventory adjustments
  - Realtime publication wiring + replica identity
  - Idempotency cleanup function

### Deployment/validation docs
- `supabase/DEPLOYMENT_HARDENING_CHECKLIST.md`

## Residual risks / TODO
- Login rate limiting is memory-based (single instance). For multi-instance deployments, move to Redis/Supabase-backed limiter.
- Add automated integration tests for route-level hardening and policy checks.
- Schedule periodic cleanup for `os_idempotency_keys`.
