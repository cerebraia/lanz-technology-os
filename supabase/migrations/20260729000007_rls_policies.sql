-- =============================================================================
-- Migration 007: Row Level Security — políticas de acceso
-- Depende de: migrations 001-006 (todas las tablas deben existir)
-- =============================================================================
-- Principios aplicados:
--   1. RLS activo en TODAS las tablas de public
--   2. Acceso denegado por defecto — solo policies explícitas conceden acceso
--   3. Tablas de solo lectura por la app usan has_permission()
--   4. Tablas de solo escritura via función usan SECURITY DEFINER en la función
--   5. Costos restringidos: no hay policy que exponga reference_cost ni unit_cost
--      a usuarios sin finance.read_costs — la protección es a nivel de aplicación
--      (no hay column-level RLS en PostgreSQL estándar)
-- =============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_locations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_balances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings      ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES
-- =============================================================================
-- Cada usuario puede leer y actualizar solo su propio perfil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admins pueden leer todos los perfiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_permission('users.read'));

-- Cada usuario actualiza solo su propio perfil (sin cambiar id ni status)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins pueden gestionar perfiles
CREATE POLICY "profiles_manage_admin" ON public.profiles
  FOR ALL TO authenticated
  USING  (has_permission('users.manage'))
  WITH CHECK (has_permission('users.manage'));

-- =============================================================================
-- ROLES — lectura para todos los autenticados
-- =============================================================================
CREATE POLICY "roles_select" ON public.roles
  FOR SELECT TO authenticated
  USING (true);

-- =============================================================================
-- PERMISSIONS — lectura para todos los autenticados
-- =============================================================================
CREATE POLICY "permissions_select" ON public.permissions
  FOR SELECT TO authenticated
  USING (true);

-- =============================================================================
-- USER_ROLES
-- =============================================================================
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (has_permission('users.read'));

CREATE POLICY "user_roles_manage_admin" ON public.user_roles
  FOR ALL TO authenticated
  USING  (has_permission('roles.assign'))
  WITH CHECK (has_permission('roles.assign'));

-- =============================================================================
-- ROLE_PERMISSIONS — lectura para autenticados, escritura solo admin
-- =============================================================================
CREATE POLICY "role_permissions_select" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "role_permissions_manage_admin" ON public.role_permissions
  FOR ALL TO authenticated
  USING  (has_permission('users.manage'))
  WITH CHECK (has_permission('users.manage'));

-- =============================================================================
-- CATEGORIES
-- =============================================================================
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (has_permission('products.create'));

CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE TO authenticated
  USING  (has_permission('products.update'))
  WITH CHECK (has_permission('products.update'));

-- Sin DELETE — desactivar via is_active = false

-- =============================================================================
-- PRODUCTS
-- =============================================================================
CREATE POLICY "products_select" ON public.products
  FOR SELECT TO authenticated
  USING (has_permission('products.read'));

CREATE POLICY "products_insert" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (has_permission('products.create'));

CREATE POLICY "products_update" ON public.products
  FOR UPDATE TO authenticated
  USING  (has_permission('products.update'))
  WITH CHECK (has_permission('products.update'));

-- Sin DELETE — archivar via archived_at

-- =============================================================================
-- PRODUCT_IMAGES
-- =============================================================================
CREATE POLICY "product_images_select" ON public.product_images
  FOR SELECT TO authenticated
  USING (has_permission('products.read'));

CREATE POLICY "product_images_insert" ON public.product_images
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission('products.create') OR has_permission('products.update')
  );

CREATE POLICY "product_images_update" ON public.product_images
  FOR UPDATE TO authenticated
  USING  (has_permission('products.update'))
  WITH CHECK (has_permission('products.update'));

CREATE POLICY "product_images_delete" ON public.product_images
  FOR DELETE TO authenticated
  USING (has_permission('products.update'));

