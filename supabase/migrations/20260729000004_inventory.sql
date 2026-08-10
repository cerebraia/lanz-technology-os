-- =============================================================================
-- Migration 004: Inventory
-- inventory_locations, inventory_balances, inventory_movements
-- record_inventory_movement() — función transaccional principal
-- Depende de: migration 001, 002, 003
-- =============================================================================

-- -----------------------------------------------------------------------------
-- INVENTORY_LOCATIONS
-- Ubicaciones físicas de inventario.
-- Diseñada para soportar múltiples ubicaciones sin complejidad de WMS.
-- Inicialmente una sola ubicación: WH-001 (creada en seed).
-- -----------------------------------------------------------------------------
CREATE TABLE public.inventory_locations (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  code        text        NOT NULL,
  description text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inventory_locations_pkey        PRIMARY KEY (id),
  CONSTRAINT inventory_locations_code_unique UNIQUE (code)
);

CREATE TRIGGER inventory_locations_updated_at
  BEFORE UPDATE ON public.inventory_locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.inventory_locations IS 'Ubicaciones de almacenamiento de inventario.';

-- -----------------------------------------------------------------------------
-- INVENTORY_BALANCES
-- Saldo materializado de inventario por producto y ubicación.
--
-- Decisión de diseño: materializar el saldo (no derivar en cada consulta)
--   - PRO: consultas O(1) de disponibilidad para cualquier escala de movimientos
--   - CONTRAPARTE: el saldo SOLO se modifica via record_inventory_movement()
--
-- Definiciones inequívocas:
--   on_hand    = existencia física en la ubicación
--   reserved   = cantidad comprometida a pedidos activos
--   available  = on_hand - reserved  (DERIVADO, no almacenado)
--
-- RLS impide escritura directa; SECURITY DEFINER en la función lo garantiza.
-- -----------------------------------------------------------------------------
CREATE TABLE public.inventory_balances (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  product_id  uuid        NOT NULL,
  location_id uuid        NOT NULL,
  on_hand     integer     NOT NULL DEFAULT 0,
  reserved    integer     NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inventory_balances_pkey    PRIMARY KEY (id),
  CONSTRAINT inventory_balances_unique  UNIQUE (product_id, location_id),

  CONSTRAINT inventory_balances_product_fk  FOREIGN KEY (product_id)
    REFERENCES public.products(id)          ON DELETE RESTRICT,
  CONSTRAINT inventory_balances_location_fk FOREIGN KEY (location_id)
    REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,

  CONSTRAINT inventory_balances_on_hand_check   CHECK (on_hand >= 0),
  CONSTRAINT inventory_balances_reserved_check  CHECK (reserved >= 0),
  -- available = on_hand - reserved >= 0 en todo momento
  CONSTRAINT inventory_balances_available_check CHECK (on_hand >= reserved)
);

CREATE INDEX idx_inventory_balances_product_id
  ON public.inventory_balances(product_id);
CREATE INDEX idx_inventory_balances_location_id
  ON public.inventory_balances(location_id);

COMMENT ON TABLE  public.inventory_balances           IS 'Saldo materializado de inventario. Solo modificable via record_inventory_movement().';
COMMENT ON COLUMN public.inventory_balances.on_hand   IS 'Existencia física. Nunca negativo.';
COMMENT ON COLUMN public.inventory_balances.reserved  IS 'Cantidad comprometida a pedidos activos.';

-- -----------------------------------------------------------------------------
-- INVENTORY_MOVEMENTS
-- Ledger inmutable de todos los cambios de inventario.
-- APPEND-ONLY: no existen UPDATE ni DELETE sobre esta tabla.
--
-- quantity: positivo = entrada, negativo = salida
-- quantity_before / quantity_after: estado del on_hand antes y después
-- reference_type + reference_id: entidad que origina el movimiento
-- -----------------------------------------------------------------------------
CREATE TABLE public.inventory_movements (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  product_id      uuid        NOT NULL,
  location_id     uuid        NOT NULL,
  movement_type   text        NOT NULL,
  quantity        integer     NOT NULL,
  quantity_before integer     NOT NULL,
  quantity_after  integer     NOT NULL,
  reason          text,
  reference_type  text,
  reference_id    uuid,
  notes           text,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inventory_movements_pkey        PRIMARY KEY (id),

  CONSTRAINT inventory_movements_product_fk  FOREIGN KEY (product_id)
    REFERENCES public.products(id)           ON DELETE RESTRICT,
  CONSTRAINT inventory_movements_location_fk FOREIGN KEY (location_id)
    REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  CONSTRAINT inventory_movements_user_fk     FOREIGN KEY (created_by)
    REFERENCES public.profiles(id)           ON DELETE SET NULL,

  CONSTRAINT inventory_movements_type_check CHECK (
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
      'loss'
    )
  ),
  CONSTRAINT inventory_movements_after_check CHECK (quantity_after >= 0)
);

