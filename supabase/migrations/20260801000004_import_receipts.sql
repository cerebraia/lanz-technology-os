-- =============================================================================
-- Migration 019: Import receipts — recepción de mercancía importada
--
-- Implementa el flujo controlado para recibir mercancía de importaciones y
-- actualizar el inventario de forma transaccional y auditable.
--
-- Principio: el inventario solo cambia via record_inventory_movement().
-- Una confirmación fallida revierte completamente (sin movimientos parciales).
--
-- Depende de: migration 004 (inventory + record_inventory_movement),
--             018 (imports + import_purchase_orders),
--             016 (purchase_orders + purchase_order_items)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- IMPORTS — agregar 'partially_received' al check de status
-- La importación pasa a partially_received al confirmar la primera recepción
-- si quedan productos pendientes, o a received si todo fue recibido.
-- -----------------------------------------------------------------------------
ALTER TABLE public.imports
  DROP CONSTRAINT imports_status_check,
  ADD CONSTRAINT imports_status_check CHECK (
    status IN (
      'planning','purchased','in_transit','customs',
      'partially_received','received','cancelled'
    )
  );

COMMENT ON COLUMN public.imports.status IS
  'planning|purchased|in_transit|customs|partially_received|received|cancelled';

-- -----------------------------------------------------------------------------
-- IMPORT_RECEIPTS — cabecera de cada acto de recepción
--
-- Una importación puede tener múltiples recepciones (parciales).
-- Una recepción confirmada es inmutable.
-- Una recepción cancelada no genera ni revierte movimientos de inventario.
-- -----------------------------------------------------------------------------
CREATE TABLE public.import_receipts (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  import_id    uuid        NOT NULL,
  reference    text        NOT NULL,
  status       text        NOT NULL DEFAULT 'draft',
  location_id  uuid        NOT NULL,
  notes        text,
  received_at  timestamptz,
  confirmed_by uuid,
  confirmed_at timestamptz,
  cancelled_by uuid,
  cancelled_at timestamptz,
  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT import_receipts_pkey          PRIMARY KEY (id),
  CONSTRAINT import_receipts_ref_unique    UNIQUE (reference),
  CONSTRAINT import_receipts_status_check  CHECK (status IN ('draft','confirmed','cancelled')),
  CONSTRAINT import_receipts_import_fk     FOREIGN KEY (import_id)    REFERENCES public.imports(id)              ON DELETE RESTRICT,
  CONSTRAINT import_receipts_location_fk   FOREIGN KEY (location_id)  REFERENCES public.inventory_locations(id)  ON DELETE RESTRICT,
  CONSTRAINT import_receipts_created_by_fk FOREIGN KEY (created_by)   REFERENCES public.profiles(id)             ON DELETE SET NULL,
  CONSTRAINT import_receipts_confirmed_fk  FOREIGN KEY (confirmed_by) REFERENCES public.profiles(id)             ON DELETE SET NULL,
  CONSTRAINT import_receipts_cancelled_fk  FOREIGN KEY (cancelled_by) REFERENCES public.profiles(id)             ON DELETE SET NULL
);

CREATE TRIGGER import_receipts_updated_at
  BEFORE UPDATE ON public.import_receipts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_import_receipts_import_id  ON public.import_receipts(import_id);
CREATE INDEX idx_import_receipts_status     ON public.import_receipts(status);
CREATE INDEX idx_import_receipts_created_at ON public.import_receipts(created_at DESC);

COMMENT ON TABLE  public.import_receipts        IS 'Recepciones de mercancía por importación. Cada recepción puede ser parcial. Inmutables al confirmar.';
COMMENT ON COLUMN public.import_receipts.status IS 'draft | confirmed | cancelled';

-- -----------------------------------------------------------------------------
-- IMPORT_RECEIPT_ITEMS — líneas de producto por recepción
--
-- expected_quantity y previously_received_quantity se congelan en el momento
-- de crear la recepción para conservar el contexto histórico exacto.
-- received_quantity y damaged_quantity son los únicos campos mutables.
-- accepted_quantity se computa al confirmar (received - damaged).
--
-- Solo los ítems con received_quantity > 0 generan movimientos de inventario.
-- Los ítems dañados NO entran al inventario disponible.
-- -----------------------------------------------------------------------------
CREATE TABLE public.import_receipt_items (
  id                           uuid    NOT NULL DEFAULT gen_random_uuid(),
  receipt_id                   uuid    NOT NULL,
  product_id                   uuid    NOT NULL,
  expected_quantity            integer NOT NULL DEFAULT 0,
  previously_received_quantity integer NOT NULL DEFAULT 0,
  received_quantity            integer NOT NULL DEFAULT 0,
  damaged_quantity             integer NOT NULL DEFAULT 0,
  notes                        text,
  created_at                   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT import_receipt_items_pkey         PRIMARY KEY (id),
  CONSTRAINT import_receipt_items_receipt_fk   FOREIGN KEY (receipt_id)  REFERENCES public.import_receipts(id) ON DELETE CASCADE,
  CONSTRAINT import_receipt_items_product_fk   FOREIGN KEY (product_id)  REFERENCES public.products(id)        ON DELETE RESTRICT,
  CONSTRAINT import_receipt_items_expected_nn  CHECK (expected_quantity            >= 0),
  CONSTRAINT import_receipt_items_prev_nn      CHECK (previously_received_quantity >= 0),
  CONSTRAINT import_receipt_items_received_nn  CHECK (received_quantity            >= 0),
  CONSTRAINT import_receipt_items_damaged_nn   CHECK (damaged_quantity             >= 0),
  CONSTRAINT import_receipt_items_damaged_max  CHECK (damaged_quantity <= received_quantity)
);

