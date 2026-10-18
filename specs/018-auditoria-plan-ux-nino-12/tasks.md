# Tareas de Implementación: Auditoría y Refactorización UX/UI "Regla del Niño de 12 Años"

## Fase 1: Punto de Venta (POS Mostrador & Offline V2) y Control de Caja
- [x] `TASK-018-01`: **Refactorización de ProductAvatar y Catálogo POS Mostrador (Cero Imágenes)** [COMPLETADA Y CERTIFICADA]
  - Reemplazado el renderizado de etiquetas `<img>` en `ProductAvatar.tsx` y `ProductSearchPanel.tsx` por tarjetas táctiles vectoriales 100% SVG (`Fish`, `Waves`, `UtensilsCrossed`, `Snowflake`, `Package`) con badges Kilo/Unidad y semáforo de stock dinámico.
  - Asegurada altura mínima de tarjeta de catálogo `min-h-[72px]` con feedback visual táctil (`active:scale-95`).
  - Suite de pruebas `src/tests/posAndCash12YearsRule.test.tsx` pasando al 100% (7/7 tests combinados).
- [x] `TASK-018-02`: **Cobro Rápido en POS Mostrador (Flujo en 2 Clics & Targets >= 48px)** [COMPLETADA Y CERTIFICADA]
  - Agregado botón de acción directa "⚡ Cobro Rápido 1-Tap" accesible directamente en el panel de cobro con atajo físico F8.
  - Asegurado que todos los atajos y botones de billetes rápidos COP ($10k, $20k, $50k, $100k) cumplan con `min-h-[48px]` y botón principal `min-h-[56px]`.
  - Verificado en suites TDD con 19/19 tests verdes y 0 errores en `tsc --noEmit`.
- [x] `TASK-018-03`: **Wizard Asistido de Arqueo y Cierre de Caja en 3 Pasos** [COMPLETADA Y CERTIFICADA]
  - Unificada la experiencia de cierre en `ArqueoCajaModal.tsx` con un Wizard táctil de 3 Pasos:
    1. Paso 1: Conteo de Billetes y Monedas con `CalculadorDenominaciones` (botones táctiles `min-w-[48px] min-h-[48px] w-12 h-12`).
    2. Paso 2: Declaración de Datáfono, QR / Transferencias con botones 1-Tap 'Copiar' del sistema para autocompletar montos esperados.
    3. Paso 3: Semáforo de tolerancia ($5.000 COP) y botón gigante de confirmación de cierre `min-h-[56px]`.
  - Retirada la duplicación de código en `CierreCajaModal.tsx` convirtiéndolo en re-exportador tipado hacia `ArqueoCajaModal.tsx`.
  - Verificado en suite TDD `posAndCash12YearsRule.test.tsx` (12/12 tests verdes) y `tsc --noEmit` (0 errores).
- [x] `TASK-018-04`: **Suite de Pruebas Unitarias y Validación DevTools para Fase 1** [COMPLETADA Y CERTIFICADA]
  - Suite `src/tests/posAndCash12YearsRule.test.tsx` creada y validada al 100% (12/12 tests verdes).
  - Integración total con la suite POS previa (24/24 tests verdes en cobro rápido, ergonomía y retorno de foco).
  - Verificación estricta de TypeScript con `tsc --noEmit` (0 errores).
  - Validación con Chrome DevTools MCP en vivo (`http://localhost:3000/#/pos`):
    - 0 errores JavaScript no controlados en consola.
    - Viewport móvil 375x812 px validado con captura de pantalla y árbol de accesibilidad.
    - 0 etiquetas `<img>` en el catálogo y tarjetas táctiles con altura mínima $\ge 72\text{ px}$.

---

## Fase 2: Bodega, Muelle (Llegada BCM) y Cuarto Frío WMS
- [x] `TASK-018-05`: **Estandarización Light Mode WCAG 2.2 AA+ en BucaramangaReceivingWizard** [COMPLETADA Y CERTIFICADA]
  - Refactorizado el wizard de descarga de furgón en muelle a Light Mode de alto contraste (fondo blanco, textos pizarra `text-slate-900`, tarjetas redondeadas con bordes sutiles `border-slate-200`).
  - Semáforo térmico optimizado para Light Mode con textos contrastados de alta visibilidad (`text-emerald-800 bg-emerald-50 border-emerald-300`, `text-amber-800 bg-amber-50`, `text-rose-800 bg-rose-50`).
  - Ajustados todos los botones a la Regla del Niño de 12 Años:
    - Botón de historial a `min-h-[48px] h-12`.
    - Botones del Stepper (Paso 1, 2, 3) a `min-h-[56px] h-14`.
    - Botones de acción principal (Continuar a Báscula, Capturar Peso Báscula, + Guardar Pesada Canastilla, Ir al Frío y Liquidar, ✓ Guardar en el Frío y Finalizar) a `min-h-[56px] h-14`.
    - Botones de porcentaje de hielo y eliminación a `min-w-[48px] min-h-[48px] w-12 h-12`.
  - Suite de pruebas `src/tests/bucaramangaReceivingWizard.test.tsx` (7/7 tests verdes) y `tsc --noEmit` (0 errores).
