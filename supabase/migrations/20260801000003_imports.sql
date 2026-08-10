-- =============================================================================
-- Migration 018: Imports — importaciones internacionales de mercancía
--
-- Una importación agrupa órdenes de compra internacionales en un único envío.
-- NO modifica el inventario — la recepción se registrará en inventory_entries.
--
-- Depende de: migration 001 (set_updated_at), 008 (roles/permisos),
--             016 (purchase_orders)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- IMPORTS — cabecera del lote de importación
-- -----------------------------------------------------------------------------
CREATE TABLE public.imports (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid(),
  reference            text        NOT NULL,
  status               text        NOT NULL DEFAULT 'planning',
  origin_country       text        NOT NULL,
  destination_country  text        NOT NULL DEFAULT 'Venezuela',
  shipping_method      text,
  estimated_departure  date,
  estimated_arrival    date,
  actual_arrival       date,
  notes                text,
  created_by           uuid,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT imports_pkey           PRIMARY KEY (id),
  CONSTRAINT imports_ref_unique     UNIQUE (reference),
  CONSTRAINT imports_status_check   CHECK (
    status IN ('planning','purchased','in_transit','customs','received','cancelled')
  ),
  CONSTRAINT imports_created_by_fk  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TRIGGER imports_updated_at
  BEFORE UPDATE ON public.imports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_imports_status     ON public.imports(status);
CREATE INDEX idx_imports_created_at ON public.imports(created_at DESC);
CREATE INDEX idx_imports_created_by ON public.imports(created_by);

COMMENT ON TABLE  public.imports            IS 'Importaciones internacionales de mercancía. Agrupa purchase_orders en un envío.';
COMMENT ON COLUMN public.imports.status     IS 'planning|purchased|in_transit|customs|received|cancelled';
COMMENT ON COLUMN public.imports.actual_arrival IS 'Fecha real de llegada. Solo se completa al recibir la mercancía.';

-- -----------------------------------------------------------------------------
-- IMPORT_PURCHASE_ORDERS — órdenes de compra vinculadas a la importación
-- Un purchase_order solo puede pertenecer a una importación a la vez.
-- -----------------------------------------------------------------------------
CREATE TABLE public.import_purchase_orders (
  id                uuid        NOT NULL DEFAULT gen_random_uuid(),
  import_id         uuid        NOT NULL,
  purchase_order_id uuid        NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT import_purchase_orders_pkey      PRIMARY KEY (id),
  CONSTRAINT import_purchase_orders_unique    UNIQUE (purchase_order_id),
  CONSTRAINT import_purchase_orders_import_fk FOREIGN KEY (import_id)
    REFERENCES public.imports(id) ON DELETE CASCADE,
  CONSTRAINT import_purchase_orders_po_fk     FOREIGN KEY (purchase_order_id)
    REFERENCES public.purchase_orders(id) ON DELETE RESTRICT
);

CREATE INDEX idx_import_po_import_id ON public.import_purchase_orders(import_id);

COMMENT ON TABLE  public.import_purchase_orders IS 'Vinculación N:M entre importaciones y órdenes de compra.';
COMMENT ON COLUMN public.import_purchase_orders.purchase_order_id IS 'UNIQUE: una orden solo puede pertenecer a una importación.';

-- -----------------------------------------------------------------------------
-- IMPORT_EXPENSES — gastos logísticos de la importación
-- -----------------------------------------------------------------------------
CREATE TABLE public.import_expenses (
  id        uuid          NOT NULL DEFAULT gen_random_uuid(),
  import_id uuid          NOT NULL,
  concept   text          NOT NULL,
  amount    numeric(15,2) NOT NULL,
  currency  char(3)       NOT NULL DEFAULT 'USD',
  notes     text,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT import_expenses_pkey       PRIMARY KEY (id),
  CONSTRAINT import_expenses_import_fk  FOREIGN KEY (import_id) REFERENCES public.imports(id) ON DELETE CASCADE,
  CONSTRAINT import_expenses_concept_check CHECK (
    concept IN ('freight','insurance','customs','taxes','storage','transport','other')
  ),
  CONSTRAINT import_expenses_amount_check CHECK (amount > 0)
);

CREATE INDEX idx_import_expenses_import_id ON public.import_expenses(import_id);

COMMENT ON TABLE  public.import_expenses         IS 'Gastos logísticos por importación (flete, seguro, aduana, etc.).';
COMMENT ON COLUMN public.import_expenses.concept IS 'freight|insurance|customs|taxes|storage|transport|other';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.imports               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_expenses        ENABLE ROW LEVEL SECURITY;

CREATE POLICY imports_select      ON public.imports               FOR SELECT USING (public.has_permission('imports.read'));
CREATE POLICY imports_insert      ON public.imports               FOR INSERT WITH CHECK (public.has_permission('imports.create'));
CREATE POLICY imports_update      ON public.imports               FOR UPDATE USING (public.has_permission('imports.update'));
CREATE POLICY import_po_select    ON public.import_purchase_orders FOR SELECT USING (public.has_permission('imports.read'));
CREATE POLICY import_po_insert    ON public.import_purchase_orders FOR INSERT WITH CHECK (public.has_permission('imports.update'));
CREATE POLICY import_po_delete    ON public.import_purchase_orders FOR DELETE USING (public.has_permission('imports.update'));
CREATE POLICY import_exp_select   ON public.import_expenses        FOR SELECT USING (public.has_permission('imports.read'));
CREATE POLICY import_exp_insert   ON public.import_expenses        FOR INSERT WITH CHECK (public.has_permission('imports.update'));
CREATE POLICY import_exp_delete   ON public.import_expenses        FOR DELETE USING (public.has_permission('imports.update'));

-- -----------------------------------------------------------------------------
-- PERMISOS
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('imports.read',    'Ver importaciones y sus detalles'),
  ('imports.create',  'Crear nuevas importaciones'),
  ('imports.update',  'Editar importaciones y agregar órdenes/gastos'),
  ('imports.receive', 'Marcar importaciones como recibidas')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles       r
JOIN public.permissions p ON p.name LIKE 'imports.%'
WHERE r.name = 'administrator'
ON CONFLICT DO NOTHING;
