# ADR-001 — Stack tecnológico

**Fecha:** 2026-07-29  
**Estado:** Aceptado  
**Autores:** Lanz Technology

---

## Contexto

Lanz Technology necesita construir una plataforma integrada de ERP + E-commerce que soporte el crecimiento del negocio a largo plazo. El sistema debe ser:

- Mantenible por un equipo pequeño durante años
- Desplegable sin infraestructura compleja
- Seguro para manejar datos de ventas, costos y clientes
- De alto rendimiento, especialmente en la tienda pública
- Escalable sin necesidad de reescribir la base

Se evaluaron distintas opciones de stack considerando experiencia disponible, ecosistema, costo de operación y madurez de las herramientas.

---

## Decisión

Usar el siguiente stack:

| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 16.x | Framework full-stack principal |
| **React** | 19.x | Librería de UI |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 4.x | Estilos |
| **PostgreSQL** | — | Base de datos relacional |
| **Supabase** | — | BaaS: Postgres, Auth, Storage, RLS |
| **GitHub** | — | Control de versiones y CI/CD futuro |
| **Hostinger** | — | Plataforma de despliegue |

---

## Razones

### Next.js + React

- Full-stack unificado: un solo proyecto para frontend, backend y API.
- App Router con Server Components reduce el JavaScript enviado al cliente.
- Soporte nativo para SEO mediante metadata API y rendering en servidor.
- Amplio ecosistema y comunidad activa.
- Server Actions simplifican la mutación de datos sin necesidad de una API REST separada.

### TypeScript

- Previene errores en tiempo de compilación antes de que lleguen a producción.
- Documenta las estructuras de datos y contratos entre módulos.
- Facilita el mantenimiento a largo plazo y el onboarding de nuevos desarrolladores.
- El modo `strict` garantiza la máxima cobertura de análisis estático.

### Tailwind CSS v4

- CSS-first: sin archivo de configuración JavaScript adicional en v4.
- Utilities predecibles y consistentes en toda la interfaz.
- Tree-shaking automático elimina clases no usadas en producción.
- Compatible con dark mode de sistema operativo.
- La v4 es la versión activa y mantenida.

### PostgreSQL + Supabase

- PostgreSQL es la base de datos relacional más robusta y madura de código abierto.
- Supabase añade: Auth, Storage, Row-Level Security y dashboard sin gestionar infraestructura propia.
- RLS permite proteger datos directamente en la base de datos como segunda línea de defensa.
- El plan gratuito de Supabase es suficiente para el desarrollo y fases iniciales.
- Si en el futuro se requiere una base de datos propia, Supabase permite migrar a un PostgreSQL gestionado.

### GitHub

- Estándar de la industria para control de versiones y colaboración.
- CI/CD futuro con GitHub Actions.
- Issues, PRs y documentación integrados.

### Hostinger

- Opción económica con soporte para aplicaciones Node.js.
- El método exacto de despliegue (VPS, plan de hosting con Node.js) dependerá del plan contratado y su soporte en el momento de la configuración.

---

## Ventajas

- Stack cohesivo: TypeScript de extremo a extremo (frontend + backend + tipos de base de datos).
- Menos context switching: un solo lenguaje y framework.
- Costo de operación bajo en etapas iniciales.
- Supabase gestiona la infraestructura de base de datos, auth y storage.
- Next.js con App Router permite optimizaciones de rendimiento avanzadas sin configuración adicional.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Next.js 16 puede tener APIs nuevas desconocidas | Leer documentación en `node_modules/next/dist/docs/` antes de implementar |
| Supabase como punto de dependencia única | Diseñar la capa de datos con abstracciones que permitan migrar si fuera necesario |
| Hosting en Hostinger con soporte variable para Node.js | Evaluar el plan y soporte antes de configurar el despliegue |
| Tailwind v4 es relativamente nueva | La v4 ya es la versión estable; revisar changelog ante actualizaciones |

---

## Alternativas consideradas

| Alternativa | Razón de rechazo |
|---|---|
| Laravel + PHP | Requeriría cambio de lenguaje; TypeScript unificado es más valioso |
| SvelteKit | Menor ecosistema; TypeScript support menos maduro para el backend |
| NestJS + API separada | Complejidad innecesaria para un equipo pequeño en fase inicial |
| MySQL | PostgreSQL tiene mejor soporte para JSON, tipos avanzados y RLS |
| Firebase | Modelo de datos no relacional; no adecuado para ERP |
| PlanetScale | No soporta RLS nativo; más caro en producción |

---

## Consecuencias

- Todo el código de la aplicación se escribe en TypeScript.
- La estructura de carpetas sigue las convenciones de Next.js App Router.
- Supabase gestiona autenticación y base de datos desde la Fase 2.
- El despliegue inicial será manual hasta configurar CI/CD en GitHub Actions.
- El método de despliegue en Hostinger se definirá según el plan contratado.
