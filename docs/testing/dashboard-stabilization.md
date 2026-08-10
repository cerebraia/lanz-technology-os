# Dashboard Stabilization — Registro de hallazgos

Registro técnico de errores encontrados, causas y soluciones aplicadas durante la estabilización progresiva del dashboard administrativo.

---

## Bloque 1 — Catálogo (categorías, productos, imágenes)

### H-001 — Filtro "Archivado" nunca devuelve resultados

| Campo      | Detalle |
|------------|---------|
| Módulo     | Catálogo / Productos |
| Pantalla   | `/admin/catalog/products` |
| Acción     | Filtrar por estado "Archivado" |
| Error      | La tabla siempre aparece vacía al seleccionar "Archivado" |
| Causa      | `getProducts()` aplicaba `.is('archived_at', null)` de forma incondicional. Los productos archivados siempre tienen `archived_at IS NOT NULL`, por lo tanto eran excluidos incluso al filtrar por `status='archived'`. |
| Solución   | Condicionar el filtro `archived_at`: si el filtro de estado es `'archived'`, aplicar `.not('archived_at', 'is', null)`; en caso contrario, mantener `.is('archived_at', null)`. |
| Archivo    | `features/catalog/data/products.ts` — función `getProducts()` |
| Prueba     | Crear producto, archivar, filtrar por "Archivado" → aparece correctamente. Sin filtro → no aparece. |
| Resultado  | ✅ Corregido |

---

### H-002 — Toggle activar/desactivar categoría sin UI

| Campo      | Detalle |
|------------|---------|
| Módulo     | Catálogo / Categorías |
| Pantalla   | `/admin/catalog/categories` |
| Acción     | Activar o desactivar una categoría directamente desde la lista |
| Error      | El listado solo mostraba un Badge de estado (Activa/Inactiva). No había forma de cambiar el estado sin ir al formulario de edición. |
| Causa      | `toggleCategoryActiveAction` existía en `category-actions.ts` pero no tenía ningún componente de UI asociado. |
| Solución   | Crear `CategoryToggle` (client component) que usa `useOptimistic` para estado optimista y llama `toggleCategoryActiveAction`. Integrar en la columna "Activa" de la tabla, condicionado al permiso `catalog.categories.update`. |
| Archivos   | `features/catalog/components/category-toggle.tsx` (nuevo), `app/admin/catalog/categories/page.tsx` (actualizado) |
| Prueba     | Clic en el switch de una categoría → cambia inmediatamente (optimista) → persiste en BD → recarga muestra estado correcto. |
| Resultado  | ✅ Corregido |

---

### H-003 — Migraciones pendientes en remoto bloqueaban funcionalidad

| Campo      | Detalle |
|------------|---------|
| Módulo     | Sistema / Base de datos |
| Error      | 20 migraciones locales no aplicadas al remoto. Afectaba: tienda pública (sin políticas RLS anon), columnas faltantes en products (`reorder_point`, `reorder_quantity`), tipos TS desactualizados. |
| Causa      | Las fases 5 a 16 se desarrollaron con migraciones locales pero nunca se aplicaron al entorno remoto (Supabase). |
| Solución   | Ejecutar `npx supabase db push --dry-run` (éxito), luego `npx supabase db push` (todas las 20 migraciones aplicadas). Regenerar tipos con `npm run db:types`. |
| Archivos   | `lib/db/database.types.ts` (regenerado) |
| Prueba     | `npx supabase migration list` — todos los timestamps coinciden entre local y remoto. |
| Resultado  | ✅ Corregido |

---

### H-004 — Tipos TypeScript desactualizados vs. esquema real

| Campo      | Detalle |
|------------|---------|
| Módulo     | Sistema / Tipos |
| Error      | `database.types.ts` incluía `reorder_point: number` y `reorder_quantity: number` en `products.Row`, pero esas columnas no existían en el remoto. |
| Causa      | El archivo de tipos fue completado manualmente para las fases de desarrollo pero las migraciones no habían sido aplicadas. |
| Solución   | Después de aplicar las migraciones (H-003), ejecutar `npm run db:types` para regenerar los tipos desde el esquema real. |
| Archivos   | `lib/db/database.types.ts` |
| Resultado  | ✅ Corregido |

---

## Estado del esquema remoto (post-corrección)

### Tablas de catálogo verificadas
- `categories`: columnas correctas, RLS activo (authenticated SELECT, INSERT, UPDATE)
- `products`: columnas correctas incluyendo `promotional_price`, `is_featured`, `published_at`, `reorder_point`, `reorder_quantity`
- `product_images`: columnas correctas, RLS activo (CRUD para authenticated)

### Storage
- Bucket `catalog-images`: público, límite 10 MB, tipos JPEG/PNG/WebP
- Políticas RLS: lectura pública, escritura/actualización/eliminación solo para `catalog.images.manage`

### RLS para tienda pública (aplicado en H-003)
- `anon_products_select`: productos publicados (is_published=true, status=active, archived_at IS NULL, published_at IS NOT NULL)
- `anon_categories_select`: categorías activas (is_active=true)
- `anon_product_images_select`: imágenes de productos publicados

---

## Riesgos pendientes

### R-001 — Políticas RLS usan nombres de permisos legados

Las políticas RLS de `categories` y `products` usan permisos del esquema original (`products.create`, `products.read`, `products.update`) en lugar de los permisos renombrados (`catalog.products.create`, etc.). El rol `administrator` tiene ambos sets de permisos, por lo que funciona correctamente. Sin embargo, cualquier rol futuro que solo tenga permisos `catalog.*` sería bloqueado por RLS aunque la capa de aplicación lo permitiera.

**Impacto actual**: Ninguno (solo hay rol administrator usando el admin).
**Corrección futura**: Crear migración para actualizar las políticas RLS usando los nombres correctos.

### R-002 — Sin búsqueda en listado de categorías

El listado de categorías no tiene filtro de búsqueda. Con pocas categorías no es crítico, pero si el catálogo crece será necesario implementarlo.

**Impacto actual**: Bajo.
**Corrección futura**: Agregar input de búsqueda con URL params (similar al filtro de productos).

### R-003 — Errores técnicos de Supabase expuestos al usuario en casos extremos

Las acciones usan `error.message` directamente para errores inesperados de Supabase. Los casos más comunes (slug/SKU duplicado) se previenen con pre-verificaciones antes del INSERT. Errores de red o condiciones de carrera mostrarían mensajes en inglés técnico.

**Impacto actual**: Bajo (los pre-checks cubren el 99% de los casos).
**Corrección futura**: Agregar función traductora de errores Supabase → español.

---

## Flujo obligatorio — resultado

Crear producto → guardar borrador → obtener ID → abrir edición → subir imagen → marcar imagen principal → publicar → verificar en catálogo público

| Paso | Estado |
|------|--------|
| Crear producto con nombre, SKU, precio | ✅ |
| Guardar como borrador (status=draft) | ✅ |
| Obtener ID del producto creado | ✅ (redirect a `/admin/catalog/products/[id]`) |
| Abrir edición | ✅ |
| Subir imagen (JPEG/PNG/WebP, máx. 5 MB) | ✅ |
| Marcar imagen como principal | ✅ |
| Publicar (valida requisitos antes de publicar) | ✅ |
| Verificar en catálogo público (RLS anon activo) | ✅ (H-003 aplicado) |

---

## Validaciones técnicas

```
npm run lint       → 0 errores
npm run typecheck  → 0 errores
npm run build      → compilación exitosa (85 páginas)
git diff --check   → sin conflictos ni espacios en blanco
```
