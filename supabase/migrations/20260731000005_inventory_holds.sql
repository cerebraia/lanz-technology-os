-- =============================================================================
-- Migration 014: Inventory holds — reservas administrativas de stock
--
-- NOTA DE DISEÑO: La tabla inventory_reservations (migration 005) está
-- diseñada para reservas vinculadas a pedidos (order_id obligatorio).
-- Este módulo implementa reservas administrativas independientes
-- (sin pedido asociado), denominadas "holds" internamente para evitar
-- colisión de nombres. Las rutas de UI usan /reservations.
--
-- Las operaciones de reserva/liberación de saldo usan reserve_inventory_movement()
-- (migration 011) que modifica inventory_balances.reserved de forma atómica.
--
-- Depende de: migration 004 (inventory), migration 011 (reserve_inventory_movement)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- INVENTORY_HOLDS — cabecera de la reserva administrativa
-- -----------------------------------------------------------------------------
CREATE TABLE public.inventory_holds (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  reference     text        NOT NULL,
  customer_name text,
  status        text        NOT NULL DEFAULT 'pending',
  notes         text,
  expires_at    timestamptz,            -- NULL = sin vencimiento
  confirmed_by  uuid,
  confirmed_at  timestamptz,
  released_by   uuid,
  released_at   timestamptz,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inventory_holds_pkey          PRIMARY KEY (id),
  CONSTRAINT inventory_holds_status_check  CHECK (status IN ('pending', 'confirmed', 'released', 'expired')),
  CONSTRAINT inventory_holds_created_by_fk   FOREIGN KEY (created_by)   REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT inventory_holds_confirmed_by_fk FOREIGN KEY (confirmed_by) REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT inventory_holds_released_by_fk  FOREIGN KEY (released_by)  REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TRIGGER inventory_holds_updated_at
  BEFORE UPDATE ON public.inventory_holds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_inventory_holds_status     ON public.inventory_holds(status);
CREATE INDEX idx_inventory_holds_expires_at ON public.inventory_holds(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_inventory_holds_created_by ON public.inventory_holds(created_by);
CREATE INDEX idx_inventory_holds_created_at ON public.inventory_holds(created_at DESC);

COMMENT ON TABLE  public.inventory_holds           IS 'Reservas administrativas de stock sin pedido asociado. Ver inventory_reservations para reservas vinculadas a pedidos.';
COMMENT ON COLUMN public.inventory_holds.status    IS 'pending | confirmed | released | expired.';
COMMENT ON COLUMN public.inventory_holds.expires_at IS 'Fecha de vencimiento opcional. La expiración automática se implementará con un cron job en una fase futura.';

-- -----------------------------------------------------------------------------
-- INVENTORY_HOLD_ITEMS — productos incluidos en la reserva
-- -----------------------------------------------------------------------------
CREATE TABLE public.inventory_hold_items (
  id          uuid    NOT NULL DEFAULT gen_random_uuid(),
  hold_id     uuid    NOT NULL,
  product_id  uuid    NOT NULL,
  quantity    integer NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inventory_hold_items_pkey       PRIMARY KEY (id),
  CONSTRAINT inventory_hold_items_hold_fk    FOREIGN KEY (hold_id)
    REFERENCES public.inventory_holds(id)    ON DELETE CASCADE,
  CONSTRAINT inventory_hold_items_product_fk FOREIGN KEY (product_id)
    REFERENCES public.products(id)           ON DELETE RESTRICT,
  CONSTRAINT inventory_hold_items_qty_check  CHECK (quantity > 0)
);

CREATE INDEX idx_hold_items_hold_id    ON public.inventory_hold_items(hold_id);
CREATE INDEX idx_hold_items_product_id ON public.inventory_hold_items(product_id);

COMMENT ON TABLE public.inventory_hold_items IS 'Líneas de producto de una reserva administrativa.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.inventory_holds      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_hold_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "holds_select" ON public.inventory_holds
  FOR SELECT TO authenticated
  USING (has_permission('inventory.reservations.read'));

CREATE POLICY "holds_insert" ON public.inventory_holds
  FOR INSERT TO authenticated
  WITH CHECK (has_permission('inventory.reservations.create'));

CREATE POLICY "holds_update" ON public.inventory_holds
  FOR UPDATE TO authenticated
  USING (
    has_permission('inventory.reservations.create')  OR
    has_permission('inventory.reservations.confirm') OR
    has_permission('inventory.reservations.release')
  );

CREATE POLICY "hold_items_select" ON public.inventory_hold_items
  FOR SELECT TO authenticated
  USING (has_permission('inventory.reservations.read'));

CREATE POLICY "hold_items_insert" ON public.inventory_hold_items
  FOR INSERT TO authenticated
  WITH CHECK (has_permission('inventory.reservations.create'));

CREATE POLICY "hold_items_delete" ON public.inventory_hold_items
  FOR DELETE TO authenticated
  USING (has_permission('inventory.reservations.create'));

-- -----------------------------------------------------------------------------
-- Permisos
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('inventory.reservations.read',    'Ver reservas de inventario'),
  ('inventory.reservations.create',  'Crear reservas en estado pendiente y agregar productos'),
  ('inventory.reservations.confirm', 'Confirmar reservas — mueve stock a reservado'),
  ('inventory.reservations.release', 'Liberar reservas — devuelve stock a disponible')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name LIKE 'inventory.reservations.%'
WHERE r.name = 'administrator'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Función: confirm_inventory_hold()
--
-- Confirma una reserva de forma atómica:
--   1. Valida estado pending y que tenga ítems
--   2. Llama reserve_inventory_movement('reservation', qty) por cada ítem
--      → incrementa inventory_balances.reserved y crea el movimiento
--   3. Actualiza el estado a confirmed
-- =============================================================================
CREATE OR REPLACE FUNCTION public.confirm_inventory_hold(
  p_hold_id      uuid,
  p_confirmed_by uuid DEFAULT NULL
)
RETURNS public.inventory_holds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold        public.inventory_holds;
  v_item        public.inventory_hold_items;
  v_location_id uuid;
  v_item_count  integer;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NOT has_permission('inventory.reservations.confirm') THEN
      RAISE EXCEPTION 'Permiso denegado: inventory.reservations.confirm';
    END IF;
  END IF;

  SELECT * INTO v_hold
  FROM public.inventory_holds
  WHERE id = p_hold_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada: %', p_hold_id;
  END IF;

  IF v_hold.status != 'pending' THEN
    RAISE EXCEPTION 'Solo se pueden confirmar reservas en estado pendiente. Estado actual: %', v_hold.status;
  END IF;

  SELECT COUNT(*) INTO v_item_count
  FROM public.inventory_hold_items
  WHERE hold_id = p_hold_id;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'La reserva no tiene productos. Agrega al menos uno antes de confirmar.';
  END IF;

  -- Verificar expiración
  IF v_hold.expires_at IS NOT NULL AND v_hold.expires_at < now() THEN
    RAISE EXCEPTION 'La reserva está vencida. No se puede confirmar.';
  END IF;

  -- Ubicación activa por defecto
  SELECT id INTO v_location_id
  FROM public.inventory_locations
  WHERE is_active = true
  ORDER BY code
  LIMIT 1;

  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'No hay ubicaciones de inventario activas.';
  END IF;

  -- Reservar stock por cada ítem — reserve_inventory_movement valida disponibilidad
  FOR v_item IN
    SELECT * FROM public.inventory_hold_items
    WHERE hold_id = p_hold_id
    ORDER BY created_at
  LOOP
    PERFORM public.reserve_inventory_movement(
      p_product_id     := v_item.product_id,
      p_location_id    := v_location_id,
      p_movement_type  := 'reservation',
      p_quantity       := v_item.quantity,
      p_reason         := 'Reserva confirmada: ' || v_hold.reference,
      p_reference_type := 'inventory_hold',
      p_reference_id   := p_hold_id,
      p_notes          := NULL,
      p_created_by     := COALESCE(p_confirmed_by, auth.uid())
    );
  END LOOP;

  UPDATE public.inventory_holds
  SET
    status       = 'confirmed',
    confirmed_by = COALESCE(p_confirmed_by, auth.uid()),
    confirmed_at = now(),
    updated_at   = now()
  WHERE id = p_hold_id
  RETURNING * INTO v_hold;

  RETURN v_hold;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_inventory_hold FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.confirm_inventory_hold TO authenticated;
GRANT  EXECUTE ON FUNCTION public.confirm_inventory_hold TO service_role;

COMMENT ON FUNCTION public.confirm_inventory_hold IS
  'Confirma una reserva administrativa. Llama reserve_inventory_movement() '
  'por cada producto. Falla si el stock disponible es insuficiente.';

-- =============================================================================
-- Función: release_inventory_hold()
--
-- Libera una reserva confirmada:
--   1. Valida que esté en confirmed o expired
--   2. Llama reserve_inventory_movement('release', qty) por cada ítem
--   3. Actualiza el estado a released
-- =============================================================================
CREATE OR REPLACE FUNCTION public.release_inventory_hold(
  p_hold_id     uuid,
  p_released_by uuid DEFAULT NULL
)
RETURNS public.inventory_holds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold        public.inventory_holds;
  v_item        public.inventory_hold_items;
  v_location_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NOT has_permission('inventory.reservations.release') THEN
      RAISE EXCEPTION 'Permiso denegado: inventory.reservations.release';
    END IF;
  END IF;

  SELECT * INTO v_hold
  FROM public.inventory_holds
  WHERE id = p_hold_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada: %', p_hold_id;
  END IF;

  IF v_hold.status NOT IN ('confirmed', 'expired') THEN
    RAISE EXCEPTION 'Solo se pueden liberar reservas confirmadas o vencidas. Estado actual: %', v_hold.status;
  END IF;

  SELECT id INTO v_location_id
  FROM public.inventory_locations
  WHERE is_active = true
  ORDER BY code
  LIMIT 1;

  FOR v_item IN
    SELECT * FROM public.inventory_hold_items
    WHERE hold_id = p_hold_id
    ORDER BY created_at
  LOOP
    PERFORM public.reserve_inventory_movement(
      p_product_id     := v_item.product_id,
      p_location_id    := v_location_id,
      p_movement_type  := 'release',
      p_quantity       := v_item.quantity,
      p_reason         := 'Reserva liberada: ' || v_hold.reference,
      p_reference_type := 'inventory_hold',
      p_reference_id   := p_hold_id,
      p_notes          := NULL,
      p_created_by     := COALESCE(p_released_by, auth.uid())
    );
  END LOOP;

  UPDATE public.inventory_holds
  SET
    status      = 'released',
    released_by = COALESCE(p_released_by, auth.uid()),
    released_at = now(),
    updated_at  = now()
  WHERE id = p_hold_id
  RETURNING * INTO v_hold;

  RETURN v_hold;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_inventory_hold FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.release_inventory_hold TO authenticated;
GRANT  EXECUTE ON FUNCTION public.release_inventory_hold TO service_role;

COMMENT ON FUNCTION public.release_inventory_hold IS
  'Libera una reserva administrativa. Devuelve el stock reservado a disponible. '
  'Llama reserve_inventory_movement(release) por cada producto.';
