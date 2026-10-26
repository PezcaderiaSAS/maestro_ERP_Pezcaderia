# Plan de Implementación Técnica: /speckit.plan (SPEC-029)

**Código:** SPEC-029  
**Fase:** /speckit.plan (SDD v3.0)  
**Dominio:** Ventas POS / Ergonomía Táctil / UI-UX Industrial  
**Estado:** PENDIENTE_APROBACION_USUARIO  
**Fecha:** 2026-10-26  
**Co-Ejecución Swarm + Harness²:** Registrada en `specs/sdd_verification_reports/sdd_bridge_coexecution_20261026_065655.json`  

---

## 1. Arquitectura Técnica y "Cómo" se Construirá

### 1.1. Principios de Diseño
1. **Regla del Niño de 12 Años & Fricción Cero:** Toda acción debe ser intuitiva sin manual de usuario. Botones de acción primaria $\ge 56\text{ px}$, botones secundarios $\ge 48\text{ px}$, espaciado mínimo de $8\text{ px}$ entre áreas activas.
2. **Standard Layout Shell Canónico:** Estructura fija en 4 zonas verticales (Header, Barra de Control de máx 3 botones, 4 Tarjetas KPI bimodal y Workspace de trabajo).
3. **Modal/Popover Keypad Táctil Embebido (`OnScreenKeypadModal.tsx`):** Despliegue emergente de alta respuesta con teclas gigantes ($\ge 56\text{ px}$) al tocar campos de cantidad o peso, cerrándose automáticamente con `Enter` o `Confirmar`.
4. **Supresión del Teclado del OS:** Uso de `inputMode="none"` en inputs asistidos por el keypad propio para prevenir la apertura del teclado virtual del sistema operativo en tablets.
5. **Cero Imágenes Estricto (Zero-Cost Vector Graphics):** Catálogo de productos POS con `vectorOnly={true}` en `ProductAvatar` utilizando Lucide React puro.
6. **Type-Safety de Rutas:** Sustitución obligatoria de magic strings `'precios'` y `'dashboard'` por `AppRouteId.PRICING` y `AppRouteId.DASHBOARD`.

---

## 2. Desglose de Componentes y Modificaciones Quirúrgicas

### 2.1. Nuevo Componente: `OnScreenKeypadModal.tsx`
* **Ubicación:** `src/views/pos/components/OnScreenKeypadModal.tsx`
* **Propósito:** Popover/modal táctil emergente de alta respuesta para edición rápida de cantidades o pesos sin invocar el teclado del sistema operativo.
* **Props:**
  ```typescript
  interface OnScreenKeypadModalProps {
    isOpen: boolean;
    titulo: string;
    subtitulo?: string;
    valorInicial: number;
    unidad: 'KG' | 'UND';
    precioUnitario?: number;
    onConfirm: (valor: number) => void;
    onClose: () => void;
  }
  ```
* **Elementos de UI:**
  - Visor numérico monoespaciado gigante (`text-4xl font-black font-mono`).
  - Cálculo de subtotal estimado en COP en tiempo real (`valor * precioUnitario`).
  - Chips de selección rápida a 1-tap:
    - Para `KG`: `0.25 kg`, `0.5 kg`, `0.75 kg`, `1 kg`, `1.5 kg`, `2 kg`, `3 kg`, `5 kg`.
    - Para `UND`: `1`, `2`, `3`, `5`, `6 (media docena)`, `10`, `12 (docena)`, `24`.
  - Cuadrícula numérica táctil 3x4:
    - Teclas `1` a `9` con `min-h-[56px] text-2xl font-black rounded-xl`.
    - Fila inferior: `.`, `0`, `Backspace (Borrar)` con icono `Delete`.
  - Botones de acción final: `Cancelar` (`min-h-[48px]`) y `Confirmar Valor` (`min-h-[56px] bg-emerald-600 text-white font-black`).

### 2.2. Actualización de `ManualWeightModal.tsx`
* **Ubicación:** `src/views/pos/components/ManualWeightModal.tsx`
* **Modificaciones:**
  - Elevar teclas del keypad numérico de `52px` a `min-h-[56px]`.
  - Elevar chips de peso frecuente de `44px` a `min-h-[48px]`.
  - Aplicar `inputMode="none"` en el `<input>` de peso para bloquear el teclado nativo en tablets.
  - Asegurar botón de confirmación `min-h-[56px]`.

