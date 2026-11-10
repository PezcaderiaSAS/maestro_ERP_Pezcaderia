# Reporte de Handoff — Explorer Integration (Hito M4 / Tarea 4)

**Hito M4 (SPEC-057 Tarea 4)**: Interceptor Global de Atajos de Teclado POS (F8, Ctrl+K, F6, F4, F2, F9, Esc)  
**Agente**: Teamwork Explorer (`m4_explorer_integration`)  
**Fecha/Hora**: 2026-11-09T12:35:00Z  
**Estado**: Hard Handoff — Investigación Completa y Lista para Implementación TDD  

---

## 1. Observation (Observaciones Directas de Código y Estado Actual)

A través de la inspección estricta de código fuente y ejecución de comandos, se evidencian las siguientes observaciones directas:

### 1.1. Estado de `src/views/pos/components/POSMultivendorView.tsx`
- **Líneas 35-62 (`POSMultivendorViewProps`)**:
  La interfaz actual expone las siguientes props:
  ```typescript
  export interface POSMultivendorViewProps {
    products: Product[];
    stockMap: Record<string, number>;
    cartItems: MultivendorCartItem[];
    onAddToCart: (product: Product, cantidad?: number) => void;
    onUpdateQuantity: (index: number, delta: number) => void;
    onRemoveItem: (index: number) => void;
    onClearCart: () => void;
    subtotal: number;
    descuento?: number;
    total: number;
    onEmitirComanda: () => void;
    onCobrarCaja?: () => void;
    selectedVendorId: string;
    onSelectVendor: (id: string) => void;
    vendedores: VendorOption[];
    cliente?: any;
    onOpenClientModal: () => void;
    comandasPendientesCount?: number;
    onOpenComandasQueue?: () => void;
    isModoCajero?: boolean;
    onToggleModoCajero?: () => void;
    onOpenScaleModal?: (product: Product) => void;
    notasDespacho?: string;
    onNotasDespachoChange?: (val: string) => void;
    isSubmitting?: boolean;
    modoCajeroWorkspace?: React.ReactNode;
  }
  ```
- **Líneas 92-95 (Estado interno)**:
  `POSMultivendorView` gestiona actualmente:
  ```typescript
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'catalogo' | 'carrito'>('catalogo');
  const [scaleModalProduct, setScaleModalProduct] = useState<Product | null>(null);
  ```
- **Líneas 137-152**: Se renderiza `<POSMultivendorLightHeader>` sin pasar referencias (`refs`) hacia los inputs de búsqueda ni código de barras.
- **Líneas 218-235**: Se renderiza `<POSMultivendorCart>` sin controlar externamente el estado del popover de descuento global (`isDiscountOpen`).
- **Líneas 240-261**: Se renderiza condicionalmente `<ManualWeightModal>` cuando `scaleModalProduct` es no nulo.
- **Ausencia actual**: `POSMultivendorView.tsx` **no invoca ningún hook de atajos de teclado** en este momento; los atajos existentes están dispersos de forma inconexa en los componentes hijos.

### 1.2. Dispersión de Atajos Actuales en Componentes Hijos
1. **`src/views/pos/components/POSMultivendorLightHeader.tsx` (Líneas 60-70)**:
   Posee un `useEffect` local no coordinado:
   ```typescript
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === 'F8') {
         e.preventDefault();
         searchInputRef.current?.focus();
         searchInputRef.current?.select();
       }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, []);
   ```
   - Input de código de barras: `id="pos-light-barcode-input"`, `data-testid="pos-light-barcode-input"`.
   - Input de búsqueda de catálogo: `id="pos-light-product-search-input"`, `data-testid="pos-light-product-search-input"`.
   - Selector de cliente: `id="btn-header-seleccionar-cliente"`, `data-testid="btn-header-seleccionar-cliente"`, invoca `onOpenClientModal`.
   - Toggle modo cajero: `id="btn-toggle-modo-cajero"`, `data-testid="btn-toggle-modo-cajero"`, invoca `onToggleModoCajero` con badge `F9`.

