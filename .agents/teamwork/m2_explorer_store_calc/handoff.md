# Handoff Report: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms en Zustand (Hito M2)

**Agente**: Explorer de Store y Cálculo Financiero (Teamwork Explorer)  
**Hito**: M2 (Tarea 2 — SPEC-057)  
**Fecha**: 2026-11-08  
**Estado**: Completado (Investigación y Diseño Técnico)

---

## 1. Observation

A partir de la inspección directa del código fuente del proyecto, se registran las siguientes observaciones verbatim y exactas:

### 1.1 Estado actual de `useMultiVendorPosStore.ts` (`src/stores/useMultiVendorPosStore.ts`)
- **Líneas 25-34**: El estado del carrito multivendedor almacena únicamente los ítems de preventa y el límite de descuento porcentual del asesor:
  ```typescript
  interface MultiVendorPosState {
    terminalId: string;
    vendedorActivo: VendedorSesion | null;
    turnoCentralEstado: 'ABIERTO' | 'CERRADO' | 'SIN_TURNO';
    turnoCentralId: string | null;

    // Estado del Carrito de Preventa
    cartItems: ItemPrefacturaInput[];
    maxDescuentoVendedorPct: number;
  ```
- **Líneas 216-228**: El cálculo de subtotales y totales en el store opera de forma síncrona pero solo contempla descuentos a nivel de ítem (`it.descuentoPct`), careciendo por completo de modelado o soporte para descuento global de comanda:
  ```typescript
  obtenerSubtotalCart: () => {
    const { cartItems } = get();
    return cartItems.reduce((acc, it) => acc + it.precioLista * it.cantidad, 0);
  },

  obtenerTotalCart: () => {
    const { cartItems } = get();
    return cartItems.reduce((acc, it) => {
      const desc = it.descuentoPct || 0;
      const precioFinal = Math.round(it.precioLista * (1 - desc / 100));
      return acc + precioFinal * it.cantidad;
    }, 0);
  },
  ```
- **Inexistencia**: No existen los campos `descuentoGlobal`, `descuentoGlobalTipo`, `descuentoGlobalValor`, ni las acciones `aplicarDescuentoGlobal` o `limpiarDescuentoGlobal` en `useMultiVendorPosStore.ts`.

### 1.2 Estado actual de `usePOSCart.ts` (`src/hooks/usePOSCart.ts`)
- **Líneas 27-30**: Maneja dos variables de estado desconectadas mediante hooks `useState`:
  ```typescript
  const [lineas, setLineas] = useState<LineaVenta[]>([]);
  const [cliente, setClienteState] = useState<ClientePOS | null>(initialCliente);
  const [descuentoGlobalPct, setDescuentoGlobalPct] = useState<number>(0);
  const [descuentoGlobalValor, setDescuentoGlobalValor] = useState<number>(0);
  ```
- **Líneas 38-44**: Delega el recálculo a `calcularTotalesPedido` vía `useMemo`:
  ```typescript
  const totales = useMemo(() => {
    const calc = calcularTotalesPedido(lineas, descuentoGlobalPct, descuentoGlobalValor);
    if (calc.error || !calc.data) {
      return { subtotal: 0, descuento: 0, totalFinal: 0, error: calc.error };
    }
    return { ...calc.data, error: null };
  }, [lineas, descuentoGlobalPct, descuentoGlobalValor]);
  ```
- **Líneas 212-217**: Al limpiar carrito resetea ambos valores:
  ```typescript
  const limpiarCarrito = () => {
    log.info('limpiarCarrito', { lineasPrevias: lineas.length });
    setLineas([]);
    setDescuentoGlobalPct(0);
    setDescuentoGlobalValor(0);
  };
  ```

