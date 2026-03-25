-- ============================================================
-- ELIE OS - Backend Hardening (Supabase/Postgres)
-- Date: 2026-03-23
-- Goal: production-grade consistency, security, indexing, idempotency, realtime-ready
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1) Orders hardening (columns, constraints, sync, indexes)
-- ------------------------------------------------------------

do $orders$
declare
  _constraint record;
begin
  if to_regclass('public.orders') is null then
    raise notice 'orders table not found, skipping orders hardening block.';
    return;
  end if;

  alter table public.orders add column if not exists reference text;
  alter table public.orders add column if not exists customer_phone text;
  alter table public.orders add column if not exists assigned_operator_id text;
  alter table public.orders add column if not exists assigned_operator_name text;
  alter table public.orders add column if not exists risk_score numeric(6,2) not null default 0;
  alter table public.orders add column if not exists priority_score numeric(6,2) not null default 0;
  alter table public.orders add column if not exists next_best_action text;
  alter table public.orders add column if not exists tags text[] not null default '{}'::text[];
  alter table public.orders add column if not exists meta jsonb not null default '{}'::jsonb;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'phone'
  ) then
    execute 'update public.orders set customer_phone = coalesce(nullif(btrim(customer_phone), ''''), nullif(btrim(phone), '''')) where customer_phone is distinct from coalesce(nullif(btrim(customer_phone), ''''), nullif(btrim(phone), ''''))';
  end if;

  execute 'update public.orders set status = ''canceled'' where status = ''cancelled''';

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'source'
  ) then
    execute $sql$
      update public.orders
      set source = case
        when source in ('meta_ads', 'meta') then 'meta_ads'
        when source in ('landing', 'landing_page') then 'landing_page'
        when source in ('wa', 'whatsapp') then 'whatsapp'
        when source in ('direct', 'organic', 'other') then source
        when source is null or btrim(source) = '' then 'direct'
        else source
      end
    $sql$;
  end if;

  -- Drop previous status/source checks to avoid legacy conflicting constraints.
  for _constraint in
    select conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'orders'
      and c.contype = 'c'
      and c.conname ilike '%status%'
  loop
    execute format('alter table public.orders drop constraint if exists %I', _constraint.conname);
  end loop;

  for _constraint in
    select conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'orders'
      and c.contype = 'c'
      and c.conname ilike '%source%'
  loop
    execute format('alter table public.orders drop constraint if exists %I', _constraint.conname);
  end loop;

  alter table public.orders drop constraint if exists orders_status_os_check;
  alter table public.orders
    add constraint orders_status_os_check
    check (status in ('new','to_confirm','callback','confirmed','shipped','delivered','canceled')) not valid;

  alter table public.orders drop constraint if exists orders_source_os_check;
  alter table public.orders
    add constraint orders_source_os_check
    check (source in ('whatsapp','direct','meta_ads','organic','other','landing_page')) not valid;

  alter table public.orders drop constraint if exists orders_customer_phone_present_check;
  alter table public.orders
    add constraint orders_customer_phone_present_check
    check (coalesce(nullif(btrim(customer_phone), ''), nullif(btrim(phone), '')) is not null) not valid;

  alter table public.orders drop constraint if exists orders_pack_type_os_check;
  alter table public.orders
    add constraint orders_pack_type_os_check
    check (pack_type in ('homme','femme','mixte')) not valid;

  begin
    alter table public.orders validate constraint orders_status_os_check;
  exception when others then
    raise notice 'orders_status_os_check validation deferred: %', sqlerrm;
  end;

  begin
    alter table public.orders validate constraint orders_source_os_check;
  exception when others then
    raise notice 'orders_source_os_check validation deferred: %', sqlerrm;
  end;

  begin
    alter table public.orders validate constraint orders_pack_type_os_check;
  exception when others then
    raise notice 'orders_pack_type_os_check validation deferred: %', sqlerrm;
  end;

  begin
    alter table public.orders validate constraint orders_customer_phone_present_check;
  exception when others then
    raise notice 'orders_customer_phone_present_check validation deferred: %', sqlerrm;
  end;
