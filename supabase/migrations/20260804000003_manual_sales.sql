-- =============================================================================
-- Migration: Ventas manuales por canal
--
-- 1. Extiende orders.sale_channel con nuevos valores de canal.
-- 2. Agrega orders.payment_method para el método primario de pago.
-- 3. Extiende payments.method con mobile_payment.
-- 4. Crea create_manual_sale(): función atómica para ventas manuales.
-- 5. Permiso sales.manual asignado a administrator y salesperson.
-- =============================================================================

-- ─── 1. Extender sale_channel ─────────────────────────────────────────────────

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_channel_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_channel_check CHECK (
    sale_channel IN (
      'store', 'storefront', 'whatsapp', 'instagram', 'facebook',
      'phone', 'direct', 'other',
      'online', 'mercadolibre', 'referral', 'physical_store'
    )
  );

-- ─── 2. Agregar orders.payment_method ────────────────────────────────────────

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text
    CHECK (payment_method IN (
      'cash', 'transfer', 'mobile_payment', 'zelle', 'binance', 'other'
    ));

COMMENT ON COLUMN public.orders.payment_method IS
  'Método de pago principal seleccionado al crear una venta manual.';

-- ─── 3. Extender payments.method con mobile_payment ──────────────────────────

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_method_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_method_check CHECK (
    method IN (
      'cash', 'transfer', 'zelle', 'paypal', 'binance',
      'card', 'mobile_payment', 'other'
    )
  );

-- ─── 4. Función create_manual_sale ───────────────────────────────────────────
-- Crea una venta manual de forma completamente atómica.
-- Si falla cualquier paso, toda la transacción hace rollback.
-- Operaciones: validar → cliente → pedido → ítems → inventario → pago → historial.

