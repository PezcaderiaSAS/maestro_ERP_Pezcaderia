---
name: systematic-debugging
description: Metodología rigurosa de depuración: reproducir el fallo, aislar causa raíz, formular hipótesis y verificar con DevTools.
---

# Depuración Sistemática (Systematic Debugging) — Protocolo v2.2

Este manual define el proceso metódico para resolver cualquier anomalía, fallo de test o error de consola en La Pezcaderia ERP.

## 1. Regla Anti-"Quick-Patch"
> **PROHIBIDO intentar arreglos al azar o "quick patches" sin evidencia documentada y reproducible.**
> Si un error aparece en la consola o en los tests, se debe seguir el ciclo formal de 4 fases antes de modificar cualquier línea de código.

## 2. El Ciclo de Depuración en 4 Fases

### Fase 1: Reproducción Concreta
- Identificar los pasos mínimos exactos para reproducir la falla.
- Escribir un test unitario o de integración automatizado que **falle** reproduciendo el error (etapa RED de TDD).
- Si es un fallo visual o de navegador, abrir la app e inspeccionar la consola JS con **Chrome DevTools MCP** (`get_console_message` / `evaluate_script`).

### Fase 2: Aislamiento de la Causa Raíz
- No tratar el síntoma; buscar el origen en el flujo de ejecución.
- Usar **GitNexus** (`context({name: "symbol"})` o `impact({target: "symbol", direction: "upstream"})`) para mapear quién invoca la función o servicio involucrado.
- Analizar llamadas asíncronas, estado global de Zustand o respuestas de Supabase.

### Fase 3: Formulación de Hipótesis y Corrección Mínima
- Formular una hipótesis verificable: *"El componente crashea porque la propiedad X llega undefined cuando el estado de sincronización offline es 'pending'"*.
- Diseñar la corrección quirúrgica más limpia y modular posible, respetando la inmutabilidad y los tipos de TypeScript.

### Fase 4: Verificación Obligatoria
- Ejecutar la suite de tests (`pnpm test:run` o `vitest`).
- **Loop Obligatorio de DevTools:**
  1. Abrir la página en Chrome DevTools.
  2. Verificar 0 errores y 0 warnings en la consola JS.
  3. Comprobar vista responsiva a 375 px (móvil).
  4. Simular la interacción que causaba el fallo para verificar la solución definitiva.
- Documentar la resolución y actualizar `MEMORY.md` si se descubrió un patrón que deba evitarse en el futuro.
