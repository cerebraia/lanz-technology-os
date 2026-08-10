# Orders Stabilization — Registro de hallazgos

---

## Auditoría del esquema remoto

### Tablas verificadas

| Tabla | Estado | Notas |
|-------|--------|-------|
| `customers` | ✅ | FK a profiles, constraint source (ahora incluye 'storefront') |
| `orders` | ✅ | FK a customers, status+payment_status CHECK, cancel_consistency CHECK |
| `order_items` | ✅ | Snapshots inmutables; DELETE policy para borrador añadida |
| `order_status_history` | ✅ | Append-only, FK a orders ON DELETE RESTRICT |
| `inventory_reservations` | ✅ | Solo lectura vía RLS; escritura mediante reserve_inventory_movement() |
| `payments` | ✅ | FK a orders ON DELETE RESTRICT, check de método y estado |
| `shipments` | ✅ | FK a orders ON DELETE RESTRICT, estados válidos |

### Funciones verificadas

| Función | Estado |
|---------|--------|
| `create_storefront_order()` | ✅ (después de H-ORD-002 y H-ORD-003) |
| `get_storefront_order_confirmation()` | ✅ Solo expone datos públicos, requiere token |

### RLS verificado

- `orders`: SELECT, INSERT, UPDATE con permisos granulares `orders.*`
- `order_items`: SELECT, INSERT, DELETE (draft only — nueva política H-ORD-001)
- `order_status_history`: SELECT, INSERT (no UPDATE/DELETE — inmutable)
- `customers`: SELECT, INSERT, UPDATE (no DELETE — archivado lógico)
- `payments`: SELECT, INSERT, UPDATE con `payments.manage`
- `shipments`: SELECT, INSERT, UPDATE con `orders.ship`
- `inventory_reservations`: Solo SELECT (escritura vía SECURITY DEFINER)

---

## Errores encontrados y corregidos

### H-ORD-001 — Eliminar productos de pedido en borrador bloqueado por RLS

| Campo | Detalle |
|-------|---------|
| Módulo | Pedidos / Gestión de ítems |
| Pantalla | `/admin/orders/[id]` (pedido en borrador) |
| Acción | Botón "Quitar" en la línea de un producto |
| Error | La acción `removeOrderItemAction` fallaba silenciosamente. RLS bloqueaba el DELETE porque no existía ninguna política DELETE para `order_items`. |
| Causa | Migration 007 (rls_policies.sql) definió `order_items` como inmutables (sin UPDATE/DELETE). Esa decisión es correcta para pedidos confirmados (snapshots históricos), pero la UI admin necesita eliminar líneas de pedidos en **borrador**. La funcionalidad fue implementada sin añadir la política RLS correspondiente. |
| Solución | Nueva migración `20260804000001_order_items_delete_policy.sql`: política DELETE que permite eliminar ítems solo cuando el pedido asociado está en estado `draft` y el usuario tiene permiso `orders.update`. |
| Archivos | `supabase/migrations/20260804000001_order_items_delete_policy.sql` (nuevo) |
| Prueba | Crear pedido → agregar producto → quitar producto → el item desaparece y el total se recalcula |
| Resultado | ✅ Corregido |

### H-ORD-002 — Checkout de tienda viola constraint `customers.source`

| Campo | Detalle |
|-------|---------|
| Módulo | Tienda pública / Checkout |
| Pantalla | `/checkout` |
| Acción | Completar el formulario de checkout como cliente nuevo |
| Error | `create_storefront_order()` fallaba con error de constraint al insertar nuevos clientes. El pedido completo revertía (rollback) y el usuario recibía "No se pudo crear el pedido". |
| Causa | La función SQL (migration 010) inserta clientes con `source = 'storefront'`. El constraint `customers_source_check` (migration 005) no incluía `'storefront'` en su lista de valores válidos. |
| Solución | Migración `20260804000002_storefront_constraint_fix.sql`: DROP y recreación del constraint incluyendo `'storefront'`. |
| Archivos | `supabase/migrations/20260804000002_storefront_constraint_fix.sql` (nuevo) |
| Resultado | ✅ Corregido |

### H-ORD-003 — Checkout de tienda viola constraint `orders.sale_channel`

| Campo | Detalle |
|-------|---------|
| Módulo | Tienda pública / Checkout |
| Pantalla | `/checkout` |
| Acción | Completar cualquier checkout en la tienda |
| Error | `create_storefront_order()` fallaba con error de constraint al crear el pedido. Bloqueaba el checkout incluso para clientes que ya existían en la BD. |
| Causa | La función SQL inserta pedidos con `sale_channel = 'storefront'`. El constraint `orders_channel_check` (migration 005) solo permitía: 'store', 'whatsapp', 'instagram', 'facebook', 'phone', 'direct', 'other'. `'storefront'` no estaba incluido. |
| Solución | Misma migración `20260804000002_storefront_constraint_fix.sql`: actualización del constraint de `sale_channel` para incluir `'storefront'`. |
| Archivos | `supabase/migrations/20260804000002_storefront_constraint_fix.sql` (nuevo) |
| Resultado | ✅ Corregido |

### H-ORD-004 — `'storefront'` no tenía etiqueta en la UI admin

