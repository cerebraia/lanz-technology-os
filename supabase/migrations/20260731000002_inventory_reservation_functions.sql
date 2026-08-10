-- =============================================================================
-- Migration 011: Inventory — tipos reservation/release + función de reserva
--
-- Extiende el CHECK de movement_type para permitir 'reservation' y 'release',
-- y crea reserve_inventory_movement() que gestiona inventory_balances.reserved
-- de forma atómica (análogo a record_inventory_movement para on_hand).
--
-- Depende de: migration 004 (inventory)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extender el CHECK de tipos de movimiento
-- Se hace DROP/ADD porque ALTER CHECK no existe en PostgreSQL.
-- Los valores existentes no se modifican; solo se amplía la lista.
-- -----------------------------------------------------------------------------
ALTER TABLE public.inventory_movements
  DROP CONSTRAINT IF EXISTS inventory_movements_type_check;

ALTER TABLE public.inventory_movements
  ADD CONSTRAINT inventory_movements_type_check CHECK (
    movement_type IN (
      'opening_balance',
      'purchase_receipt',
      'import_receipt',
      'sale',
      'return_in',
      'return_out',
      'adjustment_in',
      'adjustment_out',
      'transfer_in',
      'transfer_out',
      'damage',
      'loss',
      -- Nuevos tipos para el ciclo de reservas
      'reservation',
      'release'
    )
  );

-- -----------------------------------------------------------------------------
-- Función: reserve_inventory_movement()
--
-- Gestiona de forma atómica el campo `reserved` en inventory_balances.
-- Los movimientos de reserva/liberación no modifican on_hand, solo reserved.
-- Se registran en inventory_movements para trazabilidad completa.
--
-- Garantías:
--   1. No permite reservar más de lo disponible (on_hand - reserved)
--   2. No permite liberar más de lo reservado
--   3. Bloquea la fila de saldo para evitar race conditions (FOR UPDATE)
--   4. Falla completa ante cualquier error (ACID)
--
-- SECURITY DEFINER: corre con privilegios del owner para modificar
--   inventory_balances e inventory_movements con RLS sin INSERT policy.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_inventory_movement(
  p_product_id     uuid,
  p_location_id    uuid,
  p_movement_type  text,     -- 'reservation' | 'release'
  p_quantity       integer,  -- siempre positivo; el signo lo aplica la función
  p_reason         text      DEFAULT NULL,
  p_reference_type text      DEFAULT NULL,
  p_reference_id   uuid      DEFAULT NULL,
  p_notes          text      DEFAULT NULL,
  p_created_by     uuid      DEFAULT NULL
)
RETURNS public.inventory_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance      public.inventory_balances;
  v_delta        integer;
  v_new_reserved integer;
  v_movement     public.inventory_movements;
BEGIN
  -- Verificar permisos
  IF auth.uid() IS NOT NULL THEN
    IF NOT has_permission('inventory.reserve') THEN
      RAISE EXCEPTION 'Permiso denegado: se requiere inventory.reserve';
    END IF;
  END IF;

  -- Validar tipo
  IF p_movement_type NOT IN ('reservation', 'release') THEN
    RAISE EXCEPTION 'Tipo inválido para reserve_inventory_movement: %', p_movement_type;
  END IF;

  -- Validar cantidad
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a cero: %', p_quantity;
  END IF;

  -- reservation → sube reserved (+p_quantity)
  -- release     → baja reserved (-p_quantity)
  v_delta := CASE WHEN p_movement_type = 'reservation' THEN p_quantity ELSE -p_quantity END;

  -- Crear fila de saldo si no existe
  INSERT INTO public.inventory_balances (product_id, location_id, on_hand, reserved)
  VALUES (p_product_id, p_location_id, 0, 0)
  ON CONFLICT (product_id, location_id) DO NOTHING;

  -- Bloquear la fila
  SELECT * INTO v_balance
  FROM public.inventory_balances
  WHERE product_id  = p_product_id
    AND location_id = p_location_id
  FOR UPDATE;

  v_new_reserved := v_balance.reserved + v_delta;

  -- Invariante: reserved >= 0
  IF v_new_reserved < 0 THEN
    RAISE EXCEPTION
      'No se puede liberar más de lo reservado: reservado=%, solicitado=%',
      v_balance.reserved, p_quantity;
  END IF;

  -- Invariante: reserved <= on_hand
  IF v_new_reserved > v_balance.on_hand THEN
    RAISE EXCEPTION
      'La reserva excede el stock físico: on_hand=%, reservado_actual=%, nuevo=%',
      v_balance.on_hand, v_balance.reserved, v_new_reserved;
  END IF;

  -- Registrar movimiento (quantity refleja el delta sobre reserved)
  INSERT INTO public.inventory_movements (
    product_id, location_id, movement_type,
    quantity, quantity_before, quantity_after,
    reason, reference_type, reference_id, notes, created_by
  ) VALUES (
    p_product_id, p_location_id, p_movement_type,
    v_delta, v_balance.reserved, v_new_reserved,
    p_reason, p_reference_type, p_reference_id, p_notes,
    COALESCE(p_created_by, auth.uid())
  )
  RETURNING * INTO v_movement;

  -- Actualizar reserved en el saldo materializado
  UPDATE public.inventory_balances
  SET reserved   = v_new_reserved,
      updated_at = now()
  WHERE product_id  = p_product_id
    AND location_id = p_location_id;

  RETURN v_movement;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_inventory_movement FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.reserve_inventory_movement TO authenticated;
GRANT  EXECUTE ON FUNCTION public.reserve_inventory_movement TO service_role;

COMMENT ON FUNCTION public.reserve_inventory_movement IS
  'Gestiona reservas y liberaciones de inventario de forma atómica. '
  'Modifica inventory_balances.reserved. '
  'Registra en inventory_movements para trazabilidad completa.';
