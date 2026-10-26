# Plan de Implementación Técnica: /speckit.plan (SPEC-032)

**Código:** SPEC-032  
**Fase:** /speckit.plan (SDD v3.0)  
**Ticket:** POS-DARK-GLASSMORPHISM-V8  
**Título:** Plan Técnico de Migración del Módulo POS al Estándar Dark Glassmorphism V8  
**Arquitectos:** DataEngineer & SoftwareArchitect (Agency Swarm + Google Harness²)  
**Fecha:** 2026-10-26  
**Estado:** PENDIENTE_APROBACION_USUARIO  

---

## 1. Arquitectura de Componentes y Estrategia de Refactorización

### 1.1. Principio de Preservación de Estado (Zero-Regression Policy)
La migración afecta **exclusivamente la capa de presentación visual (JSX / Tailwind CSS / GlassCard)**.
Queda terminantemente prohibido alterar:
- Los métodos y estado de `usePOSCart` (`addItem`, `removeItem`, `updateQuantity`, `clearCart`, `subtotal`, `iva`, `total`).
- Los métodos de `cashService` y `posDraftService` (`guardarBorrador`, `recuperarBorrador`, `arqueo`).
- Los contratos y esquemas Zod en `packages/validation-schemas`.
- El mapeo offline en `localDb` / IndexedDB.
- Los atributos `data-testid` existentes utilizados por la suite de pruebas automatizadas.

---

## 2. Desglose Técnico por Capas y Componentes

### Módulo 1: Layout Shell de `POSView.tsx` sobre Canvas V8
- **Archivo:** `src/views/POSView.tsx`
- **Cambios Estructurales:**
  - Sustituir el contenedor exterior con fondo plano por el lienzo atmosférico `#0B0F19` con mesh gradients.
  - Estructurar la vista en un layout flotante desacoplado:
    - **Columna Izquierda (Catálogo y Búsqueda):** `GlassCard` con specular highlight, barra de búsqueda auto-enfocada con icono de lupa neón y chips de categoría táctiles con `min-h-[48px]`.
    - **Columna Derecha (Carrito y Resumen):** `GlassCard` con controles macOS semánticos (`#FF5F56`, `#FFBD2E`, `#27C93F`), contador de ítems en badge cian y botón gigante de cobro.
  - Asegurar aceleración por hardware con `style={{ transform: 'translateZ(0)' }}`.

### Módulo 2: Panel de Carrito de Compras (`CartPanel.tsx`)
- **Archivo:** `src/views/pos/components/CartPanel.tsx`
- **Cambios Estructurales:**
  - Encapsular en `GlassCard` con cabecera de escritorio macOS.
  - Implementar estado `isCollapsed` enlazado al botón amarillo (`#FFBD2E`) para alternar entre:
    - *Modo Completo:* Filas de productos con botones táctiles `+` / `-` ($\ge 44\text{ px}$), eliminación por deslizamiento o clic, y subtotal detallado.
    - *Modo Ultracompacto:* Resumen comprimido con badge de conteo de ítems, total general y botón directo COBRAR.
  - Fila de ítems con `hover:bg-white/5` y líneas divisorias `border-white/10`.
  - Tipografía financiera monoespaciada para valores COP en `text-slate-100` y total acumulado en `text-emerald-400 font-extrabold`.

### Módulo 3: Panel de Cobro, Medios de Pago y Keypad Táctil (`PaymentPanel.tsx`)
- **Archivo:** `src/views/pos/components/PaymentPanel.tsx`
- **Cambios Estructurales:**
  - Modal/Drawer flotante con `GlassCard` centrado (`backdrop-blur-2xl`, `bg-slate-900/90`).
  - **Selector de Medios de Cobro (4 cuadrantes táctiles):**
    - Efectivo (`Coins`), Tarjeta/Datáfono (`CreditCard`), Transferencia (`Truck`/`FileText`), Crédito POS (`UserCheck`).
    - Estado activo en bloque sólido rojo Code XR (`bg-red-600 text-white shadow-lg shadow-red-600/30`).
  - **Chips de Billetes COP Rápidos:**
    - Botones de `$10.000`, `$20.000`, `$50.000`, `$100.000` y `Exacto` con altura $\ge 48\text{ px}$, fondo `bg-slate-800/80` y borde `border-white/10`.
  - **Keypad Numérico Táctil V8:**
    - Cuadrícula numérica ($1-9, 0, 00, \text{Backspace}$) con botones de $\ge 56\text{ px} \times 56\text{ px}$, tipografía grande legible y micro-animación `active:scale-95`.
  - **Cálculo de Cambio / Vuelto en Vivo:**
    - Visualización destacada en `text-emerald-400 text-2xl font-mono font-black`.
  - **Botón Gigante de Liquidación:**
    - Altura $\ge 56\text{ px}$ con gradiente esmeralda (`bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99]`), icono de confirmación y texto legible.

### Módulo 4: Subcomponentes y Modales Operativos
- **Archivos:**
  - `src/views/pos/components/AperturaCajaModal.tsx`
  - `src/views/pos/components/RetiroParcialModal.tsx`
  - `src/views/pos/components/PosElectronicInvoiceToggle.tsx`
  - `src/views/pos/components/BalanzaButton.tsx`
- **Cambios Estructurales:**
  - Transición a `GlassCard` con fondo translúcido y bordes luminosos.
  - Preservación de validaciones numéricas y toasts SweetAlert2 Dark Glass.

---

## 3. Plan de Pruebas y Validación TDD

1. **Prueba Unitaria de V8 UI:** Crear `src/tests/posDarkGlassmorphismV8.test.tsx` para certificar:
   - Renderizado de `GlassCard` en `POSView`, `CartPanel` y `PaymentPanel`.
   - Funcionamiento del toggle de modo ultracompacto con el control amarillo macOS.
   - Presencia de botones táctiles $\ge 48\text{ px}$ y teclas numéricas $\ge 56\text{ px}$.
   - Retorno inmediato de foco a `#pos-product-search-input`.
2. **Suite Existente de POS (Cero Regresiones):**
   - Ejecutar `posSearchAndWeighing.test.tsx` (4 tests).
   - Ejecutar `posTouchErgonomics.test.tsx` (5 tests).
   - Ejecutar `posCartPanelErgonomics.test.tsx` (4 tests).
   - Ejecutar `posQuickCashAndReturnFocus.test.tsx` (4 tests).
   - Ejecutar `posLaptopAndDataTable.test.tsx` (9 tests).
   - Ejecutar `posSellerAssignment.test.tsx` (12 tests).
3. **Typecheck Estricto:** Ejecución de `tsc --noEmit` con 0 errores.
4. **Certificación DevTools:** Verificación en Google Chrome (`http://localhost:3000/`) sin errores en consola JS y renderizado móvil en 375 px.

---

**NOTA:** Este plan técnico se entrega formalmente para la revisión y aprobación explícita del usuario antes de proceder a la siguiente fase (`/speckit.tasks`).
