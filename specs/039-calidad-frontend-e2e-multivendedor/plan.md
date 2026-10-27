# Plan Técnico de Implementación — SPEC-039
**Calidad Frontend Enterprise, Accesibilidad WCAG 2.2 AA+ y Suite E2E Multivendedor - Caja Única**

---

## 1. Arquitectura Técnica & Estrategia de Componentes

### 1.1 Módulos a Modificar y Crear
```text
maestro_ERP_Pezcaderia/
├── tests/
│   └── e2e/
│       └── multivendor-cashier-flow.spec.ts   [NUEVO] Suite E2E Playwright de ciclo completo
├── src/
│   ├── views/
│   │   ├── dashboard/
│   │   │   └── components/
│   │   │       └── ExecutiveTrafficLightWidget.tsx  [MODIFICAR] Contraste WCAG AAA Tarjeta 3
│   │   └── POSView.tsx                              [MODIFICAR] Aislamiento de scrollbars independientes
│   ├── components/
│   │   └── layout/
│   │       ├── EnterpriseTopbar.tsx                 [MODIFICAR] Acotamiento breadcrumb y gap ergonómico
│   │       └── EnterpriseSidebar.tsx                [AUDITAR] Contención adyacente y controles macOS
│   └── tests/
│       └── executiveTrafficLightA11yV8.test.tsx     [NUEVO] Suite TDD para accesibilidad y contraste
```

---

## 2. Plan Detallado por Componente

### 2.1 Suite E2E Playwright (`tests/e2e/multivendor-cashier-flow.spec.ts`)
- **Objetivo:** Automatizar el flujo operativo completo definido en SPEC-037 y ratificado en `/grill-me`.
- **Precondiciones:**
  - `localStorage` sembrado con catálogo de productos del mar (`seedPOS`), estado de caja abierta (`seedCash`) y consentimiento Habeas Data aceptado.
  - Dimensiones de viewport: `1366×768` (Laptop estándar) y `1440×900`.
- **Pasos de la Prueba:**
  1. **Inicio de Sesión & Mostrador:** El Asesor Comercial abre `/pos`, busca un producto (ej. "Filete de Corvina"), ajusta el peso/cantidad y pulsa "Crear Preventa" o "Guardar Comanda".
  2. **Generación de Preventa:** El sistema confirma la emisión con prefijo `PV-` y registra la orden en estado `PENDIENTE_COBRO`.
  3. **Estación de Caja Central:** El Cajero interactúa con la Cola Central de Comandas (o ingresa al módulo de Caja), localiza la orden recién creada y la transiciona a "En Cobro" (`EN_COBRO`).
  4. **Liquidación y Recaudo F9:** Se abre el modal de recaudo, se selecciona método "Efectivo", se ingresa el monto recibido ($\ge \text{Total}$), el sistema calcula el vuelto con exactitud milimétrica y se pulsa "Confirmar Cobro".
  5. **Verificación Estructural de Despacho:** Se aserta la visibilidad del modal de éxito, la presencia del número de tirilla y el renderizado del código QR para entrega de mercancía.

### 2.2 Accesibilidad WCAG AAA en Semáforo Operativo (`ExecutiveTrafficLightWidget.tsx`)
- **Problema Detectado:** Texto `text-rose-400` sobre superficie `bg-rose-950/40` con ratio de contraste $\approx 2.8:1$ (Falla WCAG AA).
- **Solución Técnica:**
  - Superficie base: `bg-slate-900/90 backdrop-blur-xl border border-rose-500/40 hover:border-rose-400/60 transition-all`.
  - Icono de alerta: `bg-rose-500/20 text-rose-300 border border-rose-500/40`.
  - Conteo principal: `text-white font-black font-mono tracking-tight` (Ratio $> 14:1$).
  - Badge de estado: `bg-rose-500/20 text-rose-200 border border-rose-500/40 font-bold`.
  - Subtexto descriptivo: `text-slate-300 font-medium`.

### 2.3 Ergonomía y Resiliencia en Barra Superior (`EnterpriseTopbar.tsx`)
- **Acotamiento de Breadcrumbs:**
  - Sustituir `truncate max-w-[200px] sm:max-w-none` por:
    ```tsx
    <span 
      className="text-white font-black truncate max-w-[140px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[340px]"
      title={breadcrumb.sub}
    >
      {breadcrumb.sub}
    </span>
    ```
- **Zona Segura y Separación Física:**
  - Ajustar el contenedor de acciones rápidas a `gap-2 sm:gap-3`, asegurando una separación física mínima de 12px entre el badge de conectividad, el botón de "Facturar POS" y el conmutador de usuario.

### 2.4 Aislamiento de Scroll en POS (`POSView.tsx`)
- **Estructura Contenedora:**
  - Asegurar `h-full min-h-0 overflow-hidden flex flex-col md:flex-row`.
  - Catálogo de productos: contenedor con `flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin`.
  - Panel de liquidación y carrito: `w-full md:w-[380px] lg:w-[420px] shrink-0 flex flex-col h-full min-h-0 overflow-y-auto`.

---

## 3. Plan de Verificación y Criterios de Éxito
1. **TDD:** Crear `src/tests/executiveTrafficLightA11yV8.test.tsx` verificando que la Tarjeta 3 contenga las nuevas clases de contraste y renderizado de texto.
2. **Playwright:** Ejecutar `npx playwright test tests/e2e/multivendor-cashier-flow.spec.ts` con resultado 100% pasando.
3. **Consistencia Global:** `npm run test:run` (166+ suites verdes) y `npx tsc --noEmit` (0 errores).
4. **DevTools MCP:** Verificar en vivo en `http://localhost:3000` a `1366×768` (0 errores en consola JS y renderizado perfecto).
