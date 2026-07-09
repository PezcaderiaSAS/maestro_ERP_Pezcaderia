# Control de Calidad 2 — Reporte de Consistencia y Alineación Cruzada

**Fecha de Auditoría:** 2026-07-08  
**Artefactos Auditados:** `speckit_specify.md` → `speckit_checklist.md` → `speckit_plan.md` → `task.md`

---

## Matriz de Trazabilidad

| ID | Requerimiento (Spec) | En Checklist | En Plan | En Tasks | Estado |
| --- | --- | --- | --- | --- | --- |
| R1 | Restaurar visibilidad del input "CANT." | ✅ Sección 1 + DoD #1 | ✅ Sección B (`flex-1`) | ✅ Tarea 2 | ✅ ALINEADO |
| R2 | Altura uniforme de tarjetas | ✅ Sección 2, Consistencia Visual | ✅ Sección A (`h-full`) | ✅ Tarea 1 | ✅ ALINEADO |
| R3 | Ocultar spinners nativos | ✅ Sección 2, Accesibilidad | ✅ Sección C (appearance) | ✅ Tarea 2, paso 2 | ✅ ALINEADO |
| R4 | `tsc --noEmit` pasa sin errores | ✅ DoD #4 | ✅ Sección 3, paso 1 | ✅ Tarea 3 | ✅ ALINEADO |
| R5 | Verificación visual en browser | ✅ DoD #1 implícito | ✅ Sección 3, paso 2 | ✅ Tarea 4 | ✅ ALINEADO |

---

## Fisuras Detectadas

### ⚠️ FISURA #1 (MEDIA): Causa Raíz Desactualizada en la Spec

- **Ubicación:** `speckit_specify.md`, Sección 1, "Causa Técnica" (L9).
- **Problema:** La Spec describe que el input colapsó porque "el contenedor padre no le proporciona un ancho base de referencia". Sin embargo, el CQ-1 (Preguntas Estructuradas) corrigió esto: la causa real es la ausencia de `flex-1` en el propio `<input>`, no en el contenedor. El Plan y la Checklist reflejan la causa corregida, pero la **Spec sigue teniendo el diagnóstico desactualizado**.
- **Riesgo:** Si un desarrollador futuro lee solo la Spec, entenderá incorrectamente la causa raíz.
- **Remediación:** Actualizar `speckit_specify.md`, Sección 1, "Causa Técnica" con el diagnóstico correcto documentado en la Checklist.

### ⚠️ FISURA #2 (BAJA): El Plan menciona `w-full` en el snippet pero lo elimina en la Task

- **Ubicación:** `speckit_plan.md` L47 (snippet) vs. `task.md` Tarea 2, paso 1.
- **Problema:** El snippet del Plan usa `flex-1 min-w-0` (correcto y sin `w-full`). La Task también dice "reemplazar `w-full` por `flex-1`". Sin embargo, el código actual en producción en `CalculadorDenominaciones.tsx` (L94) ya tiene `w-full min-w-0`. Necesitamos verificar que el Task esté describiendo correctamente la acción: **reemplazar** `w-full` por `flex-1`, **no añadir** `flex-1` adicionalmente.
- **Riesgo:** El agente podría duplicar clases (`flex-1 w-full`) si no elimina la anterior.
- **Remediación:** Clarificar explícitamente en Tarea 2 que se debe ELIMINAR `w-full` y AÑADIR `flex-1` como reemplazo.

### ℹ️ OBSERVACIÓN #1 (INFORMATIVA): Task no incluye casos de borde del Plan

- **Ubicación:** `speckit_plan.md` Sección 3 ("Casos de borde") vs. `task.md` Tarea 4.
- **Problema:** El Plan de Verificación menciona casos de borde específicos (digitar 4 cifras, encoger ventana). La Tarea 4 de verificación visual solo menciona 3 puntos de alto nivel, omitiendo los casos de borde.
- **Riesgo:** Muy bajo. Es un proceso de QA informal, no código. No genera riesgo de regresión.
- **Remediación:** Opcional — añadir los casos de borde a Tarea 4 para mayor cobertura.

---

## Veredicto General

> **2 fisuras detectadas (1 MEDIA, 1 BAJA) + 1 observación informativa.**
> El pipeline está sustancialmente alineado y es apto para implementación, condicionado a la corrección de las fisuras antes de ejecutar.

**Acciones requeridas antes de implementar:**

1. Actualizar la "Causa Técnica" en `speckit_specify.md`.
2. Clarificar "reemplazar, no añadir" en `task.md`, Tarea 2.

---
**Estado:** ⏳ ESPERANDO APROBACIÓN PARA PROCEDER CON LAS CORRECCIONES Y LUEGO LA IMPLEMENTACIÓN.
