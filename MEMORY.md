# Memoria Activa - La Pezcadería ERP

## Contexto Actual & Estado Global (Light Mode WCAG AA+ & SDD 006 / 007 Completados)
- **Estado Global:** Sistema 100% en Modo Claro (Light Mode) de alto contraste con tokens WCAG 2.2 AA+ (`.agents/skills/erp-pos-design-tokens/SKILL.md`).
- **Verificación Completa:**
  - 50+ suites de prueba ejecutadas, pasando al 100% (incluyendo E2E de ciclo completo y SDD 007).
  - **Bucle DevTools MCP en Vivo:** Verificado en escritorio y móvil (375 px) con **0 errores en consola JS**.

## Módulo Alquiler de Cuarto Frío WMS 3PL (SDD 006 & SDD 007)
- **Cajas de Peso Cerrado / Fijo (SDD 007):** Selector táctil `[📦 Cajas Peso Fijo]` (ej. papas fritas 10 kg). Permite ingresar cantidad de cajas y peso nominal sin obligar a pesaje en báscula, calculando peso neto y tara nominal de forma determinista (`calcularPesoCajasNominal`).
- **Granel Bimodal en Canastillas (SDD 007):** Control dual estricto para productos a granel (ej. 40 canastillas con 843.3 kg netos). En salidas parciales (ej. 30 canastillas), auto-calcula la sugerencia proporcional por regla de tres ($632.48\text{ kg}$) manteniendo el campo editable para báscula real de salida (ej. $630.0\text{ kg}$), dejando el saldo exacto en canastillas y kilos (10 canastillas, $213.3\text{ kg}$).
- **Salida Rápida (Restante y Vaciado Total - SDD 007):**
  - Botón individual `[⚡ Retirar Restante]` en cada lote para vaciar canastillas y kilos al 100% en 1 toque.
  - Botón global `[⚡ Despachar Todo el Saldo]` en la cabecera del cliente para seleccionar y liquidar todas las existencias en custodia de una sola vez.
- **Recepción Múltiple & Creación Express (SDD 006):** Planilla multi-partida heterogénea, creación de cliente al vuelo (15 seg) y creación rápida de productos en batch con chips táctiles.
- **Despacho Consolidado & Salidas:** Checklist interactivo por cliente emitiendo Actas PDF oficiales (`DSP-CF-XXXXXX`).
- **Resiliencia & Persistencia:** Sincronización transparente Supabase RPC + `localStorage` (`pezcaderia_inventario_custodia`, `pezcaderia_movimientos_custodia`).

## Gobernanza UI/UX & Regla de los 12 Años
- **Flujo en 4 Pasos Visuales:** 1. Cliente/Contrato -> 2. Báscula/Recepción -> 3. Retiro/Despacho -> 4. Cobro en Caja.
- **Accesibilidad:** Botones táctiles $\ge 44\text{ px}$, chips de producto de un toque, inputs blancos con anillos índigo/esmeralda, alertas SweetAlert2 claras.
