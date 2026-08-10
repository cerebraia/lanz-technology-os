-- =============================================================================
-- Migration 025: Sistema de marketing y fidelización
--
-- Módulo 1 — Campañas de marketing (marketing_campaigns)
-- Módulo 2 — Segmentos de clientes (customer_segments)
-- Módulo 3 — Relación campaña-cliente (campaign_customers)
-- Módulo 4 — Cupones de descuento (discount_coupons)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CUSTOMER_SEGMENTS — segmentos de clientes para targeting
-- Los segmentos son etiquetas de agrupación; la membresía se calcula
-- dinámicamente en la capa de datos.
-- -----------------------------------------------------------------------------
CREATE TABLE public.customer_segments (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT customer_segments_pkey        PRIMARY KEY (id),
  CONSTRAINT customer_segments_name_unique UNIQUE (name)
);

COMMENT ON TABLE public.customer_segments IS 'Segmentos de clientes para campañas de marketing.';

-- -----------------------------------------------------------------------------
-- MARKETING_CAMPAIGNS — campañas de marketing
-- type:   email | whatsapp | discount | launch | remarketing
-- status: draft | active | paused | completed | cancelled
-- -----------------------------------------------------------------------------
CREATE TABLE public.marketing_campaigns (
  id          uuid          NOT NULL DEFAULT gen_random_uuid(),
  name        text          NOT NULL,
  description text,
  type        text          NOT NULL,
  status      text          NOT NULL DEFAULT 'draft',
  segment_id  uuid,
  start_date  date,
  end_date    date,
  budget      numeric(15,2),
  currency    char(3)       NOT NULL DEFAULT 'USD',
  created_by  uuid,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT marketing_campaigns_pkey        PRIMARY KEY (id),
  CONSTRAINT marketing_campaigns_segment_fk  FOREIGN KEY (segment_id)
    REFERENCES public.customer_segments(id)  ON DELETE SET NULL,
  CONSTRAINT marketing_campaigns_user_fk     FOREIGN KEY (created_by)
    REFERENCES public.profiles(id)           ON DELETE SET NULL,
  CONSTRAINT marketing_campaigns_type_check  CHECK (
    type IN ('email','whatsapp','discount','launch','remarketing')
  ),
  CONSTRAINT marketing_campaigns_status_check CHECK (
    status IN ('draft','active','paused','completed','cancelled')
  ),
  CONSTRAINT marketing_campaigns_budget_check CHECK (budget IS NULL OR budget >= 0)
);

CREATE TRIGGER marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_marketing_campaigns_status     ON public.marketing_campaigns(status);
CREATE INDEX idx_marketing_campaigns_type       ON public.marketing_campaigns(type);
CREATE INDEX idx_marketing_campaigns_start_date ON public.marketing_campaigns(start_date) WHERE start_date IS NOT NULL;

COMMENT ON TABLE  public.marketing_campaigns        IS 'Campañas de marketing de Lanz Technology.';
COMMENT ON COLUMN public.marketing_campaigns.budget IS 'Inversión planificada. NULL = sin presupuesto asignado.';

-- -----------------------------------------------------------------------------
-- CAMPAIGN_CUSTOMERS — destinatarios de una campaña + tracking del funnel
-- Permite medir apertura, clics y conversiones por campaña.
-- Los registros son inmutables una vez creados; solo se actualiza el funnel.
-- -----------------------------------------------------------------------------
CREATE TABLE public.campaign_customers (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  campaign_id   uuid        NOT NULL,
  customer_id   uuid        NOT NULL,
  sent_at       timestamptz,
  opened_at     timestamptz,
  clicked_at    timestamptz,
  converted_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT campaign_customers_pkey          PRIMARY KEY (id),
  CONSTRAINT campaign_customers_unique        UNIQUE (campaign_id, customer_id),
  CONSTRAINT campaign_customers_campaign_fk   FOREIGN KEY (campaign_id)
    REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  CONSTRAINT campaign_customers_customer_fk   FOREIGN KEY (customer_id)
    REFERENCES public.customers(id)           ON DELETE CASCADE
);

CREATE INDEX idx_campaign_customers_campaign  ON public.campaign_customers(campaign_id);
CREATE INDEX idx_campaign_customers_customer  ON public.campaign_customers(customer_id);
CREATE INDEX idx_campaign_customers_converted ON public.campaign_customers(campaign_id) WHERE converted_at IS NOT NULL;

COMMENT ON TABLE public.campaign_customers IS 'Tracking de funnel por campaña y cliente.';

