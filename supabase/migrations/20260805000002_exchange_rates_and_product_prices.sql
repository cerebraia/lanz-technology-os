-- =============================================================================
-- Migration: Tasas de cambio y precios diferenciados por método de pago
--
-- 1. Tabla exchange_rates — historial inmutable de tasas BCV y Binance
-- 2. Columnas products.cash_price_usd y products.bcv_reference_price_usd
--    para separar el precio USD (efectivo/Zelle/USDT) del precio base BCV
-- 3. Permisos: settings.exchange_rates.manage para administradores
-- =============================================================================

-- ─── 1. Tabla exchange_rates ──────────────────────────────────────────────────
-- Los registros son append-only. No se modifican ni eliminan.
-- El estado 'active' indica la tasa vigente para esa fuente.
-- Para cambiar la tasa vigente: insertar un nuevo registro con status='active'
-- y actualizar el anterior a 'stale'.

CREATE TABLE public.exchange_rates (
  id             uuid          NOT NULL DEFAULT gen_random_uuid(),
  source         text          NOT NULL,
  base_currency  varchar(5)    NOT NULL DEFAULT 'USD',
  quote_currency varchar(5)    NOT NULL DEFAULT 'VES',
  rate           numeric(20,6) NOT NULL,
  effective_at   timestamptz   NOT NULL DEFAULT now(),
  fetched_at     timestamptz   NOT NULL DEFAULT now(),
  status         text          NOT NULL DEFAULT 'active',
  is_manual      boolean       NOT NULL DEFAULT false,
  notes          text,
  created_by     uuid,
  created_at     timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT exchange_rates_pkey          PRIMARY KEY (id),
  CONSTRAINT exchange_rates_created_by_fk FOREIGN KEY (created_by)
    REFERENCES public.profiles(id) ON DELETE SET NULL,

  CONSTRAINT exchange_rates_source_check  CHECK (source IN ('bcv', 'binance')),
  CONSTRAINT exchange_rates_status_check  CHECK (status IN ('active', 'stale', 'failed')),
  CONSTRAINT exchange_rates_rate_check    CHECK (rate > 0),
  CONSTRAINT exchange_rates_base_check    CHECK (base_currency IN ('USD', 'USDT')),
  CONSTRAINT exchange_rates_quote_check   CHECK (quote_currency IN ('VES'))
);

CREATE INDEX idx_exchange_rates_source_status
  ON public.exchange_rates(source, status, effective_at DESC);

COMMENT ON TABLE  public.exchange_rates IS 'Historial de tasas de cambio BCV y Binance. Registros inmutables.';
COMMENT ON COLUMN public.exchange_rates.rate IS 'Cuántos VES equivalen a 1 USD (o USDT). Numeric para evitar flotantes.';

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY exchange_rates_select ON public.exchange_rates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY exchange_rates_insert ON public.exchange_rates
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('settings.manage'));

CREATE POLICY exchange_rates_update ON public.exchange_rates
  FOR UPDATE TO authenticated
  USING  (public.has_permission('settings.manage'))
  WITH CHECK (public.has_permission('settings.manage'));

-- Lectura pública para el frontend de la tienda
CREATE POLICY exchange_rates_public_select ON public.exchange_rates
  FOR SELECT TO anon
  USING (status = 'active');

-- ─── 2. Precios diferenciados en products ────────────────────────────────────
-- cash_price_usd:          precio para efectivo, Zelle y USDT
-- bcv_reference_price_usd: precio base desde el que se calcula el precio en Bs
--
-- Ambos son nullable inicialmente para no romper productos existentes.
-- Si son NULL, el frontend usa sale_price como fallback.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cash_price_usd         numeric(15,2),
  ADD COLUMN IF NOT EXISTS bcv_reference_price_usd numeric(15,2);

ALTER TABLE public.products
  ADD CONSTRAINT products_cash_price_check
    CHECK (cash_price_usd IS NULL OR cash_price_usd >= 0),
  ADD CONSTRAINT products_bcv_price_check
    CHECK (bcv_reference_price_usd IS NULL OR bcv_reference_price_usd >= 0);

COMMENT ON COLUMN public.products.cash_price_usd
  IS 'Precio en USD para pagos en efectivo, Zelle o USDT.';
COMMENT ON COLUMN public.products.bcv_reference_price_usd
  IS 'Precio base en USD para calcular el precio en bolívares a tasa BCV.';

-- ─── 3. Seed inicial — tasa manual BCV referencial ────────────────────────────
-- Se actualiza desde el panel de administración.
-- No usar como tasa real sin verificar.

INSERT INTO public.exchange_rates
  (source, base_currency, quote_currency, rate, status, is_manual, notes)
VALUES
  ('bcv',     'USD',  'VES', 40.0000, 'active', true, 'Tasa inicial manual. Actualizar desde /admin/settings/exchange-rates.'),
  ('binance',  'USDT', 'VES', 42.0000, 'active', true, 'Tasa Binance inicial manual. Actualizar desde /admin/settings/exchange-rates.')
ON CONFLICT DO NOTHING;
