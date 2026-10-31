# Tareas Atómicas de Implementación — SPEC-050 (Límite WIP = 1)
## Reestructuración UI/UX Integral de Compras, Muelle & Devoluciones B2B

- **Código:** SPEC-050
- **Fase:** Spec Kit SDD v3.0 — `/speckit.tasks`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto.
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

## Estado General del Tablero Kanban

| Por Hacer (To Do) | En Progreso (In Progress - WIP = 1) | En Revisión (In Review) | Terminado (Done) |
| :--- | :--- | :--- | :--- |
| `TASK-050-03` a `TASK-050-05` | `TASK-050-02` | Ninguna | `TASK-050-01` |

---

## Desglose Granular de Tareas

- [x] **`TASK-050-01` [UI/UX] Implementar Display Industrial de Báscula y Botones Táctiles Fitts $\ge 56\text{px}$ `ScaleIndustrialDisplay.tsx`**
  - **Objetivo:** Desarrollar `src/views/inventory/components/dock/ScaleIndustrialDisplay.tsx` con:
    - Display numérico central en `font-mono text-3xl sm:text-4xl font-black text-slate-100` con indicador de peso bruto, tara y neto.
    - Indicador visual de estabilidad (badge verde esmeralda con pulso suave).
    - Botones táctiles de gran formato $\ge 56\text{px}$ (*Capturar Pesada*, *Tara*, *Estabilizar*, *Cero*).
  - **Pruebas:** Crear `src/tests/scaleIndustrialDisplay.test.tsx` verificando renderizado, tipografía monoespaciada y disparo de callbacks.
  - **Criterio de Aceptación:** 100% tests verdes, Ley de Fitts conforme ($\ge 56\text{px}$), contraste WCAG AAA $\ge 7:1$.
  - **Estado:** COMPLETADA Y VERIFICADA (4/4 tests verdes en `scaleIndustrialDisplay.test.tsx`, 0 errores `tsc --noEmit`).

- [ ] **`TASK-050-02` [UI/UX] Implementar Panel Sensorial Visual INVIMA `InvimaQualityChecklist.tsx`**
  - **Objetivo:** Desarrollar `src/views/inventory/components/dock/InvimaQualityChecklist.tsx` con selectores semafóricos interactivos para los 4 criterios de calidad de pescado fresco (Ojos, Agallas, Olor, Textura) y cálculo automático de aprobación/rechazo.
  - **Pruebas:** Crear `src/tests/invimaQualityChecklist.test.tsx` verificando opciones normativas y emisión del estado final.
  - **Criterio de Aceptación:** 100% tests verdes, estados visuales claros (verde óptimo vs rojo no conforme).

- [ ] **`TASK-050-03` [UI/UX] Implementar Panel de Conciliación de Mermas de Viaje `DockSummaryReconciliation.tsx`**
  - **Objetivo:** Crear `src/views/inventory/components/dock/DockSummaryReconciliation.tsx` que contraste kilos según guía vs kilos pesados en báscula, calculando automáticamente el porcentaje de merma y asignando el semáforo regulatorio ($\le 3\%$ verde, $3-7\%$ ámbar, $> 7\%$ rojo con nota débito sugerida).
  - **Pruebas:** Crear `src/tests/dockSummaryReconciliation.test.tsx`.
  - **Criterio de Aceptación:** 100% tests verdes, importes y kilos en `font-mono`.

- [ ] **`TASK-050-04` [Refactor & Integración] Ensamblar y Modernizar `BucaramangaReceivingWizard.tsx`**
  - **Objetivo:** Integrar `ScaleIndustrialDisplay`, `InvimaQualityChecklist` y `DockSummaryReconciliation` dentro del wizard `BucaramangaReceivingWizard.tsx` bajo la atmósfera Dark Glassmorphism 60-30-10, garantizando cero regresiones en los flujos de recepción existentes.
  - **Pruebas:** Ejecutar la suite completa `bucaramangaReceivingWizard.test.tsx` (10 tests) y verificar `tsc --noEmit`.
  - **Criterio de Aceptación:** 100% pruebas pasando, 0 regresiones.

- [ ] **`TASK-050-05` [DevTools MCP & Certificación] Bucle de Verificación DevTools Playwright**
  - **Objetivo:** Auditar la vista en vivo contra `http://localhost:3000/` navegando a la pestaña de Recepción en Muelle.
  - **Verificación:**
    1. Consola JS con **0 errores fatales**.
    2. Captura de pantalla de escritorio a 1280px (`dock_receiving_desktop_audit.png`).
    3. Captura de pantalla móvil a 375px (`dock_receiving_mobile_audit.png`).
  - **Criterio de Aceptación:** Certificación visual completa, 0 desbordamientos y aprobación del usuario.
