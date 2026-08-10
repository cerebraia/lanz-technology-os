-- =============================================================================
-- Migration 028: Motor de automatizaciones
--
-- Módulo 1 — Definición de automatizaciones (automations)
-- Módulo 7 — Centro de ejecuciones (automation_runs)
--
-- Las automatizaciones son reglas configurables que asocian un trigger
-- a una acción. La ejecución real ocurre en la capa de servidor (Next.js
-- server actions). No requieren un proceso background externo para el MVP.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- AUTOMATIONS — reglas de automatización configurables
-- trigger_type: stock_low | order_created | order_paid | order_cancelled |
--               import_received | payment_due | customer_created |
--               campaign_finished | manual
-- action_type:  create_purchase_order | send_notification | send_whatsapp |
--               send_email | create_task | generate_report | create_alert |
--               assign_tag
-- config: JSON con parámetros específicos de la automatización
-- -----------------------------------------------------------------------------
CREATE TABLE public.automations (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  description  text,
  trigger_type text        NOT NULL,
  action_type  text        NOT NULL,
  config       jsonb       NOT NULL DEFAULT '{}',
  enabled      boolean     NOT NULL DEFAULT true,
  last_run_at  timestamptz,
  run_count    integer     NOT NULL DEFAULT 0,
  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT automations_pkey        PRIMARY KEY (id),
  CONSTRAINT automations_user_fk     FOREIGN KEY (created_by)
    REFERENCES public.profiles(id)   ON DELETE SET NULL,
  CONSTRAINT automations_trigger_check CHECK (
    trigger_type IN (
      'stock_low', 'order_created', 'order_paid', 'order_cancelled',
      'import_received', 'payment_due', 'customer_created',
      'campaign_finished', 'manual'
    )
  ),
  CONSTRAINT automations_action_check CHECK (
    action_type IN (
      'create_purchase_order', 'send_notification', 'send_whatsapp',
      'send_email', 'create_task', 'generate_report', 'create_alert',
      'assign_tag'
    )
  )
);

CREATE TRIGGER automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_automations_trigger  ON public.automations(trigger_type) WHERE enabled = true;
CREATE INDEX idx_automations_enabled  ON public.automations(enabled);

COMMENT ON TABLE  public.automations        IS 'Reglas de automatización del motor de Lanz Technology.';
COMMENT ON COLUMN public.automations.config IS 'Parámetros de configuración en JSON (thresholds, destinatarios, etc.).';

-- -----------------------------------------------------------------------------
-- AUTOMATION_RUNS — historial de ejecuciones
-- status: pending | running | completed | failed
-- result: JSON con datos de resultado (pedido creado, alerta ID, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE public.automation_runs (
  id             uuid        NOT NULL DEFAULT gen_random_uuid(),
  automation_id  uuid        NOT NULL,
  status         text        NOT NULL DEFAULT 'pending',
  triggered_by   text,
  started_at     timestamptz NOT NULL DEFAULT now(),
  finished_at    timestamptz,
  result         jsonb,
  error_message  text,

  CONSTRAINT automation_runs_pkey       PRIMARY KEY (id),
  CONSTRAINT automation_runs_auto_fk    FOREIGN KEY (automation_id)
    REFERENCES public.automations(id)   ON DELETE CASCADE,
  CONSTRAINT automation_runs_status_check CHECK (
    status IN ('pending','running','completed','failed')
  )
);

CREATE INDEX idx_automation_runs_auto_id ON public.automation_runs(automation_id, started_at DESC);
CREATE INDEX idx_automation_runs_status  ON public.automation_runs(status);

COMMENT ON TABLE public.automation_runs IS 'Historial de ejecuciones del motor de automatizaciones.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.automations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY auto_select  ON public.automations     FOR SELECT USING (public.has_permission('automations.read'));
CREATE POLICY auto_insert  ON public.automations     FOR INSERT WITH CHECK (public.has_permission('automations.create'));
CREATE POLICY auto_update  ON public.automations     FOR UPDATE USING (public.has_permission('automations.update'));
CREATE POLICY auto_delete  ON public.automations     FOR DELETE USING (public.has_permission('automations.delete'));

CREATE POLICY runs_select  ON public.automation_runs FOR SELECT USING (public.has_permission('automations.read'));
CREATE POLICY runs_insert  ON public.automation_runs FOR INSERT WITH CHECK (public.has_permission('automations.execute'));
CREATE POLICY runs_update  ON public.automation_runs FOR UPDATE USING (public.has_permission('automations.execute'));

-- -----------------------------------------------------------------------------
-- PERMISOS
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('automations.read',    'Ver automatizaciones y su historial'),
  ('automations.create',  'Crear nuevas automatizaciones'),
  ('automations.update',  'Editar y activar/desactivar automatizaciones'),
  ('automations.delete',  'Eliminar automatizaciones'),
  ('automations.execute', 'Ejecutar automatizaciones manualmente')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   public.roles       r
JOIN   public.permissions p ON p.name LIKE 'automations.%'
WHERE  r.name = 'administrator'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- SEED — automatizaciones predeterminadas
-- -----------------------------------------------------------------------------
INSERT INTO public.automations (name, description, trigger_type, action_type, config) VALUES
  (
    'Reposición automática de stock',
    'Crea una recomendación de compra cuando el stock cae al mínimo.',
    'stock_low',
    'create_purchase_order',
    '{"min_stock_threshold": 1, "note": "Generado automáticamente por el motor de reposición."}'
  ),
  (
    'Alerta de flujo de caja negativo',
    'Genera una alerta crítica cuando el balance total de cuentas es negativo.',
    'manual',
    'create_alert',
    '{"priority": "critical", "type": "finance"}'
  ),
  (
    'Notificación de importación recibida',
    'Notifica internamente cuando una importación cambia a estado recibido.',
    'import_received',
    'send_notification',
    '{"message": "Una importación ha sido recibida y procesada."}'
  ),
  (
    'Alerta de pagos vencidos',
    'Genera una alerta alta cuando hay cuentas por pagar vencidas.',
    'payment_due',
    'create_alert',
    '{"priority": "high", "type": "finance"}'
  ),
  (
    'Bienvenida a nuevo cliente',
    'Asigna la etiqueta Nuevo y genera una nota de bienvenida.',
    'customer_created',
    'assign_tag',
    '{"tag_name": "Nuevo"}'
  )
ON CONFLICT DO NOTHING;
