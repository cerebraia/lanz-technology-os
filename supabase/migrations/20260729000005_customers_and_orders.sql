-- =============================================================================
-- Migration 005: Customers and orders
-- customers, orders, order_items, order_status_history, inventory_reservations
-- Depende de: migration 001, 002, 003, 004
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ORDER NUMBER SEQUENCE
-- Genera números comerciales únicos y secuenciales sin race conditions.
-- Formato resultante: LT-001000, LT-001001, ...
-- NO usar MAX()+1 — el sequence es atómico y correcto bajo concurrencia.
-- -----------------------------------------------------------------------------
CREATE SEQUENCE public.order_number_seq
  START WITH 1000
  INCREMENT BY 1
  NO CYCLE;

-- -----------------------------------------------------------------------------
-- CUSTOMERS
-- Clientes de Lanz Technology.
-- Archivado lógico via archived_at.
-- El sistema NO exige datos completos para crear un cliente.
-- -----------------------------------------------------------------------------
CREATE TABLE public.customers (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  first_name  text        NOT NULL,
  last_name   text,
  phone       text,
  whatsapp    text,
  email       text,
  id_number   text,
  address     text,
  notes       text,
  source      text,
  archived_at timestamptz,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT customers_pkey      PRIMARY KEY (id),
  CONSTRAINT customers_user_fk   FOREIGN KEY (created_by)
    REFERENCES public.profiles(id) ON DELETE SET NULL,

  CONSTRAINT customers_source_check CHECK (
    source IS NULL OR source IN (
      'instagram', 'facebook', 'tiktok', 'whatsapp',
      'referral', 'walk_in', 'other'
    )
  )
);

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_customers_phone    ON public.customers(phone)    WHERE phone IS NOT NULL;
CREATE INDEX idx_customers_email    ON public.customers(email)    WHERE email IS NOT NULL;
CREATE INDEX idx_customers_archived ON public.customers(archived_at) WHERE archived_at IS NULL;

COMMENT ON TABLE  public.customers             IS 'Clientes de Lanz Technology.';
COMMENT ON COLUMN public.customers.source      IS 'Canal por el que llegó el cliente.';
COMMENT ON COLUMN public.customers.archived_at IS 'Archivado lógico. NULL = activo.';

