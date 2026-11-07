# Plan de Implementación Técnica: Modo Cajero Híbrido y Rediseño del Carrito POS (SPEC-054)
**Fase:** `/speckit.plan` (SDD v3.0)  
**Límite Operativo:** WIP = 1 estricto

---

## 1. Arquitectura de Archivos y Responsabilidades

```
src/
├── views/
│   ├── POSView.tsx                           <-- Orquestador principal: integra toggle Modo Cajero,
│   │                                             gestiona renderizado condicional del área izquierda
│   │                                             (Catálogo vs Cola Viva de Comandas) y topbar de turno
│   └── pos/
│       └── components/
│           ├── CartPanel.tsx                 <-- Reconstrucción del contenedor del carrito:
│           │                                     Header <= 44px, contenedor flex-1 min-h-0,
│           │                                     Footer <= 90px con TOTAL gigante y F2/F10
│           ├── LineaVentaRow.tsx             <-- Fila de tabla de alta densidad:
│           │                                     Nombre blanco 14px bold, edición inline tipo Excel,
│           │                                     botones [-] [+], captura báscula, subtotal alto contraste
│           ├── LiveComandasQueuePanel.tsx    <-- Componente nuevo: Cola Viva de Comandas FIFO (60% área principal)
│           │                                     con cards táctiles Fitts >= 48px, filtro de asesor y escáner
│           └── DirectCashierCheckoutPanel.tsx<-- Componente nuevo: Panel de liquidación directa para cajero
│                                                 con billetes ($100k, $50k, etc.), vueltas en vivo y F10
├── tests/
│   └── posCartRedesignAndCashierMode.test.tsx<-- Suite de pruebas TDD para verificar legibilidad,
│                                                 edición inline, scroll táctil y flujo de cajero
```

---

## 2. Fases de Implementación Secuencial (WIP = 1)

### Fase 1: Rediseño Anatómico de `CartPanel.tsx` y `LineaVentaRow.tsx` (Foco Vendedor)
- **Objetivo**: Garantizar legibilidad total del carrito, recuperar el espacio vertical (mínimo 350px-450px) y ofrecer edición inline tipo Excel con `[-]` y `[+]`.
- **Acciones**:
  1. Eliminar `showMacControls={true}` y el flag `isCompactMode` que ocultaba la lista de ítems.
  2. Condensar `pos-cart-header` a un contenedor esbelto $\le 44\text{px}$.
  3. Transformar `LineaVentaRow.tsx` en una fila de tabla limpia con fondo oscuro uniforme (`bg-slate-800/60 border-slate-700/40`), tipografía blanca 14px bold para el nombre del producto, botones táctiles `[-]` y `[+]` de $\ge 36\text{px}$, input numérico inline con auto-foco y botón de báscula integrado.
  4. Condensar el footer a $\le 90\text{px}$ firmemente anclado con `shrink-0 mt-auto`.

### Fase 2: Componentes del Modo Cajero Híbrido (`LiveComandasQueuePanel.tsx` & `DirectCashierCheckoutPanel.tsx`)
- **Objetivo**: Dotar al cajero de una estación de cobro donde no vea el catálogo y liquide en 1 solo paso.
- **Acciones**:
  1. Crear `LiveComandasQueuePanel.tsx`: Lista de tarjetas táctiles de preventas en espera (`PRE-YYYY-XXXXX`), ordenadas por tiempo de espera (FIFO), con barra de búsqueda rápida por código de ticket o escáner.
  2. Crear `DirectCashierCheckoutPanel.tsx`: Panel lateral permanente que exhibe el total gigante, selector táctil de medios de pago, botones de billetes colombianos ($100k, $50k, $20k, $10k, $5k, $2k), input de efectivo recibido y cálculo de cambio inmediato.
  3. Integrar la emisión de tirilla térmica silenciosa y toast con cambio entregado.

### Fase 3: Integración en `POSView.tsx` y Barra Superior de Turno
- **Objetivo**: Conectar el interruptor de Modo Cajero y los accesos rápidos a Arqueo Ciego y Egresos.
- **Acciones**:
  1. En `POSView.tsx`, agregar el estado `isModoCajero` (auto-activado si `userRole === 'cajero'`) y el botón toggle en la barra de sub-vistas.
  2. Renderizar condicionalmente: si `isModoCajero`, mostrar `LiveComandasQueuePanel` en el área izquierda y `DirectCashierCheckoutPanel` en el panel derecho; si no, mostrar catálogo y el nuevo `CartPanel`.
  3. Agregar la barra superior de turno con ventas en vivo y atajos a **Arqueo Ciego (<kbd>F4</kbd>)** y **Egreso Rápido (<kbd>F7</kbd>)**.

### Fase 4: Certificación TDD y Quality Gate
- **Objetivo**: 0 errores de TypeScript y 100% pruebas verdes en Vitest.
- **Acciones**:
  1. Crear y ejecutar `src/tests/posCartRedesignAndCashierMode.test.tsx`.
  2. Ejecutar `npx tsc --noEmit`.
  3. Ejecutar la suite completa de pruebas.

