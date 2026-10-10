# Memoria Activa - La Pezcadería ERP

## Contexto Actual & Estado Global (Light Mode WCAG AA+ & SDD 006 Completado)
- **Estado Global:** Sistema 100% en Modo Claro (Light Mode) de alto contraste con tokens WCAG 2.2 AA+ (`.agents/skills/erp-pos-design-tokens/SKILL.md`).
- **Verificación Completa:**
  - `npx tsc --noEmit`: 0 errores de tipado.
  - `npx vitest run`: 49 suites de prueba ejecutadas, **321 tests pasando al 100%** (incluyendo 44 tests de frío).
  - **Bucle DevTools MCP en Vivo:** Probado en escritorio y móvil (375 px) con **0 errores en consola JS**.

## Módulo Alquiler de Cuarto Frío WMS 3PL (Especificación SDD 006 Completada)
- **Recepción Múltiple con Taras Heterogéneas:** Planilla interactiva de pesaje en báscula calibrada que permite registrar múltiples partidas para el mismo o diferentes productos con empaques y taras independientes (Canastillas: 2.0 kg, Cajas: 0.8 kg, Suelto: 0.0 kg), consolidando totales gravimétricos exactos en una sola Acta de Recepción (`REC-CF-XXXXXX`).
- **Creación Express de Cliente In-Situ (15 Segundos):** Sub-modal táctil express que permite registrar un cliente depositante y activar su contrato al vuelo sin salir del modal de pesaje ni perder partidas en curso, preseleccionándolo automáticamente.
- **Creación Rápida Individual y Múltiple de Productos (Batch):** Sub-modal táctil (`z-[9999]`) para registrar 1 a N especies/productos asociados al cliente activo. Soporta entrada por comas (ej. "Corvina, Pargo, Camarón"), configuración individual de empaques y taras, persistencia en Supabase + `localStorage` (`crearProductosCustodiaBatch`) y selección táctil a 1-toque mediante chips de productos habituales en la báscula.
- **Despacho Consolidado con Checklist Multi-Lote:** Modal con selector de cliente y checklist interactivo de todas sus existencias activas en custodia, con soporte para retiro total o parcial por lote, validación de saldos y emisión de una sola Acta de Salida (`DSP-CF-XXXXXX`).
- **Resiliencia Offline / Local:** Doble capa de persistencia (Supabase RPC con fallback transparente y sincronizado a `localStorage`), permitiendo operación ininterrumpida sin caídas.
- **Documentos PDF Oficiales:** Actas consolidadas de recepción y despacho multi-partida generadas con jsPDF en `coldStoragePdfService.ts`.

## Gobernanza UI/UX & Regla de los 12 Años
- **Flujo en 4 Pasos Visuales:** 1. Cliente/Contrato -> 2. Báscula/Recepción -> 3. Retiro/Despacho -> 4. Cobro en Caja.
- **Accesibilidad:** Botones táctiles $\ge 44\text{ px}$, chips de producto de un toque, inputs blancos con anillos índigo/esmeralda, etiquetas autoexplicativas y alertas SweetAlert2 con resúmenes claros.
