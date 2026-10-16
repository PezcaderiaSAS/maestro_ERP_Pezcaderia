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
- [ ] `TASK-018-06`: **Wizard de Traslados a Sucursales en 2 Toques Ergonómicos**
  - Simplificar el panel de traslados internos (`WarehouseTransferPanel.tsx` / modal de abastecimiento rápido) a 2 pasos: Selección de sucursal destino $\rightarrow$ Cantidad rápida con selector táctil.
- [ ] `TASK-018-07`: **Suite de Pruebas y Validación DevTools para Fase 2**
  - Crear suite `src/tests/warehouseWms12YearsRule.test.tsx` verificando contraste, tamaños táctiles y cálculos de tara/pesaje.

---

## Fase 3: Despachos, Rutas B2B y Cartera / Cuentas por Cobrar (AR)
- [ ] `TASK-018-08`: **Modal Táctil de Abono Rápido a Cartera (QuickAbonoModal.tsx)**
  - Sustituir los diálogos HTML crudos de `Swal.fire` en `ARView.tsx` por un modal táctil React accesible:
    - Selección visual de factura con saldo pendiente.
    - Botones de abono rápido: 'Pagar Total', '50%' o teclado numérico táctil $\ge 48\text{ px}$.
    - Sincronización atómica instantánea con el flujo de caja del turno activo.
- [ ] `TASK-018-09`: **Simplificación del Tablero de Despachos a 3 Macro-Estados Operativos**
  - Simplificar el flujo Kanban de `OrderKanbanView.tsx` en vista táctil y móvil: 1. Preparación WMS $\rightarrow$ 2. En Ruta de Entrega $\rightarrow$ 3. Entregado / Liquidado.
- [ ] `TASK-018-10`: **Suite de Pruebas y Validación DevTools para Fase 3**
  - Crear suite `src/tests/arAndDispatch12YearsRule.test.tsx` validando abonos y tablero simplificado.

---

## Fase 4: Producción/Yield, Nómina, Contabilidad NIIF y Dashboard
- [ ] `TASK-018-11`: **Dashboard con Semáforo Ejecutivo Consolidado**
  - Crear widget visual superior en `DashboardView.tsx` con semáforo ejecutivo: Caja Disponible Hoy, Pedidos B2B Listos y Alertas de Stock Crítico en botones táctiles grandes.
- [ ] `TASK-018-12`: **Wizard de Nómina en 3 Pasos (PayrollView.tsx)**
  - Reestructurar el formulario denso de nómina en un Wizard guiado de 3 Pasos: 1. Selección de Empleado $\rightarrow$ 2. Novedades / Horas Extras $\rightarrow$ 3. Liquidar y Desembolsar contra Caja.
- [ ] `TASK-018-13`: **Suite Integral E2E, Auditoría Master Architect y Quality Gate Final**
  - Ejecutar suite Vitest completa (100% pasando).
  - Verificar `tsc --noEmit` (0 errores).
  - Ejecutar `npm run test:boundaries` (0 violaciones de límites arquitectónicos).
  - Comprobación final en vivo con Chrome DevTools MCP.