-- -----------------------------------------------------------------------------
-- ORDERS
-- Pedidos del sistema.
--
-- Separación de conceptos:
--   status:         estado del pedido (flujo operativo)
--   payment_status: estado del cobro (independiente del pedido)
--
-- order_number: generado automáticamente via sequence (LT-XXXXXX)
-- customer_id:  puede ser NULL en borradores, debe definirse antes de confirmar
--
-- Los pedidos históricos NO se eliminan físicamente.
-- La cancelación se registra via cancelled_at + cancel_reason.
-- -----------------------------------------------------------------------------
CREATE TABLE public.orders (
  id              uuid          NOT NULL DEFAULT gen_random_uuid(),
  order_number    text          NOT NULL DEFAULT ('LT-' || LPAD(nextval('public.order_number_seq')::text, 6, '0')),
  customer_id     uuid,
  status          text          NOT NULL DEFAULT 'draft',
  sale_channel    text          NOT NULL DEFAULT 'direct',
  currency_code   char(3)       NOT NULL DEFAULT 'USD',
  subtotal        numeric(15,2) NOT NULL DEFAULT 0,
  discount_amount numeric(15,2) NOT NULL DEFAULT 0,
  total_amount    numeric(15,2) NOT NULL DEFAULT 0,
  payment_status  text          NOT NULL DEFAULT 'pending',
  notes           text,
  cancelled_at    timestamptz,
  cancel_reason   text,
  created_by      uuid,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT orders_pkey              PRIMARY KEY (id),
  CONSTRAINT orders_number_unique     UNIQUE (order_number),

  CONSTRAINT orders_customer_fk  FOREIGN KEY (customer_id)
    REFERENCES public.customers(id) ON DELETE SET NULL,
  CONSTRAINT orders_user_fk      FOREIGN KEY (created_by)
    REFERENCES public.profiles(id)  ON DELETE SET NULL,

  CONSTRAINT orders_status_check CHECK (
    status IN (
      'draft', 'pending_confirmation', 'confirmed',
      'preparing', 'ready', 'delivered', 'cancelled'
    )
  ),
  CONSTRAINT orders_channel_check CHECK (
    sale_channel IN (
      'store', 'whatsapp', 'instagram', 'facebook',
      'phone', 'direct', 'other'
    )
  ),
  CONSTRAINT orders_currency_check        CHECK (currency_code IN ('USD', 'VES')),
  CONSTRAINT orders_subtotal_check        CHECK (subtotal >= 0),
  CONSTRAINT orders_discount_check        CHECK (discount_amount >= 0),
  CONSTRAINT orders_total_check           CHECK (total_amount >= 0),
  CONSTRAINT orders_payment_status_check  CHECK (
    payment_status IN ('pending', 'partial', 'paid', 'refunded')
  ),
  -- Coherencia: cancelled_at ↔ status = 'cancelled'
  CONSTRAINT orders_cancel_consistency CHECK (
    (status = 'cancelled') = (cancelled_at IS NOT NULL)
  )
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_orders_customer_id    ON public.orders(customer_id)    WHERE customer_id IS NOT NULL;
CREATE INDEX idx_orders_status         ON public.orders(status, created_at DESC);
CREATE INDEX idx_orders_number         ON public.orders(order_number);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created_by     ON public.orders(created_by)     WHERE created_by IS NOT NULL;

COMMENT ON TABLE  public.orders                IS 'Pedidos del sistema. Registros históricos inmutables.';
COMMENT ON COLUMN public.orders.order_number   IS 'Número comercial legible. Generado via sequence. Formato: LT-XXXXXX.';
COMMENT ON COLUMN public.orders.status         IS 'Estado operativo del pedido.';
COMMENT ON COLUMN public.orders.payment_status IS 'Estado de cobro. Independiente del status del pedido.';

-- -----------------------------------------------------------------------------
-- ORDER_ITEMS
-- Líneas de pedido con snapshots inmutables de producto y precio.
--
-- INVARIANTE: los snapshots (sku, name, price, cost) son inmutables una vez
-- creados. El pedido histórico conserva los datos del momento de la venta,
-- independientemente de cambios posteriores en el catálogo.
--
-- unit_cost: acceso RESTRINGIDO — solo administradores pueden leerlo.
-- -----------------------------------------------------------------------------
CREATE TABLE public.order_items (
  id              uuid          NOT NULL DEFAULT gen_random_uuid(),
  order_id        uuid          NOT NULL,
  product_id      uuid,
  -- Snapshots inmutables al momento de crear el pedido
  product_sku     text          NOT NULL,
  product_name    text          NOT NULL,
  unit_price      numeric(15,2) NOT NULL,
  unit_cost       numeric(15,2),
  currency_code   char(3)       NOT NULL,
  quantity        integer       NOT NULL,
  discount_amount numeric(15,2) NOT NULL DEFAULT 0,
  line_total      numeric(15,2) NOT NULL,
  created_at      timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT order_items_pkey     PRIMARY KEY (id),

  -- RESTRICT: no eliminar un pedido si tiene líneas (protege historial)
  CONSTRAINT order_items_order_fk   FOREIGN KEY (order_id)
    REFERENCES public.orders(id)    ON DELETE RESTRICT,
  -- SET NULL: si el producto se archiva, la línea conserva su snapshot
  CONSTRAINT order_items_product_fk FOREIGN KEY (product_id)
    REFERENCES public.products(id)  ON DELETE SET NULL,

  CONSTRAINT order_items_quantity_check    CHECK (quantity > 0),
  CONSTRAINT order_items_unit_price_check  CHECK (unit_price >= 0),
  CONSTRAINT order_items_unit_cost_check   CHECK (unit_cost IS NULL OR unit_cost >= 0),
  CONSTRAINT order_items_discount_check    CHECK (discount_amount >= 0),
  CONSTRAINT order_items_line_total_check  CHECK (line_total >= 0),
  CONSTRAINT order_items_currency_check    CHECK (currency_code IN ('USD', 'VES'))
);

CREATE INDEX idx_order_items_order_id   ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id) WHERE product_id IS NOT NULL;

