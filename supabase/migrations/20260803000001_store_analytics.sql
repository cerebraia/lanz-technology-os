-- =============================================================================
-- Migration 031: Analítica de la tienda pública
--
-- Tabla: store_events
-- Registra eventos del comportamiento del cliente en la tienda:
-- visitas, búsquedas, interacciones con el carrito, checkout.
--
-- Diseño:
--   - Inserción permitida a cualquier rol (anon/authenticated) para captura
--     de eventos sin autenticación.
--   - Lectura solo para usuarios con permiso marketing.analytics.read.
--   - No almacena datos personales identificables (PII).
--   - El IP solo se guarda como hash irreversible (privacidad GDPR-ready).
-- =============================================================================

CREATE TABLE public.store_events (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),

  -- Qué ocurrió
  event_type   text        NOT NULL,
  -- page_home | page_catalog | page_category | page_product | page_search |
  -- page_cart | page_checkout | add_to_cart | remove_from_cart |
  -- checkout_started | checkout_completed | whatsapp_clicked | error

  -- Contexto de sesión (sin PII)
  session_id   text,             -- UUID generado en el cliente por sesión
  ip_hash      text,             -- SHA-256 del IP, sin reversibilidad
  user_agent   text,

  -- Contexto de navegación
  page_path    text,
  referrer     text,

  -- Contexto de producto / categoría
  product_id   uuid        REFERENCES public.products(id)   ON DELETE SET NULL,
  category_id  uuid        REFERENCES public.categories(id) ON DELETE SET NULL,
  search_query text,

  -- Datos adicionales libres (no datos financieros ni personales)
  metadata     jsonb       NOT NULL DEFAULT '{}',

  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT store_events_pkey PRIMARY KEY (id),
  CONSTRAINT store_events_type_check CHECK (
    event_type IN (
      'page_home', 'page_catalog', 'page_category', 'page_product',
      'page_search', 'page_cart', 'page_checkout',
      'add_to_cart', 'remove_from_cart',
      'checkout_started', 'checkout_completed', 'whatsapp_clicked',
      'error'
    )
  )
);

-- Índices para consultas frecuentes del dashboard
CREATE INDEX idx_store_events_type_created ON public.store_events(event_type, created_at DESC);
CREATE INDEX idx_store_events_created      ON public.store_events(created_at DESC);
CREATE INDEX idx_store_events_product      ON public.store_events(product_id, created_at DESC) WHERE product_id IS NOT NULL;
CREATE INDEX idx_store_events_session      ON public.store_events(session_id)                  WHERE session_id IS NOT NULL;

COMMENT ON TABLE  public.store_events            IS 'Eventos de comportamiento del cliente en la tienda. Sin PII.';
COMMENT ON COLUMN public.store_events.ip_hash    IS 'SHA-256 del IP del visitante. Irreversible.';
COMMENT ON COLUMN public.store_events.session_id IS 'UUID generado en el cliente por sesión de navegación.';

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.store_events ENABLE ROW LEVEL SECURITY;

-- Solo admins/marketing pueden leer
CREATE POLICY "store_events_select" ON public.store_events
  FOR SELECT TO authenticated
  USING (public.has_permission('marketing.analytics.read'));

-- Cualquier rol puede insertar eventos (tracking anónimo)
CREATE POLICY "store_events_insert_anon" ON public.store_events
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "store_events_insert_auth" ON public.store_events
  FOR INSERT TO authenticated
  WITH CHECK (true);
