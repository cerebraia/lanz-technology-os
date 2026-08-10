-- =============================================================================
-- Migration 016: Purchase orders — órdenes de compra a proveedores
--
-- Una orden de compra representa la intención formal de adquirir mercancía.
-- NO modifica el inventario. El stock solo cambia cuando la mercancía se recibe
-- mediante inventory_entries (módulo separado, integración futura).
--
-- Depende de: migration 001 (set_updated_at), 002 (profiles), 003 (products),
--             008 (roles y permisos)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PURCHASE_ORDERS — cabecera de la orden de compra
-- -----------------------------------------------------------------------------
CREATE TABLE public.purchase_orders (
  id            uuid          NOT NULL DEFAULT gen_random_uuid(),
  reference     text          NOT NULL,
  supplier_name text,
  status        text          NOT NULL DEFAULT 'draft',
  currency      char(3)       NOT NULL DEFAULT 'USD',
  subtotal      numeric(15,2) NOT NULL DEFAULT 0,
  notes         text,
  sent_by       uuid,
  sent_at       timestamptz,
  cancelled_by  uuid,
  cancelled_at  timestamptz,
  created_by    uuid,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT purchase_orders_pkey           PRIMARY KEY (id),
  CONSTRAINT purchase_orders_ref_unique     UNIQUE (reference),
  CONSTRAINT purchase_orders_status_check   CHECK (status IN ('draft','sent','partially_received','completed','cancelled')),
  CONSTRAINT purchase_orders_subtotal_check CHECK (subtotal >= 0),
  CONSTRAINT purchase_orders_created_by_fk  FOREIGN KEY (created_by)  REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT purchase_orders_sent_by_fk     FOREIGN KEY (sent_by)     REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT purchase_orders_cancelled_by_fk FOREIGN KEY (cancelled_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TRIGGER purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_purchase_orders_status     ON public.purchase_orders(status);
CREATE INDEX idx_purchase_orders_created_by ON public.purchase_orders(created_by);
CREATE INDEX idx_purchase_orders_created_at ON public.purchase_orders(created_at DESC);

COMMENT ON TABLE  public.purchase_orders          IS 'Órdenes de compra a proveedores. No modifica inventario — la recepción se registra mediante inventory_entries.';
COMMENT ON COLUMN public.purchase_orders.status   IS 'draft | sent | partially_received | completed | cancelled';
COMMENT ON COLUMN public.purchase_orders.subtotal IS 'Suma de (quantity * unit_cost) de todos los ítems. Calculado en la capa de aplicación.';

-- -----------------------------------------------------------------------------
-- PURCHASE_ORDER_ITEMS — líneas de producto por orden
-- -----------------------------------------------------------------------------
CREATE TABLE public.purchase_order_items (
  id                uuid          NOT NULL DEFAULT gen_random_uuid(),
  purchase_order_id uuid          NOT NULL,
  product_id        uuid          NOT NULL,
  quantity          integer       NOT NULL,
  unit_cost         numeric(15,2) NOT NULL,
  total             numeric(15,2) NOT NULL,
  created_at        timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT purchase_order_items_pkey          PRIMARY KEY (id),
  CONSTRAINT purchase_order_items_order_fk      FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT purchase_order_items_product_fk    FOREIGN KEY (product_id)        REFERENCES public.products(id)        ON DELETE RESTRICT,
  CONSTRAINT purchase_order_items_qty_check     CHECK (quantity > 0),
  CONSTRAINT purchase_order_items_cost_check    CHECK (unit_cost > 0),
  CONSTRAINT purchase_order_items_total_check   CHECK (total >= 0)
);

CREATE INDEX idx_purchase_order_items_order_id   ON public.purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product_id ON public.purchase_order_items(product_id);

COMMENT ON TABLE  public.purchase_order_items          IS 'Líneas de producto de una orden de compra.';
COMMENT ON COLUMN public.purchase_order_items.total    IS 'quantity * unit_cost. Calculado en la capa de aplicación al insertar.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.purchase_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY purchase_orders_select      ON public.purchase_orders      FOR SELECT USING (public.has_permission('purchases.read'));
CREATE POLICY purchase_orders_insert      ON public.purchase_orders      FOR INSERT WITH CHECK (public.has_permission('purchases.create'));
CREATE POLICY purchase_orders_update      ON public.purchase_orders      FOR UPDATE USING (public.has_permission('purchases.update'));
CREATE POLICY purchase_order_items_select ON public.purchase_order_items FOR SELECT USING (public.has_permission('purchases.read'));
CREATE POLICY purchase_order_items_insert ON public.purchase_order_items FOR INSERT WITH CHECK (public.has_permission('purchases.create'));
CREATE POLICY purchase_order_items_delete ON public.purchase_order_items FOR DELETE USING (public.has_permission('purchases.update'));

-- -----------------------------------------------------------------------------
-- PERMISOS
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('purchases.read',   'Ver órdenes de compra'),
  ('purchases.create', 'Crear órdenes de compra'),
  ('purchases.update', 'Editar órdenes de compra en borrador'),
  ('purchases.send',   'Enviar órdenes de compra al proveedor'),
  ('purchases.cancel', 'Cancelar órdenes de compra')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles       r
JOIN public.permissions p ON p.name LIKE 'purchases.%'
WHERE r.name = 'administrator'
ON CONFLICT DO NOTHING;
