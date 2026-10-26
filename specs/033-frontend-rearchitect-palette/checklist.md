# Lista de Verificación de Calidad: SPEC-033 — Reestructuración Integral del Frontend (Dark Mode Abisal Linear/Raycast)

**Fase:** /speckit.checklist (SDD v3.0)  
**Ticket:** FRONTEND-PALETTE-REARCHITECT-V8  
**Fecha:** 2026-10-26  

---

### 1. Lista de Verificación Visual y de Diseño (Aesthetics & Tokens)
- [ ] **Lienzo Base:** Fondo del `body` y contenedor raíz unificado en `#070A10` con gradientes radiales oscuros y sin bordes divisorios planos.
- [ ] **Erradicación de Franjas Grises:** 0 elementos con `border-slate-200`, `border-gray-200`, `bg-slate-100` o `bg-white` en fondos principales.
- [ ] **Membranas Translúcidas:** Todos los paneles usan `bg-slate-900/85 backdrop-blur-2xl border-white/12` con specular highlight superior `inset 0 1px 0 0 rgba(255, 255, 255, 0.12)`.
- [ ] **Acentos Cromáticos Linear:**
  - Primario: Índigo Linear (`#5E6AD2` / `bg-indigo-600 hover:bg-indigo-500`).
  - Acento: Cian Oceánico Neón (`#06B6D4` / `text-cyan-400 border-cyan-500/30`).
  - Financiero: Verde Esmeralda vibrante (`#10B981` / `text-emerald-400 font-mono`).
- [ ] **Alertas Dark Glass:** Fondos translúcidos al 10% con bordes al 30% (`bg-amber-500/10 border-amber-500/30 text-amber-300`).

### 2. Lista de Verificación de Ergonomía Táctil y Accesibilidad (WCAG 2.2 AAA)
- [ ] **Contraste de Texto:** Ratios de contraste $\ge 7:1$ para textos regulares y $\ge 4.5:1$ para etiquetas secundarias.
- [ ] **Alturas Táctiles Mínimas:** Botones de acción principal $\ge 56\text{ px}$, chips y botones secundarios $\ge 48\text{ px}$.
- [ ] **Cero Imágenes Externas:** Uso exclusivo de avatares SVG vectoriales con Lucide React.
- [ ] **Aceleración por Hardware:** `transform: translateZ(0)` presente en contenedores flotantes.

### 3. Lista de Verificación de Integración y Regresión
- [ ] **TypeScript Estricto:** `tsc --noEmit` completado con 0 errores.
- [ ] **Suites Vitest:** 100% pruebas de POS y Layout pasando en verde (sin regresiones).
- [ ] **Bucle Chrome DevTools:** 0 errores fatales en consola JavaScript en desktop (1440 px) y móvil (375 px).
