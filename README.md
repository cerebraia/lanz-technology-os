# Lanz Technology OS

Sistema operativo empresarial de Lanz Technology — plataforma integrada de tienda online y centro de operaciones.

## Descripción

Lanz Technology OS es una plataforma ERP + E-commerce modular construida para centralizar las operaciones de Lanz Technology, empresa venezolana dedicada a la comercialización de productos DJI y tecnología premium.

La plataforma integrará progresivamente:

- Tienda online pública
- Gestión de productos, categorías e inventario
- Pedidos y clientes
- Proveedores, compras e importaciones
- Finanzas y rentabilidad
- Marketing y atribución
- Reportes y auditoría
- Usuarios, roles y permisos
- Configuración del negocio

## Estado actual

**Fase 2B — Supabase remoto, migraciones y primer administrador** (completada)

| Componente | Estado |
|---|---|
| Arquitectura y documentación (Fase 1) | ✅ Completada |
| Modelo físico de datos (Fase 2A) | ✅ Completada |
| Proyecto Supabase remoto | ✅ Configurado — entorno de desarrollo |
| Migraciones (8 archivos) | ✅ Aplicadas y sincronizadas |
| RLS | ✅ Habilitado en las 18 tablas públicas |
| Tipos TypeScript | ✅ Generados desde esquema real |
| Primer administrador | ✅ Creado — perfil y rol asignado |
| Autenticación visual (login/logout) | ⏳ Fase 3A |
| Módulos funcionales | ⏳ Fases posteriores |

## Stack

| Tecnología | Versión | Propósito |
|---|---|---|
| Next.js | 16.x | Framework full-stack (App Router) |
| React | 19.x | UI — Server y Client Components |
| TypeScript | 5.x | Tipado estático estricto |
| Tailwind CSS | 4.x | Estilos — CSS-first |
| ESLint | 9.x | Análisis estático |
| Git | — | Control de versiones |
| PostgreSQL + Supabase | — | Base de datos — remoto de desarrollo activo |
| GitHub | — | Repositorio remoto (futuro) |
| Hostinger | — | Despliegue (futuro) |

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Git

## Instalación

```bash
git clone <url-del-repositorio>
cd lanz-technology-os
npm install
```

## Variables de entorno

Copia `.env.example` como `.env.local` y completa los valores cuando estén disponibles:

```bash
cp .env.example .env.local
```

Las integraciones con Supabase se configurarán en la Fase 2.

## Ejecución local

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Scripts disponibles

| Script | Comando | Descripción |
|---|---|---|
| Desarrollo | `npm run dev` | Inicia el servidor en modo desarrollo (Turbopack) |
| Compilación | `npm run build` | Genera el build de producción |
| Producción | `npm run start` | Inicia el servidor de producción |
| Lint | `npm run lint` | Analiza el código con ESLint |
| TypeScript | `npm run typecheck` | Verifica tipos sin emitir archivos |

## Estructura general

```
lanz-technology-os/
├── app/                    # App Router de Next.js
│   ├── globals.css         # Estilos globales (Tailwind v4)
│   ├── layout.tsx          # RootLayout
│   └── page.tsx            # Página de inicio
├── docs/                   # Documentación del proyecto
│   ├── PROJECT-BIBLE.md    # Documento maestro del producto
│   ├── architecture/       # Diseño arquitectónico
│   ├── business/           # Reglas de negocio
│   ├── conventions/        # Convenciones de desarrollo
│   ├── decisions/          # Registros de decisiones (ADR)
│   ├── roadmap/            # Hoja de ruta del producto
│   └── testing/            # Estrategia de pruebas
├── supabase/
│   └── migrations/         # 8 migraciones aplicadas — sincronizadas con remoto
├── public/                 # Activos estáticos
├── .env.example            # Variables de entorno de referencia
├── CLAUDE.md               # Reglas permanentes para Claude Code
├── AGENTS.md               # Guía para agentes automatizados
├── next.config.ts          # Configuración de Next.js
├── tsconfig.json           # Configuración de TypeScript
├── eslint.config.mjs       # Configuración de ESLint
└── postcss.config.mjs      # Configuración de PostCSS / Tailwind
```

Consulta [`docs/architecture/project-structure.md`](docs/architecture/project-structure.md) para la estructura completa prevista.

## Convenciones básicas

- Nombres de archivos y carpetas: `kebab-case`
- Componentes React: `PascalCase`
- Funciones y variables: `camelCase`
- Tipos e interfaces TypeScript: `PascalCase`
- Nombres técnicos internos: inglés
- Textos visibles para usuarios: español
- Server Components por defecto; `"use client"` solo cuando sea necesario

Consulta [`docs/conventions/code-conventions.md`](docs/conventions/code-conventions.md) para las convenciones completas.

## Flujo de trabajo

1. Cada fase del roadmap tiene su propio alcance documentado
2. No avanzar a la siguiente fase sin completar la actual
3. Ejecutar `lint`, `typecheck` y `build` antes de cada commit
4. Documentar decisiones arquitectónicas en `docs/decisions/`
5. Mantener la documentación sincronizada con la implementación

## Estrategia de ramas

| Rama | Propósito |
|---|---|
| `main` | Código estable y revisado |
| `feature/<nombre>` | Desarrollo de funcionalidades |
| `fix/<nombre>` | Corrección de errores |
| `docs/<nombre>` | Cambios solo de documentación |

## Integración con Supabase

**Estado: Proyecto remoto activo (entorno de desarrollo).**

- Proyecto: `lanz-technology-os-dev` — región `us-east-1`
- Migraciones aplicadas: 8 archivos, local y remoto sincronizados
- RLS activo en las 18 tablas públicas
- Tipos TypeScript generados desde el esquema real
- Primer administrador: creado con perfil y rol `administrator` (24 permisos)
- Autenticación visual: **no implementada todavía** — Fase 3A
- Credenciales: en `.env.local` (excluido de git)

## Despliegue

**Estado: No configurado.** Previsto para fases posteriores en Hostinger, dependiendo del plan contratado y su soporte para aplicaciones Node.js.

## Próxima fase

**Fase 3A — Autenticación interna, gestión de sesiones y protección del centro de operaciones.**

Consulta [`docs/roadmap/product-roadmap.md`](docs/roadmap/product-roadmap.md) para el roadmap completo.