### 2.3. Actualización de `PaymentPanel.tsx`
* **Ubicación:** `src/views/pos/components/PaymentPanel.tsx`
* **Modificaciones:**
  - Elevar botones de categorías de pago (`EFECTIVO`, `TRANSFERENCIA`, `DATAFONO`, `CREDITO`) de `50px` a `min-h-[56px]`.
  - Elevar sub-pills de transferencias (`Nequi`, `Daviplata`, `QR Bancolombia`) de `44px` a `min-h-[48px]`.
  - Botón `⚡ Cobro Rápido 1-Tap`: altura `min-h-[56px]`, feedback táctil `active:scale-95`, liquidación instantánea y foco restaurado en `#pos-product-search-input`.
  - Botón de cobro normal `btn-cobrar`: altura `min-h-[56px]` y botón `Borrador`: `min-h-[48px]`.
  - Botones de billetes sugeridos (`$2k`, `$5k`, `$10k`, `$20k`, `$50k`, `$100k`): asegurar `min-h-[48px]`.
  - Input de efectivo recibido con `inputMode="none"` o toggle accesible para evitar solapamiento del OS.

### 2.4. Actualización de `CartPanel.tsx` y `LineaVentaRow.tsx`
* **Ubicación:** `src/views/pos/components/CartPanel.tsx` y `LineaVentaRow.tsx`
* **Modificaciones:**
  - Disparar `OnScreenKeypadModal` al hacer clic sobre el contador de cantidad/peso del ítem.
  - Botones de incremento/decremento (`+`/`-`): asegurar `min-h-[48px] min-w-[48px]`.
  - Botón de eliminar ítem del carrito: `min-h-[48px] min-w-[48px]`.
  - Botón `BalanzaButton`: asegurar `min-h-[48px]`.

### 2.5. Actualización de `POSView.tsx`
* **Ubicación:** `src/views/POSView.tsx`
* **Modificaciones:**
  - **Layout Shell Canónico Universal:**
    - **Zona 1 (Header):** Breadcrumb limpio (`ERP > Ventas > Punto de Venta`), título principal y 1 badge dinámico de turno.
    - **Zona 2 (Barra de Control - Regla de 3):**
      - Botón 1 (Primario Verde): `⚡ Cobro 1-Tap` o `+ Nuevo Pedido` (`min-h-[48px]`).
      - Botón 2 (Secundario Neutro): `Borrador / Espera` (`min-h-[48px]`).
      - Botón 3 (Especial Cian): `Balanza / Peso Manual` (`min-h-[48px]`).
      - Dropdown accesible **"Más Acciones..."**: agrupa `Arqueo Parcial`, `Cierre de Turno`, `Reimprimir Ticket`, `Resolución Fiscal DIAN`, `Monitor Siigo Queue`.
    - **Zona 3 (Tarjetas KPI Light Mode WCAG 2.2 AAA):**
      - Total Ventas Turno ($ COP).
      - Efectivo en Gaveta ($ COP).
      - Ventas Realizadas (Conteo).
      - Estado Conectividad / Outbox (En Línea / X pendientes).
      - Estilo: fondo `bg-white`, borde `border-slate-200`, etiquetas `text-slate-500 font-semibold text-xs`, valores `text-slate-900 font-black font-mono text-2xl`.
  - **Type-Safety de Rutas:**
    - Reemplazar `setCurrentView('precios')` por `setCurrentView(AppRouteId.PRICING)`.
    - Reemplazar `setCurrentView('dashboard')` por `setCurrentView(AppRouteId.DASHBOARD)`.
    - Importar `AppRouteId` desde `../types/routes.types.ts`.

---

## 3. Pruebas Unitarias e Integración (TDD)
1. **`src/tests/onScreenKeypadModal.test.tsx` (Nuevo):**
   - Renderiza teclas táctiles $\ge 56\text{ px}$.
   - Actualiza visor numérico y subtotal COP en tiempo real.
   - Aplica chips de peso/unidad a 1-tap.
   - Confirma valor con Enter o botón y emite callback.
2. **`src/tests/posErgonomicsLayout.test.tsx` (Nuevo):**
   - Verifica que la barra de control en `POSView` contenga como máximo 3 botones primarios.
   - Verifica que el dropdown "Más Acciones..." contenga las acciones secundarias.
   - Verifica la altura $\ge 56\text{ px}$ de los botones de cobro en `PaymentPanel`.
   - Verifica el uso de `AppRouteId` en lugar de magic strings.
   - Verifica que `ProductAvatar` renderice en modo `vectorOnly` (0 imágenes).

---

## 4. Próximo Paso en el Flujo Preceptivo
> **ATENCIÓN:** De acuerdo con la regla constitucional del proyecto y el flujo Spec Kit (SDD v3.0), **NO se ha escrito código de producción todavía**.
> Se requiere la aprobación formal del usuario sobre este plan técnico (`/speckit.plan`) para proceder a la generación de tareas atómicas (`/speckit.tasks`).
