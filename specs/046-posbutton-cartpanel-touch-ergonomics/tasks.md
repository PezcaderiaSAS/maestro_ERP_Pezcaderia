# Lista de Tareas Atómicas de Implementación: SPEC-046
# Estandarización de Ergonomía Táctil POS, Componente Canónico PosButton y Rejilla Responsiva CartPanel

- **Código:** SPEC-046
- **Fase:** Spec Kit SDD v3.0 — `/speckit.tasks`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto (RED -> GREEN -> REFACTOR).
- **Estado:** 100% COMPLETADO & CERTIFICADO

---

### Tablero Kanban de Implementación (Límite WIP = 1)

```
┌──────────────────────────────────────┬──────────────────────────────────────┬──────────────────────────────────────┐
│         EN PROCESO (WIP = 1)         │              POR HACER               │              TERMINADO               │
├──────────────────────────────────────┼──────────────────────────────────────┼──────────────────────────────────────┤
│ 🚀 TODAS LAS TAREAS COMPLETADAS      │ —                                    │ ✅ TASK-046-01: PosButton.tsx (48px) │
│    SPEC-046 100% CERTIFICADO         │                                      │ ✅ TASK-046-02: Suite Vitest Touch   │
│                                      │                                      │    (9/9 tests verdes al 100%)        │
│                                      │                                      │ ✅ TASK-046-03: Refactor CartPanel   │
│                                      │                                      │    (10/10 tests verdes al 100%)      │
│                                      │                                      │ ✅ TASK-046-04: Bucle DevTools en    │
│                                      │                                      │    vivo (0 errores consola JS)       │
└──────────────────────────────────────┴──────────────────────────────────────┴──────────────────────────────────────┘
```

---

### Desglose de Tareas Atómicas

#### 📋 `TASK-046-01` (POR HACER): Creación del Componente Canónico `PosButton.tsx`
- **Objetivo:** Implementar en `src/views/pos/components/PosButton.tsx` el botón táctil base con tamaño mínimo de 48×48 px (`min-h-[48px] min-w-[48px]`), microinteracciones hápticas `active:scale-[0.98]`, variantes semánticas y etiquetas de atajo `<kbd>`.
- **Archivos a crear:**
  - `src/views/pos/components/PosButton.tsx`
- **Criterio de Aceptación:** Componente tipado con TypeScript estricto, sin dependencias circulares, 0 errores `tsc --noEmit`.

---

#### 📋 `TASK-046-02` (POR HACER): Actualización y Verificación de Suite Vitest TDD
- **Objetivo:** Crear/actualizar las pruebas en `src/tests/posTouchErgonomics.test.tsx` verificando que `PosButton` cumpla con el target de 48px, aria-labels y clases de microinteracción.
- **Archivos:**
  - `src/tests/posTouchErgonomics.test.tsx`
- **Criterio de Aceptación:** Suite ejecutada con `npm test -- posTouchErgonomics` pasando al 100%.

---

#### 📋 `TASK-046-03` (POR HACER): Refactorización Quirúrgica de `CartPanel.tsx`
- **Objetivo:** Sustituir los botones dispersos dentro de `CartPanel.tsx` por `<PosButton>`, aplicar `font-mono tabular-nums` a los totales monetarios, e incorporar `overscroll-contain` al contenedor de ítems sin alterar las firmas de `CartPanelProps`.
- **Archivos:**
  - `src/views/pos/components/CartPanel.tsx`
- **Criterio de Aceptación:** Todas las 333 referencias ascendentes funcionando, tests existentes de `CartPanel` pasando en verde, 0 roturas.

---

#### 📋 `TASK-046-04` (POR HACER): Lanzamiento de Servidor Vite & Bucle de Validación DevTools MCP
- **Objetivo:** Desplegar Vite con `npm run dev`, auditar la interfaz táctil en vivo a 375 px y 1280 px, y verificar 0 errores y 0 warnings en la consola JavaScript.
- **Criterio de Aceptación:** Consola limpia al 100% y reporte visual certificado.
