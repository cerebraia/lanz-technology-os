# Estrategia de entornos

Define cómo se separan y gestionan los entornos de la plataforma Lanz Technology OS.

---

## Entornos previstos

| Entorno | Estado | Propósito |
|---|---|---|
| **Local (aplicación)** | Activo | Next.js en `localhost:3000` via `npm run dev` |
| **Remoto de desarrollo** | Activo | Base de datos Supabase `lanz-technology-os-dev` (us-east-1) |
| **Staging** | Futuro | Validación pre-producción con datos realistas |
| **Producción** | Futuro | Entorno final en Hostinger |

---

## Entorno actual — Fase 2B

### Aplicación local

```bash
npm run dev       # Next.js en http://localhost:3000
npm run build     # Build de producción
npm run typecheck # Verificación TypeScript
npm run lint      # ESLint
```

Variables de entorno en `.env.local` (excluido de git por `.gitignore`).

### Base de datos remota de desarrollo

- **Proyecto:** `lanz-technology-os-dev`
- **Región:** `us-east-1` — North Virginia
- **URL:** `https://omguumvsfaubghvxszmy.supabase.co`
- **Estado:** Activo con 8 migraciones aplicadas y RLS habilitado
- **Acceso:** Desde la aplicación local usando variables de entorno

---

## Separación de credenciales

| Credencial | Dónde vive | Acceso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Público — solo URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local` | Público — protección por RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor, cuando se necesite | NUNCA en cliente |
| Contraseña de BD | Nunca en código ni archivos | Solo en memoria al ejecutar `supabase link` |
| Access tokens CLI | `~/.config/supabase/` (fuera del repo) | Local del desarrollador |

**Regla absoluta:** Ninguna credencial entra al repositorio. El `.gitignore` cubre `.env*`.

---

## .env.local — Reglas de uso

1. **No versionar:** `.env.local` está en `.gitignore`.
2. **No compartir:** La publishable key del entorno de desarrollo no se comparte en el chat, documentos ni issues.
3. **No reutilizar entre entornos:** Cada entorno (dev, staging, producción) tiene sus propias claves.
4. **Referencia:** `.env.example` documenta las variables necesarias con valores vacíos.

---

## Estrategia de migraciones entre entornos

```
Escribir migración
  → supabase/migrations/<timestamp>_descripcion.sql

Revisar estáticamente
  → Leer el SQL antes de aplicar
  → Verificar dependencias entre tablas

Aplicar a remoto de desarrollo
  → npx supabase db push

Verificar sincronización
  → npx supabase migration list

Regenerar tipos
  → npm run db:types
  → npm run typecheck

── Para staging/producción (futuro) ──
  → Revisar migraciones pendientes
  → Hacer backup del estado actual
  → Aplicar con supervisión
  → Verificar inmediatamente
```

**Regla invariante:** Una migración aplicada a un entorno nunca se edita. Los errores se corrigen con una migración nueva.

---

## Entorno local con Docker (cuando esté disponible)

Cuando Docker Desktop esté instalado:

```bash
npx supabase start   # Levanta PostgreSQL + Auth + Studio local en puertos 543xx
npx supabase db reset # Aplica todas las migraciones desde cero
npx supabase stop    # Detiene el entorno local
```

Ventajas del entorno local:
- Sin riesgo de afectar la base de datos compartida
- Reset rápido para pruebas
- Studio en `http://localhost:54323`

**Estado actual:** Docker no disponible. Se usa el remoto de desarrollo para todas las operaciones.

---

## Futuro — Staging

Cuando el sistema tenga funcionalidades core (Fase 5+):

- Crear un proyecto Supabase separado: `lanz-technology-os-staging`
- Misma región que producción
- Variables de entorno propias en un `.env.staging` o en el sistema de CI
- No reutilizar credenciales de desarrollo

---

## Futuro — Producción

Al momento del despliegue en Hostinger:

- Crear un proyecto Supabase de producción: `lanz-technology-os`
- Evaluar plan de Supabase según carga esperada
- Configurar `NEXT_PUBLIC_SITE_URL` con el dominio real
- Las migraciones se aplican desde el entorno de CI/CD (no manualmente)
- La `SUPABASE_SERVICE_ROLE_KEY` de producción solo vive en variables de entorno de Hostinger
- Nunca usar credenciales de producción en entorno local