CREATE INDEX idx_import_receipt_items_receipt_id  ON public.import_receipt_items(receipt_id);
CREATE INDEX idx_import_receipt_items_product_id  ON public.import_receipt_items(product_id);

COMMENT ON TABLE  public.import_receipt_items                                  IS 'Líneas de producto por recepción de importación.';
COMMENT ON COLUMN public.import_receipt_items.expected_quantity                IS 'Congelado al crear: suma de PO items para este producto en la importación.';
COMMENT ON COLUMN public.import_receipt_items.previously_received_quantity     IS 'Congelado al crear: unidades ya aceptadas en recepciones anteriores confirmadas.';
COMMENT ON COLUMN public.import_receipt_items.received_quantity                IS 'Cantidad física recibida en este acto. Mutable solo en borrador.';
COMMENT ON COLUMN public.import_receipt_items.damaged_quantity                 IS 'De las recibidas, unidades con daño. No entran al inventario disponible.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.import_receipts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY import_receipts_select ON public.import_receipts
  FOR SELECT USING (public.has_permission('imports.receipts.read'));
CREATE POLICY import_receipts_insert ON public.import_receipts
  FOR INSERT WITH CHECK (public.has_permission('imports.receipts.create'));
CREATE POLICY import_receipts_update ON public.import_receipts
  FOR UPDATE USING (public.has_permission('imports.receipts.update'));

CREATE POLICY import_receipt_items_select ON public.import_receipt_items
  FOR SELECT USING (public.has_permission('imports.receipts.read'));
CREATE POLICY import_receipt_items_insert ON public.import_receipt_items
  FOR INSERT WITH CHECK (public.has_permission('imports.receipts.create'));
CREATE POLICY import_receipt_items_update ON public.import_receipt_items
  FOR UPDATE USING (public.has_permission('imports.receipts.update'));

-- -----------------------------------------------------------------------------
-- PERMISOS
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('imports.receipts.read',    'Ver recepciones de importaciones'),
  ('imports.receipts.create',  'Crear recepciones de importaciones en borrador'),
  ('imports.receipts.update',  'Editar recepciones en borrador'),
  ('imports.receipts.confirm', 'Confirmar recepciones — genera movimientos de inventario'),
  ('imports.receipts.cancel',  'Cancelar recepciones en borrador')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles       r
JOIN public.permissions p ON p.name LIKE 'imports.receipts.%'
WHERE r.name = 'administrator'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Función: confirm_import_receipt()
--
-- Confirma una recepción de importación de forma atómica:
--   1. Verifica permiso imports.receipts.confirm
--   2. Valida estado draft y que tenga ítems con received_quantity > 0
--   3. Llama a record_inventory_movement() por cada ítem con accepted_quantity > 0
--   4. Actualiza el estado de la recepción a confirmed
--   5. Recalcula el estado de la importación (partially_received o received)
--
-- Si cualquier operación falla, la transacción completa se revierte.
-- Ningún movimiento de inventario queda incompleto.
--
-- SECURITY DEFINER: para poder actualizar import_receipts e imports directamente
--   y llamar a record_inventory_movement() dentro de la misma transacción.
-- SET search_path = public: protección contra search_path injection.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.confirm_import_receipt(
  p_receipt_id   uuid,
  p_confirmed_by uuid DEFAULT NULL
)
RETURNS public.import_receipts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receipt          public.import_receipts;
  v_item             public.import_receipt_items;
  v_accepted_qty     integer;
  v_total_expected   integer;
  v_total_accepted   integer;
  v_import_status    text;
