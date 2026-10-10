# Plan de Implementación Brownfield SDD 007: Alquiler de Frío — Peso Fijo por Cajas, Granel Bimodal & Salida Rápida

## 1. Resumen Ejecutivo
Este plan define las modificaciones requeridas en los esquemas de validación Zod, servicios de negocio y componentes React para implementar:
1. Recepción ágil de productos estandarizados en cajas de peso cerrado (`PESO_ESTABLE`) sin forzar báscula individual.
2. Control bimodal estricto (Canastillas físicas y Kilos netos) para producto a granel (`MIXTO_BULTOS_PESO`).
3. Sugerencia proporcional automática en salidas parciales a granel con campo de peso neto editable.
4. Doble nivel de Salida Rápida (`[⚡ Retirar Restante]` por lote individual y `[⚡ Despachar Todo el Saldo]` global por cliente).

---

## 2. Arquitectura de Módulos Modificados

```
┌────────────────────────────────────────────────────────┐
│ packages/validation-schemas/src/coldStorageRental.schema.ts │
│  - calcularPesoCajasNominal()                          │
│  - calcularEstimacionProporcionalSalida()              │
│  - Refinamiento de tipos y modalidades                 │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ src/services/coldStorageRentalService.ts               │
│  - Actualización de inventario custodia con bultos y kg│
│  - Soporte de retiros parciales y totales              │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ src/views/coldStorageRental/ColdStorageRentalView.tsx   │
│  - UI Báscula: Modo Cajas de Peso Cerrado              │
│  - UI Despacho: Sugerencia proporcional al editar      │
│  - UI Despacho: Botón [⚡ Retirar Restante] (Lote)     │
│  - UI Despacho: Botón [⚡ Despachar Todo el Saldo]     │
│    (Cabecera Global)                                   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ src/tests/coldStorageRental.test.ts                    │
│  - Tests unitarios de cálculo proporcional y nominal   │
│  - Tests de flujo de entrada de cajas y salidas a granel│
└────────────────────────────────────────────────────────┘
```

---

## 3. Especificación Técnica de Algoritmos

### 3.1. Cálculo de Cajas con Peso Fijo Nominal
$$\text{Peso Neto} = \text{cantidadCajas} \times \text{pesoNominalKg}$$
$$\text{Peso Bruto} = \text{Peso Neto} + (\text{cantidadCajas} \times \text{taraCajaKg})$$

### 3.2. Estimación Proporcional de Salidas Parciales a Granel
$$\text{Peso Retiro Sugerido} = \text{round}\left(\left(\frac{\text{pesoNetoActual}}{\text{bultosActuales}}\right) \times \text{bultosARetirar}, 2\right)$$
- **Caso Bultos = 0:** Retorna 0.
- **Caso Retiro Total ($\text{bultosARetirar} \ge \text{bultosActuales}$):** Retorna exactamente `pesoNetoActual` para prevenir discrepancias por redondeo acumulado.

---

## 4. Estrategia de Pruebas TDD
1. Crear pruebas unitarias para `calcularPesoCajasNominal` y `calcularEstimacionProporcionalSalida`.
2. Probar escenarios de borde: 40 canastillas con 843.3 kg, retiro de 30 canastillas (sugerido 632.48 kg, retiro real 630 kg), retiro posterior de las 10 canastillas restantes (saldo final 213.3 kg exactos).
3. Validar botón de vaciado rápido global y por lote.
4. Auditoría en vivo con `chrome-devtools` (consola JS limpia y responsive en 375 px).
