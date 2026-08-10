# Ciclo de vida de un pedido

Define los estados, transiciones permitidas y reglas de negocio del flujo de pedidos.

---

## Separación de conceptos

El sistema mantiene dos campos de estado independientes en cada pedido:

| Campo | Representa |
|---|---|
| `status` | Estado operativo del pedido (flujo de trabajo) |
| `payment_status` | Estado del cobro (finanzas) |

Un pedido puede estar en estado `delivered` y aún tener `payment_status = 'pending'` (entregado pero no cobrado). Esto es correcto y esperado.

---

## Estados del pedido (status)

| Estado interno | Etiqueta en pantalla | Descripción |
|---|---|---|
| `draft` | Borrador | Pedido en construcción, no confirmado |
| `pending_confirmation` | Pendiente de confirmación | Esperando aprobación o confirmación del cliente |
| `confirmed` | Confirmado | Pedido aceptado, listo para preparar |
| `preparing` | En preparación | El pedido está siendo preparado para despacho |
| `ready` | Listo para entrega | Preparado, esperando que el cliente lo recoja o enviar |
| `delivered` | Entregado | El cliente recibió el pedido |
| `cancelled` | Cancelado | Pedido cancelado. Estado terminal. |

---

## Estados de pago (payment_status)

| Estado interno | Etiqueta en pantalla | Descripción |
|---|---|---|
| `pending` | Pendiente | Sin pago registrado |
| `partial` | Parcialmente pagado | Pago parcial registrado |
| `paid` | Pagado | Pago completo registrado |
| `refunded` | Reembolsado | Devolución de pago procesada |

---

## Transiciones permitidas

```
draft
  └─→ pending_confirmation
  └─→ confirmed            (salto para ventas directas)
  └─→ cancelled

pending_confirmation
  └─→ confirmed
  └─→ cancelled

confirmed
  └─→ preparing
  └─→ cancelled

preparing
  └─→ ready
  └─→ cancelled

ready
  └─→ delivered
  └─→ cancelled

delivered               [estado terminal — no cancelable]
cancelled               [estado terminal — no reversible]
```

**Regla:** Un pedido entregado (`delivered`) no puede cancelarse. Requiere un proceso de devolución.

**Regla:** Un pedido cancelado (`cancelled`) no puede volver a ningún estado activo.

---

## Reservas de inventario

| Evento | Acción sobre inventario |
|---|---|
| Pedido pasa a `confirmed` | Crear `inventory_reservation` — aumenta `reserved` en balance |
| Pedido pasa a `delivered` | Consumir reserva → crear movimiento `sale` — reduce `on_hand` y `reserved` |
| Pedido pasa a `cancelled` | Liberar reserva → reduce `reserved` en balance |

La disponibilidad visible en la tienda se calcula como `on_hand - reserved`.

---

## Cancelación

Al cancelar un pedido:
1. Registrar `cancel_reason` en `orders`.
2. Registrar `cancelled_at` en `orders`.
3. Liberar todas las reservas activas del pedido (`inventory_reservations.status = 'released'`).
4. Crear registro en `order_status_history`.
5. Registrar en `audit_logs` con el motivo.

El permiso `orders.cancel` es necesario. Los vendedores sin ese permiso no pueden cancelar.

---

## Historial de estados

Cada transición de estado genera un registro en `order_status_history`:

```
order_id        → referencia al pedido
previous_status → estado anterior (puede ser NULL en la primera transición)
new_status      → estado nuevo
notes           → nota opcional del operador
created_by      → usuario que ejecutó la transición
created_at      → timestamp de la transición
```

El historial es inmutable — no se puede editar ni eliminar.

---

## Snapshots en order_items

Al crear un pedido, cada línea conserva un snapshot inmutable del producto:

```
product_sku   → SKU en el momento de la venta
product_name  → nombre en el momento de la venta
unit_price    → precio en el momento de la venta
unit_cost     → costo en el momento de la venta (restringido)
currency_code → moneda del pedido
quantity      → cantidad vendida
line_total    → total de la línea
```

Si el nombre o precio del producto cambia después de la venta, el pedido histórico conserva los datos originales. Esto es intencional e invariante del dominio.

---

## Números de pedido

Formato: `LT-XXXXXX` donde XXXXXX es un número secuencial de 6 dígitos con cero-padding.

Ejemplo: `LT-001000`, `LT-001001`, `LT-001002`.

Generado automáticamente via sequence `public.order_number_seq`. No puede editarse manualmente.

---

## Canal de venta (sale_channel)

Indica cómo llegó el pedido al sistema:

| Valor | Descripción |
|---|---|
| `store` | Tienda online |
| `whatsapp` | WhatsApp Business |
| `instagram` | Instagram |
| `facebook` | Facebook |
| `phone` | Teléfono (venta oral) |
| `direct` | Venta directa en el establecimiento |
| `other` | Otro canal |

Usado para atribución de marketing y análisis de canales de venta.
