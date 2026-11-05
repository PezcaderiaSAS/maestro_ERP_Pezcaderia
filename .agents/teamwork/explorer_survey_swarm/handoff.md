# Reporte de Levantamiento Técnico: Tokens de Diseño, Especialista UI de Agency Swarm y Línea Base de Pruebas (R3)

**Autor:** `explorer_survey_swarm`  
**Fecha:** 2026-11-05  
**Destinatario:** Orquestador y Equipo de Implementación  
**Misión:** Levantamiento integral de tokens de diseño, recomendaciones del enjambre (/swarm UI specialist) y línea base de pruebas y compilación TypeScript para la optimización del Carrito POS en flujo multivendedor - caja única (Requerimiento R3).

---

## 1. Observación (Observation)

### A. Ejecución de Agency Swarm UI Reviewer
1. **Comando inicial:**
   ```bash
   python tools/agency-swarm/run_cli.py -a ui -p "Optimizar la pantalla de ventas de MaestroPescaderia ERP para flujo multivendedor - caja única, ergonomía táctil en mostrador, resolución del colapso vertical del carrito y visualización de 12+ items"
   ```
   **Resultado:** Falló con código 1 debido a que en `tools/agency-swarm/.env` (línea 11) estaba configurado `GEMINI_MODEL=gemini-3.5-flash-lite`, produciendo:
   > `openai.InternalServerError: Error code: 503 - [{'error': {'code': 503, 'message': 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.', 'status': 'UNAVAILABLE'}}]`

2. **Comando corregido con modelo estable de Google AI Studio:**
   ```bash
   python tools/agency-swarm/run_cli.py -m gemini-2.5-flash -a ui -p "Recomendaciones clave de UI y tokens para optimizar la pantalla de ventas de MaestroPescaderia ERP: flujo multivendedor - caja unica, ergonomia tactil en mostrador, resolucion del colapso vertical del carrito y visualizacion de 12+ items con scroll prioritario."
   ```
   **Resultado:** Exitoso (código 0). Salida textual generada por `UIReviewer`:
   - **Estructura de Layout:** Cuadrícula de 3-4 columnas (`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-screen overflow-hidden`) donde el catálogo ocupa 2-3 columnas y el carrito de ventas ocupa 1 columna dedicada (`col-span-1 glass-panel flex flex-col p-4`).
   - **Resolución del Colapso Vertical del Carrito:**
     - Contenedor raíz del carrito: `flex flex-col h-full min-h-0 overflow-hidden`.
     - Contenedor de lista de ítems: `flex-grow overflow-y-auto custom-scrollbar-dark-glass pr-2 -mr-2 mb-4` con absorción interna de scroll vertical (`overscroll-contain`).
     - Resumen y acciones: Pie anclado (`sticky bottom-0` o `shrink-0 mt-auto`) con división clara de subtotales, descuentos y total prominente.
   - **Ergonomía Táctil y Targets:**
     - Controles de cantidad (+/-): botones táctiles circulares o redondeados de mínimo `min-h-[44px]` a `48px` (`w-12 h-12`).
     - Botón de cobro/emisión: de gran prominencia táctil (`h-14` / `h-16`, `min-h-[56px]`).
     - Scrollbar Dark Glass: ancho de 10px, track sutil `rgba(255, 255, 255, 0.05)`, thumb `rgba(255, 255, 255, 0.2)` con hover `0.3`.

---

### B. Especificación Canónica de Tokens de Diseño y Guías UI
Revisión directa de `.agents/skills/erp-pos-design-tokens/SKILL.md`, `DESIGN.md`, `stitch.json` y `DOCS/frontend_enterprise_master_guide.md`:

