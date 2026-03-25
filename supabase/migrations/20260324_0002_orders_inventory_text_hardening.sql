-- ============================================================
-- ELIE OS - Orders/Inventory Text Hardening
-- Goal:
-- 1) Keep orders structure aligned with production payload (selected_perfumes/gift/price_mad)
-- 2) Remove legacy dependency on order_items
-- 3) Enforce perfumes.id + inventory.perfume_id as TEXT
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    ALTER TABLE public.orders
      ADD COLUMN IF NOT EXISTS selected_perfumes text[] DEFAULT '{}'::text[],
      ADD COLUMN IF NOT EXISTS gift_perfume text,
      ADD COLUMN IF NOT EXISTS price_mad integer;

    -- selected_perfumes => text[] (best effort conversion, keeps migration idempotent)
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

    -- Accept legacy + new aliases during transition.
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_os_check;
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_status_os_check
      CHECK (
        status IN (
          'new',
          'pending',
          'to_confirm',
          'confirmed',
          'callback',
          'cancelled',
          'canceled',
          'shipped',
          'delivered'
        )
      );
  END IF;
END;
$$;

DO $$
DECLARE
  _constraint record;
BEGIN
  IF to_regclass('public.inventory') IS NOT NULL THEN
    FOR _constraint IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.inventory'::regclass
        AND contype = 'f'
    LOOP
      EXECUTE format('alter table public.inventory drop constraint if exists %I', _constraint.conname);
    END LOOP;
  END IF;

  IF to_regclass('public.os_inventory_adjustments') IS NOT NULL THEN
    FOR _constraint IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.os_inventory_adjustments'::regclass
        AND contype = 'f'
    LOOP
      EXECUTE format('alter table public.os_inventory_adjustments drop constraint if exists %I', _constraint.conname);
    END LOOP;
  END IF;

  IF to_regclass('public.perfumes') IS NOT NULL THEN
    BEGIN
      EXECUTE 'alter table public.perfumes alter column id type text using id::text';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'perfumes.id conversion skipped: %', SQLERRM;
    END;
  END IF;

  IF to_regclass('public.inventory') IS NOT NULL THEN
    BEGIN
      EXECUTE 'alter table public.inventory alter column perfume_id type text using perfume_id::text';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'inventory.perfume_id conversion skipped: %', SQLERRM;
    END;
  END IF;

  IF to_regclass('public.os_inventory_adjustments') IS NOT NULL THEN
    BEGIN
      EXECUTE 'alter table public.os_inventory_adjustments alter column perfume_id type text using perfume_id::text';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'os_inventory_adjustments.perfume_id conversion skipped: %', SQLERRM;
    END;
  END IF;

  IF to_regclass('public.perfumes') IS NOT NULL AND to_regclass('public.inventory') IS NOT NULL THEN
    ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_perfume_id_fkey;
    ALTER TABLE public.inventory
      ADD CONSTRAINT inventory_perfume_id_fkey
      FOREIGN KEY (perfume_id) REFERENCES public.perfumes(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.perfumes') IS NOT NULL AND to_regclass('public.os_inventory_adjustments') IS NOT NULL THEN
    ALTER TABLE public.os_inventory_adjustments DROP CONSTRAINT IF EXISTS os_inventory_adjustments_perfume_id_fkey;
    ALTER TABLE public.os_inventory_adjustments
      ADD CONSTRAINT os_inventory_adjustments_perfume_id_fkey
      FOREIGN KEY (perfume_id) REFERENCES public.perfumes(id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- Keep inventory resilient even if no row exists yet.
INSERT INTO public.inventory (perfume_id, stock, low_stock_threshold, updated_at)
SELECT id, 0, 5, now()
FROM public.perfumes
ON CONFLICT (perfume_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_inventory_perfume_id ON public.inventory (perfume_id);

-- Legacy table no longer used by runtime flow.
DROP TABLE IF EXISTS public.order_items CASCADE;
