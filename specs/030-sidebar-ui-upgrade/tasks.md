# Desglose de Tareas de Implementación: /speckit.tasks (SPEC-030)

**Código:** SPEC-030  
**Fase:** /speckit.implement (SDD v3.0)  
**Ticket:** UIUX-SIDEBAR-FINAL  
**Título:** Implementación Definitiva: Premium Sidebar UI (Glassmorphism & macOS Style)  
**Estado:** COMPLETADO_Y_CERTIFICADO  
**Fecha:** 2026-10-26  
**Límite Kanban:** `WIP = 1` (Completado bajo estricto flujo TDD)  

---

## 1. Matriz de Tareas Secuenciales (Flujo TDD Estricto)

```
[TASK-030-01: Tests TDD RED] (OK) ──► [TASK-030-02: MacWindowControls] (OK) ──► [TASK-030-03: Shell Flotante & Usuario] (OK) ──► [TASK-030-04: Categorías & Estado Activo Rojo] (OK) ──► [TASK-030-05: Certificación DevTools] (OK)
```

---

### [x] TASK-030-01: Suite de Pruebas Unitarias TDD para Sidebar macOS Glassmorphism (COMPLETADA - FASE RED)
- **Objetivo:** Actualizar y extender `src/tests/enterpriseSidebar.test.tsx` con las aserciones de la nueva especificación.
- **Validaciones logradas:**
  - Existencia y renderizado de los tres controles de ventana macOS (`data-testid="mac-control-close"`, `data-testid="mac-control-minimize"`, `data-testid="mac-control-fullscreen"`).
  - Verificación de la llamada a colapso al pulsar el control amarillo.
  - Verificación de categorías de texto en mayúsculas (`MENU`, `OPERACIONES`, `GENERAL`).
  - Verificación de que el ítem activo incluya la clase del bloque rojo vibrante (`bg-red-600`).
  - Presencia del panel flotante despegado de los bordes (`rounded-3xl` y `backdrop-blur-2xl`).
- **Resultado:** Tests escritos y fallando controladamente (RED) previo a la implementación.

---

### [x] TASK-030-02: Construcción del Componente `MacWindowControls.tsx` (COMPLETADA - FASE GREEN)
- **Objetivo:** Implementar los controles de ventana estilo macOS con sus tres acciones nativas (Cerrar sesión SweetAlert2, Alternar colapso, Alternar Fullscreen).
- **Archivo creado:** `src/components/layout/components/MacWindowControls.tsx`.
- **Resultado:** Componente modular con microinteracciones `active:scale-90`, hover labels y soporte de fallbacks.

---

### [x] TASK-030-03: Contenedor Flotante Glassmorphism y Módulo de Usuario Superior (COMPLETADA - FASE GREEN)
- **Objetivo:** Adaptar el contenedor `<aside>` en `EnterpriseSidebar.tsx` a un panel flotante despegado de los bordes con `rounded-3xl`, `backdrop-blur-2xl`, `bg-slate-900/85` y reubicar la tarjeta de usuario en la parte superior debajo de los controles macOS.
- **Archivo modificado:** `src/components/layout/EnterpriseSidebar.tsx`.
- **Resultado:** Panel flotante estético (`top-3 bottom-3 left-3`), aceleración por hardware `transform: translateZ(0)` y tarjeta de usuario `sidebar-user-header` en la cabecera superior.

---

### [x] TASK-030-04: Categorización (MENU, OPERACIONES, GENERAL) y Estado Activo Rojo Vibrante (COMPLETADA - FASE GREEN)
- **Objetivo:** Agrupar las rutas en las tres secciones categorizadas con tracking amplio, aplicar el bloque rojo vibrante en los ítems activos y habilitar tooltips flotantes en modo colapsado (`w-20`).
- **Archivo modificado:** `src/components/layout/EnterpriseSidebar.tsx`.
- **Resultado:** Secciones `MENU`, `OPERACIONES` y `GENERAL` implementadas, bloque de color rojo vibrante `bg-red-600 text-white font-bold shadow-lg shadow-red-600/30` para ítems activos y cero pérdida de rutas ni tests.

---

### [x] TASK-030-05: Verificación Integral TDD, Auditoría SOLID y Bucle DevTools (COMPLETADA - CERTIFICADA)
- **Objetivo:** Certificar `tsc --noEmit` en 0 errores, suite completa de pruebas en verde, auditoría arquitectónica y prueba interactiva en vivo con Chrome DevTools.
- **Resultados de Ejecución:**
  - `npx vitest run src/tests/enterpriseSidebar.test.tsx`: **11/11 tests pasando (100% GREEN)**.
  - `npx tsc --noEmit`: **0 errores de compilación**.
  - Auditoría SOLID `node scripts/architecture/audit-solid-boundaries.cjs`: **0 violaciones críticas**.
  - Chrome DevTools MCP: Consola JS con **0 errores**; capturas validadas en móvil (375 px) y escritorio (1440 px).