1. **Ratios de Contraste WCAG 2.2 Nivel AA y AAA:**
   - **Texto Normal:** Mínimo **4.5:1** (AA); meta para interfaces operativas de alto contraste: **7:1** (AAA).
     - Light Mode: `--text-primary` (`#0f172a` sobre fondo blanco `#ffffff`) genera ratio **18.5:1** (AAA).
     - Dark Glassmorphism: `--text-primary` (`#f9fafb` sobre superficies `rgba(17, 24, 39, 0.75)` / `#0a0f1d`) genera ratio **18.5:1** (AAA).
     - `--text-secondary`: `#334155` (Light, 9.5:1) / `#9ca3af` (Dark).
     - Prohibición expresa (`SKILL.md` línea 36): *Queda prohibido usar texto blanco o gris muy claro sobre fondos blancos o claros, o texto tenue de bajo contraste sin la luminancia requerida*.
   - **Elementos de UI y Contornos:** Mínimo **3:1** contra superficies adyacentes (`--border-strong: #cbd5e1` en Light, `rgba(255, 255, 255, 0.12)` en Dark).

2. **Dimensiones Táctiles (Ley de Fitts y Regla de los 12 Años):**
   - **Nivel 1 (Acciones Secundarias, Tabs, Chips de Filtro):** Altura mínima **44px** (`min-h-[44px]`).
   - **Nivel 2 (Ajustes de Fila, Steppers de Cantidad, Delete, Inputs):** Altura y ancho mínimos de **48px** (`min-w-[48px] min-h-[48px]`, `w-12 h-12`). Verificado en `LineaVentaRow.tsx` (líneas 198, 310, 326, 337).
   - **Nivel 3 (Acción Transaccional Principal):** Altura mínima de **56px** (`min-h-[56px]`, `h-14`). Verificado en `PaymentPanel.tsx` (`btn-cobrar`) y `CartPanel.tsx` (`btn-emitir-preventa-mostrador`).

3. **Jerarquía Tipográfica y Visibilidad de Mostrador (Distancia 60–100 cm):**
   - **Total Monetario General:** `text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums text-emerald-400` (`CartPanel.tsx` línea 702).
   - **Subtotales de Fila:** `font-mono font-black text-sm sm:text-base tracking-tight tabular-nums text-blue-600 dark:text-blue-400` (`LineaVentaRow.tsx` línea 213).
   - **Nombre de Producto:** `font-bold text-xs sm:text-sm tracking-tight leading-snug break-words` (`LineaVentaRow.tsx` línea 164).
   - **Precios Unitarios:** `font-mono tabular-nums text-[11px] sm:text-xs font-semibold`.

4. **Tridecálogo Canónico CSS (`DESIGN.md` líneas 111–338):**
   - **Regla 2 (Aislamiento de Stacking Context):** `isolation: isolate` en paneles y modales (`CartPanel` y `Swal`).
   - **Regla 3 (Erradicación de márgenes en hijos):** Espaciado orquestado por el contenedor padre (`flex flex-col gap-1.5` o `space-y-1.5`).
   - **Regla 4 (Altura de Viewport):** `min-h-0 h-full` dentro de layouts sin depender de `height: 100%` frágil.
   - **Regla 10 (Container Queries):** Componentes adaptables al ancho del panel lateral.
   - **Regla 11 (Tipografía Balanceada):** `text-balance` en encabezados y `text-pretty` en textos informativos.

---

### C. Línea Base de Pruebas y Compilación TypeScript
1. **Verificación de Tipos TypeScript (`npx tsc --noEmit`):**
   - Ejecutado limpiamente: **0 errores de compilación** (Código de salida: 0).
2. **Ejecución de Suites Vitest en Componentes POS:**
   - `src/tests/posCartPanelErgonomics.test.tsx`: 13 pruebas PASADAS (100%).
   - `src/tests/challengerPOSCartAndSOPStress.test.tsx`: 8 pruebas PASADAS (100%). Incluye pruebas de estrés con 20 y 25+ ítems (`Stress-2`, `Stress-3`, `Stress-4`).
   - `src/tests/posCartRowErgonomics.test.tsx`: 4 pruebas PASADAS (100%).
   - `src/tests/posCartDrafts.test.ts`: 5 pruebas PASADAS (100%).
   - `src/tests/posErgonomicsLayout.test.tsx`: 7 pruebas PASADAS (100%).
   - `src/tests/posTouchErgonomics.test.tsx`: 9 pruebas PASADAS (100%).
   - `src/tests/posErgonomicsLaptopV8.test.tsx`: 4 pruebas PASADAS (100%).
   - `src/tests/posScrollIsolationA11yV8.test.tsx`: 3 pruebas PASADAS (100%).