end;
$orders$;

-- Keeps phone/customer_phone coherent while preserving backward compatibility.
create or replace function public.sync_orders_phone_columns()
returns trigger
language plpgsql
as $$
declare
  normalized_phone text;
begin
  normalized_phone := coalesce(nullif(btrim(new.customer_phone), ''), nullif(btrim(new.phone), ''));
  new.customer_phone := normalized_phone;
  new.phone := normalized_phone;
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.orders') is not null then
    drop trigger if exists trg_sync_orders_phone_columns on public.orders;
    create trigger trg_sync_orders_phone_columns
    before insert or update on public.orders
    for each row
    execute function public.sync_orders_phone_columns();

    execute 'create index if not exists idx_orders_status on public.orders (status)';
    execute 'create index if not exists idx_orders_created_at on public.orders (created_at desc)';
    execute 'create index if not exists idx_orders_city on public.orders (city)';
    execute 'create index if not exists idx_orders_source on public.orders (source)';
    execute 'create index if not exists idx_orders_assigned_operator_id on public.orders (assigned_operator_id)';
    execute 'create index if not exists idx_orders_customer_phone on public.orders (customer_phone)';
    execute 'create index if not exists idx_orders_updated_at on public.orders (updated_at desc)';
    execute 'create index if not exists idx_orders_status_created_at on public.orders (status, created_at desc)';
    execute 'create index if not exists idx_orders_active_pipeline on public.orders (created_at desc) where status in (''new'',''to_confirm'',''callback'',''confirmed'',''shipped'')';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 2) OS extension tables
-- ------------------------------------------------------------

create table if not exists public.os_user_preferences (
  user_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_os_user_preferences_updated_at
  on public.os_user_preferences (updated_at desc);

create table if not exists public.os_audit_logs (
  id uuid primary key default gen_random_uuid(),
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

create index if not exists idx_os_audit_logs_created_at
  on public.os_audit_logs (created_at desc);
create index if not exists idx_os_audit_logs_entity_created
  on public.os_audit_logs (entity_type, entity_id, created_at desc);
create index if not exists idx_os_audit_logs_action_created
  on public.os_audit_logs (action_type, created_at desc);

create table if not exists public.os_domain_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  actor_id text,
  actor_name text,
  label text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_os_domain_events_created_at
  on public.os_domain_events (created_at desc);
create index if not exists idx_os_domain_events_type_created
  on public.os_domain_events (event_type, created_at desc);
create index if not exists idx_os_domain_events_entity_created
  on public.os_domain_events (entity_type, entity_id, created_at desc);

create table if not exists public.os_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'notification.created',
  category text not null default 'system',
  title text not null,
  message text not null,
  link text,
  severity text not null default 'info' check (severity in ('info','warning','critical','success')),
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  read_by text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_os_notifications_read_created
  on public.os_notifications (is_read, created_at desc);
create index if not exists idx_os_notifications_category_created
  on public.os_notifications (category, created_at desc);
create index if not exists idx_os_notifications_entity_created
  on public.os_notifications (entity_type, entity_id, created_at desc);

create table if not exists public.os_inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  perfume_id text,
  product_name text,
  delta integer not null,
  previous_stock integer,
  next_stock integer,
  actor_id text not null,
  actor_name text not null,
  reason text not null default 'manual_adjustment',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_os_inventory_adjustments_perfume_created
  on public.os_inventory_adjustments (perfume_id, created_at desc);
create index if not exists idx_os_inventory_adjustments_reason_created
  on public.os_inventory_adjustments (reason, created_at desc);

create table if not exists public.os_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  actor_id text not null,
  idempotency_key text not null,
  request_hash text not null,
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  response_status integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create unique index if not exists idx_os_idempotency_unique_key
  on public.os_idempotency_keys (scope, actor_id, idempotency_key);
create index if not exists idx_os_idempotency_expires_at
  on public.os_idempotency_keys (expires_at);
create index if not exists idx_os_idempotency_status_updated
  on public.os_idempotency_keys (status, updated_at desc);

-- ------------------------------------------------------------
-- 3) Settings hardening
-- ------------------------------------------------------------

create table if not exists public.shop_settings (
  id text primary key default 'global',
  shop_name text not null default 'ELIE PERFUMES',
  support_email text not null default 'contact@elie.ma',
  whatsapp text not null default '+212 600 000 000',
  auto_validate boolean not null default false,
  low_stock_alert boolean not null default true,
  currency text not null default 'MAD',
  timezone text not null default 'Africa/Casablanca',
  updated_at timestamptz not null default now()
);

insert into public.shop_settings (id)
values ('global')
on conflict (id) do nothing;

alter table public.shop_settings drop constraint if exists shop_settings_singleton_id;
alter table public.shop_settings
  add constraint shop_settings_singleton_id check (id = 'global');

-- ------------------------------------------------------------
-- 4) Append-only safety for audit/events/inventory adjustments
-- ------------------------------------------------------------

