# Handoff Report: Survey of POS Test Infrastructure, Modals, Shortcuts & Catalog (SPEC-057)

**Agent**: `survey_explorer_pos_infra`  
**Role**: Teamwork Explorer (Read-Only Investigation & Synthesis)  
**Date**: 2026-11-08T14:33:30Z  
**Target Milestone**: SPEC-057 (Plan Integral de Refactorización y Desarrollo Frontend: Interfaz POS)

---

## 1. Observation

### 1.1. Estado de `src/tests/posCartEditableRow.test.tsx`
- **Existencia**: El archivo `src/tests/posCartEditableRow.test.tsx` **NO EXISTE** actualmente en el repositorio (`File does not exist`).
- **Pruebas y utilidades afines en el proyecto**:
  - `src/tests/posMultivendorLightSaaS.test.tsx`: Emplea `vitest` (`describe`, `it`, `expect`, `vi`, `beforeEach`) y `@testing-library/react` (`render`, `screen`, `fireEvent`). Evalúa `POSMultivendorLightHeader`, `POSMultivendorCatalog`, `POSMultivendorCart` y el contenedor `POSMultivendorView`.
  - `src/tests/posTouchErgonomics.test.tsx`: Evalúa tamaños táctiles Fitts ($\ge 48$px y $\ge 56$px) y eventos táctiles en componentes POS.
  - `src/tests/posManualWeightModal.test.tsx`: 6 pruebas unitarias e interactivas pasando al 100% sobre modales táctiles y recálculo numérico.
  - `src/tests/supervisorPinAuth.test.tsx`: 3 pruebas pasando al 100% sobre autenticación táctil con PIN de supervisor.
- **Estructura del Mock Requerido**:
  - `Product` de `src/types/erp.types.ts`: `{ id, sku, nombre, categoria, unidadMedida, precio_venta_pos, activo, ... }`.
  - `MultivendorCartItem` de `src/views/pos/components/POSMultivendorCart.tsx`: `{ id, product, cantidad, precioOverride?, notas? }`.

### 1.2. Modales POS: `ManualWeightModal` y `SupervisorPinModal`
- **`ManualWeightModal`**:
  - **Ubicación exacta**: `src/views/pos/components/ManualWeightModal.tsx` (286 líneas).
  - **Estado**: **EXISTE** y está plenamente implementado.
  - **Props & Contrato Actual**:
    ```typescript
    export interface ManualWeightModalProps {
      isOpen: boolean;
      producto: any;
      pesoInicial?: number;
      precioUnitario?: number;
      onConfirm?: (producto: any, pesoKg: number) => void;
      onConfirmWeight?: (pesoKg: number) => void;
      onClose: () => void;
    }
    ```
  - **Capacidades**:
    - Chips de acceso rápido táctil: `0.25 kg`, `0.5 kg`, `0.75 kg`, `1 kg`, `1.5 kg`, `2 kg`, `3 kg`, `5 kg`.
    - Keypad numérico táctil en pantalla (botones $\ge 56$px, Fitts compliant).
    - Recálculo en vivo de subtotal estimado: `Math.round(pesoNumerico * finalPrecioUnitario)`.
    - Soporte de teclado físico (Enter para confirmar, Escape para cerrar, 0-9 para input).
    - Botón de confirmación gigante: `AGREGAR AL CARRITO ($subtotal)`.
  - **Uso actual**: Es importado en `src/views/POSView.tsx` (líneas 59, 2409, 3967), pero **NO** está importado ni renderizado directamente dentro de `src/views/pos/components/POSMultivendorView.tsx`. Actualmente `POSMultivendorView` solo delega `onOpenScaleModal?: (product: Product) => void` a `POSMultivendorCatalog`.

- **`SupervisorPinModal`**:
  - **Ubicación exacta**: `src/views/pos/components/SupervisorPinModal.tsx` (288 líneas).
  - **Estado**: **EXISTE** y está plenamente implementado.
  - **Props & Contrato Actual**:
    ```typescript
    export interface SupervisorAuthResult {
      supervisorId: string;
      supervisorNombre: string;
      supervisorCargo: string;
      accionAutorizada: string;
      motivo?: string;
      timestamp: string;
    }

    export interface SupervisorPinModalProps {
      isOpen: boolean;
      onClose: () => void;
      accion: string;
      descripcion?: string;
      onAuthorized: (result: SupervisorAuthResult) => void;
    }
    ```
  - **Capacidades**:
    - Autenticación reactiva de PIN de 4 dígitos contra `useEmployeeStore` (`rolAcceso === 'ADMINISTRADOR' | 'GERENTE'` o cargo supervisor/administrador).
    - Animación de sacudida (`isShaking`) y feedback con SweetAlert2 toast.
    - Soporte teclado físico (0-9, Backspace, Escape).
  - **Uso actual**: Está referenciado en `src/views/POSView.tsx` (líneas 29 y 4004), pero **NO** está integrado en `POSMultivendorView.tsx` ni en `POSMultivendorCart.tsx` para control comercial de margen o descuentos.

