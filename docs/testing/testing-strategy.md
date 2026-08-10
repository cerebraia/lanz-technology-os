# Estrategia de pruebas

Define el enfoque de calidad y la estrategia de pruebas para Lanz Technology OS.

**Estado: No implementado.** Los frameworks de prueba se incorporarán cuando el volumen de lógica de negocio lo justifique.

---

## Principio general

La calidad no es solo sinónimo de pruebas automatizadas. Antes de cualquier framework, la primera capa de calidad son:

1. TypeScript estricto que previene errores de tipos
2. ESLint que detecta problemas de código
3. Build exitoso que valida la compilación

Estas tres validaciones son **obligatorias** antes de cualquier commit o entrega.

---

## Capas de calidad

### Capa 1: Validación estática (activa desde Fase 1)

**Herramientas:** TypeScript, ESLint, `next build`

**Qué detecta:**
- Errores de tipos en tiempo de compilación
- Violaciones de convenciones de código
- Importaciones incorrectas
- Componentes mal configurados

**Cuándo ejecutar:** En cada ciclo de trabajo. Antes de cualquier commit.

**Comandos:**
```bash
npm run typecheck   # TypeScript sin emitir archivos
npm run lint        # ESLint sobre todo el proyecto
npm run build       # Compilación completa
```

---

### Capa 2: Pruebas unitarias (incorporar en Fase 3+)

**Propósito:** Verificar funciones puras y reglas de negocio de forma aislada.

**Dónde se aplican:**
- Funciones de la capa de dominio (`features/<dominio>/domain/`)
- Utilidades de `lib/format/`, `lib/validation/`
- Cálculos financieros y de inventario

**Qué NO se prueba unitariamente:**
- Componentes React en esta etapa (demasiado acoplamiento con el framework)
- Llamadas a base de datos (se prueban en integración)

**Framework previsto:** Vitest (por compatibilidad con el ecosistema ESM y TypeScript)

**Criterio de incorporación:** Cuando existan al menos 5 funciones de dominio no triviales que justifiquen el overhead de configuración.

---

### Capa 3: Pruebas de integración (incorporar en Fase 4+)

**Propósito:** Verificar que los casos de uso funcionen correctamente con la base de datos real.

**Dónde se aplican:**
- Server Actions completas (desde validación hasta persistencia)
- Flujos que cruzan múltiples dominios (ej. confirmar pedido → reservar inventario → registrar ingreso)

**Estrategia:**
- Base de datos de prueba separada (Supabase proyecto de test)
- Datos de prueba reproducibles con fixtures
- Limpiar datos entre pruebas

**Criterio de incorporación:** Cuando se implementen los primeros Server Actions de negocio en la Fase 3.

---

### Capa 4: Pruebas end-to-end (incorporar en Fase 5+)

**Propósito:** Verificar flujos completos desde el navegador.

**Flujos críticos a cubrir:**
- Compra en la tienda pública (Fase 5)
- Login y acceso al admin (Fase 3)
- Creación de pedido desde el admin (Fase 6)
- Ajuste de inventario (Fase 7)

**Framework previsto:** Playwright (compatible con Next.js App Router y Server Components)

**Criterio de incorporación:** Cuando la tienda pública sea accesible (Fase 5).

---

### Capa 5: Pruebas de permisos (incorporar en Fase 3)

**Propósito:** Garantizar que el sistema de permisos funciona correctamente.

**Qué se prueba:**
- Un usuario sin sesión no puede acceder a rutas del admin
- Un Salesperson no puede ejecutar acciones de Administrator
- Un permiso denegado no es bypasseable por manipulación de la URL o el payload

**Estrategia:**
- Pruebas de integración con usuarios de distintos roles
- Verificación de que cada Server Action valida permisos

---

### Capa 6: Pruebas de inventario (incorporar en Fase 7)

**Propósito:** Garantizar las invariantes del módulo de inventario.

**Casos críticos:**
- El saldo nunca queda negativo salvo excepción documentada
- Los movimientos compensatorios corrigen correctamente el saldo
- Las reservas se contabilizan separadamente del saldo disponible
- Al cancelar un pedido, la reserva se libera correctamente

---

### Capa 7: Pruebas de cálculos financieros (incorporar en Fase 8)

**Propósito:** Verificar que los cálculos de costos, ingresos, rentabilidad y flujo de caja son correctos.

**Casos críticos:**
- El ingreso de un pedido se registra correctamente
- Los gastos de importación se distribuyen según la lógica definida
- La rentabilidad por producto usa el costo histórico correcto
- Los cálculos de ROAS usan el gasto real, no el presupuestado

**Consideración:** Los cálculos financieros deben ser deterministas y testeables con valores fijos.

---

### Capa 8: Pruebas de regresión (incorporar desde Fase 5)

**Propósito:** Garantizar que los cambios nuevos no rompen funcionalidades existentes.

**Estrategia:**
- Suite de pruebas E2E que cubra los flujos más críticos
- Ejecutar la suite completa antes de cada release
- Los errores de regresión se convierten en nuevas pruebas antes de corregirlos

---

## Cobertura vs. confianza

No se persigue un porcentaje de cobertura como objetivo. Se persigue confianza en que:

1. Las reglas de negocio críticas se comportan correctamente
2. Los permisos protegen los datos sensibles
3. Los cálculos financieros son precisos
4. Los flujos de usuario más importantes funcionan de extremo a extremo

La cobertura es una consecuencia de probar lo correcto, no el objetivo en sí.

---

## Cuándo NO agregar pruebas

- No probar código generado por el framework (ej. routing de Next.js)
- No probar funcionalidades triviales sin lógica (ej. un componente que solo renderiza texto)
- No duplicar pruebas entre capas (si está probado en integración, no duplicar en unitario)
- No probar la UI visual mediante pruebas de snapshot (demasiado frágil y costoso de mantener)

---

## Configuración prevista

```
# Pruebas unitarias e integración
vitest.config.ts

# Pruebas E2E
playwright.config.ts

# Archivos de prueba
features/<dominio>/__tests__/
  unit/
  integration/
e2e/
  flows/
```

No crear esta estructura hasta que los frameworks se incorporen en la fase correspondiente.