3. **Defecto Previo Identificado en Pruebas Existentes:**
   - Archivo: `src/tests/m2POSMultivendor.test.tsx` (11 pruebas totales, 2 fallan).
   - **Fallo 1:** `Milestone M2 > 2. Feature F6 > debe renderizar los botones de vendedores de mostrador con min-h-[44px]`
     - *Esperado:* `min-h-[44px]`, `px-3.5 py-2.5`
     - *Recibido:* `min-h-[36px] px-3 py-1.5 ...` en `src/views/POSView.tsx` línea 2290.
   - **Fallo 2:** `Milestone M2 > 3. Feature F7 > debe dimensionar las acciones rápidas del POS (Comandas, Balanza, Más acciones) con min-h-[44px]`
     - *Esperado:* `min-h-[44px]`
     - *Recibido:* `min-h-[36px] ...` en `src/views/POSView.tsx` línea 2399 (`btn-open-comandas-drawer`).

---

## 2. Cadena Lógica (Logic Chain)

1. **A partir de la Observación 1A (Ejecución Swarm):**
   El asistente UI de Swarm confirma que la arquitectura ideal para el carrito POS en flujo multivendedor consiste en fijar el contenedor exterior con `flex flex-col h-full min-h-0 overflow-hidden`, dotar a la lista de productos de un scroll vertical prioritario (`flex-1 min-h-0 overflow-y-auto overscroll-contain`), y anclar el pie de totales/acciones (`shrink-0 mt-auto`). Esto garantiza que la lista pueda crecer indefinidamente (12, 25 o 50 ítems) sin empujar ni recortar el pie de cobro.

2. **A partir de la Observación 1B (Tokens y Tridecálogo Canónico):**
   Para cumplir la Ley de Fitts y WCAG 2.2 AA+ en pantallas táctiles y laptops de mostrador:
   - Todo botón de control de cantidad e input numérico en `LineaVentaRow` debe mantener como mínimo `48px` (`min-w-[48px] min-h-[48px]`), lo cual ya está verificado en `posCartRowErgonomics.test.tsx`.
   - La cabecera del carrito (`pos-cart-header`) y la barra de pedidos en espera (`ParkedOrdersBar`) deben orquestar sus elementos con `flex-wrap gap-1.5` o `overflow-x-auto` para que en pantallas de 1024x768 o 1366x768 no canibalicen el espacio vertical disponible para el listado de productos.
   - Las fuentes de precios y totales deben utilizar `tabular-nums` y fuentes monoespaciadas (`font-mono`) en negrita extrema (`font-black`) para asegurar legibilidad instantánea por parte del operador desde una distancia ergonómica de mostrador (60-100 cm).

3. **A partir de la Observación 1C (Pruebas y Fallos Existentes):**
   - El código TypeScript compila al 100% sin errores de tipos (`npx tsc --noEmit` = 0).
   - Las pruebas de estrés con 25+ ítems ya demuestran que la arquitectura `pos-cart-items-list flex-1 min-h-0 overflow-y-auto` con footer `shrink-0 mt-auto` es mecánicamente sólida.
   - Sin embargo, los dos fallos detectados en `m2POSMultivendor.test.tsx` demuestran que en `POSView.tsx` (líneas 2290 y 2399) los botones de selección de vendedor y de apertura del cajón de comandas tienen clases regresivas `min-h-[36px]` en lugar de las clases contractuales `min-h-[44px]`.
   - Por tanto, al abordar la optimización del POS (R1, R2 y R3), es indispensable restituir `min-h-[44px]` en dichos controles para cumplir los criterios de aceptación y dejar la suite en 100% verde.

---

## 3. Salvedades (Caveats)