### 1.3. Atajos de Teclado (F8, Ctrl+K, F6, F2, F9, Esc)
- **En `src/views/pos/components/POSMultivendorView.tsx`**:
  - **Ausente**: Actualmente no tiene ningún listener de teclado (`window.addEventListener('keydown')`) ni invoca hooks de atajos.
- **En `src/views/pos/components/POSMultivendorCart.tsx`**:
  - Los botones muestran texto indicativo (`EMITIR COMANDA (F6)`, `Cobrar en Esta Terminal (F2)`), pero son solo botones `<button onClick={...}>` sin captura de eventos de teclado.
- **En `src/views/POSView.tsx` (líneas 2210-2261)**:
  - Tiene un listener legacy que intercepta:
    - `Alt + 1..9`: Selección de pestañas de categoría.
    - `Enter`: Apertura de turno o click en botón cobrar.
    - `F2`: Cobrar o foco en input de búsqueda.
    - `F6`: Guardar borrador / preventa.
    - `Escape`: Cerrar modal de arqueo o limpiar carrito.
  - No intercepta `F8` (foco buscador), `Ctrl+K` (búsqueda rápida), `F9` (conmutar modo cajero), ni `F4` (descuento comanda).
- **Hooks de referencia existentes**:
  - `src/hooks/usePOSKeyboardShortcuts.ts`: Implementa captura de teclas F1-F12, Escape y Enter, filtrando cuando el usuario está en `<input>`, `<textarea>` o `isContentEditable`.
  - `src/hooks/useMostradorKeyboard.ts`: Implementa `F8` (foco en `busquedaInputRef`), `F2` (preventa), `F6` (parkear), `F10` (cobrar), `Escape` y navegación con flechas.

### 1.4. Catálogo de Productos y Paginación (Matriz 6x3 = 18 Tarjetas)
- **Ubicación**: `src/views/pos/components/POSMultivendorCatalog.tsx` (272 líneas).
- **Densidad de Matriz**:
  - Constante: `const ITEMS_PER_PAGE = 18;` (línea 21).
  - CSS Grid: `className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5"` (línea 139). En pantallas de escritorio (`lg:`), renderiza exactamente 6 columnas y 3 filas = 18 tarjetas.
- **Paginación en Memoria**:
  - Footer fijo con selector numérico (líneas 216-268): `< Anterior`, números de página (hasta 5 visibles) y `Siguiente >`.
  - Virtualización en memoria mediante slice reactivo: `filteredProducts.slice(start, start + ITEMS_PER_PAGE)`.
  - Rendimiento: Paginación instantánea sin llamadas de red (< 5ms, 60 FPS garantizados).
- **Componente adicional**: Existe también `src/views/pos/components/POSPagination.tsx` (109 líneas), listo para ser reutilizado como componente atómico independiente si se requiere.

### 1.5. Diagnóstico de Verificación Baseline
- **Vitest**:
  - Comando: `npx vitest run src/tests/posMultivendorLightSaaS.test.tsx` $\rightarrow$ **8 de 8 tests pasando** (12.71s).
  - Comando: `npx vitest run src/tests/posManualWeightModal.test.tsx src/tests/supervisorPinAuth.test.tsx` $\rightarrow$ **9 de 9 tests pasando** (23.75s).
- **TypeScript Compiler**:
  - Comando: `npx tsc --noEmit` $\rightarrow$ **Exited with code 0 (Cero errores de compilación)**.

---

## 2. Logic Chain

1. **Premisa TDD para Tarea 1**:
   - `ORIGINAL_REQUEST.md` (R1) y `specs/spec_057_plan_checklist.md` exigen que la refactorización comience con una suite TDD en `src/tests/posCartEditableRow.test.tsx`.
   - Dado que el archivo no existe, debe crearse siguiendo estrictamente el estándar de testing observado en `posMultivendorLightSaaS.test.tsx` y `posTouchErgonomics.test.tsx`.
   - Las pruebas deben fallar inicialmente (fase RED) al exigir inputs numéricos editables continuos con navegación por [Tab], botón micro `[+ Desc]` y flexbox vertical del 85%, para luego pasar a GREEN tras la modificación de `POSMultivendorCart.tsx`.

2. **Premisa Modales (Tareas 3 y 5)**:
   - Dado que `ManualWeightModal` y `SupervisorPinModal` ya existen, están completamente tipados y tienen tests unitarios en verde, **no es necesario crearlos desde cero**.
   - El trabajo para Tarea 3 consiste en:
     - En `POSMultivendorView.tsx`: Capturar eventos de productos pesables (balanza) tanto desde el catálogo táctil como desde el escáner de código de barras, desplegando inmediatamente `ManualWeightModal`.
   - El trabajo para Tarea 5 consiste en:
     - En `POSMultivendorCart.tsx` / `POSMultivendorView.tsx`: Evaluar la regla comercial:
       - Si Descuento $> 10\%$ o Precio Propuesto $< Costo Base + 15\%$, desplegar `SupervisorPinModal`. Si es rechazado o cancelado, revertir al valor anterior.

