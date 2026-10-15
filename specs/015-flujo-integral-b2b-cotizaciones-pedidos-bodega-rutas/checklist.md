# Checklist de Calidad y Estándares de Industria (/speckit.checklist)

**Código:** SPEC-015  
**Título:** Lista de Verificación de Calidad — Flujo Integral B2B End-to-End (Cotizaciones $\rightarrow$ Pedidos $\rightarrow$ Alistamiento $\rightarrow$ Rutas)  
**Estado:** DRAFT (Esperando Aprobación Humana)  
**Fecha:** 2026-10-15  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.checklist`  

---

## 1. Integridad de Datos y Trazabilidad Operativa (Data Integrity & Audit)

- [ ] **CHK-015-01 (Trazabilidad Triple Actor):** Todo pedido en el flujo almacena y valida los campos obligatorios: `vendedorId`, `operarioAlistadorId` y `conductorRepartidorId` con sus marcas temporales correspondientes.
- [ ] **CHK-015-02 (Anti-Repudio de Eventos):** Cada cambio de estado genera un evento inmutable en el store de auditoría (`useEventStore` / Supabase) conteniendo: entidad, ID, estado previo, estado nuevo, actor ID, rol y metadatos.
- [ ] **CHK-015-03 (Esquemas Zod Estrictos):** Las entradas de datos de pesaje, remisión y cierre de ruta pasan validación Zod (`PesajeAlistamientoSchema`, `WmsDispatchRemisionSchema`).
- [ ] **CHK-015-04 (Idempotencia en Transiciones):** Las mutaciones de estado de pedidos y manifiestos de ruta previenen dobles clics y transiciones inválidas mediante claves de idempotencia o bloqueos de UI.

---

## 2. Lógica Comercial y Financiera NIIF (Commercial & Finance)

- [ ] **CHK-015-05 (Validación de Cupo de Crédito):** La conversión de cotización a pedido evalúa el límite de crédito disponible del cliente (`B2BSalesService.verificarCupoCredito`); si se excede, bloquea o exige autorización expresa.
- [ ] **CHK-015-06 (Retenciones Fiscales NIIF):** Si el cliente es Gran Contribuyente o Autorretenedor, se liquidan y desglosan automáticamente Retefuente (2.5%) y ReteICA (4.14‰) sobre la base antes de IVA.
- [ ] **CHK-015-07 (Liquidación por Peso Real - Catch Weight):** El total del pedido se recalcula con base en el **peso real registrado en báscula** ($kg\text{ real} \times \text{precio pactado}$) dentro de la tolerancia de $\pm 5\%$.
- [ ] **CHK-015-08 (Auditoría de Mermas de Picking):** Las diferencias entre peso teórico y peso real quedan cuantificadas en kilos y valor económico de merma (`calcularAjusteMermasPicking`).

---

## 3. Cadena de Frío, WMS y Rutas de Despacho (Cold Chain & Logistics)

- [ ] **CHK-015-09 (Trazabilidad FEFO y Lote):** Cada línea alistada en bodega registra el código de lote perecedero bajo política FEFO y la temperatura del producto al momento del empaque.
- [ ] **CHK-015-10 (Remisión WMS con Precinto y QR):** Al cerrar el alistamiento, se genera la remisión con identificador único, código QR y precinto de canastillas para trazabilidad de bultos.
- [ ] **CHK-015-11 (Control de Cadena de Frío en Furgón):** El check-in de carga exige validar temperatura de salida del furgón ($-18^\circ\text{C}$ o $\le 4^\circ\text{C}$) antes de transicionar a `EN_RUTA`.
- [ ] **CHK-015-12 (Consistencia de Odómetro):** Se valida obligatoriamente que el kilometraje final sea mayor o igual al inicial registrado al despachar el furgón.
- [ ] **CHK-015-13 (Evidencia de Entrega & Firma Táctil):** La entrega en cliente recaba firma digital táctil del receptor y registro exacto de hora de llegada y salida.
- [ ] **CHK-015-14 (Segregación de Devoluciones a Cuarentena):** Ante rechazo parcial o total, el ítem se descuenta del cobro y se direcciona físicamente a `CUARENTENA_CALIDAD` en el retorno a bodega.

---

## 4. Estándares UI/UX, Accesibilidad y Rendimiento (Engineering Quality)

- [ ] **CHK-015-15 (Light Mode WCAG 2.2 AA+):** Todos los componentes visuales del flujo cumplen con contraste cromático $\ge 4.5:1$ en textos y $\ge 3:1$ en controles UI activos.
- [ ] **CHK-015-16 (Touch Targets Táctiles):** Botones de acción crítica (Iniciar Picking, Confirmar Pesaje, Firmar Entrega, Cobrar) cuentan con altura mínima $\ge 48\text{ px}$.
- [ ] **CHK-015-17 (Cobertura de Pruebas TDD Vitest):** Suite unitaria y de integración integral que valida el flujo continuo de los 3 actores con 100% de tests pasando en verde.
- [ ] **CHK-015-18 (TypeScript Estricto & Compilación):** Cero errores tipográficos o advertencias (`tsc --noEmit` exitoso, código 0).
- [ ] **CHK-015-19 (Auditoría Chrome DevTools MCP):** Cero errores en consola JS en runtime y renderizado fluido en viewport móvil de 375 px y desktop de 1280 px.

---

**Siguiente Paso del Flujo:** Esperar aprobación del usuario sobre esta Lista de Verificación (`/speckit.checklist`) para proceder con la redacción del Plan Técnico de Implementación (`/speckit.plan`).
