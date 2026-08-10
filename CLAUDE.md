# Instrucciones permanentes para Claude Code — Lanz Technology OS

Este archivo define las reglas operativas que Claude Code debe seguir en todo momento dentro de este proyecto.

---

## Documentación de referencia obligatoria

Antes de escribir cualquier código relacionado con Next.js, leer la documentación relevante en:

```
node_modules/next/dist/docs/
```

Esta versión de Next.js puede tener APIs, convenciones y comportamientos distintos a los del entrenamiento. Seguir las guías oficiales incluidas.

---

## Comportamiento general

- Analizar el estado actual del proyecto antes de modificar cualquier archivo.
- Leer la documentación relevante antes de implementar cualquier integración.
- No avanzar fuera del alcance de la tarea solicitada.
- No modificar módulos no relacionados con la tarea actual.
- No realizar reescrituras completas sin justificación técnica comprobable.
- Informar riesgos antes de tomar decisiones que afecten archivos críticos.
- Preferir cambios pequeños, verificables e incrementales.
- No hacer commits salvo instrucción explícita del usuario.
- No publicar, desplegar ni empujar cambios al repositorio remoto salvo instrucción explícita.
- Confirmar antes de ejecutar cualquier acción destructiva o irreversible.

---

## Estándares de código

### TypeScript
- Usar TypeScript estricto en todo momento.
- No usar `any` salvo que exista una justificación técnica documentada en comentario.
- Preferir tipos explícitos sobre inferencia cuando mejore la legibilidad.
- Definir interfaces y tipos en archivos dedicados dentro de `types/`.

### Nomenclatura
- Nombres técnicos internos (archivos, variables, funciones, tipos, rutas de API): **inglés**.
- Textos visibles para usuarios finales (etiquetas, mensajes, títulos): **español**.
- Archivos y carpetas: `kebab-case`.
- Componentes React: `PascalCase`.
- Funciones y variables: `camelCase`.
- Constantes globales: `UPPER_SNAKE_CASE`.

### Importaciones
- Usar alias `@/` para importaciones desde la raíz del proyecto.
- No usar rutas relativas más de un nivel hacia arriba (`../../`).
- Ordenar: externos → internos compartidos → internos del módulo actual.

### Componentes
- Mantener componentes pequeños y enfocados en una responsabilidad.
- Favorecer Server Components por defecto.
- Usar `"use client"` únicamente cuando exista interactividad o acceso a APIs del navegador.
- No mezclar lógica de negocio dentro de componentes de UI.
- No acceder a la base de datos desde componentes de presentación.

### Hooks
- Ubicar hooks en `features/<dominio>/hooks/` o en `lib/hooks/` si son compartidos.
- No duplicar lógica entre hooks similares de distintos dominios.

### Manejo de errores
- Validar datos de entrada en el servidor, nunca solo en el cliente.
- No silenciar errores con bloques `catch` vacíos.
- Los errores de dominio deben ser tipos explícitos, no strings genéricos.

### Comentarios
- No documentar lo que el código dice; solo el **por qué** cuando no es obvio.
- No dejar comentarios `// TODO` sin fecha ni responsable.
- No dejar código comentado en el repositorio.

### Dependencias
- No instalar librerías sin evaluar su mantenimiento, tamaño y necesidad real.
- No anticipar dependencias para fases futuras.
- Documentar la justificación si se agrega una dependencia nueva de peso.

### Seguridad
- No incluir secretos ni credenciales en ningún archivo versionado.
- Usar variables de entorno para toda configuración sensible.
- Solo las variables prefijadas con `NEXT_PUBLIC_` se exponen al cliente.
- Validar y sanitizar toda entrada del usuario en el servidor.

---

## Reglas de negocio permanentes

Estas reglas son invariantes del dominio y nunca deben omitirse:

### Inventario
- El stock nunca se modifica directamente; todo cambio genera un movimiento registrado.
- Los movimientos de inventario no se eliminan; los errores se corrigen con movimientos compensatorios.
- Cada movimiento debe registrar: usuario, fecha, motivo, cantidad y referencia.
- Los saldos no pueden ser negativos salvo una regla futura explícita y documentada.
- El inventario en tránsito se diferencia del inventario disponible.

### Finanzas e historial
- Los registros financieros históricos no se eliminan.
- Los errores contables se corrigen mediante registros compensatorios.
- Los precios y costos históricos de pedidos se conservan como snapshots inmutables.
- Los costos y la rentabilidad son información de acceso restringido.

### Permisos y auditoría
- Los permisos controlan acciones específicas, no solo acceso a páginas.
- Las operaciones sensibles deben conservar trazabilidad completa.
- No asumir que el usuario autenticado tiene permisos de administrador.

### Diseño y UI
- Diseño mobile-first en todo momento.
- Los textos visibles para usuarios deben estar en español.
- No construir interfaces o navegaciones ficticias que no tengan funcionalidad real.

---

## Validación obligatoria antes de finalizar cualquier tarea

Antes de reportar una tarea como completa, ejecutar en orden:

1. `npm run lint` — cero errores
2. `npm run typecheck` — cero errores
3. `npm run build` — compilación exitosa
4. `git diff --check` — sin conflictos ni espacios en blanco
5. `git status` — revisar archivos afectados
6. Confirmar que no hay secretos en ningún archivo versionado
7. Confirmar que la documentación coincide con los archivos realmente creados
8. Confirmar que no se implementó código fuera del alcance solicitado
9. Entregar un resumen técnico con archivos creados, modificados y decisiones tomadas

---

## Relación con AGENTS.md

- **CLAUDE.md** (este archivo): reglas operativas permanentes para Claude Code.
- **AGENTS.md**: guía para agentes automatizados o herramientas externas que operen en el repositorio.

Ambos archivos deben mantenerse coherentes. En caso de conflicto, prevalece CLAUDE.md.
