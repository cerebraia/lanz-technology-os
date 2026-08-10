-- =============================================================================
-- Migration 026: Permisos para el módulo de reportes ejecutivos
--
-- Los reportes son de solo lectura. El acceso a datos sigue siendo
-- controlado por las RLS existentes en cada tabla. Los permisos de
-- reportes sirven como gate a nivel de página.
-- =============================================================================

INSERT INTO public.permissions (name, description) VALUES
  ('reports.read',           'Acceder al centro de reportes ejecutivos'),
  ('reports.export',         'Exportar datos de reportes a CSV'),
  ('reports.finance.read',   'Ver reportes financieros (restringido)'),
  ('reports.inventory.read', 'Ver reportes de inventario'),
  ('reports.sales.read',     'Ver reportes de ventas')
ON CONFLICT (name) DO NOTHING;

-- Administrador: acceso completo a todos los reportes
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   public.roles       r
JOIN   public.permissions p ON p.name LIKE 'reports.%'
WHERE  r.name = 'administrator'
ON CONFLICT DO NOTHING;

-- Vendedor: puede ver reportes de ventas pero no los financieros
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   public.roles       r
JOIN   public.permissions p ON p.name IN ('reports.read', 'reports.sales.read', 'reports.export')
WHERE  r.name = 'salesperson'
ON CONFLICT DO NOTHING;
