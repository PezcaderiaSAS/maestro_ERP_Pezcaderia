# Desglose de Tareas de Implementación: /speckit.tasks (SPEC-031)

**Código:** SPEC-031  
**Fase:** /speckit.implement (SDD v3.0)  
**Ticket:** EPIC-FRONTEND-GLASSMORPHISM-V8  
**Título:** Transformación Global del Frontend: Sistema de Diseño Premium (Glassmorphism & Dark UI V8)  
**Estado:** COMPLETADO_Y_CERTIFICADO  
**Fecha:** 2026-10-26  
**Límite Kanban:** `WIP = 1` (Completado bajo estricto flujo TDD y Harness2)  

---

## 1. Matriz de Tareas Secuenciales (Flujo TDD Estricto)

```
[TASK-031-01: Tests TDD RED Layout V8] (OK) ──► [TASK-031-02: Componente GlassCard.tsx] (OK) ──► [TASK-031-03: Topbar Flotante V8] (OK) ──► [TASK-031-04: Canvas Global & Rail Shell en App.tsx] (OK) ──► [TASK-031-05: Certificación Harness2 & DevTools] (OK)
```

---

### [x] TASK-031-01: Suite de Pruebas Unitarias TDD para Layout Shell Global V8 (COMPLETADA - FASE RED)
- **Objetivo:** Crear `src/tests/globalLayoutV8.test.tsx` con las pruebas que aseguren:
  - Renderizado de `GlassCard` con clases de Glassmorphism (`backdrop-blur-2xl`, `rounded-3xl`, `bg-slate-900/85`).
  - Renderizado de controles macOS dentro de `GlassCard` cuando `showMacControls={true}`.
  - Verificación del comportamiento del layout shell en `App.tsx` (topbar flotante, márgenes de contenido desacoplados, modo Rail del sidebar).
- **Resultado:** Tests escritos y fallando controladamente (RED) previo a la creación del código.

---

### [x] TASK-031-02: Construcción del Componente Atómico `GlassCard.tsx` (COMPLETADA - FASE GREEN)
- **Objetivo:** Implementar `src/components/layout/components/GlassCard.tsx` como el contenedor estándar de tarjetas y paneles para todo el ERP.
- **Detalle:** Superficie `bg-slate-900/85 backdrop-blur-2xl border border-white/12 shadow-2xl`, cabecera opcional con controles macOS, título en mayúsculas con alto tracking y badges de estado.
- **Resultado:** Componente creado y validado con specular highlight (`inset 0 1px 0 0 white/15`) y aceleración GPU `transform: translateZ(0)`.

---

### [x] TASK-031-03: Refactorización de la Barra Superior Flotante `EnterpriseTopbar.tsx` (COMPLETADA - FASE GREEN)
- **Objetivo:** Transformar la cabecera superior en un panel flotante despegado de los bordes con estética Dark Glassmorphism, buscador Omnibox integrado, indicador de red y botón de facturación POS con active state `bg-red-600`.
- **Resultado:** Topbar adaptada a tarjeta flotante `rounded-2xl` sobre fondo translúcido, sin romper breadcrumbs, selectores de bodega ni modales de usuario.

---

### [x] TASK-031-04: Transformación del Canvas Global y Shell Flotante en `App.tsx` (COMPLETADA - FASE GREEN)
- **Objetivo:** Configurar el fondo atmosférico `#0B0F19` con mesh gradients difusos, ajustar el layout para que el sidebar opere en modo Rail por defecto (`w-20`), y desvincular los contenedores de los bordes de la pantalla.
- **Resultado:** Canvas global con dos gradientes radiales atmosféricos (cyan e indigo), márgenes fluidos `lg:pl-24` / `lg:pl-68` y navegación fluida.

---

### [x] TASK-031-05: Certificación con Google Harness², Vitest, TypeScript y Chrome DevTools (COMPLETADA - CERTIFICADA)
- **Objetivo:** Ejecutar pipeline de verificación automatizada:
  - `npx vitest run src/tests/globalLayoutV8.test.tsx src/tests/enterpriseSidebar.test.tsx`: **16/16 tests pasando (100% GREEN)**.
  - `npx tsc --noEmit`: **0 errores de compilación**.
  - Auditoría SOLID `node scripts/architecture/audit-solid-boundaries.cjs`: **0 violaciones críticas**.
  - Pipeline de Google Harness² (`python tools/harness2/run_harness2.py --demo`): **2 tareas completadas, 0 fallos ($0 USD)**.
  - Bucle Chrome DevTools MCP en `http://localhost:3000/`: **0 errores en consola JS**, capturas verificadas en móvil (375 px) y desktop (1440 px).