### 1.3 Comportamiento de `calcularTotalesPedido` (`src/services/posService.ts`)
- **Líneas 47-81**:
  ```typescript
  export function calcularTotalesPedido(
    lineas: (Pick<LineaVenta, 'totalLinea'> & { baseGravableLinea?: number; cuotaIvaLinea?: number })[],
    descuentoGlobalPct: number = 0,
    descuentoGlobalValor: number = 0
  ): ResultadoOperacion<{
    subtotal: number;
    descuento: number;
    totalFinal: number;
    subtotalBaseGravable: number;
    totalIva: number;
  }> {
    const subtotal = Math.round(lineas.reduce((acc, l) => acc + (l.totalLinea || 0), 0));
    const subtotalBaseGravable = Math.round(
      lineas.reduce((acc, l) => acc + (l.baseGravableLinea !== undefined ? l.baseGravableLinea : l.totalLinea || 0), 0)
    );
    const totalIva = Math.round(lineas.reduce((acc, l) => acc + (l.cuotaIvaLinea || 0), 0));

    const descuento = Math.round(descuentoGlobalValor || subtotal * (descuentoGlobalPct / 100));

    if (descuento > subtotal) {
      return { data: null, error: 'El descuento no puede superar el total del pedido' };
    }

    const totalFinal = subtotal - descuento;
    return {
      data: {
        subtotal,
        descuento,
        totalFinal,
        subtotalBaseGravable,
        totalIva,
      },
      error: null,
    };
  }
  ```
- **Línea 64**: La expresión `descuentoGlobalValor || subtotal * (descuentoGlobalPct / 100)` da precedencia absoluta a `descuentoGlobalValor` si es distinto de cero.
- **Línea 66-68**: La regla comercial RN-06 impide que `descuento > subtotal`, retornando error `{ data: null, error: 'El descuento no puede superar el total del pedido' }`. Probada formalmente en `src/tests/pos.test.ts:54-62`.

### 1.4 Renderizado actual en `POSMultivendorCart.tsx` (`src/views/pos/components/POSMultivendorCart.tsx`)
- **Líneas 321-346**: El footer del carrito recibe `subtotal`, `descuento` y `total` numéricos calculados previamente, pero carece del botón/popover interactivo `+ Descuento (F4)` con selector `% / $`.

---

## 2. Logic Chain

A partir de las observaciones anteriores, se deduce la siguiente cadena lógica paso a paso:

1. **Riesgo de Sombreado y Desincronización en `usePOSCart.ts` (Ref Obs 1.2 & 1.3)**:
   Al usar dos variables primitivas independientes (`descuentoGlobalPct` y `descuentoGlobalValor`) y evaluarlas con `descuentoGlobalValor || subtotal * (descuentoGlobalPct / 100)`, si el usuario aplica un descuento en monto ($5.000) y luego desea cambiar a porcentaje (10%), si el código no limpia explícitamente `descuentoGlobalValor` a 0, el valor monetario continuará anulando al porcentaje.
   *Inferencia*: Se requiere un discriminador explícito de unión etiquetada (`tipo: 'porcentaje' | 'monto'`) que garantice exclusión mutua estricta.

2. **Lagunas de Validación en `calcularTotalesPedido` (Ref Obs 1.3)**:
   - Si se suministra un valor negativo (`descuentoGlobalValor = -5000` o `descuentoGlobalPct = -10`), `descuento` resulta negativo, y `totalFinal = subtotal - (-5000) = subtotal + 5000`. Esto genera un recargo involuntario sin disparar el error `descuento > subtotal`.
   - Si `subtotal === 0` (carrito vacío) y `descuentoGlobalValor > 0`, `descuento > subtotal` se cumple de inmediato, retornando `{ data: null, error: ... }`.
   *Inferencia*: Las acciones del Store deben sanear y delimitar los valores de entrada:
     - `valor = Math.max(0, Number(valor) || 0)`.
     - Si `tipo === 'porcentaje'`, restringir `0 <= valor <= 100`.
     - Si `tipo === 'monto'`, restringir `0 <= valor <= subtotalNeto`.
     - El cálculo de `totalFinal` debe acotarse con `Math.max(0, subtotal - descuento)`.