-- =============================================================================
-- INVENTORY_LOCATIONS — lectura autenticada; escritura via service_role
-- =============================================================================
CREATE POLICY "inventory_locations_select" ON public.inventory_locations
  FOR SELECT TO authenticated
  USING (has_permission('inventory.read'));

-- Sin policies de escritura — administrada via migrations / service_role

-- =============================================================================
-- INVENTORY_BALANCES — SOLO LECTURA para la app
-- Las escrituras ocurren únicamente dentro de record_inventory_movement()
-- (SECURITY DEFINER) que bypasea RLS sin exponer writes directos.
-- =============================================================================
CREATE POLICY "inventory_balances_select" ON public.inventory_balances
  FOR SELECT TO authenticated
  USING (has_permission('inventory.read'));

-- Sin INSERT/UPDATE/DELETE policies

-- =============================================================================
-- INVENTORY_MOVEMENTS — APPEND-ONLY via función
-- =============================================================================
CREATE POLICY "inventory_movements_select" ON public.inventory_movements
  FOR SELECT TO authenticated
  USING (has_permission('inventory.read'));

-- Sin INSERT/UPDATE/DELETE policies directas

-- =============================================================================
-- INVENTORY_RESERVATIONS — gestionadas via Server Actions
-- =============================================================================
CREATE POLICY "inventory_reservations_select" ON public.inventory_reservations
  FOR SELECT TO authenticated
  USING (has_permission('inventory.read'));

-- Sin INSERT/UPDATE/DELETE policies directas

-- =============================================================================
-- CUSTOMERS
-- =============================================================================
CREATE POLICY "customers_select" ON public.customers
  FOR SELECT TO authenticated
  USING (has_permission('customers.read'));

CREATE POLICY "customers_insert" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (has_permission('customers.create'));

CREATE POLICY "customers_update" ON public.customers
  FOR UPDATE TO authenticated
  USING  (has_permission('customers.update'))
  WITH CHECK (has_permission('customers.update'));

-- Sin DELETE — archivar via archived_at

-- =============================================================================
-- ORDERS
-- =============================================================================
CREATE POLICY "orders_select" ON public.orders
  FOR SELECT TO authenticated
  USING (has_permission('orders.read'));

CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (has_permission('orders.create'));

CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE TO authenticated
  USING  (has_permission('orders.update'))
  WITH CHECK (has_permission('orders.update'));

-- Sin DELETE — los pedidos son registros históricos permanentes

-- =============================================================================
-- ORDER_ITEMS — INSERT al crear; sin UPDATE/DELETE (snapshots inmutables)
-- =============================================================================
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT TO authenticated
  USING (has_permission('orders.read'));

CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (has_permission('orders.create'));

-- Sin UPDATE/DELETE — los snapshots son inmutables

-- =============================================================================
-- ORDER_STATUS_HISTORY — APPEND-ONLY, sin UPDATE/DELETE
-- =============================================================================
CREATE POLICY "order_status_history_select" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (has_permission('orders.read'));

CREATE POLICY "order_status_history_insert" ON public.order_status_history
  FOR INSERT TO authenticated
  WITH CHECK (has_permission('orders.update') OR has_permission('orders.cancel'));

-- Sin UPDATE/DELETE — el historial es inmutable

-- =============================================================================
-- AUDIT_LOGS — solo lectura para administradores; sin escritura directa
-- Las escrituras ocurren únicamente via log_audit_event() (SECURITY DEFINER)
-- =============================================================================
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (has_permission('audit.read'));

-- Sin INSERT/UPDATE/DELETE policies directas

-- =============================================================================
-- BUSINESS_SETTINGS — solo administradores
-- =============================================================================
CREATE POLICY "business_settings_select" ON public.business_settings
  FOR SELECT TO authenticated
  USING (has_permission('settings.read'));

CREATE POLICY "business_settings_manage" ON public.business_settings
  FOR ALL TO authenticated
  USING  (has_permission('settings.manage'))
  WITH CHECK (has_permission('settings.manage'));
