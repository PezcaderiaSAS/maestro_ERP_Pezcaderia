# DISPATCH

## 2026-11-04T16:46:17Z

Usa todos los agentes, todas las agencias, el harness2 y el workflow SDD para implementar la especificación SPEC-052 (specs/052-frontend-ui-fixes-pos-dashboard-overflows/spec.md) resolviendo cuatro problemas críticos de frontend en producción.

Integrity mode: development

## Reference Material
- Especificación técnica aprobada: `specs/052-frontend-ui-fixes-pos-dashboard-overflows/spec.md`

## Requirements

### R1. Descongelamiento del Dashboard
Remover `AppRouteId.DASHBOARD` de `TRANSACTIONAL_FIXED_VIEWS` en `src/components/layout/layoutModes.ts` para habilitar el desplazamiento vertical (`overflow-y-auto min-h-0`) de modo que el calendario completo y las métricas del Dashboard se puedan visualizar sin bloqueo de scroll.

### R2. Ergonomía del Carrito POS y Rescate de Espacio Vertical
Eliminar la sección estática `QuickCutNotes` ("Corte y preparación de mostrador 1 toque") en `src/views/POSView.tsx` (líneas 2652-2661) para que `CartPanel` ocupe el 100% de la altura de la columna derecha, asegurando que los botones de acción inferior no queden cortados, y proveer un modal bajo demanda para notas de despacho.

### R3. Activación y Procedimiento de Caja Única / Multivendedor
Documentar el procedimiento operativo paso a paso y la lista de chequeo para pruebas manuales del modelo multivendedor a caja única (apertura de turno de caja, emisión de preventas en mostrador y cobro/facturación en caja única).

### R4. Eliminación de Desbordamientos y Colisión en EnterpriseTopbar
Resolver el solapamiento tipográfico entre el breadcrumb y el botón de tenant en `src/components/layout/EnterpriseTopbar.tsx` mediante truncado, contención con `overflow-hidden` y visibilidad responsive por breakpoints.

## Acceptance Criteria

### Dashboard Scroll
- [ ] `getMainLayoutClasses(AppRouteId.DASHBOARD)` no incluye clases de altura fija restrictiva ni `overflow-hidden`, y asigna `overflow-y-auto min-h-0`.
- [ ] La vista del Dashboard permite desplazarse verticalmente hasta el final de la pantalla en resoluciones de escritorio (1366x768 y 1920x1080) visualizando el calendario completo y las métricas.

### Carrito POS
- [ ] El bloque estático `QuickCutNotes` está eliminado de `POSView.tsx` y `CartPanel` ocupa la altura completa disponible de la columna (`flex-1 min-h-0`).
- [ ] La lista de productos en `CartPanel` tiene scroll vertical interno (`overflow-y-auto min-h-0`) y los botones de acción inferior (`Cerrar Turno`, `En Espera (F6)`, `Cobrar / Pagar`) permanecen completamente visibles y accesibles sin recortarse contra el borde inferior de pantalla.
- [ ] Se provee un modal o acción bajo demanda para registrar notas de despacho sin ocupar espacio estático permanente en la columna del carrito.

### Caja Única / Multivendedor
- [ ] Existe una guía documentada paso a paso y un checklist de pruebas manuales que describe detalladamente:
  1. Apertura de turno de caja (vía estándar en módulo de caja y vía rápida con datos semilla).
  2. Emisión de preventas en mostrador con código de pedido en espera.
  3. Cobro y facturación de comandas en caja única.
- [ ] La interfaz refleja el estado de turno abierto/cerrado sin ambigüedad operativa.

### Topbar Layout
- [ ] No existe colisión ni solapamiento tipográfico entre el breadcrumb y el botón de tenant en anchos de pantalla de 1024px, 1280px, 1366px y 1920px.
- [ ] El contenedor del breadcrumb aplica contención con `overflow-hidden` y truncamiento con elipsis.
- [ ] Los elementos secundarios de la sección derecha del Topbar usan clases de visibilidad responsive por breakpoint (`hidden xl:...`, `hidden 2xl:...`) y truncamiento en el selector de empresa para evitar desbordamientos.

### Verificación y Pruebas
- [ ] Todos los tests del proyecto pasan exitosamente (`npm run test:run`), incluyendo `layoutModes.test.ts`, `posCartPanelErgonomics.test.tsx` y `enterpriseTopbarA11yV8.test.tsx`.
- [ ] La auditoría visual en navegador con Playwright/Chrome DevTools no reporta errores de consola JS en las vistas intervenidas ni colisiones a 1280x800 y 375x667.
