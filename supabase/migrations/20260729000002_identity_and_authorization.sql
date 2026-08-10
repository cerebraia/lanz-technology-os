-- =============================================================================
-- Migration 002: Identity and authorization
-- profiles, roles, permissions, user_roles, role_permissions
-- Depende de: migration 001 (set_updated_at)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES
-- Datos públicos del usuario vinculados a auth.users.
-- NO almacena contraseñas, tokens ni credenciales.
-- El id es el mismo UUID de auth.users — relación 1:1.
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id         uuid        NOT NULL,
  full_name  text        NOT NULL,
  phone      text,
  status     text        NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profiles_pkey         PRIMARY KEY (id),
  CONSTRAINT profiles_auth_fk      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT profiles_status_check CHECK (status IN ('active', 'inactive'))
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE  public.profiles            IS 'Perfil de usuario interno vinculado a auth.users.';
COMMENT ON COLUMN public.profiles.id         IS 'UUID idéntico al de auth.users.';
COMMENT ON COLUMN public.profiles.full_name  IS 'Nombre completo del usuario.';
COMMENT ON COLUMN public.profiles.status     IS 'active | inactive — controla acceso operativo.';

-- -----------------------------------------------------------------------------
-- ROLES
-- Agrupaciones nombradas de permisos.
-- No ampliar el CHECK sin actualizar la documentación y el seed.
-- -----------------------------------------------------------------------------
CREATE TABLE public.roles (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT roles_pkey        PRIMARY KEY (id),
  CONSTRAINT roles_name_unique UNIQUE (name),
  CONSTRAINT roles_name_check  CHECK (name IN ('administrator', 'salesperson'))
);

COMMENT ON TABLE public.roles IS 'Roles del sistema. Los roles son agrupaciones de permisos.';

-- -----------------------------------------------------------------------------
-- PERMISSIONS
-- Identificadores de acciones concretas. Formato: dominio.accion
-- -----------------------------------------------------------------------------
CREATE TABLE public.permissions (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT permissions_pkey        PRIMARY KEY (id),
  CONSTRAINT permissions_name_unique UNIQUE (name)
);

COMMENT ON TABLE public.permissions IS 'Permisos granulares por acción. Formato: dominio.accion.';

-- -----------------------------------------------------------------------------
-- USER_ROLES
-- Asignación de roles a usuarios. Un usuario puede tener múltiples roles.
-- ON DELETE RESTRICT en role_id evita eliminar roles asignados.
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_roles (
  user_id     uuid        NOT NULL,
  role_id     uuid        NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid,

  CONSTRAINT user_roles_pkey         PRIMARY KEY (user_id, role_id),
  CONSTRAINT user_roles_user_fk      FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)   ON DELETE CASCADE,
  CONSTRAINT user_roles_role_fk      FOREIGN KEY (role_id)
    REFERENCES public.roles(id)      ON DELETE RESTRICT,
  CONSTRAINT user_roles_assigned_fk  FOREIGN KEY (assigned_by)
    REFERENCES public.profiles(id)   ON DELETE SET NULL
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);

COMMENT ON TABLE public.user_roles IS 'Asignación de roles a perfiles. Relación N:N.';

-- -----------------------------------------------------------------------------
-- ROLE_PERMISSIONS
-- Asignación de permisos a roles.
-- -----------------------------------------------------------------------------
CREATE TABLE public.role_permissions (
  role_id       uuid NOT NULL,
  permission_id uuid NOT NULL,

  CONSTRAINT role_permissions_pkey           PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_role_fk        FOREIGN KEY (role_id)
    REFERENCES public.roles(id)              ON DELETE CASCADE,
  CONSTRAINT role_permissions_permission_fk  FOREIGN KEY (permission_id)
    REFERENCES public.permissions(id)        ON DELETE CASCADE
);

CREATE INDEX idx_role_permissions_role_id       ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);

COMMENT ON TABLE public.role_permissions IS 'Permisos asignados a cada rol.';

-- =============================================================================
-- Función: has_permission(p_permission text) → boolean
--
-- Verifica si el usuario autenticado actual posee el permiso indicado.
-- Se usa en políticas RLS para evitar recursión.
--
-- SECURITY DEFINER: corre con privilegios del owner (postgres) para poder
--   leer user_roles/role_permissions aunque tengan RLS activo.
-- SET search_path = public: protege contra ataques de search_path injection.
-- STABLE: el resultado es constante dentro de la misma transacción.
--
-- Revocado de PUBLIC, accesible solo a authenticated y service_role.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.has_permission(p_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles      ur
    JOIN public.role_permissions rp ON rp.role_id      = ur.role_id
    JOIN public.permissions       p  ON p.id            = rp.permission_id
    WHERE ur.user_id = auth.uid()
      AND p.name     = p_permission
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_permission(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.has_permission(text) TO  authenticated;
GRANT  EXECUTE ON FUNCTION public.has_permission(text) TO  service_role;

COMMENT ON FUNCTION public.has_permission(text) IS
  'Verifica si auth.uid() posee el permiso indicado. Segura para uso en RLS.';
