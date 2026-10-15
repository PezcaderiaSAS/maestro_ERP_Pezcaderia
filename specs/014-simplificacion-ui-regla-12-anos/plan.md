# Plan Técnico de Implementación: SPEC-014

**Código:** SPEC-014  
**Título:** Simplificación Radical de UI en POS y Operaciones (Regla del Niño de 12 Años: Fricción Cero, Targets $\ge 48\text{ px}$, Pesaje Manual Asistido y Auto-Focus)  
**Estado:** DRAFT (Esperando Aprobación Humana)  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.plan`  

---

## 1. Arquitectura Técnica y Estrategia de Componentes

El plan desacopla la complejidad operativa en micro-interacciones táctiles intuitivas manteniendo la arquitectura Data-Driven del ERP:

```
                  ┌────────────────────────────────────────┐
                  │               POSView                  │
                  │   (Gestor de Foco Global & Hotkeys)    │
                  └───────────────┬────────────────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│     ProductSearchPanel       │              │          CartPanel           │
│ - Input Auto-focus ubicuo    │              │ - Botón COBRAR (>= 56px)     │
│ - Filtros táctiles (>= 48px) │              │ - Totales Alto Contraste COP │
│ - Clic en prod. por peso:    │              │ - Resumen visual despejado   │
│   dispara ManualWeightModal  │              └──────────────┬───────────────┘
└──────────────┬───────────────┘                             │
               │                                   ┌─────────┴─────────┐
               ▼                                   ▼                   ▼
┌──────────────────────────────┐       ┌─────────────────┐   ┌─────────────────┐
│      ManualWeightModal       │       │  LineaVentaRow  │   │  PaymentPanel   │
│ - Chips peso: 0.5, 1, 2, 5kg │       │ - Botones +/-   │   │ - Billetes COP  │
│ - Keypad numérico (>= 56px)  │       │   (>= 48px)     │   │   (>= 48px)     │
│ - Auto-focus + select()      │       │ - Eliminar      │   │ - Cobro 1 toque │
│ - Confirmar con Enter/Toque  │       │   (>= 48px)     │   │ - Foco retorno  │
└──────────────────────────────┘       └─────────────────┘   └─────────────────┘
```

---

## 2. Desglose de Componentes a Modificar y Crear

### 2.1. Nuevo Componente: `ManualWeightModal.tsx`
* **Ubicación:** `src/views/pos/components/ManualWeightModal.tsx`
* **Propósito:** Permitir al cajero registrar el peso exacto de la balanza física de mesa en 1 toque o menos de 3 segundos, sin hardware serial ni clics redundantes.
* **Características:**
  - Chips rápidos táctiles: `0.25 kg` (250g), `0.5 kg` (libra), `0.75 kg`, `1.0 kg`, `1.5 kg`, `2.0 kg`, `3.0 kg`, `5.0 kg`.
  - Campo numérico auto-enfocado (`autoFocus`) con `onFocus={(e) => e.target.select()}` para sobreescribir al instante.
  - Keypad numérico táctil en pantalla de $56\text{ px}$ (dígitos 0–9, punto decimal y tecla borrar).
  - Cálculo en tiempo real del subtotal: `(peso * precioUnitario)` formateado en COP.
  - Botón táctil gigante verde esmeralda `[AGREGAR AL CARRITO]` ($\ge 56\text{ px}$) accesible con tecla `Enter`.

### 2.2. Optimización de `ProductSearchPanel.tsx`
* **Foco Continuo:** Mantener `searchRef.current?.focus()` al montar y exponer un método / prop `focusSearchInput()` para que el contenedor lo invoque tras cada evento.
* **Integración de Pesaje:** Al hacer clic en un producto con `unidadMedida === 'kg'` o categoría de pescadería a granel, abrir el `ManualWeightModal` con el producto preseleccionado. Si el producto es por unidad (`und`), agregarlo de inmediato en 1 unidad.
* **Targets Táctiles en Categorías:** Botones de chips de categoría con `min-h-[44px]` a `48px` para alternar entre pescados, mariscos y abarrotes con guantes o dedos húmedos.

### 2.3. Rediseño Táctil de `LineaVentaRow.tsx`
* **Targets Táctiles $\ge 48\text{ px}$:**
  - Botones de incremento `+` y decremento `-` con `w-12 h-12` ($48 \times 48\text{ px}$) y tipografía bold.
  - Input de cantidad editable inline con `h-12 text-center font-bold text-lg` que al ser tocado ejecuta `select()`.
  - Botón de eliminar con target de $48 \times 48\text{ px}$ y color rojo suave accesible (`text-rose-600 hover:bg-rose-50`).
  - Al pulsar sobre la etiqueta o número de peso en kg, abrir el `ManualWeightModal` para reajustar el peso directamente.

### 2.4. Ergonomía en `CartPanel.tsx`
* **Botón COBRAR:**
  - Dimensiones: `min-h-[56px]`, ancho completo (`w-full`), padding táctil generoso.
  - Color: Esmeralda `#059669` / hover `#047857` con texto blanco bold monoespaciado para el valor COP.
* **Micro-animación de Pulso:**
  - Animación sutil de rebote/pulso (`scale-[1.02]` momentáneo) en el badge del total cada vez que una línea se añade o modifica.
* **Botones de Soporte:** `Vaciar Carrito` y `Guardar Espera` con `min-h-[48px]`.

### 2.5. Flujo Fricción Cero en `PaymentPanel.tsx`
* **Billetes Sugeridos:** Dimensionamiento $\ge 48\text{ px}$ en botones de `$2.000`, `$5.000`, `$10.000`, `$20.000`, `$50.000`, `$100.000` y `$Exacto`.
* **Retorno Inmediato Post-Pago:** Tras completar la venta, disparar impresión térmica y callback `onPagoExitoso()` que:
  1. Cierra modales.
  2. Emite toast de confirmación visual breve (1000 ms).
  3. Reubica el foco en `#pos-product-search-input`.

---

## 3. Flujo de Datos y Contratos de Interfaces

### Contrato de `ManualWeightModalProps`:
```typescript
export interface ManualWeightModalProps {
  isOpen: boolean;
  producto: Product | null;
  pesoInicial?: number;
  precioUnitario: number;
  onConfirm: (producto: Product, pesoKg: number) => void;
  onClose: () => void;
}
```

---

## 4. Estrategia de Pruebas TDD (Quality Gate)

1. **`src/tests/posManualWeightModal.test.tsx` (Nuevo):**
   - Renderizado con peso inicial y cálculo correcto de subtotal en COP.
   - Selección de chips de peso frecuente (`0.5`, `1.0`, `2.0 kg`).
   - Uso del keypad numérico táctil en pantalla y confirmación con `Enter`.
   - Auto-foco y selección total en input numérico.
2. **`src/tests/posTouchErgonomics.test.tsx` (Nuevo):**
   - Verificación de dimensiones de targets táctiles ($\ge 48\text{ px}$ en botones `+`, `-`, eliminar y $\ge 56\text{ px}$ en `Cobrar`).
   - Ciclo de auto-focus: montaje del POS $\rightarrow$ adición de producto $\rightarrow$ cobro $\rightarrow$ retorno del foco a `#pos-product-search-input`.
   - Comportamiento de productos por unidad vs productos por peso.
3. **Validación en Vivo Chrome DevTools MCP:**
   - 0 errores de consola JavaScript.
   - Verificación visual en 375 px (móvil) y 768 px (tablet táctil).
