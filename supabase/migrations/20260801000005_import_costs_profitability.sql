-- =============================================================================
-- Migration 020: Distribución de costos y rentabilidad por importación
--
-- Módulo 3 — Distribución de costos logísticos
--   Permite asignar los gastos de importación (flete, seguro, aduana…) a los
--   productos recibidos usando tres métodos: por cantidad, por valor, manual.
--
-- Módulo 4 — Rentabilidad
--   Snapshot computado a demanda: costo real, ingresos proyectados, margen, ROI.
--
-- Depende de: migration 018 (imports + import_expenses),
--             019 (import_receipts + import_receipt_items),
--             003 (products + purchase_order_items)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- IMPORT_COST_ALLOCATIONS — cabecera de una distribución de costos
--
-- Una importación puede tener múltiples distribuciones (una por ejecución).
-- expense_id nullable: NULL = distribución de todos los gastos juntos;
--                      SET  = distribución de un gasto específico.
-- allocation_method: 'quantity' | 'value' | 'manual'
-- -----------------------------------------------------------------------------
CREATE TABLE public.import_cost_allocations (
  id                uuid          NOT NULL DEFAULT gen_random_uuid(),
  import_id         uuid          NOT NULL,
  expense_id        uuid,
  allocation_method text          NOT NULL,
  total_amount      numeric(15,2) NOT NULL DEFAULT 0,
  currency          char(3)       NOT NULL DEFAULT 'USD',
  notes             text,
  created_by        uuid,
  created_at        timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT import_cost_allocations_pkey        PRIMARY KEY (id),
  CONSTRAINT import_cost_allocations_import_fk   FOREIGN KEY (import_id)  REFERENCES public.imports(id)          ON DELETE CASCADE,
  CONSTRAINT import_cost_allocations_expense_fk  FOREIGN KEY (expense_id) REFERENCES public.import_expenses(id)  ON DELETE SET NULL,
  CONSTRAINT import_cost_allocations_created_fk  FOREIGN KEY (created_by) REFERENCES public.profiles(id)         ON DELETE SET NULL,
  CONSTRAINT import_cost_allocations_method_check CHECK (allocation_method IN ('quantity','value','manual')),
  CONSTRAINT import_cost_allocations_amount_check CHECK (total_amount >= 0)
);

CREATE INDEX idx_import_cost_alloc_import_id ON public.import_cost_allocations(import_id);

COMMENT ON TABLE  public.import_cost_allocations                   IS 'Distribuciones de costos logísticos a productos de una importación.';
COMMENT ON COLUMN public.import_cost_allocations.allocation_method IS 'quantity=por unidades recibidas | value=por valor mercancía | manual=libre.';
COMMENT ON COLUMN public.import_cost_allocations.expense_id        IS 'NULL=todos los gastos; SET=gasto específico.';

-- -----------------------------------------------------------------------------
-- IMPORT_COST_ALLOCATION_ITEMS — una línea por producto en la distribución
-- -----------------------------------------------------------------------------
CREATE TABLE public.import_cost_allocation_items (
  id                    uuid          NOT NULL DEFAULT gen_random_uuid(),
  allocation_id         uuid          NOT NULL,
  product_id            uuid          NOT NULL,
  quantity              integer       NOT NULL DEFAULT 0,
  unit_merchandise_cost numeric(15,2) NOT NULL DEFAULT 0,
  allocated_amount      numeric(15,2) NOT NULL DEFAULT 0,
  final_unit_cost       numeric(15,2) NOT NULL DEFAULT 0,
  created_at            timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT import_cost_alloc_items_pkey           PRIMARY KEY (id),
  CONSTRAINT import_cost_alloc_items_alloc_fk       FOREIGN KEY (allocation_id) REFERENCES public.import_cost_allocations(id) ON DELETE CASCADE,
  CONSTRAINT import_cost_alloc_items_product_fk     FOREIGN KEY (product_id)    REFERENCES public.products(id)               ON DELETE RESTRICT,
  CONSTRAINT import_cost_alloc_items_qty_check      CHECK (quantity              >= 0),
  CONSTRAINT import_cost_alloc_items_merch_check    CHECK (unit_merchandise_cost >= 0),
  CONSTRAINT import_cost_alloc_items_alloc_check    CHECK (allocated_amount      >= 0),
  CONSTRAINT import_cost_alloc_items_final_check    CHECK (final_unit_cost       >= 0)
);

CREATE INDEX idx_import_cost_alloc_items_alloc_id   ON public.import_cost_allocation_items(allocation_id);
CREATE INDEX idx_import_cost_alloc_items_product_id ON public.import_cost_allocation_items(product_id);

