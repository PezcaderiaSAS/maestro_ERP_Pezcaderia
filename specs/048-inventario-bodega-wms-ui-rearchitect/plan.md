# Plan de Implementación Técnica: SPEC-048
## Reestructuración UI/UX Integral de Inventario & Bodega WMS (`InventoryView.tsx`)

- **Código:** SPEC-048
- **Fase:** Spec Kit SDD v3.0 — `/speckit.plan`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto.
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

## 1. Arquitectura de Componentes Modulares

Para cumplir con la directiva constitucional de "cero lógica pesada en las vistas" y "archivos de menos de 400 líneas con alta cohesión y bajo acoplamiento", `InventoryView.tsx` se refactoriza extrayendo sus secciones operativas en componentes atómicos:

```
src/views/inventory/components/
├── InventoryHeroHeader.tsx        # Título, selector de Bodega/Cámara, status online
├── InventoryBentoKpis.tsx         # Bento Grid de 4 KPIs ejecutivos en tiempo real
├── InventoryQuickActionBar.tsx    # Barra de botones de acción rápida ergonómica (Fitts >= 48px)
├── InventoryFloatingPills.tsx     # Barra de navegación flotante Sticky (Hick, 7 pestañas)
├── tabs/
│   ├── StockCatalogTab.tsx        # Pestaña 1: StockMatrizTable + ProductTable
│   ├── ColdRoomsTab.tsx           # Pestaña 2: Monitoreo de cuartos fríos & cámaras
│   ├── FefoTraceabilityTab.tsx    # Pestaña 3: Trazabilidad de lotes perecederos FEFO
│   ├── YieldDissectionTab.tsx     # Pestaña 4: Mermas de despiece & rendimiento
│   ├── ParetoAbcTab.tsx           # Pestaña 5: Clasificación 80/20 y rotación
│   ├── DockTransferTab.tsx        # Pestaña 6: Recepciones de muelle y traslados
│   └── KardexAuditTab.tsx         # Pestaña 7: Historial de movimientos & kardex
```

---

## 2. Gestión de Estado Reactivo (Zustand Stores)

1. **`useInventoryStore.ts`:**
   - Catálogo maestro de productos y sincronización local/remota.
   - Cálculo reactivo de totales de valorización monetaria.
2. **`useWarehouseStore.ts`:**
   - Lista de bodegas y cuartos fríos activos por `tenantId`.
   - Control de capacidad máxima en Kg y ocupación actual.
   - Almacenamiento de temperatura actual (°C) con indicador semafórico.
3. **`useMovementStore.ts`:**
   - Movimientos de entrada, salida, traslado y merma.
   - Historial de transacciones de despiece de materia prima a derivados.
4. **`useScientificAnalytics` (Cálculo Determinista):**
   - Pareto ABC 80/20 matemático según valor de rotación acumulada.
   - Cálculo de porcentaje de merma:
     $$\text{Merma \%} = \frac{\text{Peso Entrada} - \text{Peso Filete} - \text{Subproductos}}{\text{Peso Entrada}} \times 100$$

---

## 3. Especificación Visual y Tokens de Diseño

- **Atmósfera Glassmorphism:**
  - Fondo global: `bg-[#0B0F19]`
  - Tarjetas Bento: `bg-[#131C2E]/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl shadow-cyan-950/10`
  - Floating Pills Bar: `sticky top-3 z-30 bg-[#0F172A]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5`
- **Tipografía & Datos:**
  - Importes y métricas de peso: `font-mono font-black text-slate-100`
  - Badges de alerta: `font-mono text-xs font-bold px-2 py-0.5 rounded-full border`
- **Acentos Semafóricos FEFO & Frío:**
  - Óptimo (> 7 días): `bg-emerald-500/10 text-emerald-400 border-emerald-500/30`
  - Alerta (48h a 7 días): `bg-amber-500/10 text-amber-400 border-amber-500/30`
  - Crítico (< 48h): `bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse`

---

## 4. Plan de Pruebas TDD y Cobertura

1. **`src/tests/inventoryView7Tabs.test.tsx`:**
   - Test de renderizado del Bento Grid de 4 KPIs.
   - Test de conmutación fluida entre las 7 pestañas flotantes sin desmontajes erráticos.
   - Test de responsividad táctil de la barra de acciones rápidas ($\ge 48\text{px}$).
2. **`src/tests/fefoTraceability.test.tsx`:**
   - Test de ordenamiento prioritario por fecha de caducidad más próxima.
   - Test de semaforización de badges FEFO (< 48h crítico).
3. **`src/tests/dissectionYieldWaste.test.tsx`:**
   - Test matemático del cálculo de merma y disparo de alertas al superar el 35%.

---

## 5. Bucle de Validación DevTools MCP

- Auditoría en vivo contra `http://localhost:3000/`:
  1. Verificar **0 errores y 0 warnings** en la consola JS al navegar entre las 7 pestañas.
  2. Captura de pantalla de escritorio (`1280x800`): Bento Grid y Pills.
  3. Captura de pantalla móvil (`375x812`): Scroll horizontal suave de Pills y Bento Grid apilado.
