# Control de Calidad 1: Aclaraciones de Alcance y Mitigación de Riesgos (SPEC-033)

**Especificación:** SPEC-033 — Reestructuración Integral del Frontend (Dark Mode Abisal Linear/Raycast)  
**Fase:** /speckit.clarify (SDD v3.0)  
**Fecha:** 2026-10-26  
**Decisión Humana Confirmada:** Opción 1 — **Dark Mode Puro Abisal (Linear / Raycast)** con fondo negro-azulado `#070A10`, erradicación total de franjas grises, micro-bordes translúcidos `border-white/10` y acentos vibrantes Índigo y Cian neón.

---

## 1. Preguntas Clave y Resoluciones de Diseño

### Q1: ¿Por qué aparecían franjas grises opacas (`rgb(229, 231, 235)`) en la pantalla?
- **Diagnóstico:** Componentes heredados y layouts secundarios incluían clases fijas de Tailwind pensadas para fondos blancos (`border-slate-200`, `bg-slate-100`, `bg-white`, `border-gray-200`). En un entorno oscuro, estos elementos se computan como líneas grises duras de alto contraste que rompen la continuidad visual.
- **Resolución:** Purgar de raíz todas las clases `border-slate-200`, `border-gray-200`, `bg-slate-100` y `bg-white` en `App.tsx`, `POSView.tsx`, `ProductSearchPanel.tsx`, `CartPanel.tsx`, `EnterpriseSidebar.tsx` y `EnterpriseTopbar.tsx`. Sustituirlas por `border-white/10` y elevaciones translúcidas `bg-slate-900/85`.

### Q2: ¿Cómo se manejan los banners de advertencia y estado sin que parezcan parches?
- **Diagnóstico:** Banners con `bg-amber-50` y `border-amber-200` deslumbraban negativamente sobre el fondo oscuro.
- **Resolución:** Estandarizar alertas bajo el patrón Dark Glass: fondo translúcido al 10% con borde al 30% (`bg-amber-500/10 border-amber-500/30 text-amber-300`, `bg-rose-500/10 border-rose-500/30 text-rose-300`, `bg-emerald-500/10 border-emerald-500/30 text-emerald-300`).

### Q3: ¿Cómo se garantiza que no se rompan las pruebas existentes de Vitest?
- **Diagnóstico:** Pruebas como `posPaymentMethodsLegibility.test.tsx` o `posSellerAssignment.test.tsx` verifican selectores `data-testid` o clases específicas de botones.
- **Resolución:** Mantener estrictamente todos los `data-testid`, ids de inputs (`pos-product-search-input`, `pos-seller-badge`, etc.) y dimensiones mínimas táctiles ($\ge 48\text{ px}$ y $\ge 56\text{ px}$). Solo se actualizarán los estilos visuales de fondo y bordes.

---

## 2. Matriz de Mitigación de Riesgos

| Riesgo Técnico / Visual | Probabilidad | Impacto | Estrategia de Mitigación |
| :--- | :---: | :---: | :--- |
| **Pérdida de contraste en texto secundario** | Media | Alto | Validar contraste WCAG 2.2 AAA ($\ge 7:1$) en todo texto con `text-slate-100` y `text-slate-300`. |
| **Franjas grises en componentes hijos no migrados** | Alta | Medio | Auditar el DOM real con script de inspección en Chrome DevTools identificando `rgb(229, 231, 235)` a 0 ocurrencias. |
| **Ruptura de tests de regresión POS** | Baja | Crítico | Ejecución de suite de 11 archivos de test de POS antes de cualquier commit intermedio. |
| **Rendimiento de desenfoque (`backdrop-blur`) en laptops modestas** | Baja | Medio | Aceleración GPU por hardware forzada con `transform: translateZ(0)`. |
