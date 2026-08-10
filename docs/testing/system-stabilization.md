# Lanz Technology OS — Estabilización del sistema

Registro de errores detectados, corregidos y pendientes.

---

## Bloque 1: Catálogo, Imágenes, Publicación

**Fecha:** 2026-08-04  
**Estado:** Completado

---

## BUG-001

| Campo      | Valor |
|-----------|-------|
| ID        | BUG-001 |
| Módulo    | Ventas manuales / Base de datos |
| Pantalla  | /admin/sales/manual |
| Severidad | Critical |
| Estado    | Resuelto |

**Pasos para reproducir:**
1. Navegar a /admin/sales/manual
2. Completar el formulario y enviar
3. La acción llama a `create_manual_sale` RPC

**Resultado esperado:** La venta se crea correctamente.

**Resultado real:** Error de base de datos — función inexistente. La migración `20260804000003_manual_sales.sql` estaba pendiente de despliegue.

**Causa raíz:** La migración fue creada localmente pero no desplegada al entorno remoto de Supabase. Adicionalmente, la firma de la función PL/pgSQL violaba la regla de PostgreSQL: no se pueden declarar parámetros requeridos (sin DEFAULT) después de parámetros opcionales (con DEFAULT).

**Solución:**
1. Reordenados los parámetros de `create_manual_sale` para que los requeridos (`p_first_name`, `p_sale_channel`, `p_payment_method`, `p_items`) precedan a los opcionales.
2. Desplegada la migración con `npx supabase db push`.

**Archivos modificados:**
- `supabase/migrations/20260804000003_manual_sales.sql` — reorden de parámetros

**Migración:** `20260804000003_manual_sales.sql` — desplegada

**Prueba final:** `npx supabase migration list` confirma `remote: 20260804000003`. Build y typecheck pasan sin errores.

---

## BUG-002

| Campo      | Valor |
|-----------|-------|
| ID        | BUG-002 |
| Módulo    | Tienda pública — catálogo |
| Pantalla  | /catalog, /product/[slug], /, /search |
| Severidad | High |
| Estado    | Resuelto |

**Pasos para reproducir:**
1. Crear un producto en estado `draft` (sin publicar)
2. Navegar a /catalog en la tienda pública
3. El producto borrador aparece listado junto a los publicados

**Resultado esperado:** Solo productos con `is_published=true`, `status='active'`, `archived_at IS NULL` y `published_at IS NOT NULL` son visibles.

**Resultado real:** Productos en estado borrador, archivados o sin publicar aparecen en el catálogo y buscador públicos.

**Causa raíz:** `createStoreClient()` usa `SUPABASE_SERVICE_ROLE_KEY`, que bypassa todas las políticas RLS incluyendo las definidas en `20260802000009_public_store_rls.sql`. Las queries en `features/store/data/products.ts` no tenían los filtros de visibilidad explícitos que la RLS habría aplicado automáticamente.

**Solución:** Añadidos filtros explícitos en todas las queries del store:
```typescript
.eq('is_published', true)
.eq('status', 'active')
.is('archived_at', null)
.not('published_at', 'is', null)
```

Funciones corregidas:
- `getPublishedProducts()` — filtros de visibilidad en query base
- `getFeaturedProducts()` — filtros añadidos antes del filtro `is_featured`
- `getPublishedProductBySlug()` — filtros añadidos antes de `maybeSingle()`
- `getRelatedProducts()` — filtros añadidos antes de filtros de categoría
- `searchPublishedProducts()` — filtros añadidos antes del filtro `or()`
- `getDistinctBrands()` — filtros añadidos para excluir marcas de productos no publicados

Actualizado el comentario de `lib/supabase/store-server.ts` para documentar que service_role bypassa RLS y que los filtros explícitos son obligatorios.

**Archivos modificados:**
- `features/store/data/products.ts` — filtros de visibilidad en 6 funciones
- `lib/supabase/store-server.ts` — comentario corregido

**Migración:** Ninguna. Corrección en capa de datos.

