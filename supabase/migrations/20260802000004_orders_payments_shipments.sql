-- =============================================================================
-- Migration 024: Sistema de pedidos y ventas — pagos y envíos
--
-- - Extiende orders: columnas taxes, shipping + amplía check de status
-- - Crea payments (pagos registrados por venta)
-- - Crea shipments (envíos con tracking)
-- - Nuevos permisos: orders.ship, payments.manage
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensión de la tabla orders
-- Agrega taxes y shipping como columnas opcionales (default 0).
-- Se amplía el CHECK de status para incluir los valores del flujo de ventas.
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS taxes    numeric(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping numeric(15,2) NOT NULL DEFAULT 0;

-- Reemplazar el CHECK de status por uno que incluya tanto los valores
-- del flujo anterior como los del nuevo flujo de ventas.
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check CHECK (
    status IN (
      -- flujo original
      'draft', 'pending_confirmation', 'confirmed',
      'preparing', 'ready', 'delivered', 'cancelled',
      -- flujo de ventas (Hito 10)
      'pending', 'paid', 'processing', 'shipped', 'refunded'
    )
  );

COMMENT ON COLUMN public.orders.taxes    IS 'Impuestos aplicados al pedido.';
COMMENT ON COLUMN public.orders.shipping IS 'Costo de envío cobrado al cliente.';

-- -----------------------------------------------------------------------------
-- PAYMENTS — pagos registrados contra un pedido
-- Los pagos son registros históricos; los errores se compensan con rembolsos.
-- -----------------------------------------------------------------------------
CREATE TABLE public.payments (
  id          uuid          NOT NULL DEFAULT gen_random_uuid(),
  order_id    uuid          NOT NULL,
  amount      numeric(15,2) NOT NULL,
  currency    char(3)       NOT NULL DEFAULT 'USD',
  method      text          NOT NULL,
  status      text          NOT NULL DEFAULT 'pending',
  reference   text,
  notes       text,
  created_by  uuid,
  created_at  timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT payments_pkey        PRIMARY KEY (id),
  CONSTRAINT payments_order_fk    FOREIGN KEY (order_id)   REFERENCES public.orders(id)   ON DELETE RESTRICT,
  CONSTRAINT payments_user_fk     FOREIGN KEY (created_by) REFERENCES public.profiles(id)  ON DELETE SET NULL,
  CONSTRAINT payments_amount_check  CHECK (amount > 0),
  CONSTRAINT payments_method_check  CHECK (
    method IN ('cash','transfer','zelle','paypal','binance','card','other')
  ),
  CONSTRAINT payments_status_check  CHECK (
    status IN ('pending','confirmed','rejected','refunded')
  ),
  CONSTRAINT payments_currency_check CHECK (currency IN ('USD','VES','EUR'))
);

CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_status   ON public.payments(status);

COMMENT ON TABLE public.payments IS 'Pagos registrados por pedido. Registros históricos inmutables.';

-- -----------------------------------------------------------------------------
-- SHIPMENTS — envíos con tracking
-- Un pedido puede tener múltiples envíos (parciales, re-envíos).
-- -----------------------------------------------------------------------------
CREATE TABLE public.shipments (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  order_id        uuid        NOT NULL,
  carrier         text,
  tracking_number text,
  status          text        NOT NULL DEFAULT 'pending',
  notes           text,
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT shipments_pkey        PRIMARY KEY (id),
  CONSTRAINT shipments_order_fk    FOREIGN KEY (order_id)   REFERENCES public.orders(id)   ON DELETE RESTRICT,
  CONSTRAINT shipments_user_fk     FOREIGN KEY (created_by) REFERENCES public.profiles(id)  ON DELETE SET NULL,
  CONSTRAINT shipments_status_check CHECK (
    status IN ('pending','shipped','delivered','returned')
  )
);

CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX idx_shipments_status   ON public.shipments(status);

COMMENT ON TABLE public.shipments IS 'Envíos registrados por pedido. Incluye tracking y estados.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_select ON public.payments FOR SELECT USING (public.has_permission('orders.read'));
CREATE POLICY payments_insert ON public.payments FOR INSERT WITH CHECK (public.has_permission('payments.manage'));
CREATE POLICY payments_update ON public.payments FOR UPDATE USING (public.has_permission('payments.manage'));

CREATE POLICY shipments_select ON public.shipments FOR SELECT USING (public.has_permission('orders.read'));
CREATE POLICY shipments_insert ON public.shipments FOR INSERT WITH CHECK (public.has_permission('orders.ship'));
CREATE POLICY shipments_update ON public.shipments FOR UPDATE USING (public.has_permission('orders.ship'));

-- -----------------------------------------------------------------------------
-- PERMISOS
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('orders.ship',       'Registrar envíos y actualizar tracking de pedidos'),
  ('payments.manage',   'Registrar y gestionar pagos de pedidos')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   public.roles       r
JOIN   public.permissions p ON p.name IN ('orders.ship', 'payments.manage')
WHERE  r.name = 'administrator'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   public.roles       r
JOIN   public.permissions p ON p.name IN ('orders.ship', 'payments.manage')
WHERE  r.name = 'salesperson'
ON CONFLICT DO NOTHING;
