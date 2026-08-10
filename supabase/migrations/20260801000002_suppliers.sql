-- =============================================================================
-- Migration 017: Suppliers — proveedores centralizados
--
-- Agrega la tabla de proveedores y vincula purchase_orders mediante
-- una FK nullable (supplier_id) para no romper órdenes existentes sin proveedor.
--
-- Depende de: migration 001 (set_updated_at), 008 (roles/permisos),
--             016 (purchase_orders)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SUPPLIERS
-- -----------------------------------------------------------------------------
CREATE TABLE public.suppliers (
  id       uuid        NOT NULL DEFAULT gen_random_uuid(),
  name     text        NOT NULL,
  company  text,
  email    text,
  phone    text,
  country  text        NOT NULL,
  city     text,
  address  text,
  website  text,
  tax_id   text,
  notes    text,
  is_active boolean    NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT suppliers_pkey        PRIMARY KEY (id),
  CONSTRAINT suppliers_name_unique UNIQUE (name),
  CONSTRAINT suppliers_email_check CHECK (email IS NULL OR email ~* '^[^@]+@[^@]+\.[^@]+$')
);

CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_suppliers_name      ON public.suppliers(name);
CREATE INDEX idx_suppliers_country   ON public.suppliers(country);
CREATE INDEX idx_suppliers_is_active ON public.suppliers(is_active);

COMMENT ON TABLE  public.suppliers            IS 'Proveedores de mercancía. Vinculados a purchase_orders.';
COMMENT ON COLUMN public.suppliers.name       IS 'Nombre único del proveedor (persona o empresa).';
COMMENT ON COLUMN public.suppliers.is_active  IS 'Proveedor activo. Desactivar en lugar de eliminar.';

-- -----------------------------------------------------------------------------
-- PURCHASE_ORDERS — agregar supplier_id FK nullable
-- Permite vincular órdenes existentes sin proveedor (supplier_name se conserva)
-- -----------------------------------------------------------------------------
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS supplier_id uuid
    REFERENCES public.suppliers(id) ON DELETE SET NULL;

CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id) WHERE supplier_id IS NOT NULL;

COMMENT ON COLUMN public.purchase_orders.supplier_id IS 'Proveedor vinculado. NULL = proveedor sin registro (usa supplier_name como fallback).';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY suppliers_select ON public.suppliers FOR SELECT USING (public.has_permission('suppliers.read'));
CREATE POLICY suppliers_insert ON public.suppliers FOR INSERT WITH CHECK (public.has_permission('suppliers.create'));
CREATE POLICY suppliers_update ON public.suppliers FOR UPDATE USING (public.has_permission('suppliers.update'));

-- -----------------------------------------------------------------------------
-- PERMISOS
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('suppliers.read',    'Ver proveedores'),
  ('suppliers.create',  'Crear proveedores'),
  ('suppliers.update',  'Editar proveedores'),
  ('suppliers.disable', 'Activar y desactivar proveedores')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles       r
JOIN public.permissions p ON p.name LIKE 'suppliers.%'
WHERE r.name = 'administrator'
ON CONFLICT DO NOTHING;
