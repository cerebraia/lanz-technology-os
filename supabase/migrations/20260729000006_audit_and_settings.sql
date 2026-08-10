-- =============================================================================
-- Migration 006: Audit logs and business settings
-- audit_logs, business_settings, log_audit_event()
-- Depende de: migration 001, 002
-- =============================================================================

-- -----------------------------------------------------------------------------
-- AUDIT_LOGS
-- Trazabilidad de operaciones sensibles. Append-only, inmutable.
--
-- NO se auditan automáticamente todas las lecturas ni todas las operaciones.
-- Se auditan: cambios de permisos, movimientos de inventario, cancelaciones,
--   modificaciones financieras, cambios de configuración, cambios de usuarios.
--
-- NO almacenar contraseñas, tokens ni datos sensibles completos en previous_data/new_data.
-- Los datos en previous_data/new_data deben omitir campos como reference_cost, unit_cost.
-- -----------------------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  actor_id      uuid,
  action        text        NOT NULL,
  entity_type   text        NOT NULL,
  entity_id     uuid,
  previous_data jsonb,
  new_data      jsonb,
  metadata      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT audit_logs_pkey     PRIMARY KEY (id),
  CONSTRAINT audit_logs_actor_fk FOREIGN KEY (actor_id)
    REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_entity   ON public.audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor    ON public.audit_logs(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_audit_logs_created  ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action   ON public.audit_logs(action);

COMMENT ON TABLE  public.audit_logs              IS 'Log inmutable de operaciones sensibles. Solo lectura para administradores.';
COMMENT ON COLUMN public.audit_logs.actor_id     IS 'Usuario que ejecutó la acción. NULL si fue el sistema.';
COMMENT ON COLUMN public.audit_logs.entity_type  IS 'Tipo de entidad afectada (product, order, inventory_movement, etc.).';
COMMENT ON COLUMN public.audit_logs.previous_data IS 'Estado anterior de la entidad (sin campos de costo ni secretos).';

-- -----------------------------------------------------------------------------
-- BUSINESS_SETTINGS
-- Parámetros de configuración del negocio en formato clave-valor.
-- Solo administradores pueden leer y modificar.
-- -----------------------------------------------------------------------------
CREATE TABLE public.business_settings (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  key         text        NOT NULL,
  value       text        NOT NULL,
  description text,
  updated_by  uuid,
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_settings_pkey       PRIMARY KEY (id),
  CONSTRAINT business_settings_key_unique UNIQUE (key),
  CONSTRAINT business_settings_user_fk    FOREIGN KEY (updated_by)
    REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.business_settings IS 'Configuración global del negocio. Acceso restringido a administradores.';

-- =============================================================================
-- Función: log_audit_event()
-- Registra un evento de auditoría de forma segura.
--
-- SECURITY DEFINER: permite escribir en audit_logs aunque RLS no tenga
--   política INSERT para el usuario llamante.
-- Los Server Actions llaman esta función para registrar operaciones sensibles.
-- La función asocia automáticamente auth.uid() como actor.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action      text,
  p_entity_type text,
  p_entity_id   uuid  DEFAULT NULL,
  p_previous    jsonb DEFAULT NULL,
  p_new         jsonb DEFAULT NULL,
  p_metadata    jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    actor_id,   action,       entity_type,
    entity_id,  previous_data, new_data, metadata
  ) VALUES (
    auth.uid(), p_action, p_entity_type,
    p_entity_id, p_previous, p_new, p_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_audit_event FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.log_audit_event TO authenticated;
GRANT  EXECUTE ON FUNCTION public.log_audit_event TO service_role;

COMMENT ON FUNCTION public.log_audit_event IS
  'Registra un evento de auditoría con el actor actual (auth.uid()). '
  'Llamar desde Server Actions para operaciones sensibles.';