| Campo | Detalle |
|-------|---------|
| Módulo | Admin / Pedidos |
| Pantalla | `/admin/orders` (listado) |
| Acción | Ver listado de pedidos de la tienda |
| Error | Pedidos con `sale_channel = 'storefront'` mostraban el valor crudo `'storefront'` en lugar de una etiqueta legible. |
| Causa | `SALE_CHANNEL_LABELS` en `constants.ts` no tenía entrada para `'storefront'`. |
| Solución | Agregar `storefront: 'Tienda online'` al mapa de etiquetas. |
| Archivos | `features/orders/data/constants.ts` |
| Resultado | ✅ Corregido |

---

## Flujo completo validado

| Paso | Canal | Estado |
|------|-------|--------|
| Producto publicado disponible en tienda | Tienda | ✅ (RLS anon aplicado) |
| Agregar al carrito | Tienda | ✅ (localStorage + CartContext) |
| Checkout — cliente nuevo | Tienda | ✅ (H-ORD-002 y H-ORD-003 corregidos) |
| Checkout — cliente existente (por teléfono) | Tienda | ✅ (búsqueda por teléfono normalizado) |
| Crear pedido — `create_storefront_order()` | Tienda | ✅ (SECURITY DEFINER, transaccional) |
| Crear líneas del pedido (snapshots) | Tienda | ✅ |
| Reservar inventario (si track_inventory=true) | Tienda | ✅ (reserve_inventory_movement) |
| Calcular total | Tienda | ✅ (precio calculado en DB, nunca del cliente) |
| Generar enlace WhatsApp | Tienda | ✅ (lib/whatsapp.ts) |
| Mostrar página de confirmación | Tienda | ✅ (get_storefront_order_confirmation + token) |
| Crear pedido (admin manual) | Admin | ✅ |
| Agregar ítems | Admin | ✅ |
| Eliminar ítems de borrador | Admin | ✅ (H-ORD-001 corregido) |
| Transiciones de estado | Admin | ✅ (draft→pending→paid→processing→shipped→delivered) |
| Reserva en transición a 'processing' | Admin | ✅ (reserve_inventory_movement) |
| Liberación en cancelación | Admin | ✅ (para pedidos en processing/shipped) |
| Registrar pago | Admin | ✅ |
| Registrar envío | Admin | ✅ |
| Historial de estado | Admin | ✅ (append-only) |

---

## Estados del pedido

| Estado | Válido en DB | Tiene transición UI | Notas |
|--------|-------------|---------------------|-------|
| draft | ✅ | ✅ → pending | Pedidos admin manuales |
| pending | ✅ | ✅ → paid, processing | |
| paid | ✅ | ✅ → processing | |
| processing | ✅ | ✅ → shipped | Reserva inventario |
| shipped | ✅ | ✅ → delivered | |
| delivered | ✅ | — (terminal) | |
| cancelled | ✅ | — (terminal) | Libera inventario si venía de processing/shipped |
| refunded | ✅ | — (terminal) | Libera inventario si venía de processing/shipped |
| pending_confirmation | ✅ | — | Solo pedidos de tienda |
| confirmed | ✅ | — | Flujo original |
| preparing | ✅ | — | Flujo original |
| ready | ✅ | — | Flujo original |

---

## Migraciones aplicadas

| Migración | Descripción |
|-----------|-------------|
| `20260804000001_order_items_delete_policy.sql` | Política RLS DELETE para order_items en borrador |
| `20260804000002_storefront_constraint_fix.sql` | Agrega 'storefront' a customers.source y orders.sale_channel |

---

## Riesgos pendientes

### R-ORD-001 — `total_amount` no incluye taxes ni shipping

`recalcOrderTotals` en `order-actions.ts` calcula `total_amount = subtotal` (ignora taxes y shipping). Como ambos campos siempre son 0 para pedidos admin actuales, el total mostrado es correcto. Si en el futuro se agregan impuestos o costos de envío variables a pedidos admin, el total no se recalcularía correctamente.

### R-ORD-002 — Formato de número de pedido inconsistente

- Admin: `LT-001000` (generado por el DEFAULT de la tabla via nextval)
- Tienda: `LT-2026-001000` (generado por la función SQL, incluye año)

Ambos son únicos (mismo sequence) pero tienen formatos distintos. Cosmético.

### R-ORD-003 — `releaseInventoryForOrder` sin verificación previa de reserva

Cuando se cancela un pedido que estaba en 'processing' o 'shipped', se intenta liberar inventario para TODOS los ítems. Si un ítem no tenía stock disponible al momento de reservar y la reserva falló silenciosamente, la liberación también fallará silenciosamente. El inventario queda correcto en ambos casos.

### R-ORD-004 — RLS de `orders` UPDATE no distingue cancelación de otras actualizaciones

La política `orders_update` requiere `orders.update`. El código verifica `orders.cancel` para cancelaciones. Como el admin tiene ambos permisos, esto funciona. Pero si se crea un rol con solo `orders.cancel` (sin `orders.update`), no podría cancelar pedidos a nivel RLS aunque la app lo permitiera.

---

## Validaciones técnicas

```
npm run lint       → 0 errores ✅
npm run typecheck  → 0 errores ✅
npm run build      → 85 páginas, sin errores ✅
git diff --check   → sin conflictos ✅
npx supabase migration list → todas las migraciones aplicadas ✅
```