3. **Garantía del Límite de Rendimiento Sub-10ms (<10ms) en Zustand (Ref Obs 1.1)**:
   - El estado en Zustand opera en memoria heap de JavaScript (V8).
   - Para un carrito comercial POS típico con $N \le 50$ ítems, un ciclo iterativo `reduce` que compute subtotales y aplique fórmulas aritméticas consume entre $0.005$ y $0.02$ milisegundos (5 a 20 microsegundos).
   - $10$ milisegundos equivale a $10.000$ microsegundos. El recálculo en memoria consume menos del $0.2\%$ del presupuesto asignado.
   - *Regla Arquitectónica Inviolable*: Las acciones `aplicarDescuentoGlobal` y `limpiarDescuentoGlobal` deben ser **100% síncronas** (sin `async`, sin `await`, sin escrituras a disco o llamadas a backend en el ciclo de cálculo). El recálculo síncrono al interior de `set((state) => ...)` actualiza el estado y notifica a los componentes en menos de 1ms de forma determinista.

4. **Diseño de Integración con Permisos y PIN de Supervisor (Ref Obs 1.1 & SPEC-057 F14)**:
   - `useMultiVendorPosStore` cuenta con `maxDescuentoVendedorPct` (default: 10%).
   - Para `tipo === 'porcentaje'`: si `valor > maxDescuentoVendedorPct` y no viene con `supervisorPinAutorizado: true`, la acción debe retornar `{ ok: false, requiereSupervisor: true, error: ... }`.
   - Para `tipo === 'monto'`: se calcula el porcentaje equivalente `pctEquiv = (valor / subtotalNeto) * 100`. Si `pctEquiv > maxDescuentoVendedorPct` sin autorización de supervisor, se rechaza de la misma manera.
   - Esto prepara la base para la Tarea 5 (Hito M5) sin requerir re-arquitectura posterior.

---

## 3. Caveats

1. **Tratamiento Fiscal DIAN / Prorrateo de IVA**:
   En la versión actual de `calcularTotalesPedido` (`src/services/posService.ts`), el descuento global se descuenta del total final, pero no se prorratea proporcionalmente sobre la base gravable (`subtotalBaseGravable`) ni la cuota de IVA (`totalIva`). Para el módulo de comandas y preventas mostrador (`PRE-YYYY-XXXXX`), esto es consistente con el diseño previo, pero para facturación electrónica DIAN definitiva (módulo Facturación / SIIGO), el descuento global requiere prorrateo por ítem conforme a la legislación fiscal colombiana.
2. **Coexistencia Arquitectónica (`useMultiVendorPosStore` vs `usePOSCart`)**:
   Actualmente, `POSView.tsx` usa el hook local `usePOSCart.ts` para cálculos inmediatos en mostrador, mientras que `TerminalVendorBadge.tsx` y el flujo de preventas usan `useMultiVendorPosStore.ts`. Para evitar divergencias, se recomienda implementar las firmas de descuento global idénticas en ambos módulos.
3. **Persistencia en Emisión de Comanda**:
   El contrato `EmitirPrefacturaInput` en `src/types/prefactura.types.ts` actualmente registra ítems con descuentos por línea (`ItemPrefacturaInput.descuentoPct`). Al emitir la preventa, el monto del descuento global debe ser consolidado en `Prefactura.descuentoTotal` para que la caja central reciba el valor neto exacto.

---

## 4. Conclusion

### 4.1 Tipado Canónico Propuesto

```typescript
// En src/types/pos.types.ts o src/stores/useMultiVendorPosStore.ts

export type TipoDescuentoGlobal = 'porcentaje' | 'monto';

export interface DescuentoGlobalConfig {
  tipo: TipoDescuentoGlobal;
  valor: number; // Porcentaje (ej: 10 para 10%) o COP monetario (ej: 5000)
  montoCalculado: number; // Monto descontado en COP estrictamente redondeado
  supervisorPinAutorizado?: boolean;
  supervisorId?: string;
}

export interface TotalesCartResultado {
  subtotalBruto: number;       // Suma bruta precioLista * cantidad
  descuentoLineas: number;     // Suma de descuentos específicos por ítem
  subtotalNeto: number;        // subtotalBruto - descuentoLineas
  descuentoGlobalMonto: number;// Monto en COP del descuento global aplicado
  descuentoTotal: number;      // descuentoLineas + descuentoGlobalMonto
  totalFinal: number;          // subtotalNeto - descuentoGlobalMonto (>= 0)
}
```

