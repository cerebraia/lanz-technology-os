-- =============================================================================
-- Migration 009: RLS público para la tienda online
-- Permite al rol `anon` leer únicamente datos del catálogo publicado.
-- No expone: costos, márgenes, inventario interno, movimientos, clientes,
-- pedidos, compras, importaciones, usuarios ni auditoría.
-- =============================================================================

-- Productos publicados — solo los que cumplen todas las condiciones de publicación
CREATE POLICY "anon_products_select" ON public.products
  FOR SELECT TO anon
  USING (
    is_published = true
    AND status    = 'active'
    AND archived_at  IS NULL
    AND published_at IS NOT NULL
  );

-- Categorías activas — las inactivas no deben aparecer en la tienda
CREATE POLICY "anon_categories_select" ON public.categories
  FOR SELECT TO anon
  USING (is_active = true);

-- Imágenes de productos — solo las asociadas a productos publicados
CREATE POLICY "anon_product_images_select" ON public.product_images
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
