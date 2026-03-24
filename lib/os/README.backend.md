# ELIE OS Backend Wiring

This document describes the current production-ready backend architecture for ELIE OS and the explicit branch points to plug real infra.

## 1) Domain and server structure

- `lib/os/domain/*`
  - Domain types, status transition guards, domain errors, query/deep-link mappers.
- `lib/os/orders/*`
  - Adapters (`supabase` + mock fallback), repository, mappers, mutation service.
- `lib/os/analytics/*`
  - Server aggregations and analytics snapshots for dashboard/tracking/intelligence.
- `lib/os/audit/*`
  - Central audit logger with DB fallback strategy.
- `lib/os/preferences/*`
  - User preferences defaults + persistence (DB + memory fallback).
- `lib/os/realtime/*`
  - Domain event dispatcher, event listing, event -> notification mapping.
- `lib/os/server/memory-store.ts`
  - In-memory fallback for orders/audit/events/preferences.

## 2) API endpoints

### Orders
- `GET /api/os/orders`
- `POST /api/os/orders/status`
- `POST /api/os/orders/[id]/status`
- `POST /api/os/orders/[id]/confirm`
- `POST /api/os/orders/[id]/callback`
- `POST /api/os/orders/[id]/ship`
- `POST /api/os/orders/[id]/cancel`
- `POST /api/os/orders/[id]/assign`
- `POST /api/os/orders/[id]/notes`
- `POST /api/os/orders/[id]/whatsapp`

### Analytics
- `GET /api/os/analytics/dashboard`
- `GET /api/os/analytics/tracking`
- `GET /api/os/analytics/intelligence`

### Audit / Realtime / Preferences
- `GET /api/os/audit`
- `GET /api/os/events`
- `GET /api/os/preferences`
- `PUT /api/os/preferences`
- `POST /api/os/notifications/read`

### Settings / Catalog / Auth
- `GET|PUT /api/os/settings`
- `GET|POST|PATCH /api/os/catalog`
- `POST /api/os/auth/login`
- `POST /api/os/auth/logout`

## 3) Required tables (recommended)

Core:
- `orders`
- `perfumes`
- `inventory`
- `shop_settings`

OS extension:
- `os_user_preferences` (`user_id`, `payload`, `updated_at`)
- `os_audit_logs` (`id`, `actor_id`, `actor_name`, `action_type`, `entity_type`, `entity_id`, `label`, `details`, `metadata`, `created_at`)
- `os_domain_events` (`id`, `event_type`, `entity_type`, `entity_id`, `actor_id`, `actor_name`, `label`, `payload`, `created_at`)
- `os_notifications` (`id`, `category`, `title`, `message`, `is_read`, `read_at`, `read_by`, `payload`, `created_at`, `updated_at`)
- `os_inventory_adjustments` (`id`, `perfume_id`, `delta`, `previous_stock`, `next_stock`, `actor_id`, `reason`, `metadata`, `created_at`)
- `os_idempotency_keys` (`scope`, `actor_id`, `idempotency_key`, `request_hash`, `status`, `response_status`, `response_body`, `expires_at`)

## 4) Fallback strategy

If OS extension tables are missing:
- Preferences fall back to memory store.
- Audit logs are still pushed to memory and bridged to legacy `events` when possible.
- Domain events are pushed to memory and bridged to legacy `events` when possible.
- Orders can use mock adapter if table is not available.

This lets UI stay operational while infra catches up.

## 5) Domain events used

- `order.created`
- `order.updated`
- `order.confirmed`
- `order.cancelled`
- `order.assigned`
- `stock.updated`
- `notification.created`
- `settings.updated`
- `audit.logged`

## 6) Deep links

Centralized in `lib/os/domain/query-filters.ts`:
- `buildOrdersQuery`
- `buildClientsQuery`
- `buildPipelineQuery`
- `buildTrackingQuery`
- plus corresponding parsers from URL search params.

Used by orders/clients/pipeline/tracking/intelligence paths and realtime notification links.

## 7) Business rule guardrails

Status transitions are enforced in:
- `lib/os/domain/status-transition-guards.ts`

Main flow:
- `new -> to_confirm`
- `to_confirm -> callback|confirmed|canceled`
- `confirmed -> ready_to_ship|shipped|canceled`
- `ready_to_ship -> shipped|canceled`
- `shipped -> delivered|canceled`

## 8) TODO branch points for hard production rollout

- SQL migration baseline: `supabase/migrations/20260323_0001_os_backend_hardening.sql`
  - covers schema extensions, indexes, RLS, append-only safeguards, idempotency storage, realtime publication wiring.
- API hardening completed on critical mutations:
  - auth session token verification in middleware for `/os/*` and `/api/os/*`
  - idempotency wrappers for status/confirm/cancel/settings/preferences/notifications/stock and key order actions.
- Remaining production tasks:
  - add integration tests for critical routes (status lifecycle, settings/preferences, stock adjust, notifications read).
  - enable scheduled cleanup of `os_idempotency_keys` via `cleanup_os_idempotency_keys`.
