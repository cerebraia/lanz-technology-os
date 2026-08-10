# AGENTS.md — Guía para agentes automatizados

Este archivo define el comportamiento esperado de cualquier agente automatizado, herramienta de CI/CD o sistema externo que opere sobre este repositorio.

Para las reglas operativas de Claude Code específicamente, consultar **CLAUDE.md**.

---

## Advertencia crítica sobre Next.js

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Contexto del proyecto

**Proyecto:** Lanz Technology OS
**Empresa:** Lanz Technology — comercialización de productos DJI y tecnología premium
**Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, ESLint 9
**Base de datos prevista:** PostgreSQL vía Supabase (Fase 2)

---

## Validaciones requeridas antes de cualquier merge o despliegue

Todo agente que modifique código debe garantizar:

```bash
npm run lint       # cero errores
npm run typecheck  # cero errores de TypeScript
npm run build      # compilación exitosa
```

---

## Restricciones operativas

- No hacer commits automáticos salvo instrucción explícita.
- No desplegar a producción salvo instrucción explícita.
- No instalar dependencias no aprobadas.
- No modificar archivos de configuración críticos sin revisión humana:
  - `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `package.json`
- No generar ni exponer secretos.
- No ejecutar operaciones destructivas sobre la base de datos sin aprobación explícita.

---

## Referencia cruzada

Reglas completas de desarrollo: [`CLAUDE.md`](CLAUDE.md)
Arquitectura del sistema: [`docs/architecture/system-overview.md`](docs/architecture/system-overview.md)
Roadmap: [`docs/roadmap/product-roadmap.md`](docs/roadmap/product-roadmap.md)