2. **`src/views/pos/components/POSMultivendorCart.tsx`**:
   - **Líneas 126-137**: Posee un listener local a nivel de ventana para `F4` y `Escape`:
     ```typescript
     useEffect(() => {
       const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape' && isDiscountOpen) {
           setIsDiscountOpen(false);
         } else if (e.key === 'F4' && items.length > 0) {
           e.preventDefault();
           handleToggleDiscountPopover();
         }
       };
       window.addEventListener('keydown', handleKeyDown);
       return () => window.removeEventListener('keydown', handleKeyDown);
     }, [isDiscountOpen, items.length, currentDiscountTipo, currentDiscountValor]);
     ```
   - Botón de descuento global: `id="btn-descuento-global-f4"`, `data-testid="btn-descuento-global-f4"`.
   - Botón comanda: `id="btn-emitir-preventa-f6"`, `data-testid="btn-emitir-preventa-f6"`, invoca `onEmitirComanda`.
   - Botón cobro en caja: `id="btn-cart-cobrar-caja"`, `data-testid="btn-cart-cobrar-caja"`, invoca `onCobrarCaja` con título `Cobrar directamente en esta terminal (Atajo: F2)`.

3. **`src/views/pos/components/ManualWeightModal.tsx`**:
   - **Líneas 155-163**:
     ```typescript
     const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
       if (e.key === 'Enter') {
         e.preventDefault();
         handleConfirm();
       } else if (e.key === 'Escape') {
         e.preventDefault();
         onClose();
       }
     };
     ```
   - El listener de `Escape` está adjunto **exclusivamente** al input numérico. No existe listener en el contenedor `<div role="dialog">` ni en `window`.

4. **Hallazgo de Challenger 2 en Hito M3 (`.agents/teamwork/m3_chal_saas_2/handoff.md`, líneas 68-72 y `src/tests/posManualWeightIntegrationChallenger.test.tsx` líneas 489-507)**:
   - En el Test 3.4 adversarial:
     ```typescript
     it('3.4 Vulnerabilidad de Escape: Si el usuario hace clic en el teclado numérico (o chip) y presiona Escape, el modal NO se cierra si el evento no está en el input', () => {
       ...
       fireEvent.click(btn2);
       fireEvent.keyDown(btn2, { key: 'Escape', code: 'Escape' });
       const dialogStillOpen = screen.queryByRole('dialog');
       expect(dialogStillOpen).toBeInTheDocument(); // Demuestra la ausencia de listener de Escape accesible en el modal
     });
     ```
   - Si el operador pulsa un botón numérico del keypad (`keypad-btn-*`) o un chip, el foco sale del `<input>` y `Escape` deja de cerrar el modal.
   - **Nota crítica de regresión**: El Test 3.4 en `posManualWeightIntegrationChallenger.test.tsx` afirma expresamente `expect(dialogStillOpen).toBeInTheDocument()`. Si `ManualWeightModal` cierra el diálogo ante Escape en `btn2`, dicho test fallará a menos que su aserción sea actualizada a `not.toBeInTheDocument()`.

5. **`src/hooks/usePOSKeyboardShortcuts.ts`**:
   - Diseñado originalmente para SPEC-047 con firmas de cajero (`onF1Help`, `onF2Cash`, `onF3Card`, `onF4Transfer`, `onF5Refresh`, `onF6Search`, `onF8Void`, `onF9SplitPayment`, `onF12Checkout`, `onEscape`, `onEnter`, `onArrowUp`, `onArrowDown`).
   - Usado y evaluado activamente en `src/tests/commercialFlowSupermarket.test.tsx`.
   - Carece de soporte para combinaciones compuestas (`Ctrl+K` / `Cmd+K`) y de callbacks semánticos directos para mostrador (`onFocusSearch`, `onToggleView`, `onOpenCustomerSelector`, `onOpenDiscountModal`, `onSaveDraft`, `onCheckout`).

---

## 2. Logic Chain (Cadena Lógica de Razonamiento Arquitectónico)

### Paso 1: Mapeo y Normalización de Atajos en Mostrador POS
A partir de la especificación canónica SPEC-057 (§4 Fase 4, R4) y el requerimiento formal de la orquestación, se establece el mapeo definitivo:

| Tecla / Combinación | Acción Semántica | Callback / Handler en `POSMultivendorView` | DOM Target / Efecto en Interfaz |
|:---|:---|:---|:---|
| <kbd>F8</kbd> | Enfocar Buscador | `onFocusSearch` | Enfoca y selecciona `#pos-light-product-search-input` (o `#pos-barcode-input`). Si está en vista móvil `carrito`, commuta a `catalogo`. |
| <kbd>Ctrl+K</kbd> / <kbd>Cmd+K</kbd> | Alternar Vista / Modo | `onToggleView` | Ejecuta `onToggleView?.()` o `onToggleModoCajero?.()`, o commuta `mobileTab` (`catalogo` $\leftrightarrow$ `carrito`). |
| <kbd>F6</kbd> | Selector de Cliente | `onOpenCustomerSelector` | Dispara `onOpenClientModal()`, abriendo el selector de cliente del mostrador. |
| <kbd>F4</kbd> | Descuento Global | `onOpenDiscountModal` | Alterna `isDiscountOpen` si `cartItems.length > 0` (`#btn-descuento-global-f4`). |
| <kbd>F2</kbd> | Guardar Borrador / Cobro Terminal | `onSaveDraft` | Dispara `onSaveDraft?.()` o fallback a `onCobrarCaja?.()` / `onEmitirComanda()`. |
| <kbd>F9</kbd> | Checkout / Cobro en Caja | `onCheckout` | Dispara `onCheckout?.()` o `isModoCajero ? onCobrarCaja() : onEmitirComanda()`. Si carrito vacío y `onToggleModoCajero`, alterna modo. |
| <kbd>Esc</kbd> | Cierre Jerárquico / Limpieza | `onEscape` | Cierra modales activos en orden de prioridad o limpia el buscador sin vaciar el carrito. |

### Paso 2: Resolución del Hallazgo de Challenger 2 y Jerarquía de Escape
Para resolver la vulnerabilidad de `Escape` reportada por Challenger 2 sin generar comportamientos no deseados:
1. **Prioridad 1 — Modal de Pesaje Abierto (`scaleModalProduct !== null`)**:
   - `Escape` resetea inmediatamente `setScaleModalProduct(null)`.
   - El carrito se mantiene **100% intacto** (0 ítems residuales, subtotales inalterados).
   - Se detiene la propagación para evitar que limpie búsquedas subyacentes.
2. **Prioridad 2 — Popover de Descuento Abierto (`isDiscountOpen === true`)**:
   - `Escape` cierra el popover (`setIsDiscountOpen(false)`).
3. **Prioridad 3 — Callback Externo de Escape (`onEscape?.()`)**:
   - Si el consumidor inyecta un handler de escape (para cerrar cajón de comandas o modal de supervisor).
4. **Prioridad 4 — Filtros de Búsqueda Activos (`searchQuery !== ''` o `barcodeInput !== ''`)**:
   - Limpia los campos: `setSearchQuery('')`, `setBarcodeInput('')`.
   - Restablece el catálogo a sus 18 tarjetas visibles.
5. **Prioridad 5 — Elemento con Foco Activo**:
   - Desenfoca el elemento: `(document.activeElement as HTMLElement)?.blur()`.
   - Si está en móvil, restablece a `mobileTab === 'catalogo'`.
6. **Invariante Crítico de Seguridad**:
   - **`Escape` NUNCA vacía el carrito de compras**. `onClearCart` solo puede ser disparado por el botón explícito `btn-vaciar-carrito`.

### Paso 3: Conservación de Compatibilidad Retroactiva (Zero Breakage)
1. Para no romper `src/tests/commercialFlowSupermarket.test.tsx`, la interfaz `POSShortcutHandlers` de `usePOSKeyboardShortcuts.ts` debe preservar todas las claves `onF1Help`, `onF2Cash`, `onF3Card`, etc., agregando las nuevas claves semánticas como propiedades opcionales.
2. Cuando se presiona una tecla (ej. `F8`), el hook invoca:
   `handlersRef.current.onFocusSearch?.() ?? handlersRef.current.onF8Void?.();`
3. En `POSMultivendorViewProps`, todas las nuevas props (`onSaveDraft`, `onToggleView`, `onCheckout`, `isKeyboardShortcutsEnabled`, `searchInputRef`) son **estrictamente opcionales (`?`)**. Ningún contenedor existente que use `<POSMultivendorView>` sufrirá errores de TypeScript.

---

## 3. Caveats (Advertencias, Riesgos y Supuestos)