COMMENT ON TABLE  public.import_cost_allocation_items                   IS 'Detalle de la distribución de costos por producto.';
COMMENT ON COLUMN public.import_cost_allocation_items.unit_merchandise_cost IS 'Costo promedio ponderado del producto en las órdenes de compra vinculadas.';
COMMENT ON COLUMN public.import_cost_allocation_items.allocated_amount       IS 'Porción del gasto logístico asignado a este producto.';
COMMENT ON COLUMN public.import_cost_allocation_items.final_unit_cost        IS 'unit_merchandise_cost + (allocated_amount / quantity).';

-- -----------------------------------------------------------------------------
-- IMPORT_PROFITABILITY — snapshot de rentabilidad por importación
--
-- Se calcula a demanda y se guarda como histórico.
-- El cálculo no es automático: el usuario activa el análisis.
-- Los ingresos se basan en el precio de venta vigente en el momento del análisis.
-- -----------------------------------------------------------------------------
CREATE TABLE public.import_profitability (
  id                      uuid          NOT NULL DEFAULT gen_random_uuid(),
  import_id               uuid          NOT NULL,
  total_merchandise_cost  numeric(15,2) NOT NULL DEFAULT 0,
  total_logistics_cost    numeric(15,2) NOT NULL DEFAULT 0,
  total_cost              numeric(15,2) NOT NULL DEFAULT 0,
  total_revenue           numeric(15,2) NOT NULL DEFAULT 0,
  gross_profit            numeric(15,2) NOT NULL DEFAULT 0,
  margin                  numeric(8,4)  NOT NULL DEFAULT 0,
  roi                     numeric(8,4)  NOT NULL DEFAULT 0,
  currency                char(3)       NOT NULL DEFAULT 'USD',
  notes                   text,
  created_by              uuid,
  created_at              timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT import_profitability_pkey       PRIMARY KEY (id),
  CONSTRAINT import_profitability_import_fk  FOREIGN KEY (import_id)  REFERENCES public.imports(id)  ON DELETE CASCADE,
  CONSTRAINT import_profitability_created_fk FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_import_profitability_import_id  ON public.import_profitability(import_id);
CREATE INDEX idx_import_profitability_created_at ON public.import_profitability(created_at DESC);

COMMENT ON TABLE  public.import_profitability              IS 'Snapshot de rentabilidad por importación. Calculado a demanda, conservado como histórico.';
COMMENT ON COLUMN public.import_profitability.margin       IS '(gross_profit / total_revenue) * 100. NULL si revenue = 0.';
COMMENT ON COLUMN public.import_profitability.roi          IS '(gross_profit / total_cost) * 100. NULL si total_cost = 0.';
COMMENT ON COLUMN public.import_profitability.total_revenue IS 'Ingresos proyectados basados en sale_price vigente × unidades recibidas.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.import_cost_allocations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_cost_allocation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_profitability         ENABLE ROW LEVEL SECURITY;

CREATE POLICY import_cost_alloc_select  ON public.import_cost_allocations      FOR SELECT USING (public.has_permission('imports.costs.read'));
CREATE POLICY import_cost_alloc_insert  ON public.import_cost_allocations      FOR INSERT WITH CHECK (public.has_permission('imports.costs.allocate'));
CREATE POLICY import_cost_alloc_delete  ON public.import_cost_allocations      FOR DELETE USING (public.has_permission('imports.costs.allocate'));
CREATE POLICY import_cost_items_select  ON public.import_cost_allocation_items FOR SELECT USING (public.has_permission('imports.costs.read'));
CREATE POLICY import_cost_items_insert  ON public.import_cost_allocation_items FOR INSERT WITH CHECK (public.has_permission('imports.costs.allocate'));
CREATE POLICY import_profit_select      ON public.import_profitability         FOR SELECT USING (public.has_permission('imports.profitability.read'));
CREATE POLICY import_profit_insert      ON public.import_profitability         FOR INSERT WITH CHECK (public.has_permission('imports.profitability.read'));
CREATE POLICY import_profit_delete      ON public.import_profitability         FOR DELETE USING (public.has_permission('imports.profitability.read'));

-- -----------------------------------------------------------------------------
-- PERMISOS
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('imports.costs.read',        'Ver distribuciones de costos de importaciones'),
  ('imports.costs.allocate',    'Crear y eliminar distribuciones de costos'),
  ('imports.profitability.read','Ver y generar análisis de rentabilidad de importaciones')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles       r
JOIN public.permissions p ON p.name IN (
  'imports.costs.read','imports.costs.allocate','imports.profitability.read'
)
WHERE r.name = 'administrator'
ON CONFLICT DO NOTHING;
