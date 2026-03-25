-- ============================================================
-- ELIE OS - Orders API filter performance indexes
-- Idempotent and safe on existing environments.
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.orders') IS NULL THEN
    RETURN;
  END IF;

  CREATE INDEX IF NOT EXISTS idx_orders_pack_type
    ON public.orders (pack_type);

  CREATE INDEX IF NOT EXISTS idx_orders_source_created_at
    ON public.orders (source, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_orders_city_created_at
    ON public.orders (city, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_orders_pack_created_at
    ON public.orders (pack_type, created_at DESC);
END;
$$;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_trgm extension not available, skipping trigram indexes: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.orders') IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_customer_name_trgm
      ON public.orders
      USING gin (lower(customer_name) gin_trgm_ops)
      WHERE customer_name IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_orders_phone_trgm
      ON public.orders
      USING gin (lower(phone) gin_trgm_ops)
      WHERE phone IS NOT NULL;
  END IF;
END;
$$;

