-- ============================================================
-- ELIE OS - Database hardening for orders/inventory scaling
-- Safe migration: no table drop, idempotent operations only.
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    ALTER TABLE public.orders
      ADD COLUMN IF NOT EXISTS selected_perfumes text[] DEFAULT '{}'::text[],
      ADD COLUMN IF NOT EXISTS gift_perfume text,
      ADD COLUMN IF NOT EXISTS price_mad integer;

    BEGIN
      EXECUTE 'alter table public.orders alter column selected_perfumes type text[] using coalesce(selected_perfumes::text[], ''{}''::text[])';
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        EXECUTE $sql$
          alter table public.orders
          alter column selected_perfumes type text[]
          using case
            when selected_perfumes is null then '{}'::text[]
            else regexp_split_to_array(
              regexp_replace(selected_perfumes::text, '^[\{\[\"]+|[\}\]\"]+$', '', 'g'),
              '\s*,\s*'
            )
          end
        $sql$;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'orders.selected_perfumes conversion skipped: %', SQLERRM;
      END;
    END;

    BEGIN
      EXECUTE 'alter table public.orders alter column gift_perfume type text using gift_perfume::text';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'orders.gift_perfume conversion skipped: %', SQLERRM;
    END;

    BEGIN
      EXECUTE 'alter table public.orders alter column price_mad type integer using nullif(price_mad::text, '''')::integer';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'orders.price_mad conversion skipped: %', SQLERRM;
    END;
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.perfumes') IS NOT NULL THEN
    BEGIN
      EXECUTE 'alter table public.perfumes alter column id type text using id::text';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'perfumes.id conversion skipped: %', SQLERRM;
    END;
  END IF;

  IF to_regclass('public.inventory') IS NOT NULL THEN
    ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_perfume_id_fkey;
    BEGIN
      EXECUTE 'alter table public.inventory alter column perfume_id type text using perfume_id::text';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'inventory.perfume_id conversion skipped: %', SQLERRM;
    END;
  END IF;

  IF to_regclass('public.perfumes') IS NOT NULL AND to_regclass('public.inventory') IS NOT NULL THEN
    ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_perfume_id_fkey;
    ALTER TABLE public.inventory
      ADD CONSTRAINT inventory_perfume_id_fkey
      FOREIGN KEY (perfume_id) REFERENCES public.perfumes(id) ON DELETE CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
  END IF;
END;
$$;
