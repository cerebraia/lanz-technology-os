# ADR-002 — Monolito modular

**Fecha:** 2026-07-29  
**Estado:** Aceptado  
**Autores:** Lanz Technology

---

## Contexto

Al diseñar la arquitectura de Lanz Technology OS, existe la decisión de cómo organizar el código: ¿un monolito clásico, microservicios, o algo intermedio?

El sistema cubrirá múltiples dominios de negocio (ventas, inventario, finanzas, importaciones, marketing, etc.) que están profundamente interrelacionados. El equipo de desarrollo es pequeño. El presupuesto de infraestructura es limitado en fases iniciales.

---

## Decisión

Construir Lanz Technology OS como un **monolito modular**.

Un monolito modular es una única aplicación desplegable cuyo código está organizado internamente en módulos (dominios) con límites explícitos, sin convertirse en microservicios separados.

---

## Razones

### Alineación con la etapa actual

El negocio y el sistema están en sus primeras fases. Los dominios están siendo definidos. Separar servicios prematuramente significa tomar decisiones de límites antes de tener el conocimiento suficiente para tomarlas bien.

Un monolito modular permite refinar esos límites internamente, y separar servicios en el futuro si realmente se necesita.

### Simplicidad de desarrollo

Con un equipo pequeño, la complejidad operacional de microservicios (despliegues independientes, redes entre servicios, trazabilidad distribuida) consume tiempo de ingeniería que debe ir al producto.

Un solo proceso significa:
- Una sola base de código
- Un solo ciclo de deploy
- Un solo log y un solo entorno de debug

### Simplicidad de despliegue

Un monolito se despliega con un solo proceso. No requiere orquestación de contenedores, service mesh ni infraestructura de red entre servicios.

### Transacciones consistentes

Los dominios de este sistema están altamente relacionados. Un pedido afecta el inventario y genera un registro financiero, simultáneamente. En un monolito, estas operaciones son transacciones de base de datos simples. En microservicios requieren sagas o transacciones distribuidas.

### Rendimiento

Sin latencia de red entre servicios. Las operaciones que cruzan dominios son llamadas a funciones, no llamadas HTTP.

---

## Ventajas operativas

- Un solo proceso para monitorear y reiniciar.
- Un solo pipeline de CI/CD.
- Depuración centralizada.
- Pruebas de integración más simples.
- Menor costo de infraestructura.
- Incorporación más rápida de nuevos desarrolladores.

---

## Límites entre dominios (la parte "modular")

A pesar de ser un monolito, los dominios tienen límites explícitos:

- Cada dominio vive en `features/<dominio>/`
- Un dominio **no importa** desde la carpeta interna de otro dominio
- La comunicación entre dominios ocurre a través de funciones de servicio públicas, no por acceso directo a estructuras internas
- Los tipos compartidos entre dominios viven en `types/`, no en el dominio que los define

Esta disciplina es lo que hace que el monolito sea modular: es posible razonar sobre cada dominio de forma independiente.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Acoplamiento accidental entre dominios | Definir y respetar límites explícitos desde el primer día |
| El monolito crece y se vuelve difícil de mantener | Los límites claros permiten extraer módulos cuando sea necesario |
| Escalado de un solo componente | En esta escala, el monolito escala verticalmente sin problema; la arquitectura no lo impide |
| Ciclos de deploy que afectan todo | Un solo deploy bien probado es más seguro que múltiples deploys sin coordinación |

---

## Condiciones bajo las cuales se evaluaría separar servicios

No se recomienda evaluar la separación en microservicios hasta que ocurra **al menos una** de estas condiciones:

1. Un dominio específico tiene requisitos de escalado significativamente distintos al resto (ej. el procesamiento de imágenes del catálogo consume muchos recursos mientras el resto del sistema está inactivo).
2. Un dominio necesita un ciclo de deploy independiente y frecuente, con un equipo dedicado.
3. El tiempo de build o el tamaño del monolito se convierte en un obstáculo real para la productividad.
4. Un dominio requiere una tecnología incompatible con el stack del monolito (ej. procesamiento de video en Python).

Ninguna de estas condiciones existe en la fase actual ni se anticipa en el corto plazo.

---

## Consecuencias

- Toda la aplicación vive en un solo repositorio (monorepo de un solo proyecto).
- Los límites entre dominios se mantienen por convención y revisión de código, no por separación física.
- El equipo de desarrollo puede moverse entre dominios sin cambiar de repositorio ni de entorno.
- La complejidad de infraestructura se mantiene mínima mientras el negocio crece.
- Si en el futuro se decide extraer un servicio, la modularidad interna facilitará esa extracción.