1. **Riesgo en Test 3.4 de Challenger 2 (`posManualWeightIntegrationChallenger.test.tsx`)**:
   - Como se observó en la Sección 1.4, el test 3.4 fue redactado específicamente para **demostrar la vulnerabilidad** y tiene la aserción:
     `expect(dialogStillOpen).toBeInTheDocument();`
   - Si el Worker arregla `ManualWeightModal` con un listener de `window` o si `POSMultivendorView` cierra el diálogo ante Escape en cualquier elemento hijo, ese test fallará a menos que el implementador actualice dicha prueba para verificar la subsanación:
     `expect(dialogStillOpen).not.toBeInTheDocument();`
   - Se debe coordinar con el Auditor y Reviewers para autorizar la actualización de esta aserción en el Hito M4.

2. **Doble Captura de F4**:
   - `POSMultivendorCart.tsx` actualmente tiene un listener local en `window` para `F4` (línea 130).
   - Si `POSMultivendorView` también escucha `F4` a nivel global y conmuta `isDiscountOpen`, el popover podría abrirse y cerrarse inmediatamente (doble toggle).
   - **Solución recomendada**: Pasar `isDiscountOpen` y `onToggleDiscountOpen` desde `POSMultivendorView` a `POSMultivendorCart`, y omitir o desacoplar el listener local interno de `POSMultivendorCart` cuando esté controlado.

3. **Intercepción de Teclas en Inputs de Texto**:
   - Atajos como <kbd>F1</kbd>-<kbd>F12</kbd>, <kbd>Ctrl+K</kbd> y <kbd>Esc</kbd> **deben prevenir el comportamiento por defecto del navegador** (`e.preventDefault()`) incluso si el cursor está dentro de un `<input>` o `<textarea>`, impidiendo que el navegador abra la barra de direcciones con F6 o la consola de depuración con F8.
   - En contraste, teclas de caracteres alfanuméricos, flechas (<kbd>ArrowUp</kbd>, <kbd>ArrowDown</kbd>) y <kbd>Enter</kbd> **no deben interceptarse** cuando el foco está dentro de un input para permitir la edición fluida de texto.

---

## 4. Conclusion (Especificación Concreta de Integración para el Worker)

### 4.1. Modificaciones Propuestas en `src/views/pos/components/POSMultivendorView.tsx`

```typescript
// 1. Ampliación no-bloqueante de POSMultivendorViewProps:
export interface POSMultivendorViewProps {
  // ... props existentes intactas ...
  
  // Props Hito M4 (Atajos Globales de Teclado):
  onSaveDraft?: () => void;                          // F2: Guardar borrador / preventa
  onToggleView?: () => void;                         // Ctrl+K: Alternar vista / cajero
  onCheckout?: () => void;                           // F9: Cobro / emisión comanda
  isKeyboardShortcutsEnabled?: boolean;              // Habilitación global (default: true)
  isDiscountOpen?: boolean;                          // Control externo de popover F4
  onToggleDiscountOpen?: (isOpen: boolean) => void;  // Callback toggle popover F4
  onEscape?: () => void;                             // Callback escape personalizado
  searchInputRef?: React.RefObject<HTMLInputElement>;// Ref forwarded para foco F8
}
```