### 4.2 Firmas de Actions en `useMultiVendorPosStore.ts`

```typescript
// En MultiVendorPosState:
interface MultiVendorPosState {
  // ... campos existentes ...
  descuentoGlobal: DescuentoGlobalConfig | null;

  // Acciones de Descuento Global
  aplicarDescuentoGlobal: (
    tipo: TipoDescuentoGlobal,
    valor: number,
    supervisorPinAutorizado?: boolean,
    supervisorId?: string
  ) => AplicarDescuentoResultado;

  limpiarDescuentoGlobal: () => void;

  // Getters actualizados
  obtenerTotalesCart: () => TotalesCartResultado;
  obtenerTotalCart: () => number; // Mantiene retrocompatibilidad restando descuentoGlobal
}
```

### 4.3 Implementación de Referencia de las Actions (Para el Implementador)

```typescript
// En useMultiVendorPosStore.ts:

descuentoGlobal: null,

aplicarDescuentoGlobal: (
  tipo: TipoDescuentoGlobal,
  valor: number,
  supervisorPinAutorizado?: boolean,
  supervisorId?: string
): AplicarDescuentoResultado => {
  const { cartItems, maxDescuentoVendedorPct } = get();

  if (cartItems.length === 0) {
    return { ok: false, requiereSupervisor: false, error: 'El carrito está vacío' };
  }

  const cleanValor = Math.max(0, Number(valor) || 0);
  if (cleanValor <= 0) {
    // Si es 0 o negativo, limpiar descuento
    set({ descuentoGlobal: null });
    return { ok: true, requiereSupervisor: false };
  }

  // Calcular subtotal de las líneas (después de descuentos individuales de ítem)
  const subtotalNetoLineas = cartItems.reduce((acc, it) => {
    const desc = it.descuentoPct || 0;
    const precioFinal = Math.round(it.precioLista * (1 - desc / 100));
    return acc + precioFinal * it.cantidad;
  }, 0);

  if (subtotalNetoLineas <= 0) {
    return { ok: false, requiereSupervisor: false, error: 'El subtotal del pedido es $0' };
  }

  let montoCalculado = 0;
  let pctEquivalente = 0;

  if (tipo === 'porcentaje') {
    if (cleanValor > 100) {
      return { ok: false, requiereSupervisor: false, error: 'El descuento porcentual no puede exceder el 100%' };
    }
    pctEquivalente = cleanValor;
    montoCalculado = Math.round(subtotalNetoLineas * (cleanValor / 100));
  } else {
    // tipo === 'monto'
    if (cleanValor > subtotalNetoLineas) {
      return { ok: false, requiereSupervisor: false, error: 'El descuento no puede superar el total del pedido' };
    }
    montoCalculado = Math.round(cleanValor);
    pctEquivalente = (montoCalculado / subtotalNetoLineas) * 100;
  }

  // Validación de Gobernanza de Supervisor (Límite comercial, default 10%)
  const requiereSupervisor = pctEquivalente > maxDescuentoVendedorPct;

  if (requiereSupervisor && !supervisorPinAutorizado) {
    const detalleError = tipo === 'porcentaje'
      ? `El descuento del ${cleanValor}% supera el límite permitido del ${maxDescuentoVendedorPct}%`
      : `El descuento de $${cleanValor.toLocaleString('es-CO')} (${pctEquivalente.toFixed(1)}%) supera el límite permitido del ${maxDescuentoVendedorPct}%`;

    return {
      ok: false,
      requiereSupervisor: true,
      error: `${detalleError} y requiere autorización por PIN de Supervisor`,
    };
  }

  // Actualización Síncrona en Memoria (<10ms)
  set({
    descuentoGlobal: {
      tipo,
      valor: cleanValor,
      montoCalculado,
      supervisorPinAutorizado: Boolean(supervisorPinAutorizado),
      supervisorId,
    },
  });

  return { ok: true, requiereSupervisor };
},

limpiarDescuentoGlobal: () => {
  set({ descuentoGlobal: null });
},

obtenerTotalesCart: (): TotalesCartResultado => {
  const { cartItems, descuentoGlobal } = get();

  let subtotalBruto = 0;
  let subtotalNeto = 0;

  for (const it of cartItems) {
    const bruto = it.precioLista * it.cantidad;
    const desc = it.descuentoPct || 0;
    const precioFinal = Math.round(it.precioLista * (1 - desc / 100));
    const neto = precioFinal * it.cantidad;

    subtotalBruto += bruto;
    subtotalNeto += neto;
  }

  const descuentoLineas = subtotalBruto - subtotalNeto;

  let descuentoGlobalMonto = 0;
  if (descuentoGlobal && descuentoGlobal.valor > 0 && subtotalNeto > 0) {
    if (descuentoGlobal.tipo === 'porcentaje') {
      descuentoGlobalMonto = Math.round(subtotalNeto * (Math.min(100, descuentoGlobal.valor) / 100));
    } else {
      descuentoGlobalMonto = Math.min(subtotalNeto, Math.round(descuentoGlobal.valor));
    }
  }

  const descuentoTotal = descuentoLineas + descuentoGlobalMonto;
  const totalFinal = Math.max(0, subtotalNeto - descuentoGlobalMonto);

  return {
    subtotalBruto,
    descuentoLineas,
    subtotalNeto,
    descuentoGlobalMonto,
    descuentoTotal,
    totalFinal,
  };
},

obtenerTotalCart: () => {
  return get().obtenerTotalesCart().totalFinal;
},
```