-- -----------------------------------------------------------------------------
-- DISCOUNT_COUPONS — cupones de descuento
-- type: percentage | fixed
-- Los cupones usados no se eliminan; used_count registra el uso.
-- -----------------------------------------------------------------------------
CREATE TABLE public.discount_coupons (
  id              uuid          NOT NULL DEFAULT gen_random_uuid(),
  code            text          NOT NULL,
  description     text,
  type            text          NOT NULL,
  value           numeric(10,2) NOT NULL,
  minimum_amount  numeric(15,2) NOT NULL DEFAULT 0,
  usage_limit     integer,
  used_count      integer       NOT NULL DEFAULT 0,
  expires_at      date,
  is_active       boolean       NOT NULL DEFAULT true,
  campaign_id     uuid,
  created_by      uuid,
  created_at      timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT discount_coupons_pkey        PRIMARY KEY (id),
  CONSTRAINT discount_coupons_code_unique UNIQUE (code),
  CONSTRAINT discount_coupons_campaign_fk FOREIGN KEY (campaign_id)
    REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  CONSTRAINT discount_coupons_user_fk     FOREIGN KEY (created_by)
    REFERENCES public.profiles(id)           ON DELETE SET NULL,
  CONSTRAINT discount_coupons_type_check  CHECK (type IN ('percentage','fixed')),
  CONSTRAINT discount_coupons_value_check CHECK (value > 0),
  CONSTRAINT discount_coupons_pct_check   CHECK (type != 'percentage' OR value <= 100),
  CONSTRAINT discount_coupons_used_check  CHECK (used_count >= 0)
);

CREATE INDEX idx_discount_coupons_code      ON public.discount_coupons(code);
CREATE INDEX idx_discount_coupons_is_active ON public.discount_coupons(is_active);
CREATE INDEX idx_discount_coupons_campaign  ON public.discount_coupons(campaign_id) WHERE campaign_id IS NOT NULL;

COMMENT ON TABLE public.discount_coupons IS 'Cupones de descuento. Acceso restringido a marketing.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.customer_segments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_customers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_coupons     ENABLE ROW LEVEL SECURITY;

-- customer_segments
CREATE POLICY mkt_segments_select ON public.customer_segments FOR SELECT USING (public.has_permission('marketing.read'));
CREATE POLICY mkt_segments_insert ON public.customer_segments FOR INSERT WITH CHECK (public.has_permission('marketing.create'));
CREATE POLICY mkt_segments_update ON public.customer_segments FOR UPDATE USING (public.has_permission('marketing.update'));
CREATE POLICY mkt_segments_delete ON public.customer_segments FOR DELETE USING (public.has_permission('marketing.delete'));

-- marketing_campaigns
CREATE POLICY mkt_campaigns_select ON public.marketing_campaigns FOR SELECT USING (public.has_permission('marketing.read'));
CREATE POLICY mkt_campaigns_insert ON public.marketing_campaigns FOR INSERT WITH CHECK (public.has_permission('marketing.create'));
CREATE POLICY mkt_campaigns_update ON public.marketing_campaigns FOR UPDATE USING (public.has_permission('marketing.update'));
CREATE POLICY mkt_campaigns_delete ON public.marketing_campaigns FOR DELETE USING (public.has_permission('marketing.delete'));

-- campaign_customers
CREATE POLICY mkt_cc_select ON public.campaign_customers FOR SELECT USING (public.has_permission('marketing.analytics.read'));
CREATE POLICY mkt_cc_insert ON public.campaign_customers FOR INSERT WITH CHECK (public.has_permission('marketing.create'));
CREATE POLICY mkt_cc_update ON public.campaign_customers FOR UPDATE USING (public.has_permission('marketing.update'));

-- discount_coupons
CREATE POLICY mkt_coupons_select ON public.discount_coupons FOR SELECT USING (public.has_permission('marketing.read'));
CREATE POLICY mkt_coupons_insert ON public.discount_coupons FOR INSERT WITH CHECK (public.has_permission('marketing.create'));
CREATE POLICY mkt_coupons_update ON public.discount_coupons FOR UPDATE USING (public.has_permission('marketing.update'));
CREATE POLICY mkt_coupons_delete ON public.discount_coupons FOR DELETE USING (public.has_permission('marketing.delete'));

-- -----------------------------------------------------------------------------
-- PERMISOS
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('marketing.read',           'Ver campañas, segmentos y cupones'),
  ('marketing.create',         'Crear campañas y cupones'),
  ('marketing.update',         'Editar campañas y gestionar estados'),
  ('marketing.delete',         'Eliminar campañas y cupones'),
  ('marketing.analytics.read', 'Ver analíticas y resultados de campañas')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   public.roles       r
JOIN   public.permissions p ON p.name LIKE 'marketing.%'
WHERE  r.name = 'administrator'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- SEED — segmentos predeterminados
-- -----------------------------------------------------------------------------
INSERT INTO public.customer_segments (name, description) VALUES
  ('Clientes VIP',       'Clientes con etiqueta VIP asignada'),
  ('Clientes nuevos',    'Clientes registrados en los últimos 30 días'),
  ('Clientes frecuentes','Clientes con 3 o más pedidos'),
  ('Clientes inactivos', 'Clientes sin pedidos en los últimos 90 días'),
  ('Mayoristas',         'Clientes con etiqueta Mayorista'),
  ('Corporativos',       'Clientes con etiqueta Corporativo')
ON CONFLICT (name) DO NOTHING;
