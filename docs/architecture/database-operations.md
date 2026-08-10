# Operaciones de base de datos

Guía de comandos para gestionar la base de datos de Lanz Technology OS.

**Estado actual (Fase 2B completada):**

| Componente | Estado |
|---|---|
| Proyecto remoto | `lanz-technology-os-dev` — us-east-1 — activo |
| CLI autenticación | Via `npx supabase login --token` o `SUPABASE_ACCESS_TOKEN` |
| Vinculación | `npx supabase link --project-ref omguumvsfaubghvxszmy` |
| Migraciones | 8 aplicadas — local y remoto sincronizados |
| Tipos TypeScript | `lib/db/database.types.ts` — generados desde esquema real |
| Entorno local (Docker) | No disponible — usar remoto de desarrollo |

---

## Prerrequisitos

### Supabase CLI

Instalar el CLI de Supabase en la máquina de desarrollo:

```bash
# macOS con Homebrew
brew install supabase/tap/supabase

# Verificar instalación
supabase --version
```

Alternativa portable (sin instalación global):
```bash
npx supabase --version
```

### Docker

El entorno local de Supabase requiere Docker Desktop.

```bash
# Verificar que Docker está corriendo
docker info
```

Si Docker no está disponible, solo se pueden usar las operaciones contra un proyecto remoto.

---

## Entorno local (requiere Docker)

### Inicializar el entorno local

La estructura `supabase/` ya está creada. Para iniciar el entorno local:

```bash
supabase start
```

Esto descarga las imágenes de Docker de Supabase y levanta:
- PostgreSQL en `localhost:54322`
- API REST en `localhost:54321`
- Supabase Studio en `localhost:54323`
- Servidor de email (inbucket) en `localhost:54324`

### Aplicar migraciones en local

```bash
supabase db reset
```

`db reset` aplica todas las migraciones en orden desde cero. Equivalente a una base de datos limpia.

### Aplicar solo migraciones nuevas

```bash
supabase migration up
```

### Ver estado de migraciones

```bash
supabase migration list
```

### Detener el entorno local

```bash
supabase stop
```

---

## Proyecto remoto (Supabase Cloud)

### Crear el proyecto remoto (Fase 2B)

1. Ir a [supabase.com](https://supabase.com) y crear un nuevo proyecto.
2. Copiar el `Project ID`, `Project URL` y claves de la sección API.
3. Configurar las variables en `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

**Advertencia:** `SUPABASE_SERVICE_ROLE_KEY` nunca debe usarse en el cliente. Es exclusivo del servidor.

### Vincular el proyecto remoto

```bash
supabase link --project-ref <project-id>
```

Este comando vincula el directorio local con el proyecto remoto. Ejecutar una sola vez por entorno.

### Aplicar migraciones al proyecto remoto

```bash
supabase db push
```

**Advertencia:** Este comando modifica la base de datos de producción. Revisar las migraciones antes de ejecutarlo.

---

## Generación de tipos TypeScript

Los tipos de TypeScript se generan automáticamente desde el esquema de la base de datos.

### Una vez que el proyecto remoto está configurado

```bash
npm run db:types
```

Este comando ejecuta:
```bash
supabase gen types typescript --schema public > lib/db/database.types.ts
```

El archivo `lib/db/database.types.ts` actual es un **placeholder**. Debe reemplazarse con los tipos reales una vez que las migraciones estén aplicadas.

### Regenerar tipos tras una nueva migración

Cada vez que se aplica una migración que agrega o modifica tablas:
```bash
npm run db:types
npm run typecheck
```

---

## Primer administrador

El primer usuario administrador no se crea en las migraciones.

Proceso manual post-deploy:

**Paso 1:** Crear el usuario en Supabase Auth (Studio o CLI):
```bash
supabase auth invite --email admin@lanz.technology --role admin
```

O directamente en Supabase Studio → Authentication → Users → Invite user.

**Paso 2:** Obtener el UUID del usuario creado en `auth.users`.

**Paso 3:** Crear el perfil en SQL Editor de Supabase Studio:
```sql
INSERT INTO public.profiles (id, full_name, status)
VALUES ('<uuid-del-usuario>', 'Nombre del Administrador', 'active');
```

**Paso 4:** Asignar el rol administrator:
```sql
INSERT INTO public.user_roles (user_id, role_id)
SELECT '<uuid-del-usuario>', id
FROM public.roles
WHERE name = 'administrator';
```

---

## Flujo entre desarrollo y producción

```
Desarrollo local (Docker)
  → escribir migración SQL en supabase/migrations/
  → probar con: supabase db reset

Revisión (Fase 2B)
  → revisar SQL antes de aplicar a remoto
  → aplicar con: supabase db push

Producción
  → aplicar migrations solo desde entorno controlado
  → nunca modificar manualmente tablas de producción sin migración
  → hacer backup antes de migrations importantes
```

---

## Reset local

**Advertencia:** Elimina todos los datos locales.

```bash
supabase db reset
```

Aplica todas las migraciones desde cero. Útil para desarrollo.

---

## Manejo de secretos

- Las variables de entorno locales van en `.env.local` (excluido de git por `.gitignore`).
- En producción, configurar las variables en el panel de Hostinger o en la plataforma de CI/CD.
- Nunca incluir claves reales en el repositorio.
- `SUPABASE_SERVICE_ROLE_KEY`: solo en variables de entorno del servidor.

---

## SQL Editor de Supabase Studio

Para queries ad-hoc y verificaciones:
- Local: `http://localhost:54323`
- Remoto: `https://app.supabase.com/project/<project-id>/editor`

Útil para:
- Verificar que las migraciones se aplicaron correctamente
- Inspeccionar datos después de operaciones
- Ejecutar el SQL del primer administrador
- Revisar políticas RLS activas