- [x] `TASK-018-06`: **Wizard de Traslados a Sucursales en 2 Toques Ergonómicos** [COMPLETADA Y CERTIFICADA]
  - Refactorizado `WarehouseTransferPanel.tsx` a Light Mode WCAG 2.2 AA+ con fondos claros, tarjetas contrastadas y tipografía pizarra de alta legibilidad.
  - Diseñado Wizard asistido en 2 pasos ergonómicos:
    1. Paso 1: Tarjetas táctiles de sucursal destino de `min-h-[64px]` con iconos Lucide (`Building2`, `Store`, `Snowflake`) y avance automático inmediato al tocar una sucursal.
    2. Paso 2: Buscador táctil predictivo `min-h-[48px]`, pre-selección automática de producto, display gigante de stock disponible y botones de incremento rápido `min-h-[48px] h-12` (`+1 Kg`, `+5 Kg`, `+10 Kg`, `+20 Kg`, `Todo el Stock`).
  - Botón gigante de confirmación de despacho `min-h-[56px] h-14` con fondo esmeralda `bg-emerald-600`, texto "DESPACHAR TRASLADO AHORA", `touch-manipulation` y efecto activo `active:scale-95`.
  - Validación dinámica de stock disponible en origen que bloquea el despacho en caso de sobre-stock.
  - Cero imágenes externas (100% SVG con Lucide React).
  - Pestañas 'En Tránsito' e 'Historial' estandarizadas a Light Mode con badges semánticos contrastados.
  - Suite de pruebas `src/tests/warehouseTransferPanel.test.tsx` (6/6 tests verdes), `tsc --noEmit` (0 errores) y auditoría Chrome DevTools MCP con 0 errores en consola.
- [x] `TASK-018-07`: **Suite de Pruebas y Validación DevTools para Fase 2** [COMPLETADA Y CERTIFICADA]
  - Creada suite integral `src/tests/warehouseWms12YearsRule.test.tsx` (10/10 tests verdes) validando de forma conjunta:
    1. Cero etiquetas `<img>` externas en ambos módulos operativos (100% iconos Lucide React).
    2. Cumplimiento estricto de Light Mode WCAG 2.2 AA+ con tipografía pizarra `text-slate-900` sobre fondos limpios.
    3. Muelle Bucaramanga (`BucaramangaReceivingWizard.tsx`): tara de canastilla plástica ($2.0\text{ kg}$), cálculo de peso neto en báscula, semáforo térmico cromático (óptimo, precaución, alerta sanitaria) y botones del wizard $\ge 56\text{ px}$.
    4. Traslados Internos (`WarehouseTransferPanel.tsx`): tarjetas de destino $\ge 64\text{ px}$ con avance automático al Paso 2, botones de incremento rápido $\ge 48\text{ px}$, prevención reactiva de sobre-stock y botón gigante de confirmación $\ge 56\text{ px}$ con `active:scale-95`.
  - Consolidado de la Fase 2: 3 suites dedicadas (`bucaramangaReceivingWizard.test.tsx`, `warehouseTransferPanel.test.tsx`, `warehouseWms12YearsRule.test.tsx`) con 23/23 tests verdes.
  - `tsc --noEmit` completado con 0 errores.
  - Auditoría Master Architect SOLID con 0 violaciones críticas (318 archivos analizados en 192 ms).
  - Bucle de validación Chrome DevTools MCP en vivo (`http://localhost:3000/`) con 0 errores JS en consola y grabación `phase2_wms_audit_1792161668927.webp` en desktop y viewport móvil (375x812 px).

---

