# Plan de Implementación Técnica: SPEC-046
# Estandarización de Ergonomía Táctil POS, Componente Canónico PosButton y Rejilla Responsiva CartPanel

- **Código:** SPEC-046
- **Fase:** Spec Kit SDD v3.0 — `/speckit.plan`
- **Gobernanza:** Master Architect SOLID, Rico UI Brands Tokens, TDD Estricto.
- **Validación Multi-Agente:** Evaluado concurrentemente con Agency Swarm y Google Harness² a Costo $0.

---

## 1. Arquitectura de Componentes & Contratos de Datos

### 1.1 Componente Canónico: `src/views/pos/components/PosButton.tsx`
El componente debe encapsular el contrato táctil enterprise:

```typescript
export interface PosButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'action' | 'ghost';
  size?: 'compact' | 'touch' | 'large';
  shortcutBadge?: string;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**Mapeo de Clases Semánticas (Tailwind CSS):**
- **Base común:**
  `inline-flex items-center justify-center font-semibold rounded-xl select-none transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`
- **Tamaños:**
  - `touch` (por defecto en terminal táctil): `min-h-[48px] min-w-[48px] px-4 py-2.5 text-sm gap-2`
  - `large` (acciones primarias como cobrar / emitir): `min-h-[54px] px-6 py-3 text-base gap-3`
  - `compact` (tablas secundarias de alta densidad): `min-h-[38px] px-3 py-1.5 text-xs gap-1.5`
- **Variantes Semánticas:**
  - `primary`: `bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 focus:ring-emerald-500/50`
  - `secondary`: `bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/60 focus:ring-slate-500/50`
  - `danger`: `bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 focus:ring-rose-500/50`
  - `action`: `bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 focus:ring-cyan-500/50`
  - `ghost`: `bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border border-transparent`

---

## 2. Refactorización Quirúrgica de `CartPanel.tsx`

### 2.1 Preservación de la Interfaz Ascendente
Para no romper ninguno de los 333 llamadores identificados por GitNexus:
```typescript
// Se mantiene intacta la firma de CartPanelProps
export interface CartPanelProps {
  onCheckout: () => void;
  isProcessing?: boolean;
  onEmitirPreventa?: () => void;
  readOnly?: boolean;
}
```

### 2.2 Modificaciones en el Renderizado Interno
1. **Reemplazo de Botones Fragmentados:**
   - Botón de incremento de cantidad (`+`) y decremento (`-`) se convierten a `<PosButton size="touch" variant="secondary" aria-label="Aumentar cantidad">`.
   - Botón de remover ítem se convierte a `<PosButton size="touch" variant="danger" aria-label="Eliminar ítem">`.
   - Botón de notas de despacho y descuentos rápidos se estandarizan con `PosButton`.
2. **Aislamiento del Scroll del Carrito:**
   - Contenedor de la lista de ítems recibe `flex-1 overflow-y-auto overscroll-contain pr-1 space-y-2 max-h-[calc(100vh-280px)]`.
3. **Cifras Monetarias con `font-mono tabular-nums`:**
   - Totales, impuestos y subtotales se encierran con `font-mono tracking-tight tabular-nums`.

---

## 3. Plan de Pruebas Unitarias TDD (Vitest)

1. **Test Suite:** `src/tests/posTouchErgonomics.test.tsx`
   - Test 1: Comprobar que `PosButton` renderice con clases `min-h-[48px] min-w-[48px]` por defecto.
   - Test 2: Comprobar la respuesta a clicks y eventos táctiles (`active:scale-[0.98]`).
   - Test 3: Verificar que `CartPanel` renderice botones con atributos `aria-label` descriptivos.
   - Test 4: Verificar que el total de compra tenga la clase `font-mono`.
