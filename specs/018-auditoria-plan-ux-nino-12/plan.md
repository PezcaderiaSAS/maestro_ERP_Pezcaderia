# Plan Técnico de Implementación: Auditoría y Refactorización UX/UI "Regla del Niño de 12 Años"

## 1. Arquitectura y Principios de Diseño
1. **Regla del Niño de 12 Años:**
   - Todo elemento interactivo táctil debe poseer una zona de contacto mínima de $48 \times 48\text{ px}$ (`min-w-[48px] min-h-[48px]`).
   - El botón de confirmación o acción principal de cada pantalla/modal debe tener una altura mínima de $56\text{ px}$ (`min-h-[56px] h-14`) con texto en negrita y tipografía $\ge 16\text{ px}$ (`text-base font-black`).
   - Ningún flujo operativo clave debe requerir más de 3 toques o pasos secuenciales para completarse.
   - Retroalimentación auditiva y visual inmediata (sonido de escaneo o confirmación, toasts no invasivos en esquina superior, loaders deterministas).
2. **Cero Uso de Imágenes (Zero-Cost Vector Graphics):**
   - Eliminación de etiquetas `<img>` residuales en toda la aplicación.
   - Renderizado 100% SVG vectorial temático mediante iconos de `lucide-react` con contenedores cromáticos Tailwind por categoría:
     - `Fish` para pescados frescos (`bg-sky-50 text-sky-700 border-sky-200`).
     - `Waves` o `Shell` para mariscos/camarones (`bg-amber-50 text-amber-700 border-amber-200`).
     - `Snowflake` para congelados e IQF (`bg-cyan-50 text-cyan-700 border-cyan-200`).
     - `Scissors` o `Layers` para filetes y cortes (`bg-emerald-50 text-emerald-700 border-emerald-200`).
     - `Package` para insumos y empaques (`bg-slate-50 text-slate-700 border-slate-200`).
   - Badges distintivos de modalidad de venta: ⚖️ KILOS (azul) vs 📦 UNIDADES (verde) y semáforo de stock (Verde / Amarillo / Rojo).
3. **Estandarización Light Mode WCAG 2.2 AA+:**
   - Ratios de contraste $\ge 4.5:1$ para texto regular y $\ge 7:1$ para títulos y cifras monetarias en COP.
   - Eliminación de textos atenuados ilegibles (`text-slate-400` sobre fondos oscuros en áreas operativas de alta luz ambiental).
   - Fondos limpios de alto contraste (`bg-white`, `border-slate-200`, `text-slate-900`).

---

## 2. Hoja de Ruta por Fases Operacionales

```
+-----------------------------------------------------------------------------------+
| FASE 1: PUNTO DE VENTA (POS MOSTRADOR & OFFLINE V2) Y CONTROL DE CAJA             |
| - Catálogo 100% Vectorial Táctil (Cero <img>, tarjetas min-h-[72px]).             |
| - Cobro en 2 clics: botón "Efectivo Exacto" (1-tap) + billetes rápidos COP.        |
| - Wizard de Cierre y Arqueo Ciego en 3 Pasos (Billetes -> Datáfono -> Ticket).     |
| - Calculador de denominaciones con botones táctiles >= 48px.                      |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| FASE 2: BODEGA, MUELLE (LLEGADA BCM) Y CUARTO FRÍO WMS (FEFO & CATCH WEIGHT)      |
| - Migración de BucaramangaReceivingWizard a Light Mode WCAG 2.2 AA+.               |
| - Botones de pesaje y tara en báscula >= 56px con confirmación auditiva/visual.    |
| - Wizard de traslados a sucursales en 2 toques ergonómicos.                       |
| - Propagación de WeightPackingModal y trazabilidad de canastillas a todo el WMS.  |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| FASE 3: DESPACHOS, RUTAS B2B Y CARTERA / CUENTAS POR COBRAR (AR)                 |
| - QuickAbonoModal.tsx táctil (Selector factura -> Botones 'Total'/'50%' -> Caja).  |
| - Tablero Kanban simplificado a 3 macro-estados (Preparación, En Ruta, Entregado). |
| - Vista móvil 375px optimizada con chips de filtro táctil >= 48px.                |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| FASE 4: PRODUCCIÓN/YIELD, NÓMINA, CONTABILIDAD NIIF Y DASHBOARD EJECUTIVO         |
| - Semáforo Ejecutivo en Dashboard (Caja hoy, Ventas B2B, Stock crítico).           |
| - Wizard de Nómina en 3 pasos (1. Empleado, 2. Novedades, 3. Pagar y Liquidar).   |
| - Libro Mayor NIIF simplificado con tarjetas de resumen visual y exportación.      |
+-----------------------------------------------------------------------------------+
```

---

## 3. Plan de Verificación y Criterios de Aceptación (Quality Gate)
1. **Regla de Cero Imágenes:**
   - 0 ocurrencias de etiquetas `<img>` o URLs externas en los componentes auditados y refactorizados.
   - Verificado mediante búsqueda automatizada en la suite de pruebas.
2. **Dimensiones Ergonómicas Táctiles:**
   - 100% de los botones e inputs interactivos cumplen con `min-w-[48px] min-h-[48px]`.
   - Botones de acción primaria (`btn-cobrar`, `btn-finalizar`, `btn-cerrar-turno`) cumplen con `min-h-[56px] h-14`.
3. **Flujos Reducidos:**
   - Cobro en efectivo estándar en $\le 2$ toques.
   - Arqueo de caja en 3 pasos secuenciales.
   - Recepción en muelle en 3 pasos guiados.
   - Abono de cartera en 2 toques.
4. **Verificación de Calidad y Pruebas:**
   - 100% de tests unitarios y de integración verdes en Vitest.
   - `tsc --noEmit` sin errores de compilación TypeScript.
   - Auditoría de arquitectura SOLID `scripts/architecture/audit-solid-boundaries.cjs` aprobada (`passed = true`).
   - Bucle DevTools MCP en vivo: 0 errores/warnings en consola JS y renderizado responsivo perfecto a **375 px**.