## Fase 3: Despachos, Rutas B2B y Cartera / Cuentas por Cobrar (AR)
- [x] `TASK-018-08`: **Modal Táctil de Abono Rápido a Cartera (QuickAbonoModal.tsx)** [COMPLETADA Y CERTIFICADA]
  - Creado componente React accesible `QuickAbonoModal.tsx` en `src/views/ar/components/` bajo la Regla del Niño de 12 Años:
    - Eliminadas más de 280 líneas de código imperativo HTML y DOM manual inyectado en `Swal.fire` dentro de `ARView.tsx`.
    - Resumen superior con saldo pendiente visible, cliente, total venta y porcentaje ya pagado.
    - Botones de incremento rápido de 1-toque $\ge 48\text{ px}$ ('Pagar Total 100%', '50% del Saldo', '+$100.000', 'Limpiar $0') e input numérico accesible con display formateado COP.
    - Selector táctil de método de recaudo $\ge 48\text{ px}$ ('Efectivo', 'Transferencia', 'Datáfono') con campo dinámico de referencia bancaria.
    - Prevención en vivo de sobre-abono con bloqueo del botón de confirmación si el monto supera el saldo de la factura.
    - Botón gigante de confirmación $\ge 56\text{ px}$ (`min-h-[56px] h-14 bg-emerald-600 active:scale-95`).
    - Sincronización transaccional atómica con `useARStore`, evento de dominio `SALE_COMPLETED` y registro de movimiento en el turno activo de `cashService`.
  - Cero imágenes externas (100% SVG con Lucide React).
  - Suite TDD `src/tests/quickAbonoModal.test.tsx` (6/6 tests verdes) y `tsc --noEmit` (0 errores).
  - Auditoría Master Architect SOLID con 0 violaciones críticas (saneamiento de `ARView.tsx` por debajo de 600 líneas útiles).
  - Calidad certificada con Chrome DevTools MCP en vivo con 0 errores en consola JS y video `cartera_abono_modal_check_1792166100118.webp`.
- [x] `TASK-018-09`: **Simplificación del Tablero de Despachos a 3 Macro-Estados Operativos**
  - Implementada en `OrderKanbanView.tsx` la pestaña y visualización canónica de **3 Macro-Estados Operativos**:
    1. `1. Preparación WMS` (agrupa `CREADO`, `PAUSADO`, `PAUSADO_POR_CREDITO`, `EN_FILETEO`, `EN_PESAJE`).
    2. `2. En Ruta de Entrega` (agrupa `LISTO`, `EN_DESPACHO`).
    3. `3. Entregado / Liquidado` (agrupa `ENTREGADO`, `FACTURADO`, `PAGADO`, `ANULADO`).
  - Botón prominente de 1-toque `⚡ Flujo Táctil (3 Pasos)` (`data-testid="tab-tactil-3-pasos"`) con altura ergonómica táctil $\ge 48\text{ px}$ (`min-h-[48px] h-12`).
  - Chips de filtro rápido (`TODOS`, `URGENTES`, `CATCH_WEIGHT`, `PAUSADOS`) y barra de búsqueda ajustados a targets ergonómicos $\ge 48\text{ px}$ con micro-animaciones activas `active:scale-95`.
  - Botones de avance táctil en tarjeta ergonómicos $\ge 48\text{ px}$ (`Pesar`, `A Ruta`, `Remisión QR`, `Marcar Entregado`).
  - Preservación al 100% de la compatibilidad con las pestañas tradicionales `1. Bodega` y `2. Despachos`.
  - Suite TDD creada `src/tests/orderKanban3MacroStates.test.tsx` (6/6 tests verdes) y `src/tests/orderKanbanView.test.tsx` (9/9 tests verdes) $\rightarrow$ 15/15 tests verdes.
  - TypeScript `tsc --noEmit` en 0 errores, Master Architect con 0 violaciones críticas y auditoría DevTools en vivo grabada en `kanban_macro3_audit_1792167201883.webp` con 0 errores JS en consola.
- [x] `TASK-018-10`: **Suite de Pruebas y Validación DevTools para Fase 3**
  - Creada suite de integración integral `src/tests/arAndDispatch12YearsRule.test.tsx` con **10/10 tests verdes al 100%**.
  - Verificación exhaustiva de la Fase 3 consolidada en 4 suites dedicadas (`quickAbonoModal.test.tsx`, `orderKanban3MacroStates.test.tsx`, `orderKanbanView.test.tsx`, `arAndDispatch12YearsRule.test.tsx`) con **31/31 tests verdes al 100%**.
  - TypeScript estricto `tsc --noEmit` en 0 errores y Master Architect SOLID con 0 violaciones críticas (321 archivos analizados).
  - Auditoría interactiva con DevTools MCP grabada en `phase3_integral_audit_1792169501650.webp` con 0 errores en consola JS.
  - **Fase 3 (Despachos, Rutas B2B y Cartera AR) CULMINADA Y CERTIFICADA AL 100%.**

---

