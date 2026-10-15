# Desglose de Tareas de Implementación (Tasks): SPEC-014

**Código:** SPEC-014  
**Título:** Simplificación Radical de UI en POS y Operaciones (Regla del Niño de 12 Años: Fricción Cero, Targets $\ge 48\text{ px}$, Pesaje Manual Asistido y Auto-Focus)  
**Estado:** COMPLETED (Implementación y Tests 100% Verificados)  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.tasks` & `/orch-build-mvp`  
**Gobernanza:** Continuous-Kanban-Flow con **Límite Estricto WIP = 1**  

---

## Matriz de Tareas Secuenciales (Vertical Slices)

| ID de Tarea | Componentes / Archivos Afectados | Descripción Atómica | Criterio de Verificación TDD / DevTools | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **TASK-014-01** | `src/views/pos/components/ManualWeightModal.tsx`<br>`src/tests/posManualWeightModal.test.tsx` | **Rebanada 1 (Pesaje Manual Táctil):**<br>Crear el modal táctil `ManualWeightModal.tsx` con chips rápidos (`0.25`, `0.5`, `1.0`, `1.5`, `2.0`, `3.0`, `5.0 kg`), Keypad numérico táctil en pantalla de $56\text{ px}$, input numérico auto-enfocado con `select()`, cálculo de subtotal COP en tiempo real y botón gigante `AGREGAR AL CARRITO` ($\ge 56\text{ px}$) accesible con `Enter`. | Suite unitaria `posManualWeightModal.test.tsx` 100% pasando (6/6 tests). | `[x] DONE` |
| **TASK-014-02** | `src/views/pos/components/ProductSearchPanel.tsx`<br>`src/views/POSView.tsx` | **Rebanada 2 (Búsqueda Táctil & Apertura de Pesaje):**<br>Integrar `ManualWeightModal` en la selección de productos: si `unidadMedida === 'kg'` o producto a granel, abre el modal táctil de pesaje; si es por unidad (`und`), se añade directamente en 1 clic. Aumentar tamaño táctil de chips de categoría a $\ge 48\text{ px}$ y asegurar auto-foco persistente en `#pos-product-search-input`. | Test unitario de integración en búsqueda + verificación de auto-foco tras agregar producto (4/4 tests). | `[x] DONE` |
| **TASK-014-03** | `src/views/pos/components/LineaVentaRow.tsx` | **Rebanada 3 (Ergonomía Táctil en Carrito):**<br>Asegurar targets de $48 \times 48\text{ px}$ en botones `+` y `-`. Input inline de cantidad con selección automática total al tocarlo. Botón de eliminación `Trash2` de $48 \times 48\text{ px}$. Permitir tocar la etiqueta de peso en kg para reabrir `ManualWeightModal` y editar en 1 toque. | Tests de interacción táctil y renderizado de dimensiones mínimas de 48px (4/4 tests). | `[x] DONE` |
| **TASK-014-04** | `src/views/pos/components/CartPanel.tsx`<br>`src/views/pos/components/PaymentPanel.tsx` | **Rebanada 4 (Botón Gigante COBRAR & Feedback Visual):**<br>Rediseñar el botón `COBRAR` a $\ge 56\text{ px}$ de altura (`h-14`), ancho completo, color verde esmeralda de alto contraste con tipografía monoespaciada para el total en COP. Añadir micro-animación de pulso táctil suave en el total. Targets $\ge 48\text{ px}$ en `Vaciar Carrito` y `Guardar Espera`. | Pruebas de renderizado y visualización de totales en COP sin distorsión visual (4/4 tests). | `[x] DONE` |
| **TASK-014-05** | `src/views/pos/components/PaymentPanel.tsx`<br>`src/views/POSView.tsx` | **Rebanada 5 (Cobro Fricción Cero & Retorno Inmediato):**<br>Aumentar botones de billetes rápidos COP a $\ge 48\text{ px}$. Tras presionar cobro, cerrar modales inmediatamente, emitir orden de ticket y retornar el foco a `#pos-product-search-input` acompañado de toast no bloqueante de 1000 ms. | Pruebas de cobro rápido con retorno de foco validado en DOM (4/4 tests). | `[x] DONE` |
| **TASK-014-06** | `src/tests/posTouchErgonomics.test.tsx` | **Rebanada 6 (Suite Integral E2E & Quality Gate DevTools):**<br>Crear suite integral de pruebas cubriendo el flujo completo de la "Regla del Niño de 12 Años": búsqueda $\rightarrow$ pesaje manual rápido $\rightarrow$ ajuste táctil $\rightarrow$ cobro en 1 toque $\rightarrow$ foco en buscador. Bucle de validación Chrome DevTools MCP en vivo (0 errores de consola, vistas responsivas de 375 px y 768 px). | 100% tests pasando (`npm run test:run`) + 0 errores en consola JS (5/5 tests). | `[x] DONE` |

---

## Protocolo de Ejecución de Tareas (Innegociable)
1. **Regla WIP = 1:** Se toma **UNA SOLA tarea a la vez**, pasando su estado a `[>] IN PROGRESS`.
2. **Ciclo TDD:** Escribir primero la prueba que demuestre la necesidad o fallo (RED), implementar el código mínimo para pasarla (GREEN) y refactorizar limpiamente (REFACTOR).
3. **Pausa y Confirmación:** Al finalizar cada tarea, **DETENERSE INMEDIATAMENTE** y esperar la confirmación explícita del usuario antes de mover la siguiente tarea.
4. **Validación DevTools:** Tras cada cambio de código, verificar en Chrome DevTools MCP (0 errores en consola JS y renderizado en 375 px).
