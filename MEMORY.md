# Memoria Activa - La Pezcadería ERP

## Contexto Actual (Rediseño Light Mode & Alto Contraste en POS y Cajas)
- **Estado Global:** Rediseño urgente a Modo Claro (Light Mode) de alto contraste 100% completado y validado en vivo con Chrome DevTools.
- **Skills Creadas como Fuentes de Verdad:**
  - `.agents/skills/erp-pos-design-tokens/SKILL.md`: Especificación de tokens Light Mode WCAG AA+ (fondos slate-50 `#f8fafc`, tarjetas `#ffffff`, bordes `#cbd5e1`, tipografía `#0f172a`, inputs puros blancos con anillos de foco azul/índigo, semáforos operativos).
  - `.agents/skills/ui-ux-pro-max/SKILL.md`: Patrones de flujo SaaS, split-pane táctil y AppShell responsivo.
- **Vistas y Componentes Migrados a Light Mode:**
  - `src/index.css`: Reemplazo de temas oscuros (`hyper-cobalt`, `carbon-teal`, `chrome-violet`, `obsidian`) por variantes claras de alto contraste. Sobrescrituras globales para clases oscuras residuales.
  - `src/App.tsx`, `EnterpriseTopbar.tsx`, `EnterpriseSidebar.tsx`: AppShell completo en Light Mode con títulos nítidos y badges de dominio.
  - `POSView.tsx`, `CartPanel.tsx`, `ParkedOrdersBar.tsx`, `PaymentPanel.tsx`: Catálogo de productos con nombres en mayúscula y negro intenso `#0f172a`, etiquetas de precio contrastadas, panel de ventas en espera con badges índigo/ámbar, e inputs de cobro y peso con fondo blanco absoluto.
  - `CashFlowView.tsx` y `EgresoOperativoModal.tsx`: Tablas de movimientos y formularios de egreso convertidos a Light Mode con legibilidad total bajo luz solar o iluminación intensa de punto de venta.
- **Verificación DevTools:** 0 errores en consola JS, Vite HMR 100% activo en `127.0.0.1:3000`, inspección visual exitosa de modales y flujos de cobro.

## Siguientes Flujos Operativos Prioritarios
1. **Alquileres de Frío (WMS 3PL):** Pesaje por estiba (posiciones de 800 kg), tarifas por día/mes y actas de custodia de terceros.
2. **Transformación y Fileteo en Frío (Yield & Mermas):** Despiece táctil de pescado entero a filete/posta con balance de masa en vivo.

