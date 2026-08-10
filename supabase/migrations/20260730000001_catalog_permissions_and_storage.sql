-- =============================================================================
-- Migration 009: Catalog permissions and Supabase Storage setup
-- Agrega permisos granulares de catálogo y bucket de imágenes.
-- Depende de: migration 008 (roles y permisos base)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- NUEVOS PERMISOS DE CATÁLOGO
-- Convención: dominio.subdominio.accion
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  -- Categorías
  ('catalog.categories.read',   'Ver categorías del catálogo'),
  ('catalog.categories.create', 'Crear categorías'),
  ('catalog.categories.update', 'Editar categorías'),
  ('catalog.categories.delete', 'Desactivar categorías'),
  -- Productos
  ('catalog.products.read',     'Ver productos del catálogo'),
  ('catalog.products.create',   'Crear productos'),
  ('catalog.products.update',   'Editar productos'),
  ('catalog.products.delete',   'Archivar productos'),
  ('catalog.products.publish',  'Publicar y despublicar productos en la tienda'),
  -- Imágenes y precios
  ('catalog.images.manage',     'Subir, reordenar y eliminar imágenes de productos'),
  ('catalog.prices.manage',     'Editar precio de venta de productos')
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- ASIGNAR TODOS LOS PERMISOS DE CATÁLOGO AL ROL ADMINISTRATOR
-- -----------------------------------------------------------------------------
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles       r
JOIN public.permissions p ON p.name LIKE 'catalog.%'
WHERE r.name = 'administrator'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- SUPABASE STORAGE — bucket catalog-images
-- public = true: las imágenes son accesibles públicamente para la tienda
-- file_size_limit: 10 MB máximo por archivo
-- allowed_mime_types: solo formatos de imagen estándar
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'catalog-images',
  'catalog-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- STORAGE RLS — políticas para catalog-images
-- Las lecturas son públicas por ser bucket public = true.
-- Las escrituras requieren autenticación y permiso catalog.images.manage.
-- -----------------------------------------------------------------------------

-- Lectura pública (el bucket es public, pero documentamos la política explícita)
CREATE POLICY "catalog_images_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'catalog-images');

-- Subida: solo usuarios autenticados con permiso catalog.images.manage
CREATE POLICY "catalog_images_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'catalog-images'
    AND public.has_permission('catalog.images.manage')
  );

-- Actualización: mismo permiso
CREATE POLICY "catalog_images_authenticated_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'catalog-images'
    AND public.has_permission('catalog.images.manage')
  );

-- Eliminación: mismo permiso
CREATE POLICY "catalog_images_authenticated_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'catalog-images'
    AND public.has_permission('catalog.images.manage')
  );