1. **Entorno de API de Gemini:** `tools/agency-swarm/.env` contiene `GEMINI_MODEL=gemini-3.5-flash-lite`, el cual actualmente devuelve 503 en Google AI Studio. Durante las pruebas se comprobó que forzar el parámetro `-m gemini-2.5-flash` resuelve la consulta sin costo y de forma inmediata. Se sugiere al implementador actualizar dicho valor predeterminado si se desea usar la CLI sin banderas adicionales.
2. **Alcance del Explorador:** Como agente explorador de solo lectura, no se han aplicado modificaciones sobre el código fuente en `src/`. Todas las observaciones se respaldan con herramientas directas de lectura y comandos de prueba del sistema.

---

## 4. Conclusión (Conclusion)

1. **Recomendaciones de Swarm UI Validadas:**
   - Mantener el patrón flexbox estricto: Contenedor raíz `pos-cart-panel` con `flex flex-col h-full min-h-0 overflow-hidden`.
   - Lista de productos con scroll prioritario: `pos-cart-items-list flex-1 min-h-0 overflow-y-auto overscroll-contain`.
   - Pie de totales y cobro: `pos-cart-footer shrink-0 mt-auto`.
   - Scrollbar táctil discreta: clase `custom-scrollbar-dark-glass` (ancho 8–10px, colores semitransparentes).
2. **Matriz de Tokens y Ergonomía Contractual:**
   - Acciones primarias (Cobrar / Emitir Preventa): `min-h-[56px]` / `h-14`.
   - Controles de línea (Ajuste +/-, Keypad, Eliminar): `min-w-[48px] min-h-[48px]`.
   - Controles secundarios de barra/header (Vendedor, Comandas, En Espera): `min-h-[44px]`.
   - Contraste: Texto principal sobre fondo de tarjeta `>= 18.5:1` (AAA); elementos interactivos `>= 3:1`.
3. **Plan de Casos de Prueba Necesarios:**
   - Restaurar `min-h-[44px]` en `POSView.tsx` (líneas 2290 y 2399) para corregir los 2 fallos en `m2POSMultivendor.test.tsx`.
   - Añadir una prueba explícita de renderizado con 12+ ítems verificando:
     - Altura no colapsada del contenedor de ítems.
     - Presencia visible de nombre, cantidad/unidad, precio unitario y totalLinea por fila.
     - Scroll vertical independiente funcional.
     - Anclaje intacto de la barra de ventas en espera (`ParkedOrdersBar`) y pie de cobro.

---

## 5. Método de Verificación (Verification Method)

El evaluador o implementador puede verificar independientemente este informe mediante los siguientes comandos:

1. **Verificar ejecución de Agency Swarm UI Reviewer:**
   ```powershell
   python tools/agency-swarm/run_cli.py -m gemini-2.5-flash -a ui -p "Verificar tokens y ergonomía de mostrador para el carrito de POS"
   ```
   *Criterio de éxito:* Retorna código 0 y emite el informe del agente `UIReviewer`.

2. **Verificar línea base de compilación TypeScript:**
   ```powershell
   npx tsc --noEmit
   ```
   *Criterio de éxito:* Concluye sin emitir ningún error de tipos (código 0).

3. **Verificar suites de pruebas existentes del Carrito POS:**
   ```powershell
   npx vitest run src/tests/posCartPanelErgonomics.test.tsx src/tests/posCartRowErgonomics.test.tsx src/tests/challengerPOSCartAndSOPStress.test.tsx src/tests/posTouchErgonomics.test.tsx src/tests/posScrollIsolationA11yV8.test.tsx
   ```
   *Criterio de éxito:* 37/37 pruebas pasando (100% verde).

4. **Verificar defecto previo documentado en `m2POSMultivendor.test.tsx`:**
   ```powershell
   npx vitest run src/tests/m2POSMultivendor.test.tsx
   ```
   *Criterio de éxito:* Reproduce exactamente los 2 fallos de `min-h-[44px]` frente a `min-h-[36px]` identificados en la sección 1C.