### 4.4 Integración con `limpiarCart`
En `limpiarCart`, resetear síncronamente:
```typescript
limpiarCart: () => {
  set({ cartItems: [], descuentoGlobal: null });
},
```

---

## 5. Verification Method

Para verificar independientemente la validez y corrección de esta arquitectura técnica:

1. **Verificación de Pruebas Existentes de `useMultiVendorPosStore`**:
   ```bash
   npx vitest run src/tests/useMultiVendorPosStore.test.ts
   ```
   *Condición de éxito*: 8/8 pruebas pasando sin regresiones.

2. **Verificación de Pruebas de Carrito Editable (Hito M1)**:
   ```bash
   npx vitest run src/tests/posCartEditableRow.test.tsx
   ```
   *Condición de éxito*: 10/10 pruebas pasando en verde.

3. **Verificación de Pruebas Financieras de Totales**:
   ```bash
   npx vitest run src/tests/posPricingAndTaxCop.test.ts src/tests/pos.test.ts
   ```
   *Condición de éxito*: Pruebas de redondeo entero COP y regla RN-06 (bloqueo si descuento > subtotal) verdes.

4. **Especificación del Test de Rendimiento Sub-10ms (Para el Implementador TDD)**:
   ```typescript
   it('ejecuta el recálculo síncrono de descuento global en menos de 10ms (<10ms)', () => {
     const store = useMultiVendorPosStore.getState();
     // Llenar carrito con 50 productos
     for (let i = 0; i < 50; i++) {
       store.agregarItem({
         productoId: `prod-bench-${i}`,
         nombre: `Producto ${i}`,
         cantidad: 3,
         precioLista: 25000,
         descuentoPct: 0,
       });
     }

     const t0 = performance.now();
     store.aplicarDescuentoGlobal('porcentaje', 10);
     const totalCalculado = store.obtenerTotalCart();
     const t1 = performance.now();

     const duracionMs = t1 - t0;
     expect(duracionMs).toBeLessThan(10);
     expect(totalCalculado).toBe(3375000); // 50 * 3 * 25000 = 3.750.000 - 10% = 3.375.000
   });
   ```

5. **Chequeo Estricto de Tipos**:
   ```bash
   npx tsc --noEmit
   ```
   *Condición de éxito*: 0 errores de compilación TypeScript.