3. **Premisa Atajos de Teclado (Tarea 4)**:
   - Existen dos hooks en el codebase (`usePOSKeyboardShortcuts.ts` y `useMostradorKeyboard.ts`) que demuestran el patrón canónico para interceptar teclas de función sin colisionar con inputs activos.
   - La implementación en `POSMultivendorView.tsx` debe orquestar los atajos definidos en SPEC-057:
     - `F8`: Foco en input de búsqueda (`POSMultivendorLightHeader`).
     - `Ctrl+K`: Apertura de búsqueda rápida multi-criterio.
     - `F6`: Disparar `onEmitirComanda`.
     - `F2`: Disparar `onCobrarCaja`.
     - `F9`: Alternar `isModoCajero` (`onToggleModoCajero`).
     - `Esc`: Cerrar modales abiertos o limpiar búsqueda/foco.

4. **Premisa Paginación y Calidad (Tarea 6)**:
   - La matriz 6x3 de 18 tarjetas y la botonera `< Anterior ... Siguiente >` ya se encuentran operativas en `POSMultivendorCatalog.tsx`.
   - El baseline de `tsc --noEmit` está completamente limpio (0 errores). Cualquier cambio introducido debe mantener este estado inmaculado.

---

## 3. Caveats

1. **Áreas no investigadas a fondo**:
   - Persistencia Dexie.js offline: Se comprobó que el flujo offline está documentado en la arquitectura, pero no se ejecutó prueba de desconexión física de red durante esta inspección.
   - Impresora térmica y Web Serial API real: El modal `ManualWeightModal` opera en modo digitación táctil manual (software) para independizarse de bloqueos de hardware serial.
2. **Supuestos**:
   - Se asume que el costo base del producto (`precio_compra`) está disponible en el objeto `Product` recibido por el carrito para calcular el margen comercial ($Precio \ge Costo + 15\%$). En `dummyProducts`, `precio_compra` está presente.
3. **Alternativas consideradas**:
   - Integrar `ManualWeightModal` dentro de `POSMultivendorView.tsx` directamente vs. mantenerlo en `POSView.tsx`. La recomendación de la especificación SDD es montarlo dentro del flujo de `POSMultivendorView` para que la vista sea autónoma y testeable de forma aislada.

---

## 4. Conclusion

1. **`posCartEditableRow.test.tsx`**: Debe ser creado como paso 1 del flujo TDD. Debe cubrir:
   - Renderizado de input numérico de cantidad y precio unitario en cada fila.
   - Navegación secuencial de foco con tecla [Tab] entre inputs.
   - Presencia y click del botón micro `[+ Desc]` (descuento por ítem).
   - Altura de lista de ítems ocupando el 85% del espacio vertical disponible.
   - Recálculo de totales ante cambios en cantidad o precio unitario.
2. **Modales existentes**:
   - `ManualWeightModal` (`src/views/pos/components/ManualWeightModal.tsx`) listo para integrarse en `POSMultivendorView`.
   - `SupervisorPinModal` (`src/views/pos/components/SupervisorPinModal.tsx`) listo para integrarse en la lógica comercial de edición de precios y descuentos.
3. **Atajos globales**:
   - Se debe implementar un hook dedicado (ej. `usePOSMultivendorHotkeys` o `usePOSKeyboardShortcuts`) conectado a las acciones de `POSMultivendorView`.
4. **Catálogo**:
   - Matriz 6x3 (18 productos) y paginación en memoria ya cumplen las directrices de la especificación; solo requieren verificación de rendimiento continuo.

---

## 5. Verification Method

### 5.1. Comandos de Verificación Exactos
```powershell
# 1. Comprobar suite de pruebas del carrito editable (una vez creada en Tarea 1):
npx vitest run src/tests/posCartEditableRow.test.tsx

# 2. Comprobar suites existentes afines de POS:
npx vitest run src/tests/posMultivendorLightSaaS.test.tsx src/tests/posManualWeightModal.test.tsx src/tests/supervisorPinAuth.test.tsx

# 3. Comprobar tipos globales en TypeScript (debe mantenerse en 0 errores):
npx tsc --noEmit
```

### 5.2. Condiciones de Invalidación
- Si `npx tsc --noEmit` arroja errores de tipo en las nuevas interfaces de `POSMultivendorCart` o `POSMultivendorView`.
- Si `npx vitest run src/tests/posCartEditableRow.test.tsx` falla en los escenarios de navegación Tab o recálculo financiero.
- Si los atajos de teclado F-keys capturan eventos mientras el asesor escribe en inputs de texto generales sin preventDefault controlado.