create or replace function public.prevent_append_only_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception '% is append-only. % is not allowed.', tg_table_name, tg_op;
end;
$$;

drop trigger if exists trg_os_audit_logs_append_only on public.os_audit_logs;
create trigger trg_os_audit_logs_append_only
before update or delete on public.os_audit_logs
for each row execute function public.prevent_append_only_mutation();

drop trigger if exists trg_os_domain_events_append_only on public.os_domain_events;
create trigger trg_os_domain_events_append_only
before update or delete on public.os_domain_events
for each row execute function public.prevent_append_only_mutation();

drop trigger if exists trg_os_inventory_adjustments_append_only on public.os_inventory_adjustments;
create trigger trg_os_inventory_adjustments_append_only
before update or delete on public.os_inventory_adjustments
for each row execute function public.prevent_append_only_mutation();

-- ------------------------------------------------------------
-- 5) RLS (tightened, internal OS usage)
-- ------------------------------------------------------------

do $$
begin
  if to_regclass('public.orders') is not null then
    alter table public.orders enable row level security;
    drop policy if exists orders_select_authenticated on public.orders;
    drop policy if exists orders_mutate_authenticated on public.orders;

    create policy orders_select_authenticated
      on public.orders
      for select
      using (auth.role() = 'authenticated');

    create policy orders_mutate_authenticated
      on public.orders
      for all
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.shop_settings') is not null then
    alter table public.shop_settings enable row level security;
    drop policy if exists settings_select_authenticated on public.shop_settings;
    drop policy if exists settings_update_authenticated on public.shop_settings;

    create policy settings_select_authenticated
      on public.shop_settings
      for select
      using (auth.role() = 'authenticated');

    create policy settings_update_authenticated
      on public.shop_settings
      for all
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.os_user_preferences') is not null then
    alter table public.os_user_preferences enable row level security;
    drop policy if exists preferences_select_authenticated on public.os_user_preferences;
    drop policy if exists preferences_insert_authenticated on public.os_user_preferences;
    drop policy if exists preferences_update_authenticated on public.os_user_preferences;

    create policy preferences_select_authenticated
      on public.os_user_preferences
      for select
      using (auth.role() = 'authenticated');

    create policy preferences_insert_authenticated
      on public.os_user_preferences
      for insert
      with check (auth.role() = 'authenticated');

    create policy preferences_update_authenticated
      on public.os_user_preferences
      for update
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.os_audit_logs') is not null then
    alter table public.os_audit_logs enable row level security;
    drop policy if exists audit_select_authenticated on public.os_audit_logs;
    drop policy if exists audit_insert_authenticated on public.os_audit_logs;

    create policy audit_select_authenticated
      on public.os_audit_logs
      for select
      using (auth.role() = 'authenticated');

    create policy audit_insert_authenticated
      on public.os_audit_logs
      for insert
      with check (auth.role() = 'authenticated');
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.os_domain_events') is not null then
    alter table public.os_domain_events enable row level security;
    drop policy if exists events_select_authenticated on public.os_domain_events;
    drop policy if exists events_insert_authenticated on public.os_domain_events;

    create policy events_select_authenticated
      on public.os_domain_events
      for select
      using (auth.role() = 'authenticated');

    create policy events_insert_authenticated
      on public.os_domain_events
      for insert
      with check (auth.role() = 'authenticated');
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.os_notifications') is not null then
    alter table public.os_notifications enable row level security;
    drop policy if exists notifications_select_authenticated on public.os_notifications;
    drop policy if exists notifications_insert_authenticated on public.os_notifications;
    drop policy if exists notifications_update_authenticated on public.os_notifications;

    create policy notifications_select_authenticated
      on public.os_notifications
      for select
      using (auth.role() = 'authenticated');

    create policy notifications_insert_authenticated
      on public.os_notifications
      for insert
      with check (auth.role() = 'authenticated');

    create policy notifications_update_authenticated
      on public.os_notifications
      for update
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.os_inventory_adjustments') is not null then
    alter table public.os_inventory_adjustments enable row level security;
    drop policy if exists inventory_adjustments_select_authenticated on public.os_inventory_adjustments;
    drop policy if exists inventory_adjustments_insert_authenticated on public.os_inventory_adjustments;

    create policy inventory_adjustments_select_authenticated
      on public.os_inventory_adjustments
      for select
      using (auth.role() = 'authenticated');

    create policy inventory_adjustments_insert_authenticated
      on public.os_inventory_adjustments
      for insert
      with check (auth.role() = 'authenticated');
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.os_idempotency_keys') is not null then
    alter table public.os_idempotency_keys enable row level security;

    -- No policies on purpose: only service-role should access this table.
    if exists (select 1 from pg_roles where rolname = 'anon') then
      revoke all on table public.os_idempotency_keys from anon;
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      revoke all on table public.os_idempotency_keys from authenticated;
    end if;
  end if;
