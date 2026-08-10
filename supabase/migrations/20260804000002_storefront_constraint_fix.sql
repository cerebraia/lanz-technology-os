-- =============================================================================
-- Migration: Agregar 'storefront' a constraints de customers y orders
--
-- El checkout de la tienda pública (migration 010) crea pedidos y clientes con:
--   customers.source      = 'storefront'
--   orders.sale_channel   = 'storefront'
--
-- Pero ambos valores no estaban incluidos en los CHECK constraints originales
-- (migration 005), haciendo que CADA checkout de cliente nuevo fallara con
-- una violación de constraint y toda la transacción SQL revertiera.
--
-- Esta migración agrega 'storefront' a ambas listas permitidas.
-- =============================================================================

-- customers.source — agregar 'storefront'
ALTER TABLE public.customers
  DROP CONSTRAINT customers_source_check;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_source_check CHECK (
    source IS NULL OR source IN (
      'instagram', 'facebook', 'tiktok', 'whatsapp',
      'referral', 'walk_in', 'other', 'storefront'
    )
  );

-- orders.sale_channel — agregar 'storefront'
ALTER TABLE public.orders
  DROP CONSTRAINT orders_channel_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_channel_check CHECK (
    sale_channel IN (
      'store', 'storefront', 'whatsapp', 'instagram',
      'facebook', 'phone', 'direct', 'other'
    )
  );
