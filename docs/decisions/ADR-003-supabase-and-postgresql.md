# ADR-003 — Supabase y PostgreSQL como capa de datos

**Fecha:** 2026-07-29
**Estado:** Aceptado
**Autores:** Lanz Technology

---

## Contexto

Lanz Technology OS requiere una base de datos relacional robusta para gestionar inventario, pedidos, clientes, finanzas e importaciones con total trazabilidad y seguridad.

Se requiere además un sistema de autenticación, almacenamiento de archivos (imágenes de productos) y protección de datos a nivel de base de datos.

---

## Decisión

Usar **PostgreSQL** como base de datos relacional principal, gestionado a través de **Supabase** como Backend-as-a-Service (BaaS).

---

## Ventajas

### PostgreSQL

- Base de datos relacional más madura y robusta de código abierto.
- Soporte nativo para `numeric` con precisión exacta (crítico para dinero).
- `JSONB` para datos semi-estructurados (audit logs, metadata).
- Transacciones ACID con bloqueos de fila (`FOR UPDATE`).
- Funciones y triggers en PL/pgSQL para lógica garantizada en la base.
- Row Level Security (RLS) como capa de seguridad nativa.
- Sequences para numeración atómica sin race conditions.
- Índices parciales para consultas específicas.
- `gen_random_uuid()` para UUIDs nativos.

### Supabase

- PostgreSQL completamente accesible (no es un ORM que limita las capacidades).
- Auth integrado: maneja credenciales, sesiones, JWT y recuperación de contraseña sin infraestructura propia.
- Storage integrado para archivos (imágenes de productos).
- Studio web para administración y SQL Editor.
- API REST generada automáticamente desde el esquema.
- Supabase CLI para gestionar migraciones y generar tipos TypeScript.
- Plan gratuito suficiente para desarrollo y fases iniciales.
- Migración posible a PostgreSQL self-hosted si el negocio lo requiere.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Dependencia del vendor (Supabase) | La lógica crítica vive en SQL estándar de PostgreSQL, no en APIs propietarias de Supabase |
| Fallo del servicio Supabase | Backups automáticos de Supabase + posibilidad de migrar a self-hosted |
| Costo futuro en planes pagados | Diseño eficiente minimiza queries y almacenamiento |
| service_role key expuesta accidentalmente | Variables de entorno del servidor, NUNCA en cliente |

---

## RLS como segunda línea de defensa

RLS se habilita en todas las tablas públicas. La verificación de permisos ocurre en dos niveles:

1. **Primera línea**: Server Actions en Next.js verifican permisos antes de ejecutar.
2. **Segunda línea**: RLS en PostgreSQL previene acceso incluso si la primera falla.

Funciones `SECURITY DEFINER` con `search_path` fijo para operaciones que requieren bypassear RLS de forma controlada.

---

## Migraciones

- Versionadas con timestamps en `supabase/migrations/`.
- Revisables como código fuente antes de aplicar.
- Reproducibles: una base vacía puede reconstituirse aplicando todas las migraciones en orden.
- Sin modificaciones manuales a producción fuera del flujo de migraciones.

---

## Tipos TypeScript generados

Supabase CLI genera tipos TypeScript desde el esquema de la base de datos:

```bash
supabase gen types typescript --schema public > lib/db/database.types.ts
```

Estos tipos proporcionan type-safety end-to-end desde la base de datos hasta los componentes React. Deben regenerarse después de cada migración.

---

## Separación Auth / Profiles

`auth.users` (gestionado por Supabase Auth):
- Credenciales, sesiones, JWT
- Emails, contraseñas hasheadas
- No accesible directamente desde aplicación

`public.profiles` (gestionado por la aplicación):
- Nombre, teléfono, estado
- Roles y permisos asignados
- Vinculado a `auth.users` via UUID (ON DELETE CASCADE)

Esta separación mantiene las credenciales bajo control exclusivo de Supabase Auth mientras la aplicación gestiona los datos de perfil.

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|---|---|
| PlanetScale (MySQL) | Sin RLS nativo; without transactions en algunas operaciones |
| Firebase Firestore | Modelo no-relacional; no adecuado para ERP con joins complejos |
| Neon (PostgreSQL serverless) | Sin Auth ni Storage integrados; mayor configuración necesaria |
| Railway PostgreSQL | Sin Auth integrado; mayor complejidad operacional |
| PostgreSQL self-hosted | Requiere infraestructura propia; no justificado en esta etapa |

---

## Consecuencias

- Todo el acceso a datos pasa por el cliente Supabase (`@supabase/supabase-js` + `@supabase/ssr`).
- Los tipos TypeScript deben regenerarse después de cada cambio de esquema.
- El `service_role_key` nunca se incluye en código de cliente.
- Las migraciones son la única vía para modificar el esquema en producción.