end;
$$;

-- Optional tightening for inventory table (internal stock should not be publicly readable).
do $$
begin
  if to_regclass('public.inventory') is not null then
    alter table public.inventory enable row level security;
    drop policy if exists inventory_select_authenticated on public.inventory;
    drop policy if exists inventory_manage_authenticated on public.inventory;

    create policy inventory_select_authenticated
      on public.inventory
      for select
      using (auth.role() = 'authenticated');

    create policy inventory_manage_authenticated
      on public.inventory
      for all
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 6) Realtime-ready publication wiring
-- ------------------------------------------------------------

alter table if exists public.orders replica identity full;
alter table if exists public.os_notifications replica identity full;
alter table if exists public.os_domain_events replica identity full;
alter table if exists public.inventory replica identity full;

-- Add tables to supabase_realtime publication when available.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if to_regclass('public.orders') is not null then
      begin
        execute 'alter publication supabase_realtime add table public.orders';
      exception when duplicate_object then null;
      end;
    end if;

    if to_regclass('public.os_notifications') is not null then
      begin
        execute 'alter publication supabase_realtime add table public.os_notifications';
      exception when duplicate_object then null;
      end;
    end if;

    if to_regclass('public.os_domain_events') is not null then
      begin
        execute 'alter publication supabase_realtime add table public.os_domain_events';
      exception when duplicate_object then null;
      end;
    end if;

    if to_regclass('public.inventory') is not null then
      begin
        execute 'alter publication supabase_realtime add table public.inventory';
      exception when duplicate_object then null;
      end;
    end if;
  else
    raise notice 'Publication supabase_realtime not found. Realtime add-table step skipped.';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 7) Helpful maintenance function (idempotency cleanup)
-- ------------------------------------------------------------

create or replace function public.cleanup_os_idempotency_keys(p_limit integer default 10000)
returns integer
language plpgsql
security definer
as $$
declare
  v_deleted integer;
begin
  with target as (
    select id
    from public.os_idempotency_keys
    where expires_at < now()
    order by expires_at asc
    limit greatest(1, coalesce(p_limit, 10000))
  )
  delete from public.os_idempotency_keys k
  using target t
  where k.id = t.id;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function public.cleanup_os_idempotency_keys(integer)
  is 'Deletes expired os_idempotency_keys rows in batches. Schedule with pg_cron if needed.';
