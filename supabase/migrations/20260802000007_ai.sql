-- =============================================================================
-- Migration 027: Sistema de Inteligencia Artificial empresarial
--
-- Tablas para persistir insights y recomendaciones generados por el motor
-- de reglas de negocio. Las predicciones se calculan en la capa de aplicación
-- y se almacenan aquí para consulta rápida.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- AI_INSIGHTS — alertas e insights generados por el motor de reglas
-- type:     inventory | finance | sales | import | marketing | general
-- priority: low | medium | high | critical
-- metadata: datos de contexto (JSON) para renderizado en el cliente
-- -----------------------------------------------------------------------------
CREATE TABLE public.ai_insights (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  type        text        NOT NULL,
  title       text        NOT NULL,
  description text        NOT NULL,
  priority    text        NOT NULL DEFAULT 'medium',
  metadata    jsonb,
  resolved    boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_insights_pkey           PRIMARY KEY (id),
  CONSTRAINT ai_insights_type_check     CHECK (type     IN ('inventory','finance','sales','import','marketing','general')),
  CONSTRAINT ai_insights_priority_check CHECK (priority IN ('low','medium','high','critical'))
);

CREATE INDEX idx_ai_insights_priority   ON public.ai_insights(priority);
CREATE INDEX idx_ai_insights_type       ON public.ai_insights(type);
CREATE INDEX idx_ai_insights_created_at ON public.ai_insights(created_at DESC);
CREATE INDEX idx_ai_insights_resolved   ON public.ai_insights(resolved) WHERE resolved = false;

COMMENT ON TABLE  public.ai_insights          IS 'Alertas e insights generados por el motor de reglas de negocio.';
COMMENT ON COLUMN public.ai_insights.metadata IS 'Datos de contexto en JSON para renderizado (product_id, amount, etc.).';

-- -----------------------------------------------------------------------------
-- AI_RECOMMENDATIONS — recomendaciones de acción generadas por el motor
-- category:   purchase | import | pricing | marketing | general
-- confidence: 0.0 – 1.0 (qué tan segura es la recomendación)
-- -----------------------------------------------------------------------------
CREATE TABLE public.ai_recommendations (
  id             uuid          NOT NULL DEFAULT gen_random_uuid(),
  category       text          NOT NULL,
  reference_id   uuid,
  reference_type text,
  recommendation text          NOT NULL,
  confidence     numeric(4,3)  NOT NULL DEFAULT 0.5,
  metadata       jsonb,
  is_dismissed   boolean       NOT NULL DEFAULT false,
  created_at     timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT ai_recommendations_pkey           PRIMARY KEY (id),
  CONSTRAINT ai_recommendations_category_check CHECK (category IN ('purchase','import','pricing','marketing','general')),
  CONSTRAINT ai_recommendations_confidence_check CHECK (confidence BETWEEN 0 AND 1)
);

CREATE INDEX idx_ai_recommendations_category ON public.ai_recommendations(category);
CREATE INDEX idx_ai_recommendations_created  ON public.ai_recommendations(created_at DESC);
CREATE INDEX idx_ai_recommendations_active   ON public.ai_recommendations(is_dismissed) WHERE is_dismissed = false;

COMMENT ON TABLE public.ai_recommendations IS 'Recomendaciones de acción generadas por el motor de reglas.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.ai_insights        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_insights_select ON public.ai_insights        FOR SELECT USING (public.has_permission('ai.read'));
CREATE POLICY ai_insights_insert ON public.ai_insights        FOR INSERT WITH CHECK (public.has_permission('ai.insights'));
CREATE POLICY ai_insights_update ON public.ai_insights        FOR UPDATE USING (public.has_permission('ai.insights'));

CREATE POLICY ai_rec_select ON public.ai_recommendations FOR SELECT USING (public.has_permission('ai.read'));
CREATE POLICY ai_rec_insert ON public.ai_recommendations FOR INSERT WITH CHECK (public.has_permission('ai.recommendations'));
CREATE POLICY ai_rec_update ON public.ai_recommendations FOR UPDATE USING (public.has_permission('ai.recommendations'));

-- -----------------------------------------------------------------------------
-- PERMISOS
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('ai.read',            'Acceder al módulo de IA y ver predicciones'),
  ('ai.assistant',       'Usar el asistente de IA para consultas empresariales'),
  ('ai.insights',        'Ver y gestionar alertas e insights de IA'),
  ('ai.recommendations', 'Ver y gestionar recomendaciones de IA')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   public.roles       r
JOIN   public.permissions p ON p.name LIKE 'ai.%'
WHERE  r.name = 'administrator'
ON CONFLICT DO NOTHING;
