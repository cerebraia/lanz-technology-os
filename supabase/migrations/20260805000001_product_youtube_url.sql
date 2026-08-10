-- =============================================================================
-- Migration: Agregar youtube_url a products
--
-- Permite asociar un video de YouTube a cada producto para mostrarlo
-- en la página pública del producto.
-- Acepta únicamente URLs de youtube.com o youtu.be.
-- La validación de formato se realiza en la capa de aplicación.
-- =============================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS youtube_url text;

COMMENT ON COLUMN public.products.youtube_url IS
  'URL opcional de YouTube (youtube.com o youtu.be) del video del producto.';
