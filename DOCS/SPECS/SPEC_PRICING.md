# SPEC-07: Precios Dinámicos y Simulación Comercial

**Versión:** 1.0
**Fecha:** 2026-06-19
**Estado:** `APROBADO`
**Archivo actual:** `src/views/PricingView.tsx` (a integrar)

---

## Resumen Ejecutivo

Este módulo gestiona la asignación de precios de venta dinámicos basados en costos base de compra y buffers de seguridad contra mermas de producto perecedero. Permite simular los márgenes para tres canales de venta principales (POS, Restaurante/Institucional y Mayorista), manteniendo una bitácora inmutable de la evolución de tarifas.

---

## 1. Contrato de Datos

### 1.1 Tipos TypeScript

```typescript
// src/types/pricing.types.ts

export interface ProductPricing {
  id: string;                    // Prefijo prc-
  productoId: string;            // FK a ProductCatalog
  vigenciaDesde: string;         // ISO DateTime
  precioCompra: number;          // Costo unitario base en COP
  bufferSeguridadPct: number;    // Porcentaje contra mermas (ej. 5%)
  precioVentaPos: number;        // Costo ajustado + 40%
  precioVentaRestaurante: number;// Costo ajustado + 30%
  precioVentaMayorista: number;  // Costo ajustado + 15%
  actualizadoPor: string;        // Rol de usuario (admin, administrativo)
}

export interface SimulaciónPrecio {
  costoCompra: number;
  bufferSeguridadPct: number;
  ivaPct: number;
  ivaIncluido: boolean;
}
```

### 1.2 Input / Output

| Campo | Dirección | Clave localDb / Destino |
|---|---|---|
| Catálogo de Productos | Lectura | `productsCatalog` |
| Histórico de Precios | Lectura/Escritura | `preciosHistorico` |
| Venta POS / Pedidos | Lectura | Determina tarifa según tipo de cliente |

---

## 2. Dominio (Reglas de Negocio)

**Reglas heredadas de `business_rules.md`:**
- `RN-06` — Cálculo de precios netos sin exceder subtotales

**Reglas específicas de este SPEC:**
```
DADO un costo base de compra y un buffer de seguridad
CUANDO se guardan los precios de venta
ENTONCES calcular de forma automática:
  costo_ajustado = costo_compra * (1 + buffer_seguridad_pct / 100)
  
  precio_sugerido_pos = costo_ajustado * 1.40
  precio_sugerido_restaurante = costo_ajustado * 1.30
  precio_sugerido_mayorista = costo_ajustado * 1.15
  
  Todos los precios resultantes deben redondearse al entero más cercano en COP.
```

---

## 3. Flujo de la Feature

```
[Administrador accede a Catálogo / Precios]
        │
        ▼
[Selecciona Producto para actualizar]
        │
        ▼
[Ingresa Costo Base de compra y % Buffer de Seguridad]
        │
        ▼
[Visualiza simulación en vivo de tarifas por canal]
  ├── POS (+40%)
  ├── Restaurante (+30%)
  └── Mayorista (+15%)
        │
        ▼
[Guarda Cambios]
  ├── Crear nueva tupla en localDb('preciosHistorico') con vigenciaDesde
  └── Actualizar campos de precio en el producto del catálogo activo
```

---

## 4. Plan de Refactoring

### Archivo actual
*   `src/views/PricingView.tsx` (138 KB — contiene sliders de precio y simulación manual)

### Estructura objetivo
```
src/views/pricing/
├── PricingView.tsx                 ← Vista principal de parametrización
├── components/
│   ├── CostConfigCard.tsx          ← Configuración de costo base y buffer
│   ├── PricingSimulator.tsx        ← Tabla interactiva de simulación
│   └── PriceHistoryChart.tsx       ← Gráfico de fluctuación de costos
└── hooks/
    └── usePricing.ts               ← Estado de simulación en vivo
src/services/
└── pricingService.ts               ← Lógica pura de redondeo y porcentajes
src/types/
└── pricing.types.ts
src/tests/
└── pricing.test.ts                 ← Tests de redondeo y fórmulas
```

---

## 5. Criterios de Validación (Tests)

### 5.1 Casos de Éxito

| ID Test | Escenario | Entrada | Resultado esperado |
|---|---|---|---|
| T-PRC-01 | Cálculo con buffer y márgenes | Costo: 10,000 COP, Buffer: 10% | Costo ajustado = 11,000, POS = 15,400, Rest = 14,300, Mayor = 12,650 |
| T-PRC-02 | Redondeo al entero más cercano | Costo ajustado * 1.40 da centavos | Redondeo matemático exacto (ej. 15,400.6 -> 15,401) |

---

## 6. Dependencias

| Tipo | Nombre | Propósito |
|---|---|---|
| Servicio interno | `localDb.ts` | Almacenar históricos |
| Módulo ERP | `Inventory` | Lee el costo base al procesar compras |

---

## 7. Notas de Implementación

- Los precios de venta sugeridos sirven de base para que la facturación inyecte tarifas correctas automáticamente según la clasificación del cliente (POS, Restaurante o Mayorista), previniendo modificaciones manuales en caja.