BEGIN
  -- ── Verificar permiso del usuario autenticado ───────────────────────────────
  IF auth.uid() IS NOT NULL THEN
    IF NOT has_permission('imports.receipts.confirm') THEN
      RAISE EXCEPTION 'Permiso denegado: imports.receipts.confirm';
    END IF;
  END IF;

  -- ── Bloquear y leer la recepción ────────────────────────────────────────────
  SELECT * INTO v_receipt
  FROM public.import_receipts
  WHERE id = p_receipt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recepción no encontrada: %', p_receipt_id;
  END IF;

  IF v_receipt.status != 'draft' THEN
    RAISE EXCEPTION 'Solo se pueden confirmar recepciones en borrador. Estado actual: %', v_receipt.status;
  END IF;

  -- ── Validar que tenga al menos una línea con recepción > 0 ──────────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.import_receipt_items
    WHERE receipt_id = p_receipt_id
      AND received_quantity > 0
  ) THEN
    RAISE EXCEPTION 'La recepción no tiene productos con unidades recibidas. Agrega cantidades antes de confirmar.';
  END IF;

  -- ── Generar movimiento de inventario por cada ítem aceptado ─────────────────
  -- accepted_quantity = received_quantity - damaged_quantity
  -- Solo se mueve al inventario lo aceptado (no lo dañado)
  FOR v_item IN
    SELECT * FROM public.import_receipt_items
    WHERE receipt_id = p_receipt_id
    ORDER BY created_at
  LOOP
    v_accepted_qty := v_item.received_quantity - v_item.damaged_quantity;

    IF v_accepted_qty > 0 THEN
      PERFORM public.record_inventory_movement(
        p_product_id     := v_item.product_id,
        p_location_id    := v_receipt.location_id,
        p_movement_type  := 'import_receipt',
        p_quantity       := v_accepted_qty,
        p_reason         := 'Recepción de importación: ' || v_receipt.reference,
        p_reference_type := 'import_receipt',
        p_reference_id   := p_receipt_id,
        p_notes          := v_item.notes,
        p_created_by     := COALESCE(p_confirmed_by, auth.uid())
      );
    END IF;
  END LOOP;

  -- ── Confirmar la recepción ──────────────────────────────────────────────────
  UPDATE public.import_receipts
  SET
    status       = 'confirmed',
    confirmed_by = COALESCE(p_confirmed_by, auth.uid()),
    confirmed_at = now(),
    received_at  = COALESCE(received_at, now()),
    updated_at   = now()
  WHERE id = p_receipt_id
  RETURNING * INTO v_receipt;

  -- ── Recalcular estado de la importación ─────────────────────────────────────
  -- Esperado total: suma de purchase_order_items de las órdenes vinculadas
  SELECT COALESCE(SUM(poi.quantity), 0) INTO v_total_expected
  FROM public.import_purchase_orders ipo
  JOIN public.purchase_order_items poi ON poi.purchase_order_id = ipo.purchase_order_id
  WHERE ipo.import_id = v_receipt.import_id;

  -- Aceptado total: suma de accepted_quantity en todas las recepciones confirmadas
  SELECT COALESCE(SUM(iri.received_quantity - iri.damaged_quantity), 0) INTO v_total_accepted
  FROM public.import_receipts ir
  JOIN public.import_receipt_items iri ON iri.receipt_id = ir.id
  WHERE ir.import_id = v_receipt.import_id
    AND ir.status    = 'confirmed';

  -- No cerrar automáticamente: solo transicionar a received si todo fue recibido
  IF v_total_expected > 0 AND v_total_accepted >= v_total_expected THEN
    v_import_status := 'received';
  ELSE
    v_import_status := 'partially_received';
  END IF;

  UPDATE public.imports
  SET
    status       = v_import_status,
    actual_arrival = CASE
      WHEN v_import_status = 'received' THEN COALESCE(actual_arrival, CURRENT_DATE)
      ELSE actual_arrival
    END,
    updated_at   = now()
  WHERE id = v_receipt.import_id;

  RETURN v_receipt;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_import_receipt FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.confirm_import_receipt TO authenticated;
GRANT  EXECUTE ON FUNCTION public.confirm_import_receipt TO service_role;

COMMENT ON FUNCTION public.confirm_import_receipt IS
  'Confirma una recepción de importación de forma atómica. '
  'Genera record_inventory_movement() por cada unidad aceptada. '
  'Solo unidades aceptadas (recibidas - dañadas) entran al inventario. '
  'Actualiza el estado de la importación (partially_received o received). '
  'Fallo en cualquier paso revierte la transacción completa.';

-- =============================================================================
-- Función: cancel_import_receipt()
-- Cancela una recepción en borrador. No genera ni revierte movimientos.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.cancel_import_receipt(
  p_receipt_id   uuid,
  p_cancelled_by uuid DEFAULT NULL
)
RETURNS public.import_receipts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receipt public.import_receipts;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NOT has_permission('imports.receipts.cancel') THEN
      RAISE EXCEPTION 'Permiso denegado: imports.receipts.cancel';
    END IF;
  END IF;

  SELECT * INTO v_receipt
  FROM public.import_receipts
  WHERE id = p_receipt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recepción no encontrada: %', p_receipt_id;
  END IF;

  IF v_receipt.status != 'draft' THEN
    RAISE EXCEPTION 'Solo se pueden cancelar recepciones en borrador. Estado actual: %', v_receipt.status;
  END IF;

  UPDATE public.import_receipts
  SET
    status       = 'cancelled',
    cancelled_by = COALESCE(p_cancelled_by, auth.uid()),
    cancelled_at = now(),
    updated_at   = now()
  WHERE id = p_receipt_id
  RETURNING * INTO v_receipt;

  RETURN v_receipt;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_import_receipt FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cancel_import_receipt TO authenticated;
GRANT  EXECUTE ON FUNCTION public.cancel_import_receipt TO service_role;

COMMENT ON FUNCTION public.cancel_import_receipt IS
  'Cancela una recepción en borrador sin afectar el inventario.';
