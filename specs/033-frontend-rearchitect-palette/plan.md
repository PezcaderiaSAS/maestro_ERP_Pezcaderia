# Plan Técnico de Implementación: SPEC-033 — Reestructuración Integral del Frontend (Dark Mode Abisal Linear/Raycast)

**Especificación:** SPEC-033 — Reestructuración Integral del Frontend  
**Fase:** /speckit.plan (SDD v3.0)  
**Ticket:** FRONTEND-PALETTE-REARCHITECT-V8  
**Fecha:** 2026-10-26  
**Regla de Ejecución:** TDD Quirúrgico | Aprobación Previa Obligatoria | Kanban WIP = 1  

---

## 1. Alcance Arquitectónico y Estrategia

El plan aborda de raíz la erradicación de las "franjas grises" y la reestructuración completa del frontend sobre el **Dark Mode Abisal Linear/Raycast**, garantizando cero rupturas funcionales en Zustand stores, servicios de base de datos o lógica POS.

---

## 2. Desglose Técnico por Capas y Componentes

### Módulo 1: Normalización del Canvas Base & Variables CSS
- **Archivos:** `src/index.css`, `src/App.tsx`
- **Acciones:**
  - Configurar fondo base `body` y contenedor global en `#070A10` con mesh gradients radiales discretos (sin saturación agresiva).
  - Normalizar variables CSS de tema oscuro: `--bg-color: #070A10;`, `--card-bg: rgba(17, 24, 39, 0.85);`, `--border-color: rgba(255, 255, 255, 0.12);`.
  - Asegurar que la barra de scroll (`::-webkit-scrollbar`) utilice pista oscura invisible (`background: transparent;`) y thumb translúcido (`rgba(255, 255, 255, 0.15)`), eliminando cualquier barra de desplazamiento gris plana.

### Módulo 2: Saneamiento de Layout Shell (Sidebar & Topbar)
- **Archivos:** `src/components/layout/EnterpriseSidebar.tsx`, `src/components/layout/EnterpriseTopbar.tsx`
- **Acciones:**
  - Auditar y purgar cualquier clase residual `border-slate-200`, `bg-slate-100` o `divide-slate-200`.
  - En `EnterpriseTopbar.tsx`, unificar botones de acción en `bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200`.
  - En `EnterpriseSidebar.tsx`, garantizar que el rail colapsado (`w-20`) y expandido mantengan micro-bordes luminosos `border-r border-white/10` y fondos `bg-slate-900/85 backdrop-blur-2xl`.

### Módulo 3: Saneamiento de Zonas Operativas de POS
- **Archivo:** `src/views/POSView.tsx`
- **Acciones:**
  - **Zona 1 (Breadcrumb & Vendedor):** Eliminar `bg-slate-100` y `border-slate-200/90` en `pos-seller-badge`, sustituyendo por `bg-slate-900/80 border border-white/10 text-white`.
  - **Zona 2 (Barra de Control & Subvistas):** Purgar `bg-white`, `border-slate-200` y botones secundarios con fondos crema o grises. Aplicar `bg-slate-900/85 backdrop-blur-2xl border border-white/12` con micro-divisores `divide-white/5`.
  - **Zona 3 (KPIs de Turno):** Consolidar los 4 paneles con `bg-slate-900/85 border-white/12`, specular highlight `inset 0 1px 0 0 rgba(255, 255, 255, 0.12)` y tipografía monoespaciada de alto contraste.
  - **Alerta de Caja Cerrada:** Reemplazar el banner rojo plano por `bg-rose-500/15 border border-rose-500/30 text-rose-300 backdrop-blur-xl`.

### Módulo 4: Purga de Franjas en Catálogo de Productos (`ProductSearchPanel.tsx`)
- **Archivo:** `src/views/pos/components/ProductSearchPanel.tsx`
- **Acciones:**
  - Eliminar clases `bg-white`, `border-slate-200`, `text-slate-700` en inputs de búsqueda y filtros.
  - Los inputs `#pos-product-search-input` y código de barras deben utilizar `bg-slate-950/70 border border-white/12 text-white placeholder:text-slate-400 focus:border-cyan-500/50`.
  - Los chips de categoría deben usar `bg-slate-800/80 border border-white/10 text-slate-300 hover:text-white` en reposo y `bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border-indigo-400` al estar seleccionados (altura $\ge 48\text{ px}$).
  - Tarjetas de producto `.product-card`: Purgar cualquier borde gris `border-slate-200` o fondo blanco interior; asegurar `bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 rounded-2xl`.

---

## 3. Plan de Validación TDD & Quality Gate

1. **Suite TDD Especializada (`posDarkGlassmorphismV8.test.tsx`):**
   - Verificar 0 ocurrencias de clases `border-slate-200`, `border-gray-200` o `bg-slate-100` en los componentes clave.
   - Validar que `POSView` contenga el canvas `#070A10` y `GlassCard` en todas sus zonas.
2. **Suite de Regresión Completa (11 Suites POS):**
   - Ejecutar los 69 tests de regresión garantizando 100% verde.
3. **TypeScript Compiler:**
   - `tsc --noEmit` en 0 errores.
4. **Bucle Chrome DevTools:**
   - Inspección del DOM computado en `http://localhost:3000/` verificando 0 elementos con `rgb(229, 231, 235)` sobre fondos oscuros.
   - Auditoría en 1440 px y 375 px (0 desbordamientos, 0 errores en consola JS).
