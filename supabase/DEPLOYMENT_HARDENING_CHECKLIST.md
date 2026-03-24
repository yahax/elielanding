# ELIE OS Supabase Hardening - Deployment Checklist

## 1) Backend/DB audit summary

Current backend relies on the following core tables:
- `orders`
- `perfumes`
- `inventory`
- `shop_settings`
- `os_user_preferences`
- `os_audit_logs`
- `os_domain_events`

Hardening gaps identified before this sprint:
- Missing persistence for notifications (`os_notifications`)
- Missing stock movement history (`os_inventory_adjustments`)
- Missing idempotency persistence (`os_idempotency_keys`)
- No unified `orders.customer_phone` column for indexed phone lookups
- Missing `orders.assigned_operator_id` indexed field
- Incomplete constraints normalization (`status/source`) across legacy data
- Public/overly broad RLS patterns on sensitive operational tables
- No append-only DB protection on audit/events tables
- Realtime publication not guaranteed for OS tables

## 2) Target DB structure (internal production)

### Orders
- Extended columns: `reference`, `customer_phone`, `assigned_operator_id`, `assigned_operator_name`, `risk_score`, `priority_score`, `next_best_action`, `tags`, `meta`
- Guard constraints:
  - status: `new|to_confirm|callback|confirmed|shipped|delivered|canceled`
  - source: `whatsapp|direct|meta_ads|organic|other|landing_page`
  - pack type: `homme|femme|mixte`
  - customer phone presence check
- Sync trigger: `phone <-> customer_phone`

### OS operational tables
- `os_user_preferences`
- `os_audit_logs` (append-only)
- `os_domain_events` (append-only)
- `os_notifications`
- `os_inventory_adjustments` (append-only)
- `os_idempotency_keys` (service-role only)

### Settings
- `shop_settings` singleton (`id='global'`)

## 3) Migration plan and order

Execute in this order:
1. Backup production DB snapshot.
2. Run baseline schema (if needed).
3. Run hardening migration:
   - `supabase/migrations/20260323_0001_os_backend_hardening.sql`
4. Validate RLS and policies.
5. Validate indexes and table definitions.
6. Deploy API/backend code.
7. Run route smoke tests.
8. Enable monitoring and post-deploy validation matrix.

## 4) Required environment variables

Application:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ELIE_OS_SECRET`
- `ELIE_OS_PASSWORD`

Optional hardening toggles:
- `ELIE_OS_ALLOW_ACTOR_HEADER_OVERRIDE` (default: disabled)
- `ELIE_OS_ALLOW_PREFERENCES_USER_OVERRIDE` (default: disabled)

## 5) RLS verification commands

Run in Supabase SQL editor:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'orders',
    'shop_settings',
    'os_user_preferences',
    'os_audit_logs',
    'os_domain_events',
    'os_notifications',
    'os_inventory_adjustments',
    'os_idempotency_keys',
    'inventory'
  )
order by tablename;

select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'orders',
    'shop_settings',
    'os_user_preferences',
    'os_audit_logs',
    'os_domain_events',
    'os_notifications',
    'os_inventory_adjustments',
    'inventory'
  )
order by tablename, policyname;
```

## 6) Index verification commands

```sql
select
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'orders',
    'os_notifications',
    'os_audit_logs',
    'os_domain_events',
    'os_user_preferences',
    'os_inventory_adjustments',
    'os_idempotency_keys'
  )
order by tablename, indexname;
```

## 7) Realtime verification

Expected realtime tables in publication `supabase_realtime`:
- `orders`
- `os_notifications`
- `os_domain_events`
- `inventory`

Check:

```sql
select p.pubname, c.relname as table_name
from pg_publication p
join pg_publication_rel pr on pr.prpubid = p.oid
join pg_class c on c.oid = pr.prrelid
join pg_namespace n on n.oid = c.relnamespace
where p.pubname = 'supabase_realtime'
  and n.nspname = 'public'
order by c.relname;
```

## 8) Critical API smoke tests

Test after deploy (authenticated OS session):
- Login / logout
- Single status update
- Bulk status update
- Confirm / cancel order
- Stock adjust (`PATCH /api/os/catalog`)
- Notifications read (`POST /api/os/notifications/read`)
- Preferences update (`PUT /api/os/preferences`)
- Settings update (`PUT /api/os/settings`)

For each mutation, verify:
- HTTP code and response payload
- Order/settings/preferences data persisted
- Audit entry created when change is effective
- Domain event created when change is effective
- Duplicate submit behavior (replay or no-op, no data corruption)

## 9) Idempotency and concurrency strategy in production

- API-level idempotency via `idempotency-key`/`x-idempotency-key`
- Persistence table: `os_idempotency_keys`
- Compare-and-set order updates via `expectedStatus + expectedUpdatedAt`
- Status no-op behavior: repeat same status does not create duplicate side effects
- Notification read no-op: avoids duplicate audit/event when nothing changed
- Login brute-force mitigation: in-app lock window (memory-based)

## 10) Post-deployment validation matrix

Run and mark each row as PASS/FAIL:

| Scenario | Expected DB effects |
|---|---|
| Create order | `orders` row inserted, valid status/source, indexed retrieval works |
| Confirm order | `orders.status=confirmed`, `confirmed_at` set, audit + event rows added |
| Cancel order | `orders.status=canceled`, `canceled_at` set, audit + event rows added |
| Bulk status | targeted rows updated, partial failures reported safely |
| Stock adjust | inventory updated, `os_inventory_adjustments` row added, stock event logged |
| Notification read | `os_notifications.is_read=true` and/or preferences metadata updated |
| Preferences update | `os_user_preferences` updated, audit + event row if effective change |
| Settings update | `shop_settings` updated, audit + event row if effective change |
| Unauthorized API call | rejected (`401`) by middleware on `/api/os/*` |
| RLS probe | direct anon/auth access denied on protected tables |
| Realtime feed | updates visible on subscribed channels (or polling fallback active) |

## 11) Operational follow-ups

- Add scheduled cleanup job for `cleanup_os_idempotency_keys()`.
- Add integration test suite for critical mutation routes.
- Track query plans on `orders`/`notifications` endpoints after one week of real traffic.
