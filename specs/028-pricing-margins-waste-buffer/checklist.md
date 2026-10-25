# Lista de Verificación de Calidad: SPEC-028 — Precios Dinámicos, Márgenes y Módulo de Mermas

**Código:** SPEC-028  
**Fase:** /speckit.checklist (SDD v3.0)  
**Fecha:** 2026-10-24  
**Estado:** PENDIENTE_APROBACION_USUARIO  
**Regla:** Cero código de producción. Esperar confirmación del usuario.

---

## 1. Integridad de Dominio y Contratos de Datos (Zod & TypeScript)

- [ ] **CHK-028-01 (Contrato de Configuración Global):**  
  Existe un esquema Zod estricto `PricingGlobalConfigSchema` que valida:
  - `margenPosPct`: número positivo entre $1\%$ y $200\%$.
  - `margenRestaurantePct`: número positivo entre $1\%$ y $200\%$.
  - `margenMayoristaPct`: número positivo entre $1\%$ y $200\%$.
  - `margenMinimoSeguridadPct`: número positivo entre $0\%$ y $50\%$.
  - `redondeoEnteroCop`: booleano obligatorio.
  - `bloquearVentaBajoCosto`: booleano obligatorio.

- [ ] **CHK-028-02 (Contrato de Mermas por Categoría):**  
  Existe `CategoryWasteConfigSchema` con validación de buffers por especie entre $0\%$ y $50\%$, desglosando despiece, descongelación y cocción/vísceras.

- [ ] **CHK-028-03 (Contrato de Simulación y Tarifas de Producto):**  
  Existe `ProductPricingCalculationInputSchema` y `PricingRecordSnapshotSchema` con tipos TypeScript estrictos derivados vía `z.infer`.

- [ ] **CHK-028-04 (Cero `any` y Tipado Estricto):**  
  Todo el módulo compila con `tsc --noEmit` sin advertencias, sin `any` implícitos ni conversiones forzadas.

---

## 2. Precisión Matemática y Reglas de Negocio (Determinismo)

- [ ] **CHK-028-05 (Fórmula de Costo Ajustado por Merma):**  
  El servicio calcula de forma determinista:
  $$\text{costoAjustado} = \text{Math.round}\left(\text{costoCompra} \times \left(1 + \frac{\text{bufferEfectivoPct}}{100}\right)\right)$$
  con tolerancia de 0 centavos (redondeo entero COP estricto `RN-06`).

- [ ] **CHK-028-06 (Jerarquía Bimodal de Buffers):**  
  El cálculo aplica el buffer individual del producto si está definido (`bufferPersonalizado != null`), o el buffer de su categoría en caso contrario.

- [ ] **CHK-028-07 (Detección de Venta Bajo Costo):**  
  Si para cualquier canal el precio fijado es estrictamente menor al `costoAjustado`, el motor emite un estado de error `VENTA_BAJO_COSTO` y desactiva el guardado.

- [ ] **CHK-028-08 (Control de Margen de Seguridad Mínimo):**  
  Si el margen neto porcentual es menor que `margenMinimoSeguridadPct` (default $10\%$), se activa la alerta `MARGEN_INSUFICIENTE` y se exige rol `ADMIN` para autorizar.

- [ ] **CHK-028-09 (Tratamiento de IVA):**  
  Si el producto está marcado como gravado (IVA 19%), se desglosan en pantalla `subtotalNetoCop`, `ivaCop` y `precioFinalCop`, ambos redondeados a enteros.

---

## 3. Arquitectura, Modularidad y Principios SOLID

- [ ] **CHK-028-10 (Separación de Responsabilidades - SRP):**  
  La lógica de cálculo matemático reside exclusivamente en `pricingCalculationService.ts` (función pura sin efectos secundarios ni hooks de React).

- [ ] **CHK-028-11 (Inversión de Dependencias - DIP):**  
  Los repositorios de persistencia (`pricingConfigService.ts` y almacén `localDb`) implementan interfaces desacopladas fácilmente mockeables en pruebas unitarias.

- [ ] **CHK-028-12 (Auditoría Inmutable de Snapshots):**  
  Cada actualización de tarifas persiste una entrada inmutable en `preciosHistorico` con `vigenciaDesde`, `motivo`, `usuarioId` y snapshot completo de costos y márgenes.

- [ ] **CHK-028-13 (Emisión de Eventos de Dominio):**  
  Toda modificación relevante emite eventos formales a `useEventStore` (`PRICING_CONFIG_UPDATED`, `PRODUCT_PRICING_CHANGED`).

---

## 4. Estándares UI/UX, Light Mode WCAG 2.2 AA+ y Regla de 12 Años

- [ ] **CHK-028-14 (Cero Imágenes Externas):**  
  100% iconografía vectorial semántica con Lucide React (`DollarSign`, `TrendingUp`, `Sliders`, `AlertTriangle`, `ShieldCheck`).

- [ ] **CHK-028-15 (Contraste y Legibilidad WCAG 2.2 AA+):**  
  Colores con ratio $\ge 4.5:1$ en texto normal y $\ge 7:1$ en indicadores clave; fondo blanco/slate claro sin dark mode forzado en este flujo operativo.

- [ ] **CHK-028-16 (Touch Targets y Ergonomía Táctil):**  
  Todos los botones, inputs numéricos y toggles tienen una altura mínima de $48\text{ px}$ (`h-12`) o $56\text{ px}$ (`h-14`).

- [ ] **CHK-028-17 (Modal de Recálculo Masivo en Lote):**  
  La opción de "Recalcular categoría en lote" despliega una tabla comparativa clara con columnas: `Producto`, `Costo Actual`, `Tarifa Anterior`, `Nueva Tarifa Sugerida`, `Variación COP` y botón de confirmación explícito.

---

## 5. Control de Calidad y Pruebas TDD

- [ ] **CHK-028-18 (Batería Unitaria de Esquemas Zod):**  
  Suite `pricingEngineSchema.test.ts` con cobertura de casos válidos y rechazo de valores fuera de rango (ej. buffer negativo o mayor a 50%).

- [ ] **CHK-028-19 (Batería Unitaria del Servicio de Cálculo):**  
  Suite `pricingCalculationService.test.ts` con 100% de escenarios matemáticos verdes (márgenes normales, redondeos, IVA, sobreescritura de buffers y alertas de pérdida).

- [ ] **CHK-028-20 (Batería de Hooks y Componentes React):**  
  Pruebas RTL de la interacción con el simulador, reactividad ante sliders y panel de configuración Admin.

- [ ] **CHK-028-21 (Verificación en Vivo DevTools MCP):**  
  0 errores en consola JS, verificación en viewport móvil (375 px) y validación interactiva completa antes del cierre de tarea.
