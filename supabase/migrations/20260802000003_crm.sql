-- =============================================================================
-- Migration 023: CRM — Gestión de clientes y relaciones comerciales
--
-- Módulo 1 — Clientes (extensión tabla existente)
-- Módulo 2 — Historial del cliente (customer_activity)
-- Módulo 3 — Cotizaciones (quotes + quote_items)
-- Módulo 4 — Etiquetas (customer_tags + customer_tag_assignments)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EXTENSIÓN DE CUSTOMERS
-- Agrega campos CRM a la tabla existente sin romper columnas previas.
-- company, country, city son opcionales para no forzar reingreso de datos.
-- -----------------------------------------------------------------------------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city    text;

CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company) WHERE company IS NOT NULL;

-- -----------------------------------------------------------------------------
-- CUSTOMER_TAGS — catálogo de etiquetas de segmentación
-- color: hex string (#RRGGBB) o nombre CSS
-- -----------------------------------------------------------------------------
CREATE TABLE public.customer_tags (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  color      text        NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT customer_tags_pkey        PRIMARY KEY (id),
  CONSTRAINT customer_tags_name_unique UNIQUE (name)
);

-- -----------------------------------------------------------------------------
-- CUSTOMER_TAG_ASSIGNMENTS — relación many-to-many customer ↔ tag
-- -----------------------------------------------------------------------------
CREATE TABLE public.customer_tag_assignments (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid        NOT NULL,
  tag_id      uuid        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT customer_tag_assignments_pkey       PRIMARY KEY (id),
  CONSTRAINT customer_tag_assignments_unique      UNIQUE (customer_id, tag_id),
  CONSTRAINT customer_tag_assignments_customer_fk FOREIGN KEY (customer_id)
    REFERENCES public.customers(id) ON DELETE CASCADE,
  CONSTRAINT customer_tag_assignments_tag_fk      FOREIGN KEY (tag_id)
    REFERENCES public.customer_tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_customer_tag_assignments_customer ON public.customer_tag_assignments(customer_id);
CREATE INDEX idx_customer_tag_assignments_tag      ON public.customer_tag_assignments(tag_id);

-- -----------------------------------------------------------------------------
-- CUSTOMER_ACTIVITY — historial de interacciones con el cliente
-- type: purchase | message | call | support | note | quote
-- reference_type/reference_id: entidad vinculada (order, quote, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE public.customer_activity (
  id             uuid        NOT NULL DEFAULT gen_random_uuid(),
  customer_id    uuid        NOT NULL,
  activity_type  text        NOT NULL,
  reference_type text,
  reference_id   uuid,
  description    text        NOT NULL,
  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT customer_activity_pkey        PRIMARY KEY (id),
  CONSTRAINT customer_activity_customer_fk FOREIGN KEY (customer_id)
    REFERENCES public.customers(id) ON DELETE CASCADE,
  CONSTRAINT customer_activity_user_fk     FOREIGN KEY (created_by)
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT customer_activity_type_check  CHECK (
    activity_type IN ('purchase','message','call','support','note','quote')
  )
);

CREATE INDEX idx_customer_activity_customer  ON public.customer_activity(customer_id, created_at DESC);
CREATE INDEX idx_customer_activity_type      ON public.customer_activity(activity_type);
CREATE INDEX idx_customer_activity_reference ON public.customer_activity(reference_type, reference_id) WHERE reference_id IS NOT NULL;

COMMENT ON TABLE  public.customer_activity               IS 'Historial de interacciones con el cliente.';
COMMENT ON COLUMN public.customer_activity.activity_type IS 'Tipo de actividad: purchase | message | call | support | note | quote';

-- -----------------------------------------------------------------------------
-- QUOTES — cotizaciones enviadas a clientes
-- status: draft | sent | accepted | rejected | expired
-- Los registros no se eliminan; los errores se corrigen con nuevas cotizaciones.
-- -----------------------------------------------------------------------------
CREATE TABLE public.quotes (
  id          uuid          NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid,
  status      text          NOT NULL DEFAULT 'draft',
  subtotal    numeric(15,2) NOT NULL DEFAULT 0,
  total       numeric(15,2) NOT NULL DEFAULT 0,
  notes       text,
  expires_at  date,
  created_by  uuid,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT quotes_pkey         PRIMARY KEY (id),
  CONSTRAINT quotes_customer_fk  FOREIGN KEY (customer_id)
    REFERENCES public.customers(id) ON DELETE SET NULL,
  CONSTRAINT quotes_user_fk      FOREIGN KEY (created_by)
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT quotes_status_check CHECK (
    status IN ('draft','sent','accepted','rejected','expired')
  ),
  CONSTRAINT quotes_subtotal_check CHECK (subtotal >= 0),
  CONSTRAINT quotes_total_check   CHECK (total >= 0)
);

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_quotes_customer_id ON public.quotes(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_quotes_status      ON public.quotes(status);
CREATE INDEX idx_quotes_created_at  ON public.quotes(created_at DESC);

COMMENT ON TABLE public.quotes IS 'Cotizaciones a clientes. No eliminar; errores = nueva cotización.';

-- -----------------------------------------------------------------------------
-- QUOTE_ITEMS — líneas de producto dentro de una cotización
-- -----------------------------------------------------------------------------
CREATE TABLE public.quote_items (
  id         uuid          NOT NULL DEFAULT gen_random_uuid(),
  quote_id   uuid          NOT NULL,
  product_id uuid,
  quantity   int           NOT NULL DEFAULT 1,
  unit_price numeric(15,2) NOT NULL,
  total      numeric(15,2) NOT NULL,

  CONSTRAINT quote_items_pkey       PRIMARY KEY (id),
  CONSTRAINT quote_items_quote_fk   FOREIGN KEY (quote_id)
    REFERENCES public.quotes(id) ON DELETE CASCADE,
  CONSTRAINT quote_items_product_fk FOREIGN KEY (product_id)
    REFERENCES public.products(id) ON DELETE SET NULL,
  CONSTRAINT quote_items_qty_check  CHECK (quantity > 0),
  CONSTRAINT quote_items_price_check CHECK (unit_price >= 0),
  CONSTRAINT quote_items_total_check CHECK (total >= 0)
);

CREATE INDEX idx_quote_items_quote   ON public.quote_items(quote_id);
CREATE INDEX idx_quote_items_product ON public.quote_items(product_id) WHERE product_id IS NOT NULL;

COMMENT ON TABLE public.quote_items IS 'Líneas de producto de una cotización.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.customer_tags              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tag_assignments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_activity          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items                ENABLE ROW LEVEL SECURITY;

-- customer_tags — legible por cualquiera con crm.read
CREATE POLICY crm_tags_select     ON public.customer_tags            FOR SELECT USING (public.has_permission('crm.read'));
CREATE POLICY crm_tags_insert     ON public.customer_tags            FOR INSERT WITH CHECK (public.has_permission('crm.create'));
CREATE POLICY crm_tags_update     ON public.customer_tags            FOR UPDATE USING (public.has_permission('crm.update'));
CREATE POLICY crm_tags_delete     ON public.customer_tags            FOR DELETE USING (public.has_permission('crm.delete'));

-- customer_tag_assignments
CREATE POLICY crm_tag_assign_select ON public.customer_tag_assignments FOR SELECT USING (public.has_permission('crm.read'));
CREATE POLICY crm_tag_assign_insert ON public.customer_tag_assignments FOR INSERT WITH CHECK (public.has_permission('crm.update'));
CREATE POLICY crm_tag_assign_delete ON public.customer_tag_assignments FOR DELETE USING (public.has_permission('crm.update'));

-- customer_activity
CREATE POLICY crm_activity_select ON public.customer_activity FOR SELECT USING (public.has_permission('crm.read'));
CREATE POLICY crm_activity_insert ON public.customer_activity FOR INSERT WITH CHECK (public.has_permission('crm.create'));

-- quotes
CREATE POLICY crm_quotes_select   ON public.quotes FOR SELECT USING (public.has_permission('crm.read'));
CREATE POLICY crm_quotes_insert   ON public.quotes FOR INSERT WITH CHECK (public.has_permission('crm.quotes.create'));
CREATE POLICY crm_quotes_update   ON public.quotes FOR UPDATE USING (public.has_permission('crm.quotes.update'));

-- quote_items (hereda acceso de quotes)
CREATE POLICY crm_quote_items_select ON public.quote_items FOR SELECT USING (public.has_permission('crm.read'));
CREATE POLICY crm_quote_items_insert ON public.quote_items FOR INSERT WITH CHECK (public.has_permission('crm.quotes.create'));
CREATE POLICY crm_quote_items_update ON public.quote_items FOR UPDATE USING (public.has_permission('crm.quotes.update'));
CREATE POLICY crm_quote_items_delete ON public.quote_items FOR DELETE USING (public.has_permission('crm.quotes.update'));

-- -----------------------------------------------------------------------------
-- PERMISOS CRM
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('crm.read',          'Ver clientes, cotizaciones y actividad CRM'),
  ('crm.create',        'Crear clientes y registrar actividad'),
  ('crm.update',        'Editar clientes y gestionar etiquetas'),
  ('crm.delete',        'Eliminar etiquetas y archivar clientes'),
  ('crm.quotes.create', 'Crear cotizaciones'),
  ('crm.quotes.update', 'Editar y cambiar estado de cotizaciones')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   public.roles       r
JOIN   public.permissions p ON p.name LIKE 'crm.%'
WHERE  r.name = 'administrator'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- SEED — etiquetas predeterminadas
-- -----------------------------------------------------------------------------
INSERT INTO public.customer_tags (name, color) VALUES
  ('VIP',         '#f59e0b'),
  ('Mayorista',   '#3b82f6'),
  ('Frecuente',   '#10b981'),
  ('Nuevo',       '#6366f1'),
  ('Corporativo', '#8b5cf6')
ON CONFLICT (name) DO NOTHING;
