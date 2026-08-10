-- =============================================================================
-- Migration 003: Catalog — categories, products, product_images
-- Depende de: migration 001 (set_updated_at), migration 002 (profiles)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CATEGORIES
-- Soporte para jerarquía de un nivel (parent_id opcional).
-- No construir jerarquías profundas sin necesidad demostrada.
-- Archivado lógico via is_active, no eliminación física.
-- -----------------------------------------------------------------------------
CREATE TABLE public.categories (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL,
  description text,
  parent_id   uuid,
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT categories_pkey         PRIMARY KEY (id),
  CONSTRAINT categories_slug_unique  UNIQUE (slug),
  CONSTRAINT categories_parent_fk    FOREIGN KEY (parent_id)
    REFERENCES public.categories(id) ON DELETE SET NULL,
  CONSTRAINT categories_sort_check   CHECK (sort_order >= 0)
);

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_categories_slug      ON public.categories(slug);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_categories_active    ON public.categories(is_active, sort_order);

COMMENT ON TABLE  public.categories           IS 'Categorías de productos con soporte de jerarquía simple.';
COMMENT ON COLUMN public.categories.slug      IS 'Identificador único para URLs. kebab-case.';
COMMENT ON COLUMN public.categories.parent_id IS 'Categoría padre opcional (un nivel de jerarquía).';

-- -----------------------------------------------------------------------------
-- PRODUCTS
-- Catálogo maestro de productos.
--
-- Decisiones de diseño:
--   status:       'draft' | 'active' | 'archived' — ciclo de vida del registro
--   is_published: visibilidad en la tienda pública — solo active puede publicarse
--   sale_price:   precio de venta actual en la moneda indicada
--   reference_cost: costo de referencia — acceso RESTRINGIDO (solo admin)
--   track_inventory: si es false, el producto no consume stock al venderse
--
-- Sin tabla de variantes en esta fase — evaluar en Fase 4 con necesidad real.
-- Sin historial de precios — el snapshot se conserva en order_items.
-- -----------------------------------------------------------------------------
CREATE TABLE public.products (
  id                uuid          NOT NULL DEFAULT gen_random_uuid(),
  sku               text          NOT NULL,
  name              text          NOT NULL,
  slug              text          NOT NULL,
  short_description text,
  description       text,
  category_id       uuid,
  brand             text,
  model             text,
  status            text          NOT NULL DEFAULT 'draft',
  is_published      boolean       NOT NULL DEFAULT false,
  sale_price        numeric(15,2) NOT NULL DEFAULT 0,
  currency_code     char(3)       NOT NULL DEFAULT 'USD',
  reference_cost    numeric(15,2),
  track_inventory   boolean       NOT NULL DEFAULT true,
  min_stock         integer       NOT NULL DEFAULT 0,
  archived_at       timestamptz,
  created_by        uuid,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT products_pkey        PRIMARY KEY (id),
  CONSTRAINT products_sku_unique  UNIQUE (sku),
  CONSTRAINT products_slug_unique UNIQUE (slug),

  CONSTRAINT products_category_fk   FOREIGN KEY (category_id)
    REFERENCES public.categories(id) ON DELETE SET NULL,
  CONSTRAINT products_created_by_fk FOREIGN KEY (created_by)
    REFERENCES public.profiles(id)   ON DELETE SET NULL,

  CONSTRAINT products_status_check   CHECK (status IN ('draft', 'active', 'archived')),
  CONSTRAINT products_currency_check CHECK (currency_code IN ('USD', 'VES')),
  CONSTRAINT products_price_check    CHECK (sale_price >= 0),
  CONSTRAINT products_cost_check     CHECK (reference_cost IS NULL OR reference_cost >= 0),
  CONSTRAINT products_min_stock_check CHECK (min_stock >= 0),

  -- Un producto solo puede publicarse si su status es 'active'
  CONSTRAINT products_published_requires_active
    CHECK (is_published = false OR status = 'active')
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_products_category_id ON public.products(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_products_status      ON public.products(status, is_published);
CREATE INDEX idx_products_sku         ON public.products(sku);
CREATE INDEX idx_products_slug        ON public.products(slug);
CREATE INDEX idx_products_active      ON public.products(archived_at) WHERE archived_at IS NULL;

COMMENT ON TABLE  public.products                IS 'Catálogo maestro de productos.';
COMMENT ON COLUMN public.products.sku            IS 'Stock Keeping Unit — identificador único de producto.';
COMMENT ON COLUMN public.products.status         IS 'draft | active | archived — ciclo de vida del registro.';
COMMENT ON COLUMN public.products.is_published   IS 'Visibilidad en tienda pública. Solo activo puede publicarse.';
COMMENT ON COLUMN public.products.reference_cost IS 'Costo de referencia — acceso restringido a administradores.';
COMMENT ON COLUMN public.products.archived_at    IS 'Fecha de archivado lógico. NULL = activo.';

-- -----------------------------------------------------------------------------
-- PRODUCT_IMAGES
-- Imágenes asociadas a productos.
-- Solo una imagen principal por producto (índice parcial único).
-- storage_path: ruta en Supabase Storage (configurar en Fase 4).
-- -----------------------------------------------------------------------------
CREATE TABLE public.product_images (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  product_id   uuid        NOT NULL,
  storage_path text        NOT NULL,
  alt_text     text,
  sort_order   integer     NOT NULL DEFAULT 0,
  is_primary   boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT product_images_pkey       PRIMARY KEY (id),
  CONSTRAINT product_images_product_fk FOREIGN KEY (product_id)
    REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT product_images_sort_check CHECK (sort_order >= 0)
);

-- Garantiza que solo exista una imagen principal por producto
CREATE UNIQUE INDEX product_images_primary_uidx
  ON public.product_images(product_id)
  WHERE is_primary = true;

CREATE INDEX idx_product_images_product_id
  ON public.product_images(product_id, sort_order);

COMMENT ON TABLE  public.product_images              IS 'Imágenes de productos almacenadas en Supabase Storage.';
COMMENT ON COLUMN public.product_images.storage_path IS 'Ruta relativa en Supabase Storage bucket.';
COMMENT ON COLUMN public.product_images.is_primary   IS 'Solo una imagen principal por producto (único parcial).';
