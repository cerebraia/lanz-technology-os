# Reglas de inventario — diseño físico

Actualización de los principios de inventario con el diseño físico aprobado en la Fase 2A.

Ver también: `docs/business/inventory-principles.md` para el contexto de negocio original.

---

## Estructura física del inventario

### Tablas involucradas

| Tabla | Rol |
|---|---|
| `inventory_locations` | Ubicaciones físicas (almacenes) |
| `inventory_balances` | Saldo materializado por producto+ubicación |
| `inventory_movements` | Ledger inmutable de cambios |
| `inventory_reservations` | Reservas activas de pedidos |

### Fórmulas definitivas

```
on_hand    = existencia física (derivada de movimientos, materializada)
reserved   = SUM(quantity) de inventory_reservations WHERE status = 'active'
available  = on_hand - reserved  (DERIVADO, no almacenado)
```

El campo `available` nunca se almacena en base de datos para evitar inconsistencias. Se calcula en la consulta.

---

## Invariante principal: sin escrituras directas al saldo

La única forma de modificar `inventory_balances.on_hand` es la función `record_inventory_movement()`.

```sql
-- Correcto: via función
SELECT record_inventory_movement(
  product_id   := '<uuid>',
  location_id  := '<uuid>',
  movement_type := 'purchase_receipt',
  quantity     := 10,
  reason       := 'Orden de compra OC-001',
  reference_type := 'purchase_order',
  reference_id := '<uuid-orden>'
);

-- Incorrecto: nunca hacer esto
UPDATE inventory_balances SET on_hand = on_hand + 10 WHERE product_id = '<uuid>';
```

RLS garantiza esto: no hay políticas INSERT/UPDATE/DELETE para usuarios en `inventory_balances`.

---

## Tipos de movimiento y su efecto

| Tipo | quantity | Cuándo usar |
|---|---|---|
| `opening_balance` | Positivo | Al registrar stock inicial |
| `purchase_receipt` | Positivo | Recepción de orden de compra local |
| `import_receipt` | Positivo | Recepción de importación |
| `sale` | Negativo | Despacho de pedido confirmado |
| `return_in` | Positivo | Devolución del cliente recibida |
| `return_out` | Negativo | Devolución al proveedor |
| `adjustment_in` | Positivo | Ajuste por conteo físico (sobrante) |
| `adjustment_out` | Negativo | Ajuste por conteo físico (faltante) |
| `transfer_in` | Positivo | Recepción de transferencia entre ubicaciones |
| `transfer_out` | Negativo | Salida por transferencia entre ubicaciones |
| `damage` | Negativo | Producto dañado irrecuperable |
| `loss` | Negativo | Pérdida o robo |

No todos los tipos se usan en las primeras fases. El diseño los admite desde el inicio.

---

## Flujo de reservas

```
Pedido confirmed
  └─→ INSERT inventory_reservations (status = 'active')
  └─→ inventory_balances.reserved += quantity

Pedido delivered
  └─→ inventory_reservations.status = 'consumed'
  └─→ record_inventory_movement(type='sale', quantity=-N)
  └─→ on_hand -= N  AND  reserved -= N

Pedido cancelled
  └─→ inventory_reservations.status = 'released'
  └─→ inventory_balances.reserved -= quantity
```

La reserva NO genera un movimiento en `inventory_movements`. Solo el movimiento `sale` lo genera al despachar. Una devolución posterior sí genera movimiento `return_in`.

---

## Función record_inventory_movement — garantías

1. **Bloqueo de fila**: `SELECT ... FOR UPDATE` evita race conditions bajo concurrencia.
2. **Validación de saldo negativo**: si `on_hand + quantity < 0`, la función falla con excepción y no modifica nada.
3. **Registro inmutable**: el movimiento se inserta antes de actualizar el saldo. Si el UPDATE falla, el INSERT se revierte (transacción ACID).
4. **Auditoría completa**: el movimiento registra usuario, cantidad anterior, cantidad posterior, motivo y referencia.

---

## Ajustes de inventario

Cuando el conteo físico difiere del sistema:

- Usuario crea una solicitud de ajuste (Server Action).
- Un administrador revisa y aprueba.
- Al aprobar, se llama `record_inventory_movement()` con tipo `adjustment_in` o `adjustment_out`.
- El ajuste queda registrado en `audit_logs` con el motivo y el aprobador.

El sistema NO permite que el vendedor ejecute ajustes directamente (sin permiso `inventory.adjust`).

---

## Stock mínimo y alertas

El campo `products.min_stock` define el umbral mínimo.

```
si (on_hand - reserved) <= min_stock → alerta de reabastecimiento
```

Las alertas se implementarán en una fase futura. El campo `min_stock` ya existe en el esquema.

---

## Inventario en tránsito (Fase 11)

Cuando se implemente el módulo de Importaciones:

- Los productos en una importación activa aparecerán como `in_transit`.
- El campo `on_hand` no aumenta hasta la recepción física (`movement_type = 'import_receipt'`).
- El inventario en tránsito es visible pero no disponible para reservas.

---

## Errores de movimiento: corrección compensatoria

Si un movimiento fue registrado con datos incorrectos:

1. **No se elimina** el movimiento original.
2. Se crea un movimiento compensatorio que revierte el efecto.
3. Se crea un nuevo movimiento con los datos correctos.
4. Todos los movimientos quedan visibles en el historial.

Ejemplo: si se registró una entrada de 10 unidades pero eran 8:
```
Movimiento A: +10 (erróneo)
Movimiento B: -10 (compensatorio, con nota: "corrige movimiento A")
Movimiento C: +8  (correcto)
```