CREATE OR REPLACE FUNCTION public.create_manual_sale(
  p_first_name         text,
  p_sale_channel       text,
  p_payment_method     text,
  p_items              jsonb,
  p_last_name          text     DEFAULT NULL,
  p_phone              text     DEFAULT NULL,
  p_email              text     DEFAULT NULL,
  p_address            text     DEFAULT NULL,
  p_payment_reference  text     DEFAULT NULL,
  p_discount_amount    numeric  DEFAULT 0,
  p_shipping_amount    numeric  DEFAULT 0,
  p_notes              text     DEFAULT NULL,
  p_currency           text     DEFAULT 'USD',
  p_created_by         uuid     DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id   uuid;
  v_order_id      uuid;
  v_order_number  text;
  v_location_id   uuid;
  v_subtotal      numeric(15,2) := 0;
  v_total_amount  numeric(15,2);
  v_item          jsonb;
  v_product_id    uuid;
  v_quantity      integer;
  v_unit_price    numeric(15,2);
  v_item_discount numeric(15,2);
  v_line_total    numeric(15,2);
  v_prod_name     text;
  v_prod_sku      text;
  v_prod_cost     numeric(15,2);
  v_on_hand       integer;
  v_reserved      integer;
  v_available     integer;
BEGIN
  -- ── Validaciones básicas ──────────────────────────────────────────────────
  p_first_name := trim(coalesce(p_first_name, ''));
  IF p_first_name = '' THEN
    RAISE EXCEPTION 'first_name_required';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'items_required';
  END IF;

  IF p_sale_channel IS NULL OR trim(p_sale_channel) = '' THEN
    RAISE EXCEPTION 'sale_channel_required';
  END IF;

  IF p_payment_method IS NULL OR trim(p_payment_method) = '' THEN
    RAISE EXCEPTION 'payment_method_required';
  END IF;

  -- ── Ubicación de inventario por defecto ───────────────────────────────────
  SELECT id INTO v_location_id
  FROM public.inventory_locations
  WHERE is_active = true
  ORDER BY code
  LIMIT 1;

  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'no_active_inventory_location';
  END IF;

  -- ── Validar productos y stock ─────────────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;

    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'invalid_product_id';
    END IF;
    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'invalid_quantity';
    END IF;
    IF v_unit_price IS NULL OR v_unit_price < 0 THEN
      RAISE EXCEPTION 'invalid_unit_price';
    END IF;

    SELECT name, sku, reference_cost
    INTO v_prod_name, v_prod_sku, v_prod_cost
    FROM public.products
    WHERE id = v_product_id
      AND is_published = true
      AND archived_at IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_not_found:%', v_product_id;
    END IF;

    SELECT on_hand, reserved
    INTO v_on_hand, v_reserved
    FROM public.inventory_balances
    WHERE product_id  = v_product_id
      AND location_id = v_location_id;

    v_available := COALESCE(v_on_hand, 0) - COALESCE(v_reserved, 0);

    IF v_available < v_quantity THEN
      RAISE EXCEPTION 'insufficient_stock:%:%:%',
        v_product_id, v_available, v_quantity;
    END IF;
  END LOOP;

  -- ── Buscar o crear cliente ────────────────────────────────────────────────
  IF p_phone IS NOT NULL AND trim(p_phone) <> '' THEN
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE phone = trim(p_phone)
      AND archived_at IS NULL
    LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (
      first_name, last_name, phone, email, address, created_by
    ) VALUES (
      trim(p_first_name),
      NULLIF(trim(coalesce(p_last_name, '')), ''),
      NULLIF(trim(coalesce(p_phone, '')), ''),
      NULLIF(trim(coalesce(p_email, '')), ''),
      NULLIF(trim(coalesce(p_address, '')), ''),
      COALESCE(p_created_by, auth.uid())
    )
    RETURNING id INTO v_customer_id;
  END IF;

  -- ── Crear el pedido ───────────────────────────────────────────────────────
  INSERT INTO public.orders (
    customer_id, sale_channel, payment_method, currency_code,
    status, payment_status, notes, discount_amount, shipping,
    subtotal, total_amount, created_by
  ) VALUES (
    v_customer_id,
    p_sale_channel,
    p_payment_method,
    p_currency,
    'confirmed',
    'pending',
    NULLIF(trim(coalesce(p_notes, '')), ''),
    COALESCE(p_discount_amount, 0),
    COALESCE(p_shipping_amount, 0),
    0,
    0,
    COALESCE(p_created_by, auth.uid())
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- ── Insertar ítems y calcular subtotal ────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id    := (v_item->>'product_id')::uuid;
    v_quantity      := (v_item->>'quantity')::integer;
    v_unit_price    := (v_item->>'unit_price')::numeric;
    v_item_discount := COALESCE((v_item->>'discount_amount')::numeric, 0);
    v_line_total    := (v_quantity * v_unit_price) - v_item_discount;

    SELECT name, sku, reference_cost
    INTO v_prod_name, v_prod_sku, v_prod_cost
    FROM public.products
    WHERE id = v_product_id;

    INSERT INTO public.order_items (
      order_id, product_id, product_sku, product_name,
      unit_price, unit_cost, quantity, discount_amount,
      line_total, currency_code
    ) VALUES (
      v_order_id, v_product_id, v_prod_sku, v_prod_name,
      v_unit_price, v_prod_cost, v_quantity, v_item_discount,
      v_line_total, p_currency
    );

    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  -- ── Actualizar totales ────────────────────────────────────────────────────
  v_total_amount := v_subtotal
    - COALESCE(p_discount_amount, 0)
    + COALESCE(p_shipping_amount, 0);

  UPDATE public.orders
  SET subtotal     = v_subtotal,
      total_amount = GREATEST(v_total_amount, 0)
  WHERE id = v_order_id;

  -- ── Descontar inventario ──────────────────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::integer;

    PERFORM public.record_inventory_movement(
      p_product_id     := v_product_id,
      p_location_id    := v_location_id,
      p_movement_type  := 'sale',
      p_quantity       := -v_quantity,
      p_reason         := 'Venta manual: ' || v_order_number,
      p_reference_type := 'order',
      p_reference_id   := v_order_id,
      p_created_by     := COALESCE(p_created_by, auth.uid())
    );
  END LOOP;

  -- ── Registrar pago ────────────────────────────────────────────────────────
  INSERT INTO public.payments (
    order_id, amount, currency, method, status, reference, created_by
  ) VALUES (
    v_order_id,
    GREATEST(COALESCE(v_total_amount, 0), 0),
    p_currency,
    p_payment_method,
    'confirmed',
    NULLIF(trim(coalesce(p_payment_reference, '')), ''),
    COALESCE(p_created_by, auth.uid())
  );

  UPDATE public.orders
  SET payment_status = 'paid'
  WHERE id = v_order_id;

  -- ── Historial de estado ───────────────────────────────────────────────────
  INSERT INTO public.order_status_history (
    order_id, previous_status, new_status, notes, created_by
  ) VALUES (
    v_order_id,
    'draft',
    'confirmed',
    'Venta manual — canal: ' || p_sale_channel,
    COALESCE(p_created_by, auth.uid())
  );

  RETURN jsonb_build_object(
    'order_id',     v_order_id,
    'order_number', v_order_number
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_manual_sale FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_manual_sale TO authenticated;
GRANT  EXECUTE ON FUNCTION public.create_manual_sale TO service_role;

COMMENT ON FUNCTION public.create_manual_sale IS
  'Crea una venta manual de forma atómica: cliente, pedido, ítems, inventario, pago, historial.';

-- ─── 5. Permiso sales.manual ──────────────────────────────────────────────────

INSERT INTO public.permissions (name, description) VALUES
  ('sales.manual', 'Registrar ventas manuales por canal desde el panel')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name = 'sales.manual'
WHERE r.name IN ('administrator', 'salesperson')
ON CONFLICT DO NOTHING;
