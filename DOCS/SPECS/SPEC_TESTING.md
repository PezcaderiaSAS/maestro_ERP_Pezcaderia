# SPEC-TESTING: Guía de Tests Unitarios con Vitest

**Versión:** 1.0 | **Fecha:** 2026-06-19 | **Estado:** `APROBADO`

---

## 1. Configuración de Vitest

### Instalación

```bash
pnpm add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

### `vite.config.ts` — Agregar configuración de test

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
});
```

### `src/tests/setup.ts` — Setup global

```typescript
import '@testing-library/jest-dom';

// Mock de localStorage para tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

### Scripts en `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 2. Estructura de Tests

```
src/tests/
├── setup.ts                    ← Configuración global (mocks)
├── pos.test.ts                 ← Tests del módulo POS
├── inventory.test.ts           ← Tests del módulo Inventario
├── orders.test.ts              ← Tests del módulo Pedidos/Logística
└── utils/
    └── testFactories.ts        ← Factories para crear datos de prueba
```

---

## 3. Convenciones de Tests

### Estructura de cada test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('[Módulo]: [Funcionalidad]', () => {
  beforeEach(() => {
    // Limpiar estado entre tests
    localStorage.clear();
  });

  it('debería [resultado esperado] cuando [condición]', () => {
    // Arrange (preparar datos)
    const input = { ... };

    // Act (ejecutar la función)
    const resultado = miFuncion(input);

    // Assert (verificar resultado)
    expect(resultado.error).toBeNull();
    expect(resultado.data).toEqual(expect.objectContaining({ ... }));
  });
});
```

### Regla de nombrado

- Archivos: `[modulo].test.ts`
- Describe: `'[Módulo]: [Entidad o Flujo]'`
- It: `'debería [resultado] cuando [condición]'`

---

## 4. Factory de Datos de Prueba

```typescript
// src/tests/utils/testFactories.ts

import type { Producto } from '../../types/inventory.types';
import type { VentaPOS } from '../../types/pos.types';
import type { Pedido } from '../../types/orders.types';

export const crearProducto = (overrides: Partial<Producto> = {}): Producto => ({
  id: 'prod-001',
  sku: 'SAL-001',
  nombre: 'Salmón Entero',
  categoriaId: 'cat-001',
  unidadMedida: 'KG',
  precioCompra: 15000,
  precioVentaPOS: 22000,
  precioVentaRestaurante: 20000,
  precioVentaMayorista: 18000,
  codigoBarras: null,
  imagenUrl: null,
  bufferSeguridad: 5,
  activo: true,
  ...overrides,
});

export const crearVentaPOS = (overrides: Partial<VentaPOS> = {}): VentaPOS => ({
  id: 'venta-001',
  fecha: new Date().toISOString(),
  clienteId: null,
  cajeroId: 'user-001',
  lineas: [],
  subtotal: 0,
  descuentoGlobalPct: 0,
  descuentoGlobalValor: 0,
  totalFinal: 0,
  formaPago: 'EFECTIVO',
  requiereFacturaElectronica: false,
  estadoSiigo: 'NO_REQUERIDO',
  idempotencyKey: crypto.randomUUID(),
  ...overrides,
});

export const crearPedido = (overrides: Partial<Pedido> = {}): Pedido => ({
  id: 'ped-001',
  numeroPedido: 'PED-000001',
  fecha: new Date().toISOString(),
  origen: 'VISITA',
  clienteId: 'cli-001',
  bodegaId: 'bod-001',
  vendedorId: 'user-001',
  formaPago: 'CONTADO',
  tipoEntrega: 'EN_RUTA',
  fechaEntrega: new Date().toISOString().split('T')[0],
  jornada: 'MANANA',
  estado: 'CREADO',
  observaciones: '',
  lineas: [],
  subtotal: 0,
  descuentoGlobalPct: 0,
  descuentoGlobalValor: 0,
  totalFinal: 0,
  idempotencyKey: crypto.randomUUID(),
  rutaId: null,
  ...overrides,
});
```

---

## 5. Ejemplos de Tests por Módulo

### Tests del POS (`pos.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { calcularTotalLinea, calcularTotalesPedido } from '../../services/posService';
import { crearProducto } from './utils/testFactories';

