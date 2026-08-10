# Product Edit Page — Diagnóstico y corrección

**Fecha:** 2026-08-04  
**Ruta oficial de edición:** `/admin/catalog/products/[id]`  
**Estado:** Corregido

---

## Síntoma

Al navegar a `/admin/catalog/products/[id]` la aplicación mostraba "This page couldn't load".

---

## Error encontrado

Dos causas identificadas:

### Causa 1: Función `getCategories` lanzaba excepción propagada

`features/catalog/data/categories.ts` tenía:
```typescript
if (error) throw new Error(`Error al obtener categorías: ${error.message}`)
```

Cuando Supabase devolvía un error en esta query (ej. schema cache stale, timeout), la excepción se propagaba. En la página, la excepción era atrapada por el IIFE y re-lanzada como un nuevo error. Este error secundario podía no ser interceptado correctamente por el error boundary en Next.js 16 con Turbopack, causando que el servidor enviara una respuesta de error sin el componente error.tsx.

### Causa 2: Patrón IIFE con triple capa de try/catch enmascaraba el error real

La página usaba un IIFE para cargar las tres queries:
```typescript
const [product, categories, images] = await (async () => {
  try {
    const results = await Promise.allSettled([...])
    // ...
    throw originalError
  } catch (err) {
    throw new Error(`No se pudo cargar el producto...`)  // ← envuelve el error original
  }
})()
```

La envoltura del error original en un nuevo `Error` podía alterar el tipo de error recibido por Next.js, haciendo que el framework lo manejara de forma diferente al esperado. En particular, cuando el error original era un `NEXT_REDIRECT` u otro tipo especial de Next.js, envolverlo en `new Error()` podría interrumpir el manejo especial.

### Causa 3: Imports superfluos de tipos de órdenes

La página importaba `Payment`, `Shipment`, `OrderStatusHistory` del módulo de órdenes sin usarlos. Aunque son `import type` (eliminados en compilación), su presencia era un código muerto que podía indicar refactorizaciones incompletas.

---

## Consulta que fallaba

```typescript
// En getCategories() — lanzaba excepción
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .order('sort_order', { ascending: true })
  .order('name', { ascending: true })

if (error) throw new Error(`Error al obtener categorías: ${error.message}`)
// ↑ Esta excepción propagada causaba el fallo
```

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/admin/catalog/products/[id]/page.tsx` | Reescritura completa: eliminado IIFE, queries directas y resilientes |
| `app/admin/catalog/products/[id]/error.tsx` | Simplificado, mensajes más claros, detecta `PGRST116` |
| `app/admin/catalog/products/[id]/loading.tsx` | Creado nuevo (skeleton de carga) |
| `features/catalog/data/categories.ts` | `getCategories` ya no lanza — devuelve `[]` en error con log servidor |

---

## Ruta oficial de edición

`/admin/catalog/products/[id]` — página única, sin ruta `/edit` separada.

Flujo de redirecciones correcto:
1. Crear producto → redirect a `/admin/catalog/products/[id]` (via `product-actions.ts`)
2. Lista de productos → link a `/admin/catalog/products/[id]`
3. Guardar cambios → permanece en `/admin/catalog/products/[id]`

No existe `/admin/catalog/products/[id]/edit` ni debe crearse.

---

## Migraciones creadas

Ninguna. La corrección fue exclusivamente en la capa de datos y presentación.

---

## Resultado de pruebas

```
npm run lint      → 0 errores
npm run typecheck → 0 errores
npm run build     → compilación exitosa
```

### Rutas verificadas en build:
```
ƒ /admin/catalog/products/[id]      ✓ Compila
ƒ /admin/catalog/products/new       ✓ Compila
ƒ /admin/catalog/products           ✓ Compila
```

### Flujo de navegación:
```
GET /admin/catalog/products/[uuid] (sin auth) → 307 → /login   ✓
GET /admin/catalog/products/[uuid] (con auth) → 200 (o notFound) ✓
```

---

## Flujos validados a nivel de código

| Caso | Comportamiento esperado |
|------|------------------------|
| Producto con imágenes | Muestra sección Multimedia con grid de imágenes |
| Producto sin imágenes | Muestra sección Multimedia vacía con opción de subir |
| Producto destacado | Badge "Destacado" en el header |
| Producto publicado | Badge "Publicado" en el header |
| Producto en borrador | Badge "Borrador" en el header |
| Producto archivado | Badge "Archivado" en el header |
| Producto sin categoría | Formulario con selector de categoría vacío |
| ID de producto no encontrado | Página 404 de Next.js |
| ID de producto sin permiso | Redirect a /admin/catalog/products |
| Error en carga de categorías | Formulario funciona con lista vacía (log en servidor) |

---

## Riesgos residuales

- Si `getCategories()` falla, el formulario de edición carga sin opciones de categoría. El usuario puede guardar el producto sin cambiar la categoría (se conserva el `category_id` actual). El error queda en los logs del servidor.
- La página no tiene Suspense boundaries explícitos, por lo que la carga es bloqueante. La `loading.tsx` cubre este caso visualmente.
