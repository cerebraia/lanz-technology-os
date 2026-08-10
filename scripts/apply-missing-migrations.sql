-- ================================================================
-- SCRIPT: Aplicar migraciones faltantes en Supabase Studio
-- Ejecutar en: Supabase Studio → SQL Editor
-- Fecha: 2026-08-04
--
-- Incluye:
--   1. Migration 009: RLS público para la tienda (anon)
--   2. Migration 010: Columnas de checkout en orders
--   3. Recargar schema cache de PostgREST
-- ================================================================


-- ── MIGRATION 009: RLS público para tienda ───────────────────────
-- Permite que el rol `anon` lea el catálogo publicado

CREATE POLICY IF NOT EXISTS "anon_products_select" ON public.products
  FOR SELECT TO anon
  USING (
    is_published = true
    AND status    = 'active'
    AND archived_at  IS NULL
    AND published_at IS NOT NULL
  );

CREATE POLICY IF NOT EXISTS "anon_categories_select" ON public.categories
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY IF NOT EXISTS "anon_product_images_select" ON public.product_images
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM   public.products p
      WHERE  p.id           = product_images.product_id
        AND  p.is_published = true
        AND  p.status       = 'active'
        AND  p.archived_at  IS NULL
        AND  p.published_at IS NOT NULL
    )
  );


-- ── MIGRATION 010: Columnas de checkout en orders ────────────────

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_method    text
    CHECK (delivery_method IN ('pickup', 'local', 'national')),
  ADD COLUMN IF NOT EXISTS confirmation_token uuid
    NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS idempotency_key    uuid
    UNIQUE;

CREATE INDEX IF NOT EXISTS idx_orders_confirmation_token
  ON public.orders (confirmation_token);

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq
  START 1000 INCREMENT 1 NO CYCLE;


-- ── RECARGAR SCHEMA CACHE DE POSTGREST ───────────────────────────
-- Esto hace visible create_storefront_order via supabase.rpc()

NOTIFY pgrst, 'reload schema';


-- ── VERIFICACIÓN ─────────────────────────────────────────────────
-- Ejecuta esto para confirmar que todo esté correcto:

SELECT
  'products anon policy'    AS check_name,
  COUNT(*) > 0              AS ok
FROM pg_policies
WHERE tablename = 'products' AND policyname = 'anon_products_select'

UNION ALL

SELECT
  'orders confirmation_token',
  COUNT(*) > 0
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'confirmation_token'

UNION ALL

SELECT
  'create_storefront_order function',
  COUNT(*) > 0
FROM pg_proc
WHERE proname = 'create_storefront_order';
