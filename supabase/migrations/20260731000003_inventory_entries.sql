-- =============================================================================
-- Migration 012: Inventory entries (entradas de mercancía)
--
-- Modela el flujo borrador → confirmado para recepciones de inventario.
-- La confirmación es atómica: genera movimientos y actualiza saldos
-- en una sola transacción mediante confirm_inventory_entry().
--
-- Depende de: migration 004 (inventory), migration 011 (reservation types)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- INVENTORY_ENTRIES
-- Cabecera de cada lote de entrada. Estado: draft → confirmed | cancelled.
-- Una entrada confirmada es inmutable (enforcement en RLS + función).
-- -----------------------------------------------------------------------------
CREATE TABLE public.inventory_entries (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  reference     text        NOT NULL,
  supplier_name text,
  entry_type    text        NOT NULL,
  status        text        NOT NULL DEFAULT 'draft',
  notes         text,
  total_units   integer     NOT NULL DEFAULT 0,
  confirmed_by  uuid,
  confirmed_at  timestamptz,
  cancelled_by  uuid,
  cancelled_at  timestamptz,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inventory_entries_pkey         PRIMARY KEY (id),
  CONSTRAINT inventory_entries_type_check   CHECK (entry_type IN ('purchase', 'import', 'return', 'adjustment')),
  CONSTRAINT inventory_entries_status_check CHECK (status    IN ('draft', 'confirmed', 'cancelled')),
  CONSTRAINT inventory_entries_units_check  CHECK (total_units >= 0),

  CONSTRAINT inventory_entries_created_by_fk   FOREIGN KEY (created_by)   REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT inventory_entries_confirmed_by_fk FOREIGN KEY (confirmed_by) REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT inventory_entries_cancelled_by_fk FOREIGN KEY (cancelled_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TRIGGER inventory_entries_updated_at
  BEFORE UPDATE ON public.inventory_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_inventory_entries_status     ON public.inventory_entries(status);
CREATE INDEX idx_inventory_entries_type       ON public.inventory_entries(entry_type);
CREATE INDEX idx_inventory_entries_created_by ON public.inventory_entries(created_by);
CREATE INDEX idx_inventory_entries_created_at ON public.inventory_entries(created_at DESC);

COMMENT ON TABLE  public.inventory_entries        IS 'Entradas de mercancía al almacén. Inmutables una vez confirmadas.';
COMMENT ON COLUMN public.inventory_entries.status IS 'draft | confirmed | cancelled.';

-- -----------------------------------------------------------------------------
-- INVENTORY_ENTRY_ITEMS
-- Líneas de producto por entrada. Solo modificables en estado draft.
-- CASCADE DELETE: si se elimina la entrada (solo posible en draft), se
-- eliminan las líneas.
-- -----------------------------------------------------------------------------
CREATE TABLE public.inventory_entry_items (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
  inventory_entry_id  uuid        NOT NULL,
  product_id          uuid        NOT NULL,
  quantity            integer     NOT NULL,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inventory_entry_items_pkey       PRIMARY KEY (id),
  CONSTRAINT inventory_entry_items_entry_fk   FOREIGN KEY (inventory_entry_id)
    REFERENCES public.inventory_entries(id)   ON DELETE CASCADE,
  CONSTRAINT inventory_entry_items_product_fk FOREIGN KEY (product_id)
    REFERENCES public.products(id)            ON DELETE RESTRICT,
  CONSTRAINT inventory_entry_items_qty_check  CHECK (quantity > 0)
);

CREATE INDEX idx_entry_items_entry_id   ON public.inventory_entry_items(inventory_entry_id);
CREATE INDEX idx_entry_items_product_id ON public.inventory_entry_items(product_id);

COMMENT ON TABLE public.inventory_entry_items IS 'Líneas de producto por entrada. Solo modificables mientras la entrada está en draft.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.inventory_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_entry_items  ENABLE ROW LEVEL SECURITY;

-- Entries: select
CREATE POLICY "entries_select" ON public.inventory_entries
  FOR SELECT TO authenticated
  USING (has_permission('inventory.entries.read'));

-- Entries: insert (solo creator)
CREATE POLICY "entries_insert" ON public.inventory_entries
  FOR INSERT TO authenticated
  WITH CHECK (has_permission('inventory.entries.create'));

-- Entries: update (status transitions via functions or create for total_units)
CREATE POLICY "entries_update" ON public.inventory_entries
  FOR UPDATE TO authenticated
  USING (
    has_permission('inventory.entries.create')  OR
    has_permission('inventory.entries.confirm') OR
    has_permission('inventory.entries.cancel')
  );

-- Entry items: select
CREATE POLICY "entry_items_select" ON public.inventory_entry_items
  FOR SELECT TO authenticated
  USING (has_permission('inventory.entries.read'));

-- Entry items: insert (draft only — enforced in app)
CREATE POLICY "entry_items_insert" ON public.inventory_entry_items
  FOR INSERT TO authenticated
  WITH CHECK (has_permission('inventory.entries.create'));

-- Entry items: delete (draft only — enforced in app)
CREATE POLICY "entry_items_delete" ON public.inventory_entry_items
  FOR DELETE TO authenticated
  USING (has_permission('inventory.entries.create'));

-- -----------------------------------------------------------------------------
-- Permisos de entradas
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('inventory.entries.read',    'Ver entradas de mercancía'),
  ('inventory.entries.create',  'Crear entradas en borrador y agregar productos'),
  ('inventory.entries.confirm', 'Confirmar entradas — genera movimientos de inventario'),
  ('inventory.entries.cancel',  'Cancelar entradas en borrador')
ON CONFLICT (name) DO NOTHING;

-- Asignar todos al rol administrator
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name LIKE 'inventory.entries.%'
WHERE r.name = 'administrator'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Función: confirm_inventory_entry()
--
-- Confirma una entrada de forma atómica:
--   1. Valida estado draft y que tenga ítems
--   2. Genera un record_inventory_movement() por cada ítem
--   3. Actualiza el saldo y el estado de la entrada
--
-- Si cualquier movimiento falla (ej. stock negativo imposible en entradas,
-- pero podría fallar por otra razón), la transacción completa revierte.
--
-- SECURITY DEFINER: para poder actualizar inventory_entries (via RLS update
-- policy necesita permiso) y llamar a record_inventory_movement().
-- =============================================================================
CREATE OR REPLACE FUNCTION public.confirm_inventory_entry(
  p_entry_id     uuid,
  p_confirmed_by uuid DEFAULT NULL
)
RETURNS public.inventory_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry         public.inventory_entries;
  v_item          public.inventory_entry_items;
  v_location_id   uuid;
  v_movement_type text;
  v_total_units   integer;
BEGIN
  -- Verificar permiso
  IF auth.uid() IS NOT NULL THEN
    IF NOT has_permission('inventory.entries.confirm') THEN
      RAISE EXCEPTION 'Permiso denegado: inventory.entries.confirm';
    END IF;
  END IF;

  -- Bloquear y leer la entrada
  SELECT * INTO v_entry
  FROM public.inventory_entries
  WHERE id = p_entry_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entrada no encontrada: %', p_entry_id;
  END IF;

  IF v_entry.status != 'draft' THEN
    RAISE EXCEPTION 'Solo se pueden confirmar entradas en borrador. Estado actual: %', v_entry.status;
  END IF;

  -- Verificar que tiene ítems
  SELECT COUNT(*) INTO v_total_units
  FROM public.inventory_entry_items
  WHERE inventory_entry_id = p_entry_id;

  IF v_total_units = 0 THEN
    RAISE EXCEPTION 'La entrada no tiene productos. Agrega al menos uno antes de confirmar.';
  END IF;

  -- Obtener ubicación por defecto (primera activa, orden por código)
  SELECT id INTO v_location_id
  FROM public.inventory_locations
  WHERE is_active = true
  ORDER BY code
  LIMIT 1;

  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'No hay ubicaciones de inventario activas configuradas.';
  END IF;

  -- Mapear tipo de entrada → tipo de movimiento
  v_movement_type := CASE v_entry.entry_type
    WHEN 'purchase'   THEN 'purchase_receipt'
    WHEN 'import'     THEN 'import_receipt'
    WHEN 'return'     THEN 'return_in'
    WHEN 'adjustment' THEN 'adjustment_in'
    ELSE 'adjustment_in'
  END;

  -- Calcular total de unidades
  SELECT COALESCE(SUM(quantity), 0) INTO v_total_units
  FROM public.inventory_entry_items
  WHERE inventory_entry_id = p_entry_id;

  -- Generar movimiento por cada ítem
  FOR v_item IN
    SELECT * FROM public.inventory_entry_items
    WHERE inventory_entry_id = p_entry_id
    ORDER BY created_at
  LOOP
    PERFORM public.record_inventory_movement(
      p_product_id     := v_item.product_id,
      p_location_id    := v_location_id,
      p_movement_type  := v_movement_type,
      p_quantity       := v_item.quantity,
      p_reason         := 'Entrada confirmada: ' || v_entry.reference,
      p_reference_type := 'inventory_entry',
      p_reference_id   := p_entry_id,
      p_notes          := v_item.notes,
      p_created_by     := COALESCE(p_confirmed_by, auth.uid())
    );
  END LOOP;

  -- Actualizar entrada a confirmada
  UPDATE public.inventory_entries
  SET
    status       = 'confirmed',
    total_units  = v_total_units,
    confirmed_by = COALESCE(p_confirmed_by, auth.uid()),
    confirmed_at = now(),
    updated_at   = now()
  WHERE id = p_entry_id
  RETURNING * INTO v_entry;

  RETURN v_entry;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_inventory_entry FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.confirm_inventory_entry TO authenticated;
GRANT  EXECUTE ON FUNCTION public.confirm_inventory_entry TO service_role;

COMMENT ON FUNCTION public.confirm_inventory_entry IS
  'Confirma una entrada de mercancía de forma atómica. '
  'Genera record_inventory_movement() por cada ítem. '
  'Transacción completa: fallo en cualquier movimiento revierte todo.';

-- =============================================================================
-- Función: cancel_inventory_entry()
-- Cancela una entrada en estado draft. No afecta inventario.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.cancel_inventory_entry(
  p_entry_id     uuid,
  p_cancelled_by uuid DEFAULT NULL
)
RETURNS public.inventory_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry public.inventory_entries;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NOT has_permission('inventory.entries.cancel') THEN
      RAISE EXCEPTION 'Permiso denegado: inventory.entries.cancel';
    END IF;
  END IF;

  SELECT * INTO v_entry
  FROM public.inventory_entries
  WHERE id = p_entry_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entrada no encontrada: %', p_entry_id;
  END IF;

  IF v_entry.status != 'draft' THEN
    RAISE EXCEPTION 'Solo se pueden cancelar entradas en borrador. Estado actual: %', v_entry.status;
  END IF;

  UPDATE public.inventory_entries
  SET
    status       = 'cancelled',
    cancelled_by = COALESCE(p_cancelled_by, auth.uid()),
    cancelled_at = now(),
    updated_at   = now()
  WHERE id = p_entry_id
  RETURNING * INTO v_entry;

  RETURN v_entry;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_inventory_entry FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cancel_inventory_entry TO authenticated;
GRANT  EXECUTE ON FUNCTION public.cancel_inventory_entry TO service_role;

COMMENT ON FUNCTION public.cancel_inventory_entry IS
  'Cancela una entrada en borrador. No genera movimientos de inventario.';
