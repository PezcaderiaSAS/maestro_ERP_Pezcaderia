# Plan de Implementación Técnica: SPEC-019

**Código:** SPEC-019  
**Título:** Optimización de Legibilidad, Ergonometría Táctil y Desbordamiento en Medios de Pago POS  
**Estado:** DRAFT (Esperando Aprobación Humana)  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.plan`  

---

## 1. Arquitectura y Estrategia de Refactorización

### 1.1. Estado Interno y Compatibilidad de Contrato
Para no romper el contrato existente con `CartPanel.tsx`, `POSView.tsx` y el backend RPC de Supabase, `PaymentPanel.tsx` continuará exportando y emitiendo `MetodoCobroPos`:
```typescript
export type MetodoCobroPos = 'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'QR_BANCOLOMBIA' | 'DATAFONO' | 'CREDITO';
```

A nivel de presentación y estado interno, se introduce la discriminación de categoría:
```typescript
type CategoriaPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'DATAFONO' | 'CREDITO';
type SubMetodoTransferencia = 'NEQUI' | 'DAVIPLATA' | 'QR_BANCOLOMBIA';

const [categoriaActiva, setCategoriaActiva] = useState<CategoriaPago>('EFECTIVO');
const [subTransferencia, setSubTransferencia] = useState<SubMetodoTransferencia>('NEQUI');
```
Cuando `categoriaActiva === 'TRANSFERENCIA'`, el `metodoPago` efectivo enviado al callback `onPagar` o evaluado por el sistema es el valor de `subTransferencia`. En los demás casos, mapea directamente a `EFECTIVO`, `DATAFONO` o `CREDITO`.

---

## 2. Plan Detallado por Componente y Capa

### 2.1. Refactorización de `PaymentPanel.tsx`

#### A. Cabecera y Botón Split
- Cambiar label informativo de atajos a `<kbd>F1-F4</kbd>` en lugar de `F1-F6`.
- Mantener el botón `+ Split` con tamaño táctil y feedback claro.

#### B. Modo Cobro Único: Grilla 2x2 para Macro-Medios
- Reemplazar la grilla `grid grid-cols-3 sm:grid-cols-6 gap-1` por:
  ```tsx
  <div className="grid grid-cols-2 gap-2">
    {/* 1. Efectivo [F1] */}
    {/* 2. Transferencia [F2] */}
    {/* 3. Datáfono [F3] */}
    {/* 4. Crédito [F4] */}
  </div>
  ```
- Cada botón tendrá:
  - Altura mínima: `min-h-[50px] h-auto py-2 px-3`.
  - Icono y texto alineados en fila con espacio suficiente: `<Icon size={18} className="..." />`.
  - Badge de atajo: `<kbd className="text-[10px] font-mono font-bold ...">[F1]</kbd>`.
  - Texto completo sin `truncate`: `<span className="text-xs font-bold leading-tight">Efectivo</span>`.

#### C. Sub-Barra de Transferencias (Nequi, Daviplata, QR Bancolombia)
- Si `categoriaActiva === 'TRANSFERENCIA'`, se renderiza una sub-tarjeta con transición suave conteniendo 3 píldoras en `grid grid-cols-3 gap-1.5`:
  ```tsx
  <div className="p-2 bg-slate-100/80 border border-slate-200 rounded-xl flex flex-col gap-1.5">
    <div className="flex items-center justify-between px-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Destino de Transferencia:
      </span>
      <span className="text-[10px] font-mono text-slate-400">Atajos 1 - 3</span>
    </div>
    <div className="grid grid-cols-3 gap-1.5">
      {/* Píldora Nequi: Smartphone, fuchsia */}
      {/* Píldora Daviplata: Wallet, rose */}
      {/* Píldora QR Bancolombia: QrCode, amber */}
    </div>
  </div>
  ```
- Cada sub-píldora cuenta con altura de $44\text{ px}$, icono de marca y nombre 100% visible sin puntos suspensivos.

#### D. Modo Split (+ Split / Cobro Mixto)
- Actualizar la grilla existente de 2 columnas (`grid grid-cols-2 gap-2.5`) asignando a cada uno de los 6 medios su icono y color de marca diferenciado.
- Altura de inputs garantizada en `h-11` ($44\text{ px}$) con números tabulares claros.

#### E. Manejador de Atajos de Teclado (`handleKeyDown`)
- `F1`: Seleccionar `EFECTIVO`.
- `F2`: Seleccionar `TRANSFERENCIA`. Si ya estaba en transferencia, ciclar entre Nequi -> Daviplata -> QR.
- `F3`: Seleccionar `DATAFONO`.
- `F4`: Seleccionar `CREDITO`.
- `1`, `2`, `3`: Si el foco no está en un input y la categoría es `TRANSFERENCIA`, conmutar inmediatamente a Nequi, Daviplata o QR.
- `Space`: Seleccionar pago con monto exacto en Efectivo.
- `Enter`: Procesar pago si las condiciones son válidas.

---

## 3. Plan de Pruebas Automatizadas TDD (Vitest)

### Archivo de Prueba: `src/views/pos/components/__tests__/PaymentPanel.test.tsx`
1. **Test 1:** Renderizado de los 4 botones principales con sus labels completos visibles (`Efectivo`, `Transferencia`, `Datáfono`, `Crédito`).
2. **Test 2:** Al hacer clic en `Transferencia`, verificar que se despliega la sub-barra con las 3 opciones (`Nequi`, `Daviplata`, `QR Bancolombia`) y que Nequi queda seleccionado por defecto.
3. **Test 3:** Al seleccionar `Daviplata`, verificar que el estado emitido en `onPagar` sea `{ metodo: 'DAVIPLATA', monto: total }`.
4. **Test 4:** Simulación de pulsación de teclas `F1`, `F2`, `F3`, `F4` comprobando el cambio reactivo de categoría activa.
5. **Test 5:** Verificación de contraste y ausencia de la clase `truncate` que generaba el bug de elipsis.

---

## 4. Matriz de Riesgo y Plan de Contingencia

| Riesgo Técnico | Severidad | Mitigación |
| :--- | :--- | :--- |
| Conflicto de atajos `1-3` con digitación en inputs | MEDIA | La escucha de teclas numéricas `1-3` verifica estrictamente `e.target instanceof HTMLInputElement`. Si el cajero está escribiendo un monto, NO intercepta el teclado. |
| Incompatibilidad con reportes de cierre de caja | NINGUNA | El tipo emitido sigue siendo `MetodoCobroPos` estándar (`NEQUI`, `DAVIPLATA`, etc.), garantizando que `cashService` y reportes no sufran alteraciones. |
| Desbordamiento en pantallas móviles pequeñas (< 340px) | BAJA | Grilla adaptable de 2 columnas con wrapping seguro `leading-tight`. |

---

## 5. Criterios de Aceptación y Quality Gate
1. `npm test src/views/pos/components/__tests__/PaymentPanel.test.tsx` pasando al 100%.
2. `npx tsc --noEmit` con 0 errores de tipado.
3. Bucle Chrome DevTools: 0 errores en consola y verificación visual en 375px y 1268px.
