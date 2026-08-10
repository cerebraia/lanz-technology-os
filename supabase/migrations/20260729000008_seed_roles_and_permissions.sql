-- =============================================================================
-- Migration 008: Seed — roles, permissions, initial location, basic settings
-- Depende de: migrations 001-007
--
-- Datos incluidos:
--   - Roles del sistema (administrator, salesperson)
--   - Permisos iniciales
--   - Asignación de permisos a roles
--   - Ubicación de inventario inicial
--   - Configuración mínima del negocio
--
-- NO incluye:
--   - Usuarios (el primer administrador se asigna post-deploy — ver docs)
--   - Productos, clientes, pedidos ni movimientos de inventario
--
-- Uso de ON CONFLICT DO NOTHING: la migración es idempotente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ROLES
-- -----------------------------------------------------------------------------
INSERT INTO public.roles (name, description) VALUES
  ('administrator', 'Acceso completo al sistema operativo'),
  ('salesperson',   'Acceso operativo a ventas, clientes e inventario básico')
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- PERMISSIONS
-- Convención de nombres: dominio.accion en snake_case
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  -- Catálogo
  ('products.read',              'Ver productos y catálogo completo'),
  ('products.create',            'Crear productos y categorías'),
  ('products.update',            'Editar productos y categorías'),
  ('products.publish',           'Publicar y despublicar productos en la tienda'),
  -- Inventario
  ('inventory.read',             'Ver inventario, saldos y movimientos'),
  ('inventory.receive',          'Registrar entradas de inventario (compras, importaciones)'),
  ('inventory.reserve',          'Crear y liberar reservas de inventario'),
  ('inventory.adjust',           'Crear ajustes de inventario con aprobación'),
  -- Pedidos
  ('orders.read',                'Ver pedidos y su historial'),
  ('orders.create',              'Crear nuevos pedidos'),
  ('orders.update',              'Actualizar pedidos en estados permitidos'),
  ('orders.cancel',              'Cancelar pedidos'),
  ('orders.view_cost',           'Ver costos unitarios en líneas de pedido (restringido)'),
  -- Clientes
  ('customers.read',             'Ver clientes y contactos'),
  ('customers.create',           'Crear nuevos clientes'),
  ('customers.update',           'Editar datos de clientes'),
  -- Finanzas (acceso restringido)
  ('finance.read_costs',         'Ver costos de referencia de productos (restringido)'),
  ('finance.read_profitability', 'Ver márgenes y rentabilidad (restringido)'),
  -- Usuarios y roles
  ('users.read',                 'Ver usuarios del sistema'),
  ('users.manage',               'Crear, editar y desactivar usuarios'),
  ('roles.assign',               'Asignar y revocar roles a usuarios'),
  -- Configuración y auditoría
  ('settings.read',              'Ver configuración del negocio'),
  ('settings.manage',            'Modificar configuración del negocio'),
  ('audit.read',                 'Consultar el log de auditoría')
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- ROLE PERMISSIONS: administrator — acceso completo
-- -----------------------------------------------------------------------------
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'administrator'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- ROLE PERMISSIONS: salesperson — acceso operativo limitado
-- -----------------------------------------------------------------------------
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name IN (
  'products.read',
  'inventory.read',
  'inventory.reserve',
  'orders.read',
  'orders.create',
  'orders.update',
  'customers.read',
  'customers.create',
  'customers.update'
)
WHERE r.name = 'salesperson'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- INVENTORY LOCATION INICIAL
-- Una sola ubicación para el MVP. Agregar ubicaciones adicionales via migrations.
-- -----------------------------------------------------------------------------
INSERT INTO public.inventory_locations (name, code, description) VALUES
  ('Almacén principal', 'WH-001', 'Ubicación de inventario principal de Lanz Technology')
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- BUSINESS SETTINGS INICIALES
-- Solo datos no privados y no sensibles.
-- Los valores reales se actualizarán via el panel de configuración.
-- -----------------------------------------------------------------------------
INSERT INTO public.business_settings (key, value, description) VALUES
  ('business_name',    'Lanz Technology',
   'Nombre comercial de la empresa'),
  ('default_currency', 'USD',
   'Moneda predeterminada del sistema (USD | VES)'),
  ('order_prefix',     'LT',
   'Prefijo para números de pedido'),
  ('timezone',         'America/Caracas',
   'Zona horaria del negocio')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- NOTA: Primer administrador
-- =============================================================================
-- El primer usuario administrador NO se crea en esta migración.
-- Proceso post-deploy:
--   1. Crear el usuario en el panel de Supabase Auth (Supabase Studio o CLI)
--   2. Supabase creará automáticamente el registro en auth.users
--   3. Crear el perfil en public.profiles con el mismo UUID:
--      INSERT INTO public.profiles (id, full_name) VALUES ('<uuid>', 'Nombre Admin');
--   4. Asignar el rol administrator:
--      INSERT INTO public.user_roles (user_id, role_id)
--      SELECT '<uuid>', id FROM public.roles WHERE name = 'administrator';
-- Ver: docs/architecture/database-operations.md
-- =============================================================================
