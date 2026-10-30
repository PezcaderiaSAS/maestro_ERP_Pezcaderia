# Plan Técnico de Implementación — SPEC-042
**Ajuste Ergonómico del Mostrador para Comandas y Ciclo de Vida Preventa**

---

## 1. Arquitectura de Componentes y Solución al Clipping Visual

### 1.1. Estructura Flexbox y Aislamiento de Desplazamiento en `CartPanel.tsx`
- **Contenedor Principal (`GlassCard`):**
  - Cambiar clases de:
    `className="pos-cart-panel flex flex-col h-full min-h-0 overflow-y-auto pr-1 p-4"`
  - a:
    `className="pos-cart-panel flex flex-col h-full min-h-0 overflow-hidden pr-1 p-4 select-none"`
  - *Impacto:* Al retirar `overflow-y-auto` de la raíz del panel, se erradica el contexto de scroll global que causaba que el pie flotara y colisionara contra la cabecera.
- **Cabecera (`pos-cart-header`):**
  - Migrar clases de `bg-slate-50 border-slate-200` a `bg-slate-900/60 border border-white/10 rounded-2xl p-2.5 backdrop-blur-xl`.
  - Botón de cliente: Dark Glass (`bg-slate-800/80 hover:bg-slate-700/80 border-white/10 text-white font-bold`).
  - Botones de En Espera y Borradores: Formateo compacto en una sola línea para evitar wrapping vertical en anchos de mostrador ($\sim 380\text{px}$).
- **Barra Multicliente (`ParkedOrdersBar.tsx`):**
  - Renderizado condicional inteligente: solo se muestra si `drafts.length > 0` o si el vendedor hace clic en el badge de borradores.
  - Estilización Dark Glassmorphism V8 (`bg-slate-900/80 border-b border-white/10 text-slate-200`, pestañas activas con acento cian `border-cyan-500/40 bg-cyan-950/60`).
- **Lista de Ítems (`pos-cart-items-list`):**
  - Clases: `pos-cart-items-list flex-1 min-h-0 overflow-y-auto pr-1 space-y-2`.
  - Estado vacío: placeholder minimalista de 80px con icono sutil y texto accesible en `text-slate-400`.
- **Pie de Carrito (`pos-cart-footer`):**
  - Cambiar clases de:
    `className="pos-cart-footer shrink-0 sticky bottom-0 bg-slate-50/95 backdrop-blur-md p-2.5 border-t border-slate-200 flex flex-col gap-2 rounded-b-xl shadow-inner"`
  - a:
    `className="pos-cart-footer shrink-0 mt-auto bg-slate-900/90 backdrop-blur-2xl p-3 border-t border-white/10 flex flex-col gap-2 rounded-2xl shadow-2xl"`
  - *Impacto:* Se elimina `sticky bottom-0`. El pie queda sólidamente anclado al fondo del flexbox (`mt-auto`), garantizando cero colisiones.
- **Corrección de Contraste en `DiscountPanel.tsx`:**
  - Sustituir estilos fijos `#0F172A` por `text-slate-100 font-bold font-mono` y `#64748B` por `text-slate-400`.
  - Asegurar ratio de contraste WCAG 2.2 AA+ $\ge 4.5:1$ y AAA $\ge 7:1$.

---

## 2. Modal de Confirmación de Comanda para Asesor de Mostrador

Conforme a la clarificación del usuario, al pulsar el botón `EMITIR PREVENTA / COMANDA (F6)` o presionar `F6`:
1. Si el carrito tiene $\ge 1$ ítem, se despliega un modal elegante de confirmación:
   - **Título:** Confirmar Emisión de Preventa / Comanda.
   - **Detalle:** Código preliminar (ej. `PRE-2026-01001`), Cliente destinatario, Cantidad total de ítems y Total a liquidar en COP.
   - **Nota de Ventanilla:** *"Esta preventa se enviará a la Caja Única (Ventanilla) para su recaudación y posterior despacho en bodega."*
   - **Acciones:** `[ Corregir Pedido ]` (vuelve al carrito) y `[ Confirmar y Emitir (F6/Enter) ]` (guarda la comanda, limpia el carrito local y emite notificación toast).
2. Si el carrito está vacío (`0 ítems`), el botón permanece desactivado con tooltip explicativo.

---

## 3. Plan de Pruebas Unitarias TDD y Verificación

1. **Pruebas en `src/tests/posCartPanelErgonomics.test.tsx`:**
   - Verificar que `pos-cart-panel` no use `overflow-y-auto` en la raíz.
   - Verificar que `pos-cart-footer` no use `sticky bottom-0` y se mantenga en `shrink-0`.
   - Verificar que `DiscountPanel` aplique tipografía de alto contraste legible en modo oscuro.
   - Verificar que el modal de confirmación de comanda se active al disparar `onGuardarBorrador` o presionar `F6` en modo asesor.
2. **Pruebas en `src/tests/asesorMostradorSinCobro.test.tsx`:**
   - Confirmar segregación absoluta de cobro en mostrador.
3. **Bucle DevTools:**
   - Auditoría en Chrome DevTools a 1280×800 y 375×667 (0 errores consola, 0 desbordamientos).

