-- =============================================================================
-- Migration: Rol Operador y gestión de usuarios
--
-- 1. Actualiza el constraint de roles para permitir 'operator'.
-- 2. Crea el rol 'operator' con permisos de inventario, compras e importaciones.
-- 3. Amplía permisos del salesperson: CRM, reportes de ventas básicos.
-- 4. Agrega permiso 'users.invite' para invitar nuevos usuarios.
-- =============================================================================

-- ─── 1. Actualizar constraint de nombres de roles ─────────────────────────────

ALTER TABLE public.roles
  DROP CONSTRAINT IF EXISTS roles_name_check;

ALTER TABLE public.roles
  ADD CONSTRAINT roles_name_check
    CHECK (name IN ('administrator', 'salesperson', 'operator'));

-- ─── 2. Insertar rol operador ─────────────────────────────────────────────────

INSERT INTO public.roles (name, description) VALUES
  ('operator', 'Acceso operativo a inventario, compras, importaciones y proveedores')
ON CONFLICT (name) DO NOTHING;

-- ─── 3. Permisos del operador ────────────────────────────────────────────────

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name IN (
  -- Catálogo (solo lectura)
  'products.read',
  'catalog.products.read',
  'catalog.categories.read',
  -- Inventario completo
  'inventory.read',
  'inventory.receive',
  'inventory.adjust',
  'inventory.reserve',
  'inventory.entries.read',
  'inventory.entries.create',
  'inventory.entries.confirm',
  'inventory.entries.cancel',
  'inventory.adjustments.read',
  'inventory.adjustments.create',
  'inventory.adjustments.confirm',
  'inventory.alerts.read',
  'inventory.reservations.read',
  -- Compras
  'purchases.read',
  'purchases.create',
  'purchases.update',
  'purchases.send',
  'purchases.cancel',
  -- Importaciones
  'imports.read',
  'imports.create',
  'imports.update',
  'imports.receive',
  'imports.receipts.read',
  'imports.receipts.create',
  'imports.receipts.confirm',
  'imports.receipts.cancel',
  'imports.receipts.update',
  'imports.costs.read',
  'imports.costs.allocate',
  -- Proveedores
  'suppliers.read',
  'suppliers.create',
  'suppliers.update',
  -- Clientes (mínimo para referencias en compras)
  'customers.read',
  -- Configuración (solo lectura)
  'settings.read'
)
WHERE r.name = 'operator'
ON CONFLICT DO NOTHING;

-- ─── 4. Ampliar permisos del salesperson ─────────────────────────────────────
-- CRM (cotizaciones y etiquetas) + reportes de ventas básicos

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name IN (
  'crm.read',
  'crm.create',
  'crm.update',
  'crm.quotes.create',
  'crm.quotes.update',
  'catalog.products.read',
  'catalog.categories.read',
  'reports.read',
  'reports.sales.read',
  'settings.read',
  'payments.manage',
  'orders.cancel',
  'orders.ship'
)
WHERE r.name = 'salesperson'
ON CONFLICT DO NOTHING;

-- ─── 5. Permiso users.invite ─────────────────────────────────────────────────

INSERT INTO public.permissions (name, description) VALUES
  ('users.invite', 'Invitar nuevos usuarios al sistema')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name = 'users.invite'
WHERE r.name = 'administrator'
ON CONFLICT DO NOTHING;
