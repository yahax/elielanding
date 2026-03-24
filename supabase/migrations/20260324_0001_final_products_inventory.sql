-- ============================================================
-- ELIE OS - Final Products & Inventory Tables Migration
-- Description: Idempotent creation of perfumes, inventory, and adjustments tables
-- ============================================================

-- 1) Create perfumes table
CREATE TABLE IF NOT EXISTS public.perfumes (
  id text primary key,
  name text not null,
  tier text not null check (tier in ('classic', 'niche')),
  gender text not null check (gender in ('homme', 'femme', 'mixte')),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Create inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
  perfume_id text primary key references public.perfumes(id) on delete cascade,
  stock integer not null default 0,
  low_stock_threshold integer not null default 5,
  updated_at timestamptz not null default now()
);

-- 3) Create os_inventory_adjustments table (to log modifications safely)
CREATE TABLE IF NOT EXISTS public.os_inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  perfume_id text references public.perfumes(id),
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

-- 4) Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_perfumes_is_active ON public.perfumes (is_active);
CREATE INDEX IF NOT EXISTS idx_perfumes_tier ON public.perfumes (tier);
CREATE INDEX IF NOT EXISTS idx_perfumes_gender ON public.perfumes (gender);

CREATE INDEX IF NOT EXISTS idx_inventory_perfume_id ON public.inventory (perfume_id);

CREATE INDEX IF NOT EXISTS idx_os_inventory_adjustments_perfume_created
  ON public.os_inventory_adjustments (perfume_id, created_at desc);

-- 5) Fill missing inventory rows with stock = 0
-- This ensures that any perfume inserted in the DB gets a default 0 stock row
-- if it doesn't already have one, preventing the "empty state" errors in the UI.
INSERT INTO public.inventory (perfume_id, stock, low_stock_threshold, updated_at)
SELECT id, 0, 5, now() FROM public.perfumes
ON CONFLICT (perfume_id) DO NOTHING;

-- 6) RLS Policies
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS perfumes_select_authenticated ON public.perfumes;
CREATE POLICY perfumes_select_authenticated ON public.perfumes FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS perfumes_mutate_authenticated ON public.perfumes;
CREATE POLICY perfumes_mutate_authenticated ON public.perfumes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS inventory_select_authenticated ON public.inventory;
CREATE POLICY inventory_select_authenticated ON public.inventory FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS inventory_mutate_authenticated ON public.inventory;
CREATE POLICY inventory_mutate_authenticated ON public.inventory FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 7) Append-only constraint for os_inventory_adjustments
DO $$
BEGIN
  CREATE OR REPLACE FUNCTION public.prevent_append_only_mutation()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $func$
  BEGIN
    RAISE EXCEPTION '% is append-only. % is not allowed.', TG_TABLE_NAME, TG_OP;
  END;
  $func$;
EXCEPTION WHEN duplicate_function THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_os_inventory_adjustments_append_only ON public.os_inventory_adjustments;
CREATE TRIGGER trg_os_inventory_adjustments_append_only
BEFORE UPDATE OR DELETE ON public.os_inventory_adjustments
FOR EACH ROW EXECUTE FUNCTION public.prevent_append_only_mutation();

-- 8) Add to Realtime (for live OS updates)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      EXECUTE 'alter publication supabase_realtime add table public.perfumes';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      EXECUTE 'alter publication supabase_realtime add table public.inventory';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END;
$$;
