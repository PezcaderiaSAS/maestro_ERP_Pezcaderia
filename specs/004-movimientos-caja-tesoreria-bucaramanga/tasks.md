# Tareas Atómicas: Módulo 004 - Movimientos de Dinero, Fletes Bucaramanga y Tesorería

- [x] **Tarea 1 (Backend/Data Services):** Extender `cash.types.ts` y `cashService.ts` para soportar categorías de egreso operativo (`FLETE_TRANSPORTE`, `PAGO_PROVEEDOR_PESCADO`, `ANTICIPO_COMPRA`, `INSUMOS_HIELO_CAVA`, `GASTO_OPERATIVO_GENERAL`) y helpers de verificación de saldo.
- [x] **Tarea 2 (Integración Compras-Caja):** Conectar `purchasesBucaramangaService.ts` y `BucaramangaReceivingWizard.tsx` permitiendo debitar flete y saldo de proveedor de la caja activa seleccionada con 1 toque.
- [x] **Tarea 3 (Componente Táctil de Egreso):** Crear `src/views/cash/components/EgresoOperativoModal.tsx` con botones gigantes (≥ 52 px), presets de fletes y proveedores de pescado, selector de recepciones pendientes y manejo de saldo insuficiente con alternativa de transferencia o crédito (CxP).
- [x] **Tarea 4 (Modernización Táctil de Flujo de Caja):** Integrar en `CashFlowView.tsx` el nuevo modal de egreso, pestañas táctiles de filtrado rápido (`Todo`, `🛒 Ventas`, `🚚 Fletes`, `🐟 Pescado`, `🧊 Insumos y Gastos`) y tarjetas sin jerga técnica con semáforo visual.
- [x] **Tarea 5 (TDD & Quality Gates):** Crear `src/tests/cashPurchasesIntegration.test.ts` con cobertura de débitos de flete, compras de contado, validación de saldo insuficiente y filtros táctiles. Ejecutar `tsc --noEmit` y suite de Vitest.
- [x] **Tarea 6 (Verificación DevTools 375 px & Sincronización):** Auditar en vivo en Chrome DevTools a 375 px con 0 errores de consola, actualizar `MEMORY.md` y `CHANGELOG_AGENTS.md`.
