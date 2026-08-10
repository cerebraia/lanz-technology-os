-- =============================================================================
-- Migration 010: Products — promotional price, published_at, is_featured
-- Extiende la tabla products con campos comerciales sin romper constraints
-- existentes.
-- Depende de: migration 003 (products)
-- =============================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS promotional_price numeric(15,2),
  ADD COLUMN IF NOT EXISTS published_at      timestamptz,
  ADD COLUMN IF NOT EXISTS is_featured       boolean NOT NULL DEFAULT false;

-- Precio promocional no negativo (la regla promo < sale se valida en la app)
ALTER TABLE public.products
  ADD CONSTRAINT products_promo_price_check
    CHECK (promotional_price IS NULL OR promotional_price >= 0);

-- Índice parcial para la consulta de productos destacados
CREATE INDEX IF NOT EXISTS idx_products_featured
  ON public.products(is_featured)
  WHERE is_featured = true;

-- Índice para filtrar productos con precio promocional activo
CREATE INDEX IF NOT EXISTS idx_products_promo
  ON public.products(promotional_price)
  WHERE promotional_price IS NOT NULL;

COMMENT ON COLUMN public.products.promotional_price
  IS 'Precio promocional opcional. NULL = sin promoción. Validar < sale_price en la capa de aplicación.';
COMMENT ON COLUMN public.products.published_at
  IS 'Fecha y hora de la primera publicación. Solo se escribe al publicar por primera vez.';
COMMENT ON COLUMN public.products.is_featured
  IS 'Marca el producto como destacado en la tienda pública.';
