# 04. Design Brief & UI/UX Guidelines
## Módulo de Despachos B2B y Rutas de Entrega — La Pezcadería ERP

- **Versión:** 1.0.0
- **Fecha:** 2026-10-14
- **Estándar:** Modo Claro (Light Mode) WCAG 2.2 AA+ Estricto (`.agents/skills/erp-pos-design-tokens/SKILL.md`)
- **Alineación:** SaaS Enterprise (Stripe / Linear / Rico UI Brands) con Alta Densidad Operativa

---

### 1. Principios Visuales y Tokens de Diseño

1. **Cero Modo Oscuro (100% Light Mode):**
   - El sistema opera exclusivamente sobre fondos claros para garantizar legibilidad óptima bajo la luz solar intensa en muelles de carga y cabinas de camiones.
2. **Contraste WCAG 2.2 AA+ Innegociable:**
   - Ratio de contraste mínimo de $4.5:1$ para textos regulares y $7:1$ para textos críticos y cifras financieras.
   - Prohibido el texto gris claro sobre fondo blanco (`text-slate-400` sobre `bg-white`).
3. **Ergonomía Táctil Industrial:**
   - Targets táctiles mínimos de **44 px $\times$ 44 px** para todos los botones y casillas de selección, facilitando el uso con dedos enguantados o mojados en bodega y ruta.

---

### 2. Paleta de Colores Semántica y Jerarquía de Tokens

| Token Semántico | Clase Tailwind | Valor Hex | Uso Exclusivo en Despachos |
| :--- | :--- | :--- | :--- |
| **Fondo Principal** | `bg-slate-50` | `#F8FAFC` | Fondo de la vista general y contenedores de tarjetas. |
| **Superficie de Tarjetas** | `bg-white` | `#FFFFFF` | Contenedores modales, tarjetas de pedido y paneles. |
| **Borde Estructural** | `border-slate-200` | `#E2E8F0` | Líneas divisorias, bordes de tabla y contornos de tarjeta. |
| **Texto Primario** | `text-slate-900` | `#0F172A` | Títulos, nombres de clientes y cifras financieras. |
| **Texto Secundario** | `text-slate-700` | `#334155` | Direcciones, etiquetas y metadatos complementarios. |
| **Acento Primario (Cobalt)** | `bg-blue-600` / `text-blue-600` | `#2563EB` | Botones principales, pestañas activas e indicadores de ruta. |
| **Éxito / Conforme (Emerald)**| `bg-emerald-600` / `text-emerald-700` | `#059669` | Estado `ENTREGADO_TOTAL`, entregas conformes y dinero cuadrado. |
| **Alerta / Descuadre (Amber)** | `bg-amber-500` / `text-amber-800` | `#D97706` | Estado `ENTREGADO_PARCIAL`, demoras de ruta y faltantes. |
| **Peligro / Rechazo (Rose)** | `bg-rose-600` / `text-rose-700` | `#E11D48` | Estado `NO_ENTREGADO_RECHAZADO`, averías y cancelaciones. |
| **Offline / Resiliencia (Violet)**| `bg-violet-600` / `text-violet-700` | `#7C3AED` | Indicador de Outbox activo y datos almacenados localmente. |

---

### 3. Especificación Visual de Pantallas y Componentes

#### A. Torre de Control — `DispatchView.tsx` (Desktop / Tablet)
- **Barra Superior de Indicadores:**
  - 4 métricas rápidas: *Pedidos Listos (kg totales)*, *Rutas en Tránsito*, *Dinero en Custodia de Choferes ($ COP)*, *OTIF del Día (%)*.
- **Sistema de Pestañas:**
  - Pestañas tipo pastilla (`inline-flex p-1 bg-slate-200/80 rounded-xl`):
    1. 📦 **Pedidos Listos** (con contador en badge).
    2. 🚚 **Rutas Activas** (con indicador de progreso de paradas).
    3. ⚖️ **Rutas por Liquidar** (con alerta de retorno a base).
    4. 📊 **Gobernanza OTIF** (gráficos y SLAs).
