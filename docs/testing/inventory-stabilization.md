# Inventory Stabilization — Registro de hallazgos

---

## Auditoría del esquema remoto

### Tablas verificadas

| Tabla | Estado | Notas |
|-------|--------|-------|
| `inventory_locations` | ✅ | WH-001 "Almacén principal" activo |
| `inventory_balances` | ✅ | on_hand, reserved. Constraints: on_hand≥0, reserved≥0, on_hand≥reserved |
| `inventory_movements` | ✅ | Ledger append-only. 14 tipos válidos incluidos reservation y release |
| `inventory_entries` | ✅ | Estados: draft→confirmed/cancelled |
| `inventory_entry_items` | ✅ | CASCADE DELETE desde inventory_entries |
| `inventory_adjustments` | ✅ | Estados: draft→confirmed/cancelled. Motivo obligatorio. |
| `inventory_adjustment_items` | ✅ | current_stock + physical_stock + difference (calculado) |
| `inventory_holds` | ✅ | Estados: pending→confirmed→released/expired |
| `inventory_hold_items` | ✅ | CASCADE DELETE desde inventory_holds |
| `inventory_reservations` | ✅ | Tabla separada para reservas vinculadas a pedidos |

### Funciones verificadas

| Función | Estado |
|---------|--------|
| `record_inventory_movement()` | ✅ SECURITY DEFINER, bloqueo FOR UPDATE, validación stock≥0 |
| `reserve_inventory_movement()` | ✅ SECURITY DEFINER, valida disponible≥reserva, valida reserva≥0 |
| `confirm_inventory_entry()` | ✅ Atómica, genera movimientos por ítem, maneja total_units |
| `cancel_inventory_entry()` | ✅ Solo draft, no genera movimientos |
| `confirm_inventory_adjustment()` | ✅ Atómica, solo ítems con difference≠0 |
| `cancel_inventory_adjustment()` | ✅ Solo draft, no genera movimientos |
| `confirm_inventory_hold()` | ✅ Llama reserve_inventory_movement, valida expiración |
| `release_inventory_hold()` | ✅ Llama reserve_inventory_movement(release) |

### RLS verificado

- `inventory_balances`: SELECT con `inventory.read`. Sin INSERT/UPDATE directos (solo vía SECURITY DEFINER).
- `inventory_movements`: SELECT con `inventory.read`. Sin INSERT directo (append-only via función).
- `inventory_entries/items`: SELECT, INSERT, UPDATE, DELETE con permisos granulares `inventory.entries.*`.
- `inventory_adjustments/items`: Mismo patrón con `inventory.adjustments.*`.
- `inventory_holds/hold_items`: Mismo patrón con `inventory.reservations.*`.
- `inventory_locations`: SELECT con `inventory.read`.

### Permisos del administrador

El rol `administrator` tiene todos los permisos de inventario necesarios: `inventory.read`, `inventory.receive`, `inventory.adjust`, `inventory.reserve`, `inventory.entries.*`, `inventory.adjustments.*`, `inventory.reservations.*`, `inventory.alerts.read`.

---

## Errores encontrados y corregidos

### H-INV-001 — Ajuste de inventario con dirección "Salida" siempre incrementa el stock

| Campo | Detalle |
|-------|---------|
| Módulo | Inventario / Movimientos |
| Pantalla | `/admin/inventory/movements/new?type=adjustment` |
| Acción | Registrar ajuste manual con dirección "Salida (−)" |
| Error | El stock siempre aumentaba, incluso al seleccionar dirección "Salida" |
| Causa | `createInventoryAdjustment` en `inventory-actions.ts` calculaba `signedQty = direction === 'in' ? absQty : -absQty` (correcto), pero luego pasaba `Math.abs(signedQty)` al servicio (elimina el signo). El servicio al recibir `type: 'adjustment'` con cantidad positiva siempre genera `adjustment_in`. |
| Solución | Cambiar la llamada a `recordMovement` para usar `type: 'exit'` cuando direction es 'out'. El servicio mapea `exit` → `adjustment_out` con cantidad negativa, produciendo la salida correcta. |
| Archivo | `features/inventory/actions/inventory-actions.ts` — función `createInventoryAdjustment` |
| Prueba | Registrar ajuste salida de 5 unidades → stock disminuye 5; registrar ajuste entrada de 3 → stock aumenta 3 |
| Resultado | ✅ Corregido |

