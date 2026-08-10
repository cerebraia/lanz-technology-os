# Marketing — Visión general

Define conceptualmente el módulo de marketing de Lanz Technology OS.

**Estado: No implementado.** Este documento es la referencia de diseño para la Fase 12.

---

## Propósito del módulo

El módulo de marketing **controla la inversión publicitaria y mide sus resultados**.

No es una herramienta para publicar contenido en redes sociales.

Su función es responder preguntas como:

- ¿Cuánto se invirtió en publicidad este mes?
- ¿Qué campañas generaron más pedidos?
- ¿Cuál es el costo por pedido de cada campaña?
- ¿Qué tan rentable fue una campaña después de descontar la publicidad?
- ¿En qué plataformas conviene invertir más?

---

## Elementos del módulo

### Campaña

Unidad básica de seguimiento de marketing.

- Nombre de la campaña
- Plataforma (Instagram, Facebook, TikTok, Google, WhatsApp, otro)
- Objetivo (visibilidad, tráfico, conversión, ventas)
- Fecha de inicio y fin
- Presupuesto planeado
- Gasto real acumulado
- Productos o categorías promocionados
- Estado (activa, pausada, finalizada)

### Gasto publicitario

Registro de cada pago realizado en concepto de publicidad.

- Monto y moneda
- Plataforma
- Fecha
- Campaña asociada
- Comprobante (archivo o referencia)
- Notas

### Atribución de pedidos

Asociación entre un pedido y la campaña que lo originó.

En la fase inicial, la atribución es **manual**: el vendedor o administrador indica la fuente del pedido al crearlo.

En fases futuras, se podrá incorporar UTM tracking para atribución automática desde la tienda online.

### Fuente comercial

Campo en el pedido que indica cómo llegó el cliente:

- Campaña de Instagram
- Campaña de Facebook
- Búsqueda orgánica
- Referido
- WhatsApp directo
- Visita directa
- Otro

---

## Métricas previstas

| Métrica | Descripción |
|---|---|
| Gasto total por campaña | Suma de todos los pagos asociados |
| Pedidos atribuidos | Cantidad de pedidos cuyo origen es la campaña |
| Ingresos atribuidos | Suma de ingresos de pedidos atribuidos |
| Costo por pedido | Gasto total / pedidos atribuidos |
| Costo por venta | Gasto total / ventas completadas atribuidas |
| Rentabilidad post-publicidad | Ganancia neta después de descontar gasto publicitario |
| ROAS (Return on Ad Spend) | Ingresos atribuidos / gasto total |

El ROAS y la rentabilidad post-publicidad requieren acceso a los costos, por lo que son métricas de acceso restringido.

---

## Atribución inicial

La atribución en las primeras fases del sistema será manual porque:

1. No existe tracking automático en la primera versión de la tienda.
2. Muchas ventas ocurren por WhatsApp, fuera del flujo digital rastreable.
3. El equipo de ventas conoce el origen de los pedidos.

**La atribución automática con UTM** se planificará cuando la tienda online esté operativa y se tenga un volumen de tráfico digital significativo.

---

## Relación con otros dominios

| Dominio | Relación |
|---|---|
| `sales` | Los pedidos contienen la fuente de atribución |
| `catalog` | Las campañas se vinculan a productos o categorías |
| `finance` | Los gastos publicitarios se registran como egresos |
| `reports` | Los reportes de marketing agregan campañas, gastos y resultados |

---

## Lo que el módulo de marketing NO hace

- No publica contenido en Instagram, Facebook, TikTok ni ninguna red social.
- No gestiona creatividades publicitarias (imágenes, videos, textos de anuncios).
- No se conecta a las APIs de Meta Ads o Google Ads en la fase inicial.
- No reemplaza las herramientas de gestión de anuncios de las plataformas.

Su función es el **registro, control y medición** de la inversión publicitaria.