- **Tablas de Carga de Alta Densidad:**
  - Filas alternadas sutiles (`hover:bg-slate-50`), cabeceras en `bg-slate-100 text-slate-800 font-bold uppercase text-xs`.
  - Checkbox táctil visible de $20\text{ px} \times 20\text{ px}$ en cada fila de pedido.

#### B. Modal Creador de Manifiestos — `RouteManifestBuilderModal.tsx`
- **Layout de Dos Columnas:**
  - *Columna Izquierda (Parámetros):* Selectores de Chofer, Camión, Odómetro de salida, Temperatura de cava refrigerada y Observaciones.
  - *Columna Derecha (Pedidos Seleccionados):* Lista reordenable mediante botones de subir/bajar o drag, con cálculo en tiempo real de kilos acumulados y capacidad restante del camión.
- **Botón de Acción Flotante:** `bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20`.

#### C. Portal Móvil del Chofer — `DeliveryDriverPortalModal.tsx` (Mobile 375 px)
- **Diseño Mobile-First (Viewport 375 px a 420 px):**
  - Barra de estado superior con placa del camión y botón de emergencia o llamada directa a base.
  - Indicador de estado de sincronización:
    - *Online:* Badge verde con texto *"Conectado a Central"*.
    - *Offline:* Badge púrpura con texto *"Modo Fuera de Línea (X eventos en cola Outbox)"*.
- **Tarjetas de Parada Secuencial:**
  - Número de parada prominente (`bg-blue-100 text-blue-800 font-black text-xl w-10 h-10 rounded-full flex items-center justify-center`).
  - Nombre del restaurante en `font-bold text-slate-900 text-base`.
  - Dirección legible con enlace a Google Maps / Waze (`geo:lat,lng`).
  - Botón de acción rápida: *"Registrar Entrega"* en ancho completo (`w-full py-3.5`).

#### D. Modal de Ejecución de Entrega & Firma — `DeliveryExecutionModal.tsx`
- **Sección 1: Check-in de Llegada:**
  - Botón grande con icono de pin GPS: *"📍 Registrar Llegada (Check-in)"*. Al pulsarse, muestra hora de llegada con marca de verificación verde.
- **Sección 2: Ajuste de Productos y Devoluciones:**
  - Lista de ítems del pedido con cantidades. Permite desplegar *"Devolución Parcial"* ingresando kilos rechazados y motivo de avería.
- **Sección 3: Desglose Financiero COP:**
  - Campos numéricos formateados en moneda colombiana: Efectivo recibido, Transferencia digital (con campo para número de comprobante) o Crédito.
- **Sección 4: Canvas Táctil de Firma Digital:**
  - Contenedor con borde punteado de `h-40 bg-white rounded-xl border-2 border-dashed border-slate-300 relative`.
  - Botón para *"Limpiar Firma"* y mensaje guía: *"Firme con el dedo dentro del recuadro"*.
  - Campos de texto para: *"Nombre de quien recibe"* y *"Cédula / Documento"*.

#### E. Modal de Liquidación de Tesorería — `RouteSettlementModal.tsx`
- **Resumen Financiero en 4 Cuadrantes:**
  - Tarjetas de resumen con fondo claro y bordes de color:
    1. *Efectivo Teórico:* Borde azul.
    2. *Transferencias:* Borde verde.
    3. *Créditos:* Borde morado.
    4. *Gastos de Ruta:* Borde ámbar.
- **Calculadora de Cuadre de Caja:**
  - Entrada numérica destacada para *"Efectivo Físico Entregado por el Chofer"*.
  - Badge dinámico de diferencia:
    - `0 COP`: Verde brillante con texto *"Cuadre Exacto (0 discrepancia)"*.
    - Positivo: Azul con texto *"Sobrante: +$X COP"*.
    - Negativo: Rojo con texto *"Faltante: -$X COP"*.
- **Área de Aprobación de Devoluciones:**
  - Confirmación visual de cada lote y peso devuelto a cava de averías.