**Prueba final:** lint ✓, typecheck ✓, build ✓

---

## Errores conocidos pendientes (próximos bloques)

| ID | Módulo | Descripción | Severidad |
|----|--------|-------------|-----------|
| BUG-003 | Catálogo — Admin | Campos `reorder_point` y `reorder_quantity` no tienen inputs en el formulario de producto. Siempre guardan 0. Bloquea la funcionalidad de alertas de inventario si el operador quiere configurar umbrales por producto. | Medium |
| BUG-004 | Catálogo — Store | `inStock` en `getPublishedProductBySlug` siempre retorna `true`. La disponibilidad real depende de `inventory_balances` que requiere política RLS para `anon` o función SECURITY DEFINER. | Medium |
| BUG-005 | Catálogo — Admin | Categorías con `parent_id` no son gestionables desde la UI. El formulario de categorías no muestra el selector de categoría padre aunque el campo existe en la DB. | Low |

---

## Estado de Supabase al cierre del bloque

- Migraciones locales: 34
- Migraciones remotas: 34 (todas sincronizadas)
- Última migración: `20260804000003_manual_sales.sql`
- Storage bucket `catalog-images`: activo, público, límite 10 MB (app valida 5 MB)
- RLS habilitado en todas las tablas públicas
- Tipos TypeScript generados: sincronizados con esquema actual

---

## Resultado de pruebas técnicas

```
npm run lint      → 0 errores, 0 warnings
npm run typecheck → 0 errores
npm run build     → compilación exitosa, 0 errores
npx supabase migration list → todas las migraciones en sync (local = remote)
```

---

## Flujos validados a nivel de código

### Categorías
- [x] Crear (category-actions.ts → `createCategoryAction`)
- [x] Editar (category-actions.ts → `updateCategoryAction`)
- [x] Activar/Desactivar (category-actions.ts → `toggleCategoryActiveAction`)
- [x] Validación de slug duplicado
- [x] Auto-generación de slug desde nombre

### Productos
- [x] Crear (product-actions.ts → `createProductAction`)
- [x] Editar (product-actions.ts → `updateProductAction`)
- [x] Publicar con validación de requisitos (nombre, SKU, categoría, precio > 0, al menos 1 imagen)
- [x] Ocultar (setea `is_published=false` sin cambiar status)
- [x] Archivar (setea `status='archived'`, `is_published=false`, `archived_at=now()`)
- [x] Marcar como destacado (`is_featured` via Switch checkbox)
- [x] Guardar precio y precio promocional con validación (`promo < sale`)
- [x] Validación de SKU único
- [x] Validación de slug único
- [x] No se envían columnas inexistentes a Supabase

### Imágenes
- [x] Subir (5 MB máximo, JPEG/PNG/WebP)
- [x] Eliminación con devolución de storage y promoción automática de nueva principal
- [x] Establecer imagen principal
- [x] Reordenar (swap de sort_order)
- [x] Máximo 10 imágenes por producto
- [x] URL pública via `getPublicImageUrl()` (bucket `catalog-images`)

### Tienda pública
- [x] Solo productos publicados visibles (BUG-002 corregido)
- [x] Solo marcas de productos publicados en filtros
- [x] Solo categorías activas en navegación
- [x] Página de producto 404 para borradores/archivados

---

## Siguiente bloque de estabilización

Trabajar en este orden:

1. **Inventario**
   - Validar saldo inicial, entradas, salidas, ajustes, reservas, alertas
   - Verificar que `reorder_point`/`reorder_quantity` pueden configurarse (BUG-003)
   - Comprobar que movimientos no se duplican

2. **Ventas manuales**
   - Probar el flujo completo con la migración ya desplegada
   - Validar stock insuficiente, cliente nuevo vs existente
   - Verificar atomicidad (si falla un paso no queda registro parcial)

3. **Pedidos**
   - Listado, filtros, cambio de estado
   - Cancelación con devolución de inventario
   - Historial de estado

4. **Clientes**
   - CRUD, deduplicación por teléfono, historial de pedidos
