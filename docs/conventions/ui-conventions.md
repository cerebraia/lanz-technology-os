# Convenciones de interfaz

Define los principios de diseño y experiencia de usuario para Lanz Technology OS.

**Estado parcial:** Los principios son definitivos. El sistema de diseño visual se construirá progresivamente.

---

## Filosofía visual

Lanz Technology vende tecnología premium. La interfaz debe reflejar esa identidad:

- **Limpia:** sin elementos innecesarios en pantalla.
- **Precisa:** cada dato visible tiene un propósito operativo o comercial.
- **Confiable:** las acciones tienen consecuencias claras y predecibles.
- **Profesional:** orientada a usuarios internos competentes, no a consumidores casuales.

---

## Mobile-first

Todo componente se diseña primero para pantallas pequeñas y se expande para pantallas grandes.

- El operador de ventas puede gestionar pedidos desde su teléfono.
- Los formularios deben ser utilizables con una mano.
- Los botones primarios deben tener al menos 44px de alto en móvil.
- Las tablas deben colapsar en filas apiladas o permitir scroll horizontal en móvil.
- No asumir que el usuario tiene acceso a teclado y ratón.

---

## Jerarquía visual

- Un solo elemento de acción principal por pantalla o sección.
- Los datos más importantes visibles sin scroll.
- Usar tamaños de texto para comunicar importancia, no colores.
- Colores de estado reservados para semántica: verde (éxito/disponible), rojo (error/peligro), amarillo (advertencia/pendiente), azul/gris (información/inactivo).

---

## Navegación

- Simple y predecible. El usuario debe saber siempre dónde está.
- Sin menús de más de dos niveles de profundidad.
- Las rutas del centro de operaciones son distintas a las de la tienda pública.
- El breadcrumb es útil en flujos de más de dos niveles.
- No usar tabs en móvil si superan 4 elementos.

---

## Estados de carga

- Toda operación asíncrona tiene un indicador de carga visible.
- Preferir skeleton screens sobre spinners para contenido de lista o tabla.
- No bloquear toda la interfaz por una operación parcial.
- En formularios, desactivar el botón de envío mientras se procesa.

---

## Estados vacíos

- Cuando una lista no tiene datos, mostrar un mensaje claro y accionable.
- No mostrar una tabla vacía sin explicación.
- El estado vacío debe sugerir qué acción tomar a continuación.

Ejemplo: "No hay productos registrados. Agrega tu primer producto."

---

## Estados de error

- Los errores se muestran cerca del elemento que los originó.
- Los errores de formulario aparecen junto al campo correspondiente.
- Los errores de sistema se muestran en un área visible pero no intrusiva.
- El mensaje de error debe explicar qué pasó y, si es posible, cómo resolverlo.
- No mostrar mensajes técnicos ni stack traces al usuario.

---

## Accesibilidad

- Todos los formularios tienen etiquetas (`<label>`) correctamente asociadas a sus campos.
- Las imágenes tienen texto alternativo descriptivo.
- Los colores no son el único indicador de estado (se acompaña de texto o ícono).
- Los botones de acción tienen texto visible o aria-label descriptivo.
- El contraste de texto cumple con WCAG AA como mínimo.
- El orden de foco con teclado es lógico.

---

## Formularios

- Los campos requeridos se indican claramente.
- Los mensajes de error aparecen tras la interacción (no antes de que el usuario toque el campo).
- Los formularios largos se agrupan en secciones con títulos claros.
- Las acciones de formulario tienen confirmación cuando son destructivas.
- El botón principal de envío es claro y único por formulario.

---

## Tablas

- Las columnas más importantes están primero (en móvil se muestran las críticas, el resto colapsa).
- Las tablas con muchos datos tienen paginación o carga incremental.
- Las acciones por fila son accesibles sin seleccionar múltiples filas primero.
- Las columnas numéricas se alinean a la derecha.
- Los encabezados de columna indican si son ordenables.

---

## Confirmación para acciones sensibles

Las siguientes acciones requieren confirmación explícita del usuario antes de ejecutarse:

- Cancelar un pedido
- Eliminar o desactivar un usuario
- Ajustar inventario
- Modificar una configuración crítica
- Cualquier acción que sea difícil o imposible de revertir

La confirmación debe ser un diálogo claro, no un simple `window.confirm`. Debe indicar las consecuencias de la acción.

---

## Dashboards

- No sobrecargar el dashboard con métricas que no se usan diariamente.
- Solo métricas accionables: pedidos pendientes, stock bajo, importaciones activas.
- Las métricas financieras (costos, rentabilidad) solo son visibles para administradores.
- El dashboard del vendedor es distinto al del administrador.

---

## Animaciones

- No usar animaciones decorativas. Solo transiciones funcionales.
- Las transiciones de estado (carga, éxito, error) pueden tener animaciones breves (< 200ms).
- Respetar `prefers-reduced-motion` del sistema operativo del usuario.

---

## Consistencia visual

- Los componentes iguales tienen el mismo aspecto en toda la aplicación.
- No crear variantes ad-hoc de botones, badges o inputs fuera del sistema de diseño.
- Las etiquetas de estado usan los mismos colores en todas las secciones (un pedido "cancelado" es siempre rojo, en cualquier módulo).
- Las acciones primarias tienen siempre el mismo estilo visual.

---

## Sistema de diseño

**Estado:** No construido. Se desarrollará progresivamente a partir de la Fase 4.

El sistema de diseño incluirá:
- Paleta de colores (light y dark mode)
- Tipografía (Geist Sans como fuente base)
- Espaciado
- Primitivos de UI en `components/ui/`
- Guía de uso por componente

No construir el sistema de diseño completo antes de tener funcionalidades reales que implementar.
