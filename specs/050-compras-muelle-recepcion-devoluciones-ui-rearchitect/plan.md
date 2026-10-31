# Plan de Implementación Técnica: SPEC-050
## Reestructuración UI/UX Integral de Compras, Muelle & Devoluciones B2B

- **Código:** SPEC-050
- **Fase:** Spec Kit SDD v3.0 — `/speckit.plan`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto.
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

## 1. Arquitectura de Componentes Modulares

Siguiendo la directiva de modularidad extrema y archivos concisos (< 400 líneas), la recepción en muelle y compras se estructura en componentes atómicos de alta cohesión:

```
src/views/inventory/components/dock/
├── DockHeroHeader.tsx              # Resumen del furgón, status de báscula y temperatura
├── ScaleIndustrialDisplay.tsx      # Display numérico font-mono text-3xl & botones Fitts >= 56px
├── BucaramangaStepWizard.tsx       # Orquestador del wizard de 4 pasos secuenciales
├── CanastillaPesajeGrid.tsx        # Grid histórico de pesadas por canastilla con subtotal neto
├── InvimaQualityChecklist.tsx      # Checklist sensorial visual (Ojos, Agallas, Olor, Textura)
├── DockSummaryReconciliation.tsx   # Panel de conciliación financiera: Mermas, CxP y Notas
└── ReturnsQualityInspector.tsx     # Protocolo de cuarentena y re-pesaje de devoluciones B2B
```

---

## 2. Integración de Estado y Servicios

1. **Integración con Báscula (`useBalanza.ts`):**
   - Transmisión continua de peso (Kg) con detección de estabilidad (`isStable: boolean`).
   - Comandos de control directo: `tarar()`, `capturarPeso()`, `reiniciar()`.
2. **Validación Zod (`purchasesBucaramanga.schema.ts` & `dockReceiving.schema.ts`):**
   - Garantizar que cada pesada satisfaga:
     $$\text{Peso Bruto} > \text{Tara} > 0 \implies \text{Peso Neto} > 0$$
   - Tolerancia de merma de viaje con alertas automáticas:
     - $\le 3\%$: Normal (verde esmeralda).
     - $3\% - 7\%$: Advertencia (ámbar supervisor).
     - $> 7\%$: Retención (rojo crítico).
3. **Persistencia & Kardex NIIF:**
   - Creación atómica de lotes perecederos FEFO en `useWarehouseStore`.
   - Generación de asientos de entrada en `useMovementStore` con costo unitario de compra ponderado.

---

## 3. Especificación Visual (Dark Glassmorphism 60-30-10)

- **Contenedores de Paso:** `bg-[#131C2E]/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl`
- **Báscula Display:** `bg-[#0B0F19] border-2 border-cyan-500/40 rounded-2xl p-4 text-center shadow-lg shadow-cyan-500/10`
- **Tipografía Números Báscula:** `font-mono text-3xl sm:text-4xl font-black text-slate-100 tracking-wider`
- **Botones de Operario (Ley de Fitts):** `min-h-[56px] text-sm font-black px-6 rounded-xl transition-all active:scale-[0.98]`
  - Botón Capturar: `bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30`
  - Botón Tara: `bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30`
  - Botón Estabilizar: `bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700`

---

## 4. Plan de Pruebas TDD

1. **`src/tests/scaleIndustrialDisplay.test.tsx`:**
   - Test de renderizado del display de báscula en `font-mono`.
   - Test de botones táctiles $\ge 56\text{px}$ y disparo de callbacks de Tara y Captura.
2. **`src/tests/bucaramangaReceivingWizard.test.tsx` (Regresión):**
   - Garantizar que los 10 tests existentes sigan pasando al 100%.
3. **`src/tests/dockSummaryReconciliation.test.tsx`:**
   - Test de cálculo de semáforo de mermas ($\le 3\%$, $3-7\%$, $> 7\%$).

---

## 5. Bucle DevTools MCP

- Auditoría en vivo contra `http://localhost:3000/` navegando a la pestaña `Recepción Furgón`:
  1. Verificar **0 errores y 0 warnings fatales** en consola JS.
  2. Captura de pantalla de escritorio (`1280x800`).
  3. Captura de pantalla móvil (`375x812`).
