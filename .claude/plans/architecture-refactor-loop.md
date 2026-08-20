# Loop Runbook: Architecture & Refactoring Loop (MaestroPescaderia ERP)

## 1. Loop Metadata
- **Pattern:** `sequential`
- **Mode:** `safe` (Gates estrictos y verificación completa tras cada iteración)
- **Stop Condition:** Cuando se resuelvan todos los ciclos de importación circular, conflictos unmerged de git y se desacoplen las vistas de `useAppStore`.

## 2. Iteraciones Planificadas

### Iteración 1: Resolución de Conflictos Unmerged de Git
- **Objetivo**: Limpiar las marcas de conflicto (`<<<<<<<`, `=======`, `>>>>>>>`) en `package.json`, `src/App.tsx`, `src/index.css`, `src/services/cashService.ts`, y `src/types/cash.types.ts`.
- **Validación**: `pnpm test` ejecuta sin errores de sintaxis en bundling.

### Iteración 2: Extracción de Tipos y Eliminación de Ciclos Circulares (Cash Module)
- **Objetivo**: Extraer interfaces compartidas a `src/types/caja.types.ts` y romper los 7 ciclos de dependencia entre `App.tsx` ➔ `CashFlowView` ➔ `cashService` ➔ `App.tsx`.
- **Validación**: Ejecutar `detect_changes()` o revisión de grafos con Graphify para confirmar 0 ciclos de importación.

### Iteración 3: Desacoplamiento de Vistas vía `IDataService`
- **Objetivo**: Refactorizar `CRMView.tsx`, `DashboardView.tsx` y `HRView.tsx` para consumir servicios de dominio en lugar de depender directamente de `useAppStore.ts`.
- **Validación**: Cobertura de tests unitarios pasa verde y `tsc --noEmit` sin errores.

### Iteración 4: Normalización de UI y Estilos Modales
- **Objetivo**: Eliminar estilos inline en `AperturaCajaModal` y `ArqueoCajaModal` reemplazándolos con clases limpias de Tailwind CSS.
- **Validación**: Pruebas visuales y de renderizado sin modales fuera de viewport.

## 3. Controles de Seguridad (Safety Gates)
- **Impact Analysis obligatorio**: Antes de editar cualquier símbolo en `cashService.ts` o `App.tsx`, ejecutar análisis de impacto.
- **TDD / Pruebas Verificadas**: Ejecutar suite de pruebas (`pnpm test`) después de cada cambio de código.