### H-INV-002 — Movimientos de entrada/ajuste cargados sin filtro server-side (hasta 100, posibles omisiones)

| Campo | Detalle |
|-------|---------|
| Módulo | Inventario / Entradas y Ajustes |
| Pantalla | `/admin/inventory/entries/[id]` y `/admin/inventory/adjustments/[id]` |
| Acción | Ver movimientos generados al confirmar una entrada o ajuste |
| Error | La página cargaba hasta 100 movimientos de todo el sistema y luego filtraba en JavaScript por `reference_id`. Con más de 100 movimientos, los movimientos de la entrada/ajuste podían no aparecer. |
| Causa | `getMovementsFiltered` no tenía filtro para `reference_id`. Las páginas usaban `.then(all => all.filter(...))` post-fetch. |
| Solución | Agregar `referenceId?: string` a `MovementFilters` en `inventory.ts`. Aplicar `.eq('reference_id', ...)` antes de la ejecución. Actualizar ambas páginas para usar `referenceId: id`. |
| Archivos | `features/inventory/data/inventory.ts`, `app/admin/inventory/entries/[id]/page.tsx`, `app/admin/inventory/adjustments/[id]/page.tsx` |
| Prueba | Confirmar una entrada con 3 productos → los 3 movimientos aparecen en el detalle de la entrada |
| Resultado | ✅ Corregido |

---

## Flujo principal validado

| Paso | Estado |
|------|--------|
| Producto existe con saldo inicial en WH-001 | ✅ (location activa confirmada) |
| Crear entrada de mercancía (draft) | ✅ |
| Agregar productos a entrada | ✅ |
| Confirmar entrada → movimientos generados | ✅ (confirm_inventory_entry atómica) |
| Stock actualizado en inventory_balances | ✅ (record_inventory_movement SECURITY DEFINER) |
| Ver movimientos de la entrada (H-INV-002 corregido) | ✅ |
| Crear reserva (pending) | ✅ |
| Confirmar reserva → reserved aumenta | ✅ (reserve_inventory_movement) |
| Liberar reserva → reserved disminuye | ✅ (release_inventory_hold) |
| Crear ajuste positivo → stock aumenta | ✅ |
| Crear ajuste negativo → stock disminuye (H-INV-001 corregido) | ✅ |
| Historial de movimientos por producto | ✅ (getInventoryMovements) |
| Alertas de stock bajo/crítico/agotado | ✅ (getAlertStatus + reorder_point) |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `features/inventory/actions/inventory-actions.ts` | Fix Bug H-INV-001: dirección de ajuste |
| `features/inventory/data/inventory.ts` | Agrega `referenceId` a `MovementFilters`, aplica filtro server-side |
| `app/admin/inventory/entries/[id]/page.tsx` | Usa `referenceId: id` en lugar de filtro JS |
| `app/admin/inventory/adjustments/[id]/page.tsx` | Usa `referenceId: id` en lugar de filtro JS |
| `docs/testing/inventory-stabilization.md` | Este documento |

---

## Riesgos pendientes

### R-INV-001 — inventory_balances.reserved puede quedar inconsistente si una reserva/hold se cancela sin liberar stock

`cancel_inventory_entry()` no libera stock porque las entradas en draft no modifican el stock. Correcto. Pero si un `inventory_hold` en estado `confirmed` se cancela sin llamar `release_inventory_hold()`, el campo `reserved` quedaría inflado. Actualmente no hay lógica de cancelación de holds confirmados — solo existe `release`. Impacto: bajo (el UI solo muestra Liberar para confirmed, no Cancelar).

### R-INV-002 — Sin paginación en movimientos de la página principal

`getMovementsFiltered` tiene `limit = 100`. Con muchos movimientos, el historial completo no es visible. No es un error funcional pero afecta la usabilidad a largo plazo.

### R-INV-003 — Errores de DB devueltos en inglés en algunos casos

Las acciones `entry-actions.ts` y `adjustment-actions.ts` devuelven `error.message` directamente cuando la función SQL falla. El mensaje puede estar en inglés técnico (RAISE EXCEPTION del SQL). Las excepciones del SQL están en español (definidas en las funciones), por lo que en la práctica el impacto es mínimo.

---

## Validaciones técnicas

```
npm run lint       → 0 errores ✅
npm run typecheck  → 0 errores ✅
npm run build      → 85 páginas, sin errores ✅
git diff --check   → sin conflictos ✅
```
