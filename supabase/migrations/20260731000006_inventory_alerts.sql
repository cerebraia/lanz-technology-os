-- =============================================================================
-- Migration 015: Inventory alerts — reorder_point, reorder_quantity y permiso
--
-- Agrega dos columnas al catálogo de productos para soportar el módulo de
-- alertas de reposición. No modifica lógica de inventario existente.
-- Depende de: migration 008 (roles y permisos)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PRODUCTOS — campos de punto de reposición
--
-- reorder_point:    stock disponible en el que se recomienda iniciar la compra
-- reorder_quantity: cantidad sugerida para la orden de reposición
-- -----------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS reorder_point    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reorder_quantity integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.products.reorder_point    IS 'Stock disponible a partir del cual se recomienda reponer. Debe ser >= min_stock.';
COMMENT ON COLUMN public.products.reorder_quantity IS 'Cantidad sugerida para una orden de reposición estándar.';

-- -----------------------------------------------------------------------------
-- PERMISOS — inventory.alerts.read
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('inventory.alerts.read', 'Ver alertas de reposición de inventario')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles       r
JOIN public.permissions p ON p.name = 'inventory.alerts.read'
WHERE r.name = 'administrator'
ON CONFLICT DO NOTHING;
