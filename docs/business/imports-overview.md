# Importaciones — Visión general

Define conceptualmente el ciclo de vida de las importaciones de Lanz Technology.

**Estado: No implementado.** Este documento es la referencia de diseño para la Fase 11.

---

## Contexto

Lanz Technology comercializa productos DJI y tecnología premium que en su mayoría provienen del exterior. El proceso de importación es un eje operativo crítico que involucra capital significativo, plazos variables y múltiples gastos asociados.

El módulo de importaciones permite controlar cada importación desde la orden al proveedor hasta la recepción en Venezuela, con visibilidad del capital comprometido y los gastos incurridos.

---

## Elementos del proceso

### Proveedor

Empresa o persona del exterior que suministra los productos.

- Nombre y datos de contacto
- País de origen
- Moneda de facturación
- Historial de órdenes

### Orden de compra al proveedor

Documento formal que origina una importación.

- Líneas de productos con cantidades y precios de costo
- Fecha de emisión
- Condiciones de pago
- Referencia del proveedor

### Importación

Entidad que agrupa todos los eventos desde el pedido al proveedor hasta la recepción local.

- Vinculada a una o más órdenes de compra
- Productos incluidos y cantidades
- Fechas estimadas y reales de cada etapa
- Empresa de transporte (courier, naviera, etc.)
- Número de tracking / referencia de envío
- Capital comprometido (costo de mercancía + gastos)
- Gastos asociados (detallados abajo)

### Gastos de importación

Todos los costos adicionales al precio de compra que forman parte del costo real de la mercancía:

- Flete internacional
- Seguro de carga
- Gastos de aduana
- Impuestos de importación
- Comisiones de agente aduanal
- Transporte local
- Otros gastos operativos

Estos gastos se distribuirán entre los productos de la importación para calcular el costo real unitario.

### Recepción

Evento de llegada y verificación de la mercancía.

- Confirmación de cantidades recibidas vs. ordenadas
- Registro de faltantes
- Registro de daños
- Generación de movimientos de inventario (`entry`)
- Actualización del costo unitario con gastos distribuidos

---

## Estados del ciclo de vida

Los nombres internos son en inglés. Las etiquetas visibles en la interfaz serán en español.

| Estado interno | Etiqueta en español | Descripción |
|---|---|---|
| `draft` | Borrador | Importación en construcción, no confirmada |
| `ordered` | Ordenado al proveedor | Orden de compra enviada y confirmada |
| `supplier_processing` | En proceso con proveedor | El proveedor está preparando el envío |
| `ready_to_ship` | Lista para envío | Mercancía lista en origen |
| `in_transit` | En tránsito | Mercancía en camino, tracking activo |
| `customs` | En aduana | Mercancía detenida en proceso aduanal |
| `local_delivery` | Entrega local | Mercancía en Venezuela, en tránsito local |
| `received` | Recibida | Mercancía verificada y registrada en inventario |
| `closed` | Cerrada | Importación completada, costos distribuidos, inventario actualizado |
| `cancelled` | Cancelada | Importación cancelada antes de recibirse |

---

## Capital comprometido

El módulo debe mostrar en todo momento el capital comprometido en importaciones activas:

```
capital_comprometido = suma(costo_mercancía + gastos_estimados) de importaciones no cerradas
```

Esta información es crítica para la gestión financiera y de flujo de caja.

---

## Inventario en tránsito

Mientras una importación no está en estado `received` o `closed`, los productos de esa importación cuentan como **inventario en tránsito**, no como inventario disponible.

El módulo de inventario distingue entre:
- Saldo disponible
- Saldo en tránsito (referenciado desde importaciones activas)

---

## Relación con otros dominios

| Dominio | Relación |
|---|---|
| `purchasing` | Proveedor y orden de compra se originan aquí |
| `inventory` | Al cerrar la importación, se generan movimientos de entrada |
| `finance` | Los gastos de importación se registran como egresos; el costo de mercancía afecta el costo unitario |
| `audit` | Cambios de estado y recepciones quedan registrados |

---

## Lo que el módulo de importaciones NO hace

- No gestiona relaciones de aduanas con documentación legal (solo registra el estado).
- No se conecta automáticamente a sistemas de tracking (en fases iniciales, el tracking es manual).
- No emite facturas ni documentos oficiales de importación.
- No gestiona divisas automáticamente (los montos se registran en la moneda indicada manualmente).
