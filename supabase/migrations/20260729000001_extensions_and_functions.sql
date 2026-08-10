-- =============================================================================
-- Migration 001: Extensions and shared utility functions
-- Orden: debe ejecutarse primero — otras migraciones dependen de estas funciones
-- =============================================================================

-- pgcrypto: necesario en PostgreSQL < 13 para gen_random_uuid()
-- En PostgreSQL 13+ está disponible de forma nativa; la extensión no hace daño
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- uuid-ossp: alternativa de UUID, útil para compatibilidad y uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Función: set_updated_at()
-- Mantiene el campo updated_at actualizado automáticamente en cada UPDATE.
-- Se aplica como trigger BEFORE UPDATE en todas las tablas con ese campo.
-- SECURITY DEFINER con search_path fijo para evitar ataques de search_path.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
  'Trigger function: actualiza updated_at a now() en cada UPDATE.';
