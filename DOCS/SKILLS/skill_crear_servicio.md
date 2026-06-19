# Skill: Cómo Crear un Servicio de Datos

> **USO**: Adjunta este archivo cuando necesites que Antigravity cree un nuevo archivo de servicio.
> Comando: `@DOCS/AI_RULES.md @DOCS/SKILLS/skill_crear_servicio.md Crea el servicio para el módulo [X]`

---

## Qué es un Servicio en este Proyecto

Un servicio (`*Service.ts`) es un módulo TypeScript puro que contiene **exclusivamente lógica de negocio**. No importa React, no tiene JSX, no maneja estado de UI. Solo funciones que transforman datos y aplican reglas de negocio.

---

## Estructura de un Servicio

```typescript
// src/services/[modulo]Service.ts

// 1. Importar SOLO tipos y el localDb
import { load, save } from './localDb';
import type { MiEntidad, ResultadoOperacion } from '../types/[modulo].types';

// 2. Constantes del módulo (si aplica)
const NOMBRE_CLAVE_DB = 'pezcaderia_[clave]' as const;

// ============================================================
// FUNCIONES DE LECTURA (getters)
// ============================================================

/**
 * Obtiene todos los [entidades] del sistema.
 * @returns ResultadoOperacion con el array de entidades o error
 */
export function getAll[Entidades](): ResultadoOperacion<MiEntidad[]> {
  try {
    const data = load('[clave]', []);
    return { data, error: null };
  } catch {
    return { data: null, error: 'Error al cargar [entidades]' };
  }
}

// ============================================================
// FUNCIONES DE ESCRITURA (mutations)
// ============================================================

/**
 * Crea una nueva [entidad].
 * Aplica: RN-XX ([descripción de la regla])
 */
export function crear[Entidad](input: Omit<MiEntidad, 'id'>): ResultadoOperacion<MiEntidad> {
  // Validar reglas de negocio PRIMERO
  if (!input.campo) {
    return { data: null, error: 'El campo [X] es obligatorio' };
  }

  // Aplicar lógica de negocio
  const nueva: MiEntidad = {
    id: crypto.randomUUID(),
    ...input,
  };

  // Persistir
  const entidades = load('[clave]', []);
  save('[clave]', [...entidades, nueva]);

  return { data: nueva, error: null };
}

// ============================================================
// FUNCIONES DE VALIDACIÓN (puras, sin efectos secundarios)
// ============================================================

/**
 * Valida [condición]. Función pura, no modifica estado.
 * Usada por los tests directamente.
 */
export function validar[Condicion](
  param: number
): ResultadoOperacion<{ valido: true }> {
  if (param <= 0) {
    return { data: null, error: 'El valor debe ser mayor a 0' };
  }
  return { data: { valido: true }, error: null };
}
```

---

## Reglas del Patrón de Servicio

### ✅ SIEMPRE
- Retornar `{ data, error }` en TODAS las funciones (tipo `ResultadoOperacion<T>`)
- Comentar con `// RN-XX` cuando se aplique una regla de negocio
- Validar reglas de negocio ANTES de persistir
- Las funciones de validación deben ser **puras** (sin efectos secundarios) para que sean testeable directamente

### ❌ NUNCA
- Importar React o componentes en un servicio
- Usar `console.log` (solo `console.warn` o `console.error` para errores reales)
- Lanzar excepciones (`throw`). Retornar el error en el campo `error` del resultado
- Acceder a `localStorage` directamente: usar `load()` y `save()` de `localDb.ts`
- Cruzar dominios: `posService` no escribe en claves del inventario directamente

---

## Ejemplo Real: `posService.ts`

```typescript
// src/services/posService.ts

import { load, save } from './localDb';
import { validarStock } from './inventoryService'; // Cruzar vía interfaz pública
import type { VentaPOS, LineaVenta, ResultadoOperacion } from '../types/pos.types';

/**
 * Calcula los totales de una línea de venta.
 * Aplica: RN-06 (descuento por línea)
 */
export function calcularTotalLinea(
  precioLista: number,
  descuentoPct: number,
  cantidad: number
): { precioFinal: number; totalLinea: number } {
  const precioFinal = precioLista * (1 - descuentoPct / 100); // RN-06
  const totalLinea = cantidad * precioFinal;
  return { precioFinal, totalLinea };
}

/**
 * Calcula subtotal y total final de un pedido POS.
 * Aplica: RN-06 (total nunca negativo)
 */
export function calcularTotalesPedido(
  lineas: Pick<LineaVenta, 'totalLinea'>[],
  descuentoGlobalPct: number,
  descuentoGlobalValor: number
): ResultadoOperacion<{ subtotal: number; descuento: number; totalFinal: number }> {
  const subtotal = lineas.reduce((acc, l) => acc + l.totalLinea, 0);
  const descuento = descuentoGlobalValor || subtotal * (descuentoGlobalPct / 100);

  if (descuento > subtotal) { // RN-06
    return { data: null, error: 'El descuento no puede superar el total del pedido' };
  }

  return { data: { subtotal, descuento, totalFinal: subtotal - descuento }, error: null };
}

/**
 * Registra una venta en el sistema.
 * Aplica: RN-01 (stock), RN-07 (idempotencia)
 */
export function registrarVenta(venta: VentaPOS): ResultadoOperacion<VentaPOS> {
  // RN-07: Verificar idempotencia
  const ventas = load('ventas', [] as VentaPOS[]);
  const existente = ventas.find(v => v.idempotencyKey === venta.idempotencyKey);
  if (existente) return { data: existente, error: null };

  // RN-01: Validar stock para cada línea
  for (const linea of venta.lineas) {
    const stockCheck = validarStock(linea.productoId, 'bodega-activa', linea.cantidad);
    if (stockCheck.error) return { data: null, error: stockCheck.error };
  }

  save('ventas', [...ventas, venta]);
  return { data: venta, error: null };
}
```