describe('POS: Cálculo de Descuentos (RN-06)', () => {
  it('debería calcular precioFinal con descuento por línea', () => {
    const precioLista = 22000;
    const descuentoPct = 10;

    const resultado = calcularTotalLinea(precioLista, descuentoPct, 1.5);

    expect(resultado.precioFinal).toBe(19800);   // 22000 * 0.90
    expect(resultado.totalLinea).toBe(29700);    // 19800 * 1.5
  });

  it('debería bloquear si descuento global supera el subtotal (RN-06)', () => {
    const lineas = [{ precioFinal: 5000, cantidad: 2, totalLinea: 10000 }];
    const descuentoGlobalValor = 15000;

    const resultado = calcularTotalesPedido(lineas, 0, descuentoGlobalValor);

    expect(resultado.error).toBe('El descuento no puede superar el total del pedido');
    expect(resultado.data).toBeNull();
  });

  it('debería retornar data sin error en venta válida', () => {
    const lineas = [{ precioFinal: 22000, cantidad: 1, totalLinea: 22000 }];

    const resultado = calcularTotalesPedido(lineas, 0, 0);

    expect(resultado.error).toBeNull();
    expect(resultado.data?.totalFinal).toBe(22000);
  });
});
```

### Tests del Inventario (`inventory.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { validarStock, registrarEntrada } from '../../services/inventoryService';
import { save } from '../../services/localDb';

describe('Inventario: Control de Stock (RN-01)', () => {
  beforeEach(() => {
    localStorage.clear();
    // Preparar stock inicial
    save('stock', [
      { bodegaId: 'bod-001', productoId: 'prod-001', cantidad: 10 }
    ]);
  });

  it('debería retornar válido si hay stock suficiente', () => {
    const resultado = validarStock('prod-001', 'bod-001', 5);
    expect(resultado.error).toBeNull();
    expect(resultado.data?.disponible).toBe(10);
  });

  it('debería bloquear si la cantidad supera el stock disponible (RN-01)', () => {
    const resultado = validarStock('prod-001', 'bod-001', 15);
    expect(resultado.error).toBe('Stock insuficiente. Disponible: 10 KG');
    expect(resultado.data).toBeNull();
  });

  it('debería registrar entrada y actualizar stock', () => {
    registrarEntrada({ bodegaId: 'bod-001', productoId: 'prod-001', cantidad: 5 });
    const resultado = validarStock('prod-001', 'bod-001', 14);
    expect(resultado.error).toBeNull(); // Ahora hay 15, puede sacar 14
  });
});
```

### Tests de Pedidos (`orders.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { validarTransicionEstado } from '../../services/ordersService';
import type { EstadoPedido } from '../../types/orders.types';

describe('Pedidos: Transiciones de Estado (RN-04)', () => {
  const transicionesValidas: [EstadoPedido, EstadoPedido][] = [
    ['CREADO', 'ALISTADO'],
    ['ALISTADO', 'FACTURADO'],
    ['FACTURADO', 'EN_RUTA'],
    ['EN_RUTA', 'ENTREGADO'],
    ['CREADO', 'ANULADO'],
    ['ALISTADO', 'ANULADO'],
  ];

  transicionesValidas.forEach(([desde, hacia]) => {
    it(`debería permitir transición ${desde} → ${hacia}`, () => {
      const resultado = validarTransicionEstado(desde, hacia);
      expect(resultado.error).toBeNull();
    });
  });

  it('debería bloquear retroceder estado FACTURADO → ALISTADO (RN-04)', () => {
    const resultado = validarTransicionEstado('FACTURADO', 'ALISTADO');
    expect(resultado.error).toBe('Transición de estado no permitida');
  });

  it('debería bloquear facturar un pedido en estado CREADO (RN-05)', () => {
    const resultado = validarTransicionEstado('CREADO', 'FACTURADO');
    expect(resultado.error).toBe('Transición de estado no permitida');
  });
});
```

---

## 6. Ejecutar los Tests

```bash
# Modo watch (desarrollo)
pnpm test

# Una sola ejecución (CI)
pnpm test:run

# Con UI visual en el navegador
pnpm test:ui

# Con reporte de cobertura
pnpm test:coverage
```

---

## 7. Criterios Mínimos de Cobertura

| Módulo | Cobertura mínima |
|---|---|
| `posService.ts` | 80% |
| `inventoryService.ts` | 85% |
| `ordersService.ts` | 85% |
| Reglas de negocio RN-01 a RN-15 | 100% de las reglas tienen al menos 1 test |
