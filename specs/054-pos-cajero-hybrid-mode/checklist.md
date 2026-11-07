# Checklist de Calidad y Criterios de Aceptación (SPEC-054)
**Módulo:** Rediseño del Carrito POS (Tabla Alta Densidad) & Modo Cajero Híbrido  
**Estándar:** WCAG 2.2 AA+, TDD (Vitest), Regla del Niño de 12 Años (Fitts ≥ 48px)

---

## 1. Criterios de Aceptación: Carrito de Ventas (`CartPanel.tsx` & `LineaVentaRow.tsx`)
- [ ] **CHK-01 (Altura y Scroll Aislado)**: El contenedor de ítems (`data-testid="cart-items-container"`) mantiene altura flexible con `flex-1 min-h-0 overflow-y-auto overscroll-contain` y visualiza entre 8 y 15 productos agregados sin colapso visual en resoluciones 1366x768 y 1280x800.
- [ ] **CHK-02 (Eliminación de Controles macOS)**: No existen botones decorativos circulares (`showMacControls={false}` o removidos) ni handlers de minimizar (`isCompactMode`) que puedan ocultar accidentalmente la lista de ítems.
- [ ] **CHK-03 (Header Condensado ≤ 44px)**: El encabezado del carrito ocupa un máximo de 44px de altura, conteniendo el selector de cliente, botón de suspensión/en espera (<kbd>F6</kbd>) y badge contador de borradores.
- [ ] **CHK-04 (Tabla Pura de Productos)**: Las líneas de venta se renderizan en una tabla semántica (`<table>` o grid estricto) con columnas `#`, `Cant/Peso`, `Producto`, `Precio Unit.`, `Subtotal` y `🗑️`.
- [ ] **CHK-05 (Edición Inline y Controles Táctiles)**:
  - Botones táctiles `[-]` y `[+]` con target táctil $\ge 40\text{px}$ para incrementar/decrementar cantidad.
  - Al hacer clic/toque en la celda de cantidad, se activa el campo numérico con foco automático para digitar directamente.
  - Si el producto tiene unidad `KG`, se visualiza el botón de báscula serial para captura de peso con un solo toque.
- [ ] **CHK-06 (Legibilidad y Contraste WCAG 2.2 AA+)**: Nombre del producto en tipografía nítida blanca (14px bold, `text-white`), precio unitario en gris claro (`text-slate-300`) y subtotal en alto contraste (`text-emerald-400 font-mono`). Cero fondos pasteles desentonados.
- [ ] **CHK-07 (Footer Esbelto ≤ 90px)**: Resumen financiero compacto (Subtotal, Descuento F4, IVA), caja de TOTAL gigante y botón principal $\ge 56\text{px}$ (**⚡ EMITIR PREVENTA F2** para vendedores / **⚡ COBRAR F10** para cajeros).

---

## 2. Criterios de Aceptación: Modo Cajero Híbrido en POS
- [ ] **CHK-08 (Interruptor Modo Cajero)**: Existe un toggle visible en la cabecera del POS ("Modo Cajero") con auto-activación si `userRole === 'cajero'`.
- [ ] **CHK-09 (Cola Viva de Comandas FIFO)**: Al activarse el Modo Cajero, el área principal izquierda (60%) reemplaza el catálogo de productos por la lista viva de preventas en espera (`PRE-YYYY-XXXXX`), ordenadas cronológicamente con turno, asesor, cliente, total y tiempo de espera.
- [ ] **CHK-10 (Panel de Liquidación Directa)**: Al tocar o escanear una comanda, el panel derecho muestra de inmediato los medios de pago (Efectivo, Tarjeta, Transferencia, Mixto), botones táctiles de billetes colombianos ($100k, $50k, $20k, $10k, $5k, $2k) y cálculo en tiempo real de "Cambio / Vueltas".
- [ ] **CHK-11 (Post-Cobro Inmediato)**: Al confirmar cobro (<kbd>Enter</kbd> / <kbd>F10</kbd>), se dispara la impresión silenciosa de la tirilla térmica, se muestra toast con el cambio entregado y se auto-selecciona la siguiente comanda más antigua en cola.
- [ ] **CHK-12 (Barra de Turno Integrada)**: Cabecera superior con total recaudado en el turno en tiempo real y botones para **Arqueo Ciego (<kbd>F4</kbd>)** y **Egreso Rápido (<kbd>F7</kbd>)** que abren modales superpuestos sin recargar el POS.

---

## 3. Criterios de Calidad Técnica
- [ ] **CHK-13 (TypeScript Estricto)**: `npx tsc --noEmit` debe pasar con **0 errores**.
- [ ] **CHK-14 (Suite Vitest 100% Verde)**: Toda la suite de pruebas del proyecto permanece verde sin regresiones.
- [ ] **CHK-15 (Tests E2E / Integración Nuevos)**: Suite dedicada `src/tests/posCartRedesignAndCashierMode.test.tsx` con al menos 15 pruebas unitarias e integrales cubriendo cada criterio de aceptación.

