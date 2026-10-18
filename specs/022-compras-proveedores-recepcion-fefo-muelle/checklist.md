# Lista de Verificación de Calidad y Estándares de la Industria (/speckit.checklist)

- **Especificación:** SPEC-022 (Compras, Proveedores y Recepción con Trazabilidad FEFO en Muelle)
- **Fecha:** 2026-10-18
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

## 1. Estándares de Inocuidad Alimentaria y Cadena de Frío (HACCP Pesquero)
- [ ] **CHK-HACCP-01 (Semáforo Térmico Estricto):** El sistema valida y colorea la temperatura de la cava del camión según umbrales sanitarios:
  - $\le 4.0^\circ\text{C}$: ÓPTIMO (Verde Esmeralda - Inocuidad garantizada).
  - $4.1\text{ a }7.0^\circ\text{C}$: PRECAUCIÓN (Ámbar - Exige adición inmediata de hielo escama).
  - $> 7.0^\circ\text{C}$: ALERTA CRÍTICA (Rojo - Bloqueo preventivo de recepción).
- [ ] **CHK-HACCP-02 (Registro de Faena y Conductor):** Se captura la fecha de faena/captura y los datos del transportador para auditorías fitosanitarias de la AUNAP / INVIMA.

---

## 2. Metrología Legal y Pesaje Catch Weight en Muelle
- [ ] **CHK-MET-01 (Deducción Invariable de Tara Canastilla):** Cada canastilla plástica de muelle tiene una tara exacta de $2.0\text{ kg}$. El sistema descuenta automáticamente: $\text{Tara Total} = \text{Cantidad Canastillas} \times 2.0\text{ kg}$.
- [ ] **CHK-MET-02 (Deducción Gradual de Hielo):** El selector de porcentaje de hielo ($0\%$, $3\%$, $5\%$, $7\%$, $10\%$, $12\%$, $15\%$) descuenta exclusivamente sobre el peso con hielo neto de canastilla:
  $$\text{Peso Neto Real} = (\text{Peso Bruto} - \text{Tara Canastillas}) \times (1 - \% \text{Hielo})$$
- [ ] **CHK-MET-03 (Protección contra Inconsistencias):** Bloqueo si el peso bruto es $\le$ a la tara total de canastillas.

---

## 3. Trazabilidad GS1 y Rotación FEFO (First Expired, First Out)
- [ ] **CHK-FEFO-01 (Generación Determinista de Lote):** Genera código canónico inmutable `LOT-{YYYYMMDD}-{PROV_CORTO}-{CONSECUTIVO}`.
- [ ] **CHK-FEFO-02 (Cálculo de Caducidad por Tipo de Conservación):**
  - Pescado fresco enhielado ($0\text{ a }2^\circ\text{C}$): Vida útil estimada de 8 días desde faena.
  - Congelado ($-18^\circ\text{C}$): Vida útil de 180 días desde congelación.
- [ ] **CHK-FEFO-03 (Anexar Lote de Origen Opcional):** Permite registrar en 1 toque el número de lote de fábrica o precinto de guía de despacho del camión.

---

## 4. Estándares UX/UI y Accesibilidad: "Regla del Niño de 12 Años"
- [ ] **CHK-UX-01 (Light Mode WCAG 2.2 AA+):** Contraste superior a 4.5:1 en textos estándar y 7:1 en display de pesaje y alertas. Cero fondos oscuros fatigantes en ambiente de muelle.
- [ ] **CHK-UX-02 (Ergonomía Táctil y Targets):**
  - Botones secundarios, botones de incremento y tabs $\ge 48\times 48\text{ px}$.
  - Botón principal de liquidación y lotes $\ge 56\text{ px}$ de altura (`min-h-[56px] h-14`).
  - Micro-animación física en botones táctiles (`active:scale-95`).
- [ ] **CHK-UX-03 (Stepper Guiado en 3 Pasos):**
  - Paso 1: Proveedor y Furgón (Placa, Temperatura cava).
  - Paso 2: Pesaje en Báscula (Canastillas, tara y % hielo).
  - Paso 3: Liquidación de Compra y Entrada a Frío (COP, Forma de pago, Confirmación).
- [ ] **CHK-UX-04 (Cero Imágenes Externas):** 100% iconos vectoriales Lucide React sin dependencias externas ni imágenes pesadas no responsive.

---

## 5. Integración Contable, Tesorería y Control de Inventarios
- [ ] **CHK-FIN-01 (Causación de Cuentas por Pagar - CxP):** Compras a crédito generan un registro atómico en `cuentas_por_pagar` con plazo en días y fecha de vencimiento.
- [ ] **CHK-FIN-02 (Egreso de Caja para Compras de Contado):** Compras de contado efectúan un debito directo en la caja activa del turno (`EGRESO_COMPRA_MERCANCIA`).
- [ ] **CHK-FIN-03 (Idempotencia y Actualización de Stock):** Incremento de inventario con tipo de movimiento `ENTRADA_COMPRA_PROVEEDOR` sin duplicidades ante doble clic o reintentos.

---

## 6. Arquitectura de Software y Quality Gate
- [ ] **CHK-ENG-01 (Clean Architecture & SRP):** Modularización en archivos $< 600$ líneas útiles, separando capa de presentación, esquemas Zod de validación y servicios transaccionales.
- [ ] **CHK-ENG-02 (TypeScript Estricto):** Cero errores en `tsc --noEmit` y tipado exhaustivo sin uso de `any`.
- [ ] **CHK-ENG-03 (Suites Vitest TDD):** 100% de tests verdes pasando con cobertura integral de cálculo de pesaje, validación de inocuidad y transacciones financieras.
- [ ] **CHK-ENG-04 (Master Architect SOLID):** Cero violaciones críticas en `scripts/architecture/audit-solid-boundaries.cjs`.
- [ ] **CHK-ENG-05 (Chrome DevTools MCP):** Cero errores JavaScript en consola y validación en viewport móvil táctil (375 px).