## Fase 4: Producción/Yield, Nómina, Contabilidad NIIF y Dashboard
- [x] `TASK-018-11`: **Dashboard con Semáforo Ejecutivo Consolidado**
  - Implementado widget visual superior en `src/views/dashboard/components/ExecutiveTrafficLightWidget.tsx` e integrado en `DashboardView.tsx`.
  - 3 botones táctiles de 1-toque $\ge 56\text{ px}$ (`min-h-[100px]`, `active:scale-95`, `touch-manipulation`):
    1. *Caja Disponible Hoy:* Saldo acumulado en efectivo y bancos del turno activo, cálculo de saldo teórico, indicador de salud financiero (verde/ámbar) y redirección táctil a `AppRouteId.CASH_DESK`.
    2. *Despachos B2B:* Contador de pedidos listos para despacho en cava y pedidos en furgón en ruta, con desglose cuantitativo y redirección a `AppRouteId.ORDERS_KANBAN`.
    3. *Stock en Cuarto Frío:* Detección de productos bajo buffer de seguridad o agotados, con conteo en tiempo real y redirección táctil a `AppRouteId.INVENTORY`.
  - Cero imágenes externas (100% SVG con Lucide React), Light Mode WCAG 2.2 AA+ y tipado TypeScript estricto.
  - Creada suite TDD dedicada `src/tests/dashboardExecutiveTrafficLight.test.tsx` con **8/8 tests verdes al 100%**.
  - Auditoría interactiva con DevTools MCP grabada en `dashboard_traffic_light_audit_1792170861264.webp` con 0 errores en consola JS.
- [x] `TASK-018-12`: **Wizard de Nómina en 3 Pasos (PayrollView.tsx)** [COMPLETADA Y CERTIFICADA]
  - Modularizado `PayrollView.tsx` reduciendo su tamaño de más de 600 líneas a 241 líneas útiles.
  - Creado componente táctil guiado `src/views/payroll/components/PayrollWizard3Steps.tsx` bajo la Regla del Niño de 12 Años:
    1. *Paso 1 (Colaborador & Período):* Tarjetas de selección con bordes contrastantes, cálculo automático de días comerciales (base 360/30) y presets de quincena/mes.
    2. *Paso 2 (Novedades & Extras):* Steppers táctiles de horas extras diurnas/nocturnas, bonificaciones y deducciones con recálculo dinámico en COP.
    3. *Paso 3 (Liquidar & Desembolsar):* Resumen contrastado de Neto a Pagar y Costo Empresa, selección de medio de pago (Transferencia / Efectivo) y desembolso automático integrado atómicamente con `cashService.registrarMovimiento` en turno activo (`EGRESO_GASTO`).
  - Suite TDD `src/tests/payroll3StepsWizard.test.tsx` creada con **6/6 tests verdes**.
- [x] `TASK-018-13`: **Suite Integral E2E, Auditoría Master Architect y Quality Gate Final** [COMPLETADA Y CERTIFICADA]
  - Suite de integración de la Fase 4 creada en `src/tests/dashboardAndPayroll12YearsRule.test.tsx` (4/4 tests verdes).
  - Consolidado de las 4 Fases de la Regla del Niño de 12 Años certificado al 100%:
    1. Fase 1: `posAndCash12YearsRule.test.tsx` (12 tests verdes).
    2. Fase 2: `warehouseWms12YearsRule.test.tsx` (10 tests verdes), `bucaramangaReceivingWizard.test.tsx` (7 tests verdes), `warehouseTransferPanel.test.tsx` (6 tests verdes).
    3. Fase 3: `arAndDispatch12YearsRule.test.tsx` (10 tests verdes), `quickAbonoModal.test.tsx` (6 tests verdes), `orderKanban3MacroStates.test.tsx` (6 tests verdes).
    4. Fase 4: `dashboardExecutiveTrafficLight.test.tsx` (8 tests verdes), `payroll3StepsWizard.test.tsx` (6 tests verdes), `dashboardAndPayroll12YearsRule.test.tsx` (4 tests verdes).
  - Suite Vitest global: **95 suites pasadas, 640 tests verdes (100% pasando)**.
  - TypeScript estricto: `tsc --noEmit` verificado con **0 errores**.
  - Auditoría Master Architect SOLID (`audit-solid-boundaries.cjs`): 345 archivos analizados en 205 ms con **0 violaciones críticas**.
  - Validación Chrome DevTools MCP en vivo (`http://localhost:3000/`): 0 errores en consola JS, vista responsive 375 px verificada y ergonomía táctil $\ge 48\text{ px}$ en todos los flujos principales.
  - **SPEC-018 CULMINADA Y CERTIFICADA AL 100%.**


