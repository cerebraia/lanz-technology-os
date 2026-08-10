-- =============================================================================
-- Migration 013: Inventory adjustments (ajustes de inventario)
--
-- Modela el ciclo borrador → confirmado para conteos físicos y correcciones.
-- La confirmación genera adjustment_in / adjustment_out según la diferencia.
-- Diferencia = physical_stock - current_stock (positiva = entrada, negativa = salida).
--
-- Depende de: migration 004 (inventory), migration 012 (inventory_entries)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- INVENTORY_ADJUSTMENTS — cabecera del ajuste
-- -----------------------------------------------------------------------------
CREATE TABLE public.inventory_adjustments (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  reference    text        NOT NULL,
  reason       text        NOT NULL,
  status       text        NOT NULL DEFAULT 'draft',
  notes        text,
  confirmed_by uuid,
  confirmed_at timestamptz,
  cancelled_by uuid,
  cancelled_at timestamptz,
  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inventory_adjustments_pkey          PRIMARY KEY (id),
  CONSTRAINT inventory_adjustments_status_check  CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  CONSTRAINT inventory_adjustments_created_by_fk   FOREIGN KEY (created_by)   REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT inventory_adjustments_confirmed_by_fk FOREIGN KEY (confirmed_by) REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT inventory_adjustments_cancelled_by_fk FOREIGN KEY (cancelled_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TRIGGER inventory_adjustments_updated_at
  BEFORE UPDATE ON public.inventory_adjustments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_inventory_adjustments_status     ON public.inventory_adjustments(status);
CREATE INDEX idx_inventory_adjustments_created_by ON public.inventory_adjustments(created_by);
CREATE INDEX idx_inventory_adjustments_created_at ON public.inventory_adjustments(created_at DESC);

COMMENT ON TABLE  public.inventory_adjustments        IS 'Ajustes de inventario por conteo físico. Inmutables una vez confirmados.';
COMMENT ON COLUMN public.inventory_adjustments.status IS 'draft | confirmed | cancelled.';

-- -----------------------------------------------------------------------------
-- INVENTORY_ADJUSTMENT_ITEMS — líneas de producto con conteo físico
--
-- current_stock: snapshot del on_hand en el momento de agregar el ítem.
-- physical_stock: lo que se contó físicamente.
-- difference: physical_stock - current_stock (puede ser positivo, negativo o cero).
-- -----------------------------------------------------------------------------
CREATE TABLE public.inventory_adjustment_items (
  id                      uuid    NOT NULL DEFAULT gen_random_uuid(),
  inventory_adjustment_id uuid    NOT NULL,
  product_id              uuid    NOT NULL,
  current_stock           integer NOT NULL DEFAULT 0,
  physical_stock          integer NOT NULL,
  difference              integer NOT NULL,  -- physical_stock - current_stock
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inventory_adjustment_items_pkey        PRIMARY KEY (id),
  CONSTRAINT inventory_adjustment_items_adj_fk      FOREIGN KEY (inventory_adjustment_id)
    REFERENCES public.inventory_adjustments(id)     ON DELETE CASCADE,
  CONSTRAINT inventory_adjustment_items_product_fk  FOREIGN KEY (product_id)
    REFERENCES public.products(id)                  ON DELETE RESTRICT,
  CONSTRAINT inventory_adjustment_items_stock_check CHECK (current_stock >= 0),
  CONSTRAINT inventory_adjustment_items_phys_check  CHECK (physical_stock >= 0)
);

CREATE INDEX idx_adj_items_adjustment_id ON public.inventory_adjustment_items(inventory_adjustment_id);
CREATE INDEX idx_adj_items_product_id    ON public.inventory_adjustment_items(product_id);

COMMENT ON TABLE  public.inventory_adjustment_items               IS 'Líneas de ajuste: stock en sistema vs. conteo físico.';
COMMENT ON COLUMN public.inventory_adjustment_items.current_stock IS 'Snapshot de on_hand al momento de agregar el ítem.';
COMMENT ON COLUMN public.inventory_adjustment_items.difference    IS 'physical_stock - current_stock. + = entrada, - = salida.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.inventory_adjustments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "adjustments_select" ON public.inventory_adjustments
  FOR SELECT TO authenticated
  USING (has_permission('inventory.adjustments.read'));

CREATE POLICY "adjustments_insert" ON public.inventory_adjustments
  FOR INSERT TO authenticated
  WITH CHECK (has_permission('inventory.adjustments.create'));

CREATE POLICY "adjustments_update" ON public.inventory_adjustments
  FOR UPDATE TO authenticated
  USING (
    has_permission('inventory.adjustments.create')  OR
    has_permission('inventory.adjustments.confirm') OR
    has_permission('inventory.adjustments.cancel')
  );

CREATE POLICY "adj_items_select" ON public.inventory_adjustment_items
  FOR SELECT TO authenticated
  USING (has_permission('inventory.adjustments.read'));

CREATE POLICY "adj_items_insert" ON public.inventory_adjustment_items
  FOR INSERT TO authenticated
  WITH CHECK (has_permission('inventory.adjustments.create'));

CREATE POLICY "adj_items_delete" ON public.inventory_adjustment_items
  FOR DELETE TO authenticated
  USING (has_permission('inventory.adjustments.create'));

-- -----------------------------------------------------------------------------
-- Permisos
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('inventory.adjustments.read',    'Ver ajustes de inventario'),
  ('inventory.adjustments.create',  'Crear ajustes en borrador y agregar productos'),
  ('inventory.adjustments.confirm', 'Confirmar ajustes — genera movimientos de inventario'),
  ('inventory.adjustments.cancel',  'Cancelar ajustes en borrador')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name LIKE 'inventory.adjustments.%'
WHERE r.name = 'administrator'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Función: confirm_inventory_adjustment()
--
-- Confirma un ajuste de forma atómica:
--   1. Valida estado draft
--   2. Valida que haya al menos un ítem con diferencia ≠ 0
--   3. Genera record_inventory_movement() por cada ítem con diferencia ≠ 0
--   4. Actualiza el estado del ajuste
-- =============================================================================
CREATE OR REPLACE FUNCTION public.confirm_inventory_adjustment(
  p_adjustment_id uuid,
  p_confirmed_by  uuid DEFAULT NULL
)
RETURNS public.inventory_adjustments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_adj         public.inventory_adjustments;
  v_item        public.inventory_adjustment_items;
  v_location_id uuid;
  v_has_change  boolean := false;
BEGIN
  -- Verificar permiso
  IF auth.uid() IS NOT NULL THEN
    IF NOT has_permission('inventory.adjustments.confirm') THEN
      RAISE EXCEPTION 'Permiso denegado: inventory.adjustments.confirm';
    END IF;
  END IF;

  -- Bloquear y leer el ajuste
  SELECT * INTO v_adj
  FROM public.inventory_adjustments
  WHERE id = p_adjustment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ajuste no encontrado: %', p_adjustment_id;
  END IF;

  IF v_adj.status != 'draft' THEN
    RAISE EXCEPTION 'Solo se pueden confirmar ajustes en borrador. Estado actual: %', v_adj.status;
  END IF;

  -- Verificar que tiene ítems con diferencia ≠ 0
  SELECT EXISTS (
    SELECT 1 FROM public.inventory_adjustment_items
    WHERE inventory_adjustment_id = p_adjustment_id
      AND difference != 0
  ) INTO v_has_change;

  IF NOT v_has_change THEN
    RAISE EXCEPTION 'El ajuste no tiene diferencias que corregir. Verifica los conteos físicos.';
  END IF;

  -- Obtener ubicación por defecto
  SELECT id INTO v_location_id
  FROM public.inventory_locations
  WHERE is_active = true
  ORDER BY code
  LIMIT 1;

  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'No hay ubicaciones de inventario activas configuradas.';
  END IF;

  -- Generar movimiento por cada ítem con diferencia ≠ 0
  FOR v_item IN
    SELECT * FROM public.inventory_adjustment_items
    WHERE inventory_adjustment_id = p_adjustment_id
      AND difference != 0
    ORDER BY created_at
  LOOP
    PERFORM public.record_inventory_movement(
      p_product_id     := v_item.product_id,
      p_location_id    := v_location_id,
      p_movement_type  := CASE WHEN v_item.difference > 0 THEN 'adjustment_in' ELSE 'adjustment_out' END,
      p_quantity       := v_item.difference,  -- positivo o negativo
      p_reason         := 'Ajuste confirmado: ' || v_adj.reference,
      p_reference_type := 'inventory_adjustment',
      p_reference_id   := p_adjustment_id,
      p_notes          := v_item.notes,
      p_created_by     := COALESCE(p_confirmed_by, auth.uid())
    );
  END LOOP;

  -- Marcar como confirmado
  UPDATE public.inventory_adjustments
  SET
    status       = 'confirmed',
    confirmed_by = COALESCE(p_confirmed_by, auth.uid()),
    confirmed_at = now(),
    updated_at   = now()
  WHERE id = p_adjustment_id
  RETURNING * INTO v_adj;

  RETURN v_adj;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_inventory_adjustment FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.confirm_inventory_adjustment TO authenticated;
GRANT  EXECUTE ON FUNCTION public.confirm_inventory_adjustment TO service_role;

COMMENT ON FUNCTION public.confirm_inventory_adjustment IS
  'Confirma un ajuste de inventario de forma atómica. '
  'Genera adjustment_in/adjustment_out según la diferencia de cada ítem. '
  'Ignora ítems con diferencia = 0.';

-- =============================================================================
-- Función: cancel_inventory_adjustment()
-- =============================================================================
CREATE OR REPLACE FUNCTION public.cancel_inventory_adjustment(
  p_adjustment_id uuid,
  p_cancelled_by  uuid DEFAULT NULL
)
RETURNS public.inventory_adjustments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_adj public.inventory_adjustments;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NOT has_permission('inventory.adjustments.cancel') THEN
      RAISE EXCEPTION 'Permiso denegado: inventory.adjustments.cancel';
    END IF;
  END IF;

  SELECT * INTO v_adj
  FROM public.inventory_adjustments
  WHERE id = p_adjustment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ajuste no encontrado: %', p_adjustment_id;
  END IF;

  IF v_adj.status != 'draft' THEN
    RAISE EXCEPTION 'Solo se pueden cancelar ajustes en borrador. Estado actual: %', v_adj.status;
  END IF;

  UPDATE public.inventory_adjustments
  SET
    status       = 'cancelled',
    cancelled_by = COALESCE(p_cancelled_by, auth.uid()),
    cancelled_at = now(),
    updated_at   = now()
  WHERE id = p_adjustment_id
  RETURNING * INTO v_adj;

  RETURN v_adj;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_inventory_adjustment FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cancel_inventory_adjustment TO authenticated;
GRANT  EXECUTE ON FUNCTION public.cancel_inventory_adjustment TO service_role;

COMMENT ON FUNCTION public.cancel_inventory_adjustment IS
  'Cancela un ajuste en borrador. No genera movimientos de inventario.';
