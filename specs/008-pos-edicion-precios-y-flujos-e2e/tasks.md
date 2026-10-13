# Lista de Tareas Brownfield SDD 008: POS — Modificación de Precios en Venta & Suite de Pruebas E2E

- [x] **Tarea 1: Extensión del Hook de Carrito (`usePOSCart.ts`)**
  - [x] **T-1.1:** Verificar y asegurar que `updateItemPrice(productoId, newPrice)` conserve `precioModificadoOriginal` de forma inmutable.
  - [x] **T-1.2:** Implementar `resetItemPrice(productoId: string)` para restaurar el precio de lista original y recalcular totales.
  - [x] **T-1.3:** Exportar `resetItemPrice` en el valor de retorno del hook.
  - [x] *Criterio de Aceptación / QA Gate:* Suite `usePOSCart.test.ts` con 11 pruebas unitarias pasando al 100%.

- [x] **Tarea 2: Componentes Visuales del Carrito (`LineaVentaRow.tsx` y `CartPanel.tsx`)**
  - [x] **T-2.1:** En `LineaVentaRow.tsx`, recibir props `onUpdatePrecio` y `onResetPrecioItem`.
  - [x] **T-2.2:** Convertir el precio unitario en un botón táctil ergonómico ($\ge 44\text{ px}$) con icono ✏️ (`Edit3`).
  - [x] **T-2.3:** Implementar diálogo interactivo con SweetAlert2 para capturar el nuevo precio unitario numérico.
  - [x] **T-2.4:** Agregar validación de margen de rentabilidad: alerta si `nuevoPrecio < linea.precioCompra` solicitando confirmación explícita.
  - [x] **T-2.5:** Renderizar insignia visual `✏️ Modificado (Base: $XX.XXX)` y enlace `Restablecer` al diferir del catálogo maestro.
  - [x] **T-2.6:** En `CartPanel.tsx`, propagar `onUpdatePrecio` y `onResetPrecioItem` reactivamente a cada fila.
  - [x] *Criterio de Aceptación / QA Gate:* Inspección DevTools MCP sin errores de renderizado táctil en 375 px.

- [x] **Tarea 3: Integración y Persistencia en `POSView.tsx`**
  - [x] **T-3.1:** Extraer `updateItemPrice` y `resetItemPrice` de `usePOSCart`.
  - [x] **T-3.2:** Conectar callbacks correspondientes a `<CartPanel>`.
  - [x] **T-3.3:** Corregir mapeo de compatibilidad `cart` y `newVenta.items` para garantizar que `precioOverride` y `precioUnitario` tomen `linea.precioFinal` sin sobreescrituras indeseadas.
  - [x] **T-3.4:** Persistir actualización de tarifas históricas (`updateLastClientPrice`) para clientes identificados.
  - [x] *Criterio de Aceptación / QA Gate:* Consola JS limpia con 0 errores y 0 advertencias durante la navegación.

- [x] **Tarea 4: Suite de Pruebas E2E de Ciclo Completo (`posComprehensiveLifecycleE2E.test.ts`)**
  - [x] **T-4.1 (Flujo 1):** Apertura de Turno de Caja con base inicial de efectivo en gaveta ($150.000).
  - [x] **T-4.2 (Flujo 2):** Venta multi-presentación (KG a granel y UNIDAD) a Consumidor Final con pago en efectivo y cambio exacto.
  - [x] **T-4.3 (Flujo 3):** Venta guardada en espera (`saveDraft`), vaciado de carrito, recuperación intacta del borrador y liquidación con pago mixto ($50k Efectivo + $40k Nequi).
  - [x] **T-4.4 (Flujo 4):** Venta con precios de venta modificados, validación de recálculo y actualización de `lastClientPrices`.
  - [x] **T-4.5 (Flujo 5):** Venta a crédito a cliente registrado, validación de cupo y generación de cuenta por cobrar `InvoiceAR`.
  - [x] **T-4.6 (Flujo 6):** Solicitud de reabastecimiento POS hacia Bodega Principal vía `internalTransferService`.
  - [x] *Criterio de Aceptación / QA Gate:* 6/6 pruebas E2E pasando con éxito en Vitest.

- [x] **Tarea 5: Validación DevTools MCP en Vivo & Cierre de Gobernanza**
  - [x] **T-5.1:** Conectar y auditar consola JS en `http://127.0.0.1:3000/` con **0 errores y 0 warnings**.
  - [x] **T-5.2:** Auditar renderizado táctil responsivo en vista móvil **375 px**.
  - [x] **T-5.3:** Ejecutar análisis de impacto y blast radius con GitNexus (`detect-changes` / `medium risk`).
  - [x] **T-5.4:** Actualizar `MEMORY.md` respetando el límite de ~50 líneas y documentar en `CHANGELOG_AGENTS.md`.
