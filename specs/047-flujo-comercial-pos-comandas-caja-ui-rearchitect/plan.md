# Plan de Implementación Técnica — SPEC-047

## 1. Arquitectura de Módulos y Componentes

### 1.1 Nuevos Módulos y Componentes
1. **`src/hooks/usePOSKeyboardShortcuts.ts`**
   - Hook reactivo para la captura y orquestación unificada de atajos de teclado `F1` a `F12`, `Enter`, `Escape` y `Space`.
   - Incluye detección inteligente para no interceptar teclas cuando el usuario esté escribiendo en inputs de texto estándar (a menos que sea una tecla de función especial o Enter para confirmación).
2. **`src/views/pos/components/InternalQueueTicker.tsx`**
   - Cintillo compacto de alta visibilidad para la barra superior del Mostrador POS y de la Caja Única.
   - Muestra: Turno actual en atención (`Turno T-042`), Total de comandas en cola, y badge de tiempo promedio de espera.
   - Estilo: Dark Glassmorphism (`bg-slate-900/80 border border-slate-800`), acento cian pulsante y tipografía monoespaciada.
3. **`src/views/pos/components/CashierSupermarketTerminal.tsx`**
   - Vista de presentación ultradensa tipo terminal de supermercado para la Taquilla de Caja Única.
   - Sustituye las tarjetas Kanban por una tabla de alta velocidad:
     - Filas con altura ergonómica $\ge 40\text{px}$.
     - Navegación con flechas `Arriba` y `Abajo`.
     - Fila activa resaltada con `bg-cyan-950/40 border-l-4 border-cyan-400`.
     - Datos: Turno, Cliente, Vendedor, Cantidad de Ítems, Total COP (`font-mono text-right font-bold text-emerald-400`), Tiempo transcurrido con alerta de color (Verde $< 5\text{min}$, Ámbar $5-15\text{min}$, Rojo $> 15\text{min}$).
     - Barra de estado inferior con atajos activos visibles: `[F1 Ayuda] [F2 Efectivo] [F3 Datáfono] [F4 QR] [F5 Refrescar] [F9 Cobro Dividido] [F12 Cobrar]`.
4. **`src/views/pos/components/SplitPaymentModal.tsx`**
   - Modal de Cobro Dividido / Mixto Dinámico:
     - Permite añadir múltiples líneas de pago con selector: Efectivo, Tarjeta/Datáfono, Transferencia QR, Crédito.
     - Input numérico con máscara de moneda y foco automático.
     - Cálculo reactivo en vivo:
       - Total Venta.
       - Monto Pagado Acumulado.
       - Saldo Pendiente por Cubrir (rojo si $> 0$, verde si $== 0$).
       - Cambio / Vueltas (ámbar/verde en `font-mono text-2xl font-bold` si el efectivo supera el saldo).
     - Atajo de teclado: `Enter` o `F12` para liquidar en cuanto el saldo restante llegue a `$0.00`.
5. **`src/views/pos/components/QuickCutNotes.tsx`**
   - Micro-componente táctil para mostrador con chips rápidos de preparación de pescado: `Fileteado`, `Entero Limpio`, `En Postas`, `Sin Escama`, `En Mariposa`, `Con Hielo Extra`.
   - Altura táctil $\ge 48\text{px}$, activación en 1 toque.

### 1.2 Componentes Refactorizados
1. **`src/views/pos/components/CashierKanbanView.tsx`**
   - Integración del switch/renderizado de `CashierSupermarketTerminal` como vista principal de alta velocidad para la taquilla de caja.
   - Conexión con `SplitPaymentModal` para el procesamiento del cobro mixto.
2. **`src/views/POSView.tsx`**
   - Embebido del `InternalQueueTicker` en la cabecera del mostrador.
   - Integración de los chips rápidos de notas de corte (`QuickCutNotes`) y atajo de pesaje en mostrador.

---

## 2. Esquema de Datos y Tipos TypeScript

### 2.1 Extensión de Tipos de Pago Mixto
```typescript
export interface SplitPaymentLine {
  id: string;
  metodo: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO';
  monto: number;
  referencia?: string;
  efectivoEntregado?: number;
  vueltoCalculado?: number;
}

export interface SplitPaymentSummary {
  montoTotal: number;
  montoAsignado: number;
  saldoPendiente: number;
  vueltoTotal: number;
  lineas: SplitPaymentLine[];
  estaCompleto: boolean;
}
```

---

## 3. Plan de Pruebas Unitarias e Integración (TDD)
- **Archivo de Pruebas:** `src/tests/commercialFlowSupermarket.test.tsx`
- **Casos de Prueba:**
  1. `usePOSKeyboardShortcuts`: Captura y ejecución adecuada de callbacks F1-F12 sin dispararse dentro de `<input type="text">` estándar.
  2. `InternalQueueTicker`: Renderizado correcto de conteo de comandas y turno activo.
  3. `CashierSupermarketTerminal`: Navegación con teclas de flecha `ArrowDown`/`ArrowUp`, selección con `Enter` y formateo de moneda en `font-mono`.
  4. `SplitPaymentModal`: Cálculo matemático reactivo de múltiples pagos divididos (ej. $30k efectivo + $20k transferencia sobre ticket de $50k $\rightarrow$ saldo $0; entrega $50k efectivo $\rightarrow$ vueltas $20k).
  5. Contraste de colores y accesibilidad según la regla 60-30-10.