COMMENT ON TABLE  public.order_items           IS 'Líneas de pedido con snapshots inmutables.';
COMMENT ON COLUMN public.order_items.unit_cost IS 'Costo en el momento de la venta. Acceso restringido.';

-- -----------------------------------------------------------------------------
-- ORDER_STATUS_HISTORY
-- Historial de transiciones de estado. Append-only, inmutable.
-- Permite reconstruir el ciclo de vida completo de cualquier pedido.
-- -----------------------------------------------------------------------------
CREATE TABLE public.order_status_history (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  order_id        uuid        NOT NULL,
  previous_status text,
  new_status      text        NOT NULL,
  notes           text,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT order_status_history_pkey     PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_fk FOREIGN KEY (order_id)
    REFERENCES public.orders(id) ON DELETE RESTRICT,
  CONSTRAINT order_status_history_user_fk  FOREIGN KEY (created_by)
    REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_order_status_history_order
  ON public.order_status_history(order_id, created_at DESC);

COMMENT ON TABLE public.order_status_history IS 'Historial inmutable de transiciones de estado de pedidos.';

-- -----------------------------------------------------------------------------
-- INVENTORY_RESERVATIONS
-- Stock comprometido a pedidos activos pero aún no despachado.
--
-- Estados del ciclo de vida:
--   active   → stock reservado, pedido en curso
--   released → reserva liberada por cancelación del pedido
--   consumed → reserva convertida en salida real al despachar
--
-- La reserva NO reduce on_hand — solo incrementa reserved en inventory_balances.
-- La relación con inventory_balances se mantiene via Server Actions.
-- -----------------------------------------------------------------------------
CREATE TABLE public.inventory_reservations (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  product_id  uuid        NOT NULL,
  location_id uuid        NOT NULL,
  order_id    uuid        NOT NULL,
  quantity    integer     NOT NULL,
  status      text        NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inventory_reservations_pkey       PRIMARY KEY (id),

  CONSTRAINT inventory_reservations_product_fk  FOREIGN KEY (product_id)
    REFERENCES public.products(id)              ON DELETE RESTRICT,
  CONSTRAINT inventory_reservations_location_fk FOREIGN KEY (location_id)
    REFERENCES public.inventory_locations(id)   ON DELETE RESTRICT,
  CONSTRAINT inventory_reservations_order_fk    FOREIGN KEY (order_id)
    REFERENCES public.orders(id)                ON DELETE RESTRICT,

  CONSTRAINT inventory_reservations_quantity_check CHECK (quantity > 0),
  CONSTRAINT inventory_reservations_status_check   CHECK (
    status IN ('active', 'released', 'consumed')
  )
);

CREATE TRIGGER inventory_reservations_updated_at
  BEFORE UPDATE ON public.inventory_reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índice para consultar reservas activas de un producto+ubicación rápidamente
CREATE INDEX idx_inventory_reservations_active
  ON public.inventory_reservations(product_id, location_id)
  WHERE status = 'active';

CREATE INDEX idx_inventory_reservations_order
  ON public.inventory_reservations(order_id);

COMMENT ON TABLE  public.inventory_reservations        IS 'Reservas de stock para pedidos activos.';
COMMENT ON COLUMN public.inventory_reservations.status IS 'active | released | consumed.';
