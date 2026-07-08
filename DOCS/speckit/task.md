# Lista de Tareas (Task Tracker) — v2.0

Este documento contiene las tareas secuenciales para implementar la corrección visual del componente `CalculadorDenominaciones`.

**Instrucción para el Agente:** Ejecuta **UNA TAREA A LA VEZ**. Después de completar el código de una tarea, detente y espera confirmación antes de pasar a la siguiente.

**Cambios respecto a v1.0:** Correcciones aplicadas según Fisuras #1 y #2 del CQ-2.

---

## Fase 0: Correcciones de Artefactos (Pre-Implementación)

- [x] **Tarea 0.1: Corregir Fisura #1 — Causa Raíz en Spec**
  - Archivo: `DOCS/speckit/speckit_specify.md`
  - Acción: ~~Actualizar la "Causa Técnica" con el diagnóstico correcto del CQ-1.~~ ✅ COMPLETADO.

---

## Fase 1: Implementación de Clases Utilitarias (React/JSX)

- [x] **Tarea 1: Ajuste de Altura Uniforme en Tarjetas**
  - Archivo: `src/views/cash/components/CalculadorDenominaciones.tsx`
  - Línea objetivo: `<label>` dentro de `renderCard` (aprox. L63-L65).
  - Acción: Añadir la clase `h-full` al `className` del `<label>`.

- [x] **Tarea 2: Corrección del Colapso del Input + Ocultar Spinners**
  - Archivo: `src/views/cash/components/CalculadorDenominaciones.tsx`
  - Línea objetivo: `<input>` dentro de `renderCard` (aprox. L83-L94).
  - Acciones (**FISURA #2 — Aplicada**: la instrucción es REEMPLAZAR, NO AÑADIR):
    1. **ELIMINAR** la clase `w-full` del `className` del `<input>`.
    2. **AÑADIR** en su lugar la clase `flex-1` (para que el input negocie el espacio disponible dentro del contenedor flex).
    3. **AÑADIR** las clases para ocultar el spinner nativo del navegador:
       `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`.

---

## Fase 2: Verificación de Calidad y Testing

- [x] **Tarea 3: Testing de Integridad Estática**
  - Acción: Ejecutar `npx.cmd tsc --noEmit`. Verificar que la salida sea 0 errores y 0 advertencias.

- [x] **Tarea 4: Verificación Visual (Browser — Casos de Borde)**
  - Acción: Lanzar `browser_subagent` para capturar imagen del modal "Abrir Turno". Confirmar:
    1. ✅ Los inputs son lo suficientemente anchos para leer números (incluir 4 cifras: `9999`).
    2. ✅ Las tarjetas tienen altura consistente en la cuadrícula.
    3. ✅ No se observan flechas del spinner del navegador.
    4. ✅ La etiqueta "CANT." no se aplasta al encoger el modal o reducir el viewport.

---
*Versión 3.0-v2 (Calculadora de Base Fix — Post CQ-2)*