CREATE INDEX idx_inventory_movements_product_location_date
  ON public.inventory_movements(product_id, location_id, created_at DESC);
CREATE INDEX idx_inventory_movements_reference
  ON public.inventory_movements(reference_type, reference_id)
  WHERE reference_id IS NOT NULL;
CREATE INDEX idx_inventory_movements_created_by
  ON public.inventory_movements(created_by);
CREATE INDEX idx_inventory_movements_type
  ON public.inventory_movements(movement_type);

COMMENT ON TABLE  public.inventory_movements               IS 'Ledger inmutable de movimientos de inventario. Append-only.';
COMMENT ON COLUMN public.inventory_movements.quantity      IS 'Positivo = entrada, negativo = salida.';
COMMENT ON COLUMN public.inventory_movements.quantity_after IS 'Saldo on_hand resultante. Nunca negativo.';

-- =============================================================================
-- Función: record_inventory_movement()
-- Única forma segura de registrar un cambio de inventario.
--
-- Garantías:
--   1. Bloqueo optimista de la fila de saldo (FOR UPDATE)
--   2. Validación: el saldo resultante no puede ser negativo
--   3. Inserción atómica del movimiento + actualización del saldo
--   4. Fallo total ante cualquier error (ACID)
--   5. Verificación de permisos del llamante
--
-- SECURITY DEFINER: corre con privilegios del owner para escribir en
--   inventory_balances e inventory_movements que tienen RLS sin INSERT policy.
-- SET search_path = public: protección contra search_path injection.
--
-- Acceso: authenticated (con permiso apropiado) y service_role.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.record_inventory_movement(
  p_product_id     uuid,
  p_location_id    uuid,
  p_movement_type  text,
  p_quantity       integer,
  p_reason         text    DEFAULT NULL,
  p_reference_type text    DEFAULT NULL,
  p_reference_id   uuid    DEFAULT NULL,
  p_notes          text    DEFAULT NULL,
  p_created_by     uuid    DEFAULT NULL
)
RETURNS public.inventory_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance        public.inventory_balances;
  v_quantity_after integer;
  v_movement       public.inventory_movements;
BEGIN
  -- Verificar permisos del usuario autenticado
  -- service_role (auth.uid() IS NULL) siempre puede ejecutar
  IF auth.uid() IS NOT NULL THEN
    IF NOT (
      has_permission('inventory.receive') OR
      has_permission('inventory.adjust')  OR
      has_permission('inventory.reserve')
    ) THEN
      RAISE EXCEPTION 'Permiso denegado: se requiere permiso de inventario (inventory.receive, inventory.adjust o inventory.reserve)';
    END IF;
  END IF;

  -- Crear fila de saldo si no existe (upsert seguro)
  INSERT INTO public.inventory_balances (product_id, location_id, on_hand, reserved)
  VALUES (p_product_id, p_location_id, 0, 0)
  ON CONFLICT (product_id, location_id) DO NOTHING;

  -- Bloquear la fila de saldo para esta transacción (evita race conditions)
  SELECT * INTO v_balance
  FROM public.inventory_balances
  WHERE product_id  = p_product_id
    AND location_id = p_location_id
  FOR UPDATE;

  v_quantity_after := v_balance.on_hand + p_quantity;

  -- Regla invariante: el stock físico no puede ser negativo
  IF v_quantity_after < 0 THEN
    RAISE EXCEPTION
      'Stock insuficiente: on_hand=%, cambio solicitado=%, resultado sería %',
      v_balance.on_hand, p_quantity, v_quantity_after;
  END IF;

  -- Registrar el movimiento (inmutable, append-only)
  INSERT INTO public.inventory_movements (
    product_id, location_id, movement_type,
    quantity, quantity_before, quantity_after,
    reason, reference_type, reference_id, notes, created_by
  ) VALUES (
    p_product_id, p_location_id, p_movement_type,
    p_quantity, v_balance.on_hand, v_quantity_after,
    p_reason, p_reference_type, p_reference_id, p_notes,
    COALESCE(p_created_by, auth.uid())
  )
  RETURNING * INTO v_movement;

  -- Actualizar el saldo materializado
  UPDATE public.inventory_balances
  SET
    on_hand    = v_quantity_after,
    updated_at = now()
  WHERE product_id  = p_product_id
    AND location_id = p_location_id;

  RETURN v_movement;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_inventory_movement FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.record_inventory_movement TO authenticated;
GRANT  EXECUTE ON FUNCTION public.record_inventory_movement TO service_role;

COMMENT ON FUNCTION public.record_inventory_movement IS
  'Registra un movimiento de inventario de forma atómica. '
  'Única vía para modificar inventory_balances. '
  'Falla si el saldo resultante sería negativo.';
