-- =============================================================================
-- Migration: Corregir llamada a reserve_inventory_movement en create_storefront_order
--
-- Bug identificado: la llamada pasaba v_order_id::text para el parámetro
-- p_reference_id (uuid), lo que impedía que PostgreSQL resolviera la firma
-- correcta de la función bajo named parameters, fallando con error 42883:
--   "function does not exist ... p_reference_id => text"
--
-- Fix: eliminar el cast ::text y pasar v_order_id directamente como uuid.
--
-- NO editar la migración original (010) ya que pudo haber sido aplicada.
-- Esta migración recrea la función completa con CREATE OR REPLACE.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_storefront_order(
  p_idempotency_key  uuid,
  p_first_name       text,
  p_last_name        text,
  p_phone            text,
  p_whatsapp         text,
  p_email            text,
  p_city             text,
  p_address          text,
  p_id_number        text,
  p_delivery_method  text,
  p_notes            text,
  p_items            jsonb,   -- [{product_id: uuid, quantity: integer}]
  p_currency         text DEFAULT 'USD'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id        uuid;
  v_order_id           uuid;
  v_order_number       text;
  v_confirm_token      uuid;
  v_subtotal           numeric(12,2) := 0;
  v_location_id        uuid;
  v_phone_norm         text;
  v_existing_order_id  uuid;
  v_existing_number    text;
  v_existing_token     uuid;
  v_item_json          jsonb;
  v_product_id         uuid;
  v_quantity           integer;
  v_prod_name          text;
  v_prod_sku           text;
  v_is_published       boolean;
  v_status             text;
  v_archived_at        timestamptz;
  v_sale_price         numeric(12,2);
  v_promo_price        numeric(12,2);
  v_reference_cost     numeric(12,2);
  v_track_inventory    boolean;
  v_currency_code      text;
  v_unit_price         numeric(12,2);
  v_line_total         numeric(12,2);
  v_available          integer;
  v_validated_items    jsonb := '[]'::jsonb;
BEGIN
  -- ── Normalización básica ──────────────────────────────────────────────────
  p_first_name      := trim(coalesce(p_first_name, ''));
  p_phone           := trim(coalesce(p_phone, ''));
  p_city            := trim(coalesce(p_city, ''));
  p_delivery_method := lower(trim(coalesce(p_delivery_method, '')));

  -- ── Validación de inputs ──────────────────────────────────────────────────
  IF p_first_name = ''                              THEN RAISE EXCEPTION 'first_name_required';     END IF;
  IF p_phone = ''                                   THEN RAISE EXCEPTION 'phone_required';          END IF;
  IF p_city = ''                                    THEN RAISE EXCEPTION 'city_required';            END IF;
  IF p_delivery_method NOT IN ('pickup','local','national')
    THEN RAISE EXCEPTION 'invalid_delivery_method'; END IF;
  IF p_delivery_method IN ('local','national')
    AND (p_address IS NULL OR trim(p_address) = '')
    THEN RAISE EXCEPTION 'address_required_for_delivery';                                           END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0
    THEN RAISE EXCEPTION 'empty_cart';              END IF;
  IF jsonb_array_length(p_items) > 20
    THEN RAISE EXCEPTION 'too_many_items';          END IF;

  -- ── Idempotencia ─────────────────────────────────────────────────────────
  SELECT id, order_number, confirmation_token
  INTO   v_existing_order_id, v_existing_number, v_existing_token
  FROM   orders
  WHERE  idempotency_key = p_idempotency_key;

  IF v_existing_order_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'order_number',       v_existing_number,
      'confirmation_token', v_existing_token,
      'idempotent',         true
    );
  END IF;

  -- ── Ubicación de inventario por defecto ──────────────────────────────────
  SELECT id INTO v_location_id
  FROM   inventory_locations
  WHERE  is_active = true
  ORDER  BY code
  LIMIT  1;

  -- ── Validación de ítems y cálculo de totales ──────────────────────────────
  FOR v_item_json IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item_json->>'product_id')::uuid;
    v_quantity   := (v_item_json->>'quantity')::integer;

    IF v_quantity IS NULL OR v_quantity <= 0 OR v_quantity > 100 THEN
      RAISE EXCEPTION 'invalid_quantity:%', v_product_id::text;
    END IF;

    SELECT
      name, sku, is_published, status, archived_at,
      sale_price, promotional_price, reference_cost,
      track_inventory, currency_code
    INTO
      v_prod_name, v_prod_sku, v_is_published, v_status, v_archived_at,
      v_sale_price, v_promo_price, v_reference_cost,
      v_track_inventory, v_currency_code
    FROM products
    WHERE id = v_product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_not_found:%', v_product_id::text;
    END IF;

    IF NOT v_is_published OR v_status != 'active' OR v_archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'product_unavailable:%:%', v_product_id::text, v_prod_name;
    END IF;

    -- Precio efectivo — solo del servidor, nunca del cliente
    v_unit_price := CASE
      WHEN v_promo_price IS NOT NULL AND v_promo_price < v_sale_price
      THEN v_promo_price
      ELSE v_sale_price
    END;

    v_line_total := round(v_unit_price * v_quantity, 2);

    -- Verificar disponibilidad si el producto rastrea inventario
    IF coalesce(v_track_inventory, false) AND v_location_id IS NOT NULL THEN
      SELECT coalesce(on_hand, 0) - coalesce(reserved, 0)
      INTO   v_available
      FROM   inventory_balances
      WHERE  product_id = v_product_id AND location_id = v_location_id;

      IF coalesce(v_available, 0) < v_quantity THEN
        RAISE EXCEPTION 'insufficient_stock:%:%', v_product_id::text, v_prod_name;
      END IF;
    END IF;

    v_subtotal        := v_subtotal + v_line_total;
    v_validated_items := v_validated_items || jsonb_build_object(
      'product_id',      v_product_id,
      'name',            v_prod_name,
      'sku',             v_prod_sku,
      'quantity',        v_quantity,
      'unit_price',      v_unit_price,
      'unit_cost',       v_reference_cost,
      'line_total',      v_line_total,
      'currency',        coalesce(v_currency_code, p_currency),
      'track_inventory', coalesce(v_track_inventory, false)
    );
  END LOOP;

  -- ── Identificar o crear cliente ───────────────────────────────────────────
  v_phone_norm := regexp_replace(p_phone, '[^0-9+]', '', 'g');

  SELECT id INTO v_customer_id
  FROM   customers
  WHERE  regexp_replace(coalesce(phone, ''), '[^0-9+]', '', 'g') = v_phone_norm
    AND  archived_at IS NULL
  ORDER  BY created_at DESC
  LIMIT  1;

  IF v_customer_id IS NULL AND p_email IS NOT NULL AND trim(p_email) != '' THEN
    SELECT id INTO v_customer_id
    FROM   customers
    WHERE  lower(trim(coalesce(email,''))) = lower(trim(p_email))
      AND  archived_at IS NULL
    ORDER  BY created_at DESC
    LIMIT  1;
  END IF;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (
      first_name, last_name, phone, whatsapp, email,
      city, address, id_number, source
    ) VALUES (
      p_first_name,
      NULLIF(trim(coalesce(p_last_name,'')), ''),
      p_phone,
      NULLIF(trim(coalesce(p_whatsapp,'')), ''),
      NULLIF(lower(trim(coalesce(p_email,''))), ''),
      NULLIF(trim(coalesce(p_city,'')), ''),
      NULLIF(trim(coalesce(p_address,'')), ''),
      NULLIF(trim(coalesce(p_id_number,'')), ''),
      'storefront'
    )
    RETURNING id INTO v_customer_id;
  ELSE
    -- Completar campos vacíos conservadoramente
    UPDATE customers SET
      first_name = CASE WHEN coalesce(first_name,'') = '' THEN p_first_name ELSE first_name END,
      city       = CASE WHEN coalesce(city,'')       = '' THEN NULLIF(trim(coalesce(p_city,'')), '') ELSE city END,
      whatsapp   = CASE WHEN coalesce(whatsapp,'')   = '' THEN NULLIF(trim(coalesce(p_whatsapp,'')), '') ELSE whatsapp END,
      updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  -- ── Generar número comercial del pedido (atómico via secuencia) ──────────
  v_order_number  := 'LT-' || to_char(now(), 'YYYY') || '-' ||
                     lpad(nextval('order_number_seq')::text, 6, '0');
  v_confirm_token := gen_random_uuid();

  -- ── Crear pedido ──────────────────────────────────────────────────────────
  INSERT INTO orders (
    order_number, customer_id, sale_channel, status, payment_status,
    currency_code, subtotal, discount_amount, shipping, taxes, total_amount,
    notes, delivery_method, confirmation_token, idempotency_key, created_by
  ) VALUES (
    v_order_number,
    v_customer_id,
    'storefront',
    'pending_confirmation',
    'pending',
    p_currency,
    v_subtotal,
    0,
    0,
    0,
    v_subtotal,
    NULLIF(trim(coalesce(p_notes,'')), ''),
    p_delivery_method,
    v_confirm_token,
    p_idempotency_key,
    NULL
  )
  RETURNING id INTO v_order_id;

  -- ── Crear líneas y reservar inventario ────────────────────────────────────
  FOR v_item_json IN SELECT * FROM jsonb_array_elements(v_validated_items) LOOP
    v_product_id      := (v_item_json->>'product_id')::uuid;
    v_quantity        := (v_item_json->>'quantity')::integer;
    v_unit_price      := (v_item_json->>'unit_price')::numeric;
    v_reference_cost  := (v_item_json->>'unit_cost')::numeric;
    v_line_total      := (v_item_json->>'line_total')::numeric;
    v_currency_code   := v_item_json->>'currency';
    v_track_inventory := (v_item_json->>'track_inventory')::boolean;

    INSERT INTO order_items (
      order_id, product_id, product_sku, product_name,
      unit_price, unit_cost, currency_code,
      quantity, discount_amount, line_total
    ) VALUES (
      v_order_id,
      v_product_id,
      v_item_json->>'sku',
      v_item_json->>'name',
      v_unit_price,
      v_reference_cost,
      coalesce(v_currency_code, p_currency),
      v_quantity,
      0,
      v_line_total
    );

    -- FIX: pasar v_order_id (uuid) directamente — NO ::text
    -- Bug original en migration 010: v_order_id::text causaba error 42883
    -- (function does not exist para p_reference_id => text)
    IF v_track_inventory AND v_location_id IS NOT NULL THEN
      PERFORM public.reserve_inventory_movement(
        p_product_id     => v_product_id,
        p_location_id    => v_location_id,
        p_movement_type  => 'reservation',
        p_quantity       => v_quantity,
        p_reason         => format('Storefront %s', v_order_number),
        p_notes          => NULL,
        p_reference_type => 'order',
        p_reference_id   => v_order_id,
        p_created_by     => NULL
      );
    END IF;
  END LOOP;

  -- ── Historial de estado ───────────────────────────────────────────────────
  INSERT INTO order_status_history (order_id, previous_status, new_status, notes, created_by)
  VALUES (v_order_id, NULL, 'pending_confirmation', 'Pedido creado desde tienda online', NULL);

  RETURN jsonb_build_object(
    'order_number',       v_order_number,
    'confirmation_token', v_confirm_token,
    'subtotal',           v_subtotal,
    'total',              v_subtotal,
    'currency',           p_currency,
    'idempotent',         false
  );

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- Permisos — idénticos a migration 010
REVOKE EXECUTE ON FUNCTION public.create_storefront_order FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_storefront_order TO anon;
GRANT  EXECUTE ON FUNCTION public.create_storefront_order TO authenticated;
GRANT  EXECUTE ON FUNCTION public.create_storefront_order TO service_role;

COMMENT ON FUNCTION public.create_storefront_order IS
  'Crea un pedido público de forma atómica. SECURITY DEFINER. Accesible para anon. '
  'Nunca acepta precios del cliente — lee precios actuales de la BD. '
  'Reserva inventario si track_inventory=true. Idempotente via idempotency_key. '
  'Fix (migration 011): p_reference_id pasado como uuid, no como text.';
