-- ELIE OS extension tables
-- Apply after core schema.

create table if not exists public.os_user_preferences (
  user_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.os_audit_logs (
  id uuid primary key,
  actor_id text not null,
  actor_name text not null,
  action_type text not null,
  entity_type text not null,
  entity_id text not null,
  label text not null,
  details text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_os_audit_logs_created_at on public.os_audit_logs (created_at desc);
create index if not exists idx_os_audit_logs_entity on public.os_audit_logs (entity_type, entity_id);

create table if not exists public.os_domain_events (
  id uuid primary key,
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  actor_id text null,
  actor_name text null,
  label text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_os_domain_events_created_at on public.os_domain_events (created_at desc);
create index if not exists idx_os_domain_events_type on public.os_domain_events (event_type, created_at desc);