```typescript
// 2. Implementación interna del hook en POSMultivendorView:
export const POSMultivendorView: React.FC<POSMultivendorViewProps> = ({
  // ... props ...
}) => {
  // Estado local y refs para atajos
  const internalSearchInputRef = useRef<HTMLInputElement>(null);
  const resolvedSearchRef = externalSearchInputRef || internalSearchInputRef;
  const [internalDiscountOpen, setInternalDiscountOpen] = useState(false);
  const resolvedDiscountOpen = externalIsDiscountOpen !== undefined ? externalIsDiscountOpen : internalDiscountOpen;

  const handleToggleDiscount = (open?: boolean) => {
    const next = open !== undefined ? open : !resolvedDiscountOpen;
    if (onToggleDiscountOpen) {
      onToggleDiscountOpen(next);
    } else {
      setInternalDiscountOpen(next);
    }
  };

  usePOSKeyboardShortcuts(
    {
      onFocusSearch: () => {
        if (mobileTab !== 'catalogo') setMobileTab('catalogo');
        const el =
          resolvedSearchRef.current ||
          document.getElementById('pos-light-product-search-input') ||
          document.querySelector<HTMLInputElement>('[data-testid="pos-light-product-search-input"]') ||
          document.getElementById('pos-barcode-input') ||
          document.querySelector<HTMLInputElement>('[data-testid="pos-barcode-input"]');
        if (el) {
          el.focus();
          el.select();
        }
      },
      onToggleView: () => {
        if (onToggleView) {
          onToggleView();
        } else if (onToggleModoCajero) {
          onToggleModoCajero();
        } else {
          setMobileTab((prev) => (prev === 'catalogo' ? 'carrito' : 'catalogo'));
        }
      },
      onOpenCustomerSelector: () => {
        onOpenClientModal();
      },
      onOpenDiscountModal: () => {
        if (cartItems.length > 0) {
          handleToggleDiscount();
        }
      },
      onSaveDraft: () => {
        if (onSaveDraft) {
          onSaveDraft();
        } else if (onCobrarCaja) {
          onCobrarCaja();
        } else {
          onEmitirComanda();
        }
      },
      onCheckout: () => {
        if (cartItems.length > 0 && !isSubmitting) {
          if (onCheckout) {
            onCheckout();
          } else if (isModoCajero && onCobrarCaja) {
            onCobrarCaja();
          } else {
            onEmitirComanda();
          }
        } else if (cartItems.length === 0 && onToggleModoCajero) {
          onToggleModoCajero();
        }
      },
      onEscape: () => {
        // Prioridad 1: Cerrar modal de balanza si está abierto
        if (scaleModalProduct) {
          setScaleModalProduct(null);
          return;
        }
        // Prioridad 2: Cerrar popover de descuento si está abierto
        if (resolvedDiscountOpen) {
          handleToggleDiscount(false);
          return;
        }
        // Prioridad 3: Callback personalizado si fue inyectado
        if (propsOnEscape) {
          propsOnEscape();
          return;
        }
        // Prioridad 4: Limpiar buscador y pistola si tienen contenido
        if (searchQuery || barcodeInput) {
          setSearchQuery('');
          setBarcodeInput('');
          return;
        }
        // Prioridad 5: Desenfocar input activo y normalizar vista
        if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
          (document.activeElement as HTMLElement).blur();
        }
      },
    },
    {
      isEnabled: isKeyboardShortcutsEnabled ?? true,
    }
  );

  // ...
```

### 4.2. Ajustes Complementarios en `POSMultivendorLightHeader.tsx`
- Permitir prop opcional `searchInputRef?: React.RefObject<HTMLInputElement>;`.
- Añadir atributos `data-testid="pos-barcode-input"` y `data-testid="pos-search-input"` para compatibilidad universal con los selectores de las suites de prueba TDD.
- Retirar el `useEffect` redundante que escucha `F8` localmente para evitar invocaciones dobles.

### 4.3. Ajuste Complementario en `ManualWeightModal.tsx`
- Incorporar listener de teclado a nivel de documento (`window.addEventListener('keydown', ...)`) cuando `isOpen === true`:
  ```typescript
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  ```

---

## 5. Verification Method (Método de Verificación Independiente)

Para que el Implementador, Reviewer y Auditor verifiquen autónomamente la integración sin fallos:

1. **Verificación de Tipos TypeScript Estricto**:
   ```powershell
   npx tsc --noEmit
   ```
   *Criterio de éxito*: Código de salida 0 (0 errores de tipos en `POSMultivendorView.tsx` y componentes hijos).

2. **Suite TDD de Atajos de Teclado POS (Nueva Suite M4)**:
   ```powershell
   npx vitest run src/tests/posKeyboardShortcuts.test.tsx
   ```
   *Criterio de éxito*: 100% de pruebas de atajos pasando en verde (F8, Ctrl+K, F6, F4, F2, F9, Esc con y sin modal, prevención de `defaultPrevented: true`).

3. **Suite Completa de No-Regresión de Hitos M1 a M3 (7 Suites)**:
   ```powershell
   npx vitest run src/tests/posManualWeightIntegrationChallenger.test.tsx src/tests/posManualWeightModal.test.tsx src/tests/posTouchErgonomics.test.tsx src/tests/posGlobalDiscount.test.tsx src/tests/posCartEditableRow.test.tsx src/tests/posMultivendorLightSaaS.test.tsx src/tests/commercialFlowSupermarket.test.tsx
   ```
   *Criterio de éxito*: Todas las pruebas pasando limpiamente sin regresiones.
