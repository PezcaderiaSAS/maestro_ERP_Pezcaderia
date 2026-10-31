# Checklist de Calidad Técnica y UX — SPEC-048
## Reestructuración UI/UX Integral de Inventario & Bodega WMS (`InventoryView.tsx`)

- **Código:** SPEC-048
- **Fase:** Spec Kit SDD v3.0 — `/speckit.checklist`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`).

---

### 1. Lista de Verificación de Diseño y Experiencia de Usuario (UI/UX)
- [ ] **Leyes Cognitivas Validadas:**
  - [ ] **Fitts:** Todos los botones de acción rápida, selectores y pestañas tienen altura mínima de $44\text{px}$ a $48\text{px}$.
  - [ ] **Hick:** Menú consolidado en 7 Pills superiores claramente identificables.
  - [ ] **Miller:** Bento Grid de exactamente 4 tarjetas principales en el viewport superior.
  - [ ] **Proximidad:** Métricas y acciones agrupadas contextualmente por dominio de bodega/lote.
  - [ ] **Jakob:** Patrones estándar de tablas de datos con sticky header, paginación y búsqueda.
- [ ] **Armonía Cromática 60-30-10:**
  - [ ] 60% Fondo: `bg-[#0B0F19]` y tarjetas translúcidas `bg-[#131C2E]/60 backdrop-blur-xl`.
  - [ ] 30% Estructura: Bordes `border-slate-800/85` y textos `text-slate-100` / `text-slate-400`.
  - [ ] 10% Acentos funcionales: Cian `#00F2FE`, Ámbar `#F59E0B`, Rojo Merma `#EF4444`, Esmeralda `#10B981`.
- [ ] **Accesibilidad WCAG 2.1 AA/AAA:**
  - [ ] Ratio de contraste texto/fondo $\ge 7:1$ para números y etiquetas críticas.
  - [ ] Atributos `aria-label` en botones basados únicamente en íconos.
  - [ ] Navegación fluida por teclado (`Tab`, `Enter`, `Escape`).

---

### 2. Lista de Verificación de Arquitectura y Lógica de Negocio WMS
- [ ] **Cuartos Fríos:** Monitoreo visual de capacidad ocupada en Kg y alertas de temperatura.
- [ ] **Lotes FEFO:** Clasificación de perecederos priorizando los lotes más próximos a vencer (< 48 hrs con badge pulsante).
- [ ] **Mermas de Despiece:** Registro de pesaje de materia prima vs producto aprovechable con cálculo de porcentaje de rendimiento y alertas de desvío (> 35%).
- [ ] **Pareto ABC:** Clasificación automática 80/20 según rotación e impacto financiero en inventario.
- [ ] **Aislamiento Multi-Tenant:** Todas las consultas y mutaciones filtradas estrictamente por `activeTenant.id`.

---

### 3. Lista de Verificación de Código y Calidad (TDD & DevTools)
- [ ] **TypeScript Estricto:** Cero errores en `tsc --noEmit`, sin uso de `any`.
- [ ] **Cobertura Vitest:** $\ge 85\%$ de cobertura en componentes y hooks de inventario.
- [ ] **Bucle DevTools MCP:**
  - [ ] 0 errores fatales en consola (`pageerror = 0`).
  - [ ] 0 advertencias de React (`act(...)` o keys duplicadas).
  - [ ] Vista de escritorio (1280px) nítida y sin desbordamientos.
  - [ ] Vista móvil (375px) ergonómica y responsive.
- [ ] **Rendimiento:** Transición fluida entre pestañas sin lag perceptivo ni re-renders cíclicos.
