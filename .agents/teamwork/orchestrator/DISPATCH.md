# Dispatch History

## 2026-11-05T18:16:28Z
Crear una vista nueva dedicada y de alto rendimiento para ventas de mostrador tipo tabla en MaestroPescaderia ERP (ruta `/mostrador` o `/pos-tabla`), optimizada para la operación fluida en desktop (1280x800) y móvil/tablet con catálogos masivos de hasta 10.000 productos cargados desde Supabase.

Integrity mode: development

Requirements:
- R1. Barra Superior Condensada y Entrada Rápida de Ítems
- R2. Estructura de Mostrador de Alta Productividad y Diseño Ultra Ligero sin Imágenes
- R3. Escala y Fluidez para Catálogo Masivo de hasta 10.000 Productos
- R4. Navegación 100% por Teclado y Experiencia Táctil Ergonómica
- R5. Pie Financiero y Flujo Multivendedor con Derivación a Caja Única
## 2026-11-05T19:22:44Z
Crear una vista nueva dedicada y de alto rendimiento para ventas de mostrador tipo tabla en MaestroPescaderia ERP (ruta `/mostrador` o `/pos-tabla`), optimizada para la operación fluida en desktop (1280x800) y móvil/tablet con catálogos masivos de hasta 10.000 productos cargados desde Supabase.

Integrity mode: development

Resume execution from Milestone M1: Inspect existing survey handoffs, PROJECT.md, and test files.
IMPORTANT: When spawning workers or subagents, use Model: 'flash' to prevent 429 quota exhaustion.
Maintain progress.md and BRIEFING.md diligently.

## 2026-11-07T18:28:52Z
Reconstruir desde cero la pantalla de ventas POS (`POSView.tsx`, `CartPanel.tsx`, `LineaVentaRow.tsx`) para producción, eliminando la saturación visual actual y adoptando un diseño espacioso, altamente legible y ergonómico estilo SaaS maduro para los vendedores en mostrador.

Integrity mode: demo

Reference material:
- Imagen 1 (Problema actual de saturación en carrito): file:///C:/Users/usuario/.gemini/antigravity/brain/e2aefe99-37a4-4e7c-ad1a-2417f699b44e/.user_uploaded/media_1794075195584_b45d7bb3.png
- Imagen 2 (Diseño de referencia POS maduro): file:///C:/Users/usuario/.gemini/antigravity/brain/e2aefe99-37a4-4e7c-ad1a-2417f699b44e/.user_uploaded/media_1794075246319_e3c57ab1.png

## Requirements

### R1. Reconstrucción integral de la interfaz de ventas POS
Eliminar la interfaz actual sobrecargada de ventas POS y rehacer la vista desde cero, estructurándola con:
1. Barra superior limpia con búsqueda por código de barras, buscador de productos y botón de creación rápida ("Crear Producto +").
2. Pestañas de categorías con navegación horizontal.
3. Cuadrícula de productos amplia, limpia y legible, con nombre completo, precio visible destacado y paginación.
4. Carrito lateral derecho amplio y despejado.

### R2. Panel de carrito ergonómico y desahogado
El panel de carrito lateral derecho debe proveer máxima legibilidad vertical para todas las líneas de venta agregadas (eliminando la franja comprimida de 40px y cualquier artefacto blanco), con un selector de cliente simple en la parte superior y una barra inferior con botones directos y despejados ("Vender" y "Guardar").

### R3. Reubicación de funciones operativas secundarias de caja
Reubicar las funciones operativas de caja ("Cerrar turno", "Ventas en espera", "Borradores" y "Multicliente") en un menú secundario, desplegable o modal accesible desde la interfaz, garantizando que el carrito quede 100% despejado sin perder estas capacidades operativas.

### R4. Optimización de procesos con Harness² y gobernanza arquitectónica
Utilizar el framework Google Harness² (`tools/harness2/run_harness2.ps1` y `scripts/architecture/run_agency_sdd_bridge.py`) para optimizar procesos, auditar invariantes de arquitectura, validar tokens de diseño y reglas de seguridad de forma recursiva durante el ciclo de desarrollo.

## Verification Resources
- Verificación visual interactiva con Chrome DevTools (cero errores en consola, inspección de legibilidad del carrito en resolución de escritorio/mostrador y móvil 375px).
- Pruebas unitarias y de componentes en Vitest.
- Auditoría técnica y verificación de invariantes con Google Harness² y Agency Swarm Bridge (`scripts/architecture/run_agency_sdd_bridge.py`).

## Acceptance Criteria

### Ergonomía y Legibilidad del Carrito
- [ ] El contenedor de líneas de venta del carrito ocupa el espacio vertical disponible de forma desahogada y permite leer claramente nombre de producto, cantidad, precio unitario y subtotal sin compresión ni artefactos visuales.
- [ ] La barra inferior del carrito muestra con claridad el total acumulado y los botones de acción principales ("Vender" y "Guardar").
- [ ] El selector de cliente se ubica en la parte superior del carrito de forma compacta y sin desplazar el contenido del pedido.
- [ ] Las acciones operativas secundarias ("Cerrar turno", "Ventas en espera", "Borradores", "Multicliente") son accesibles desde un menú secundario, desplegable o modal sin restar espacio vertical a las líneas de venta.

### Navegación y Catálogo de Productos
- [ ] La barra superior incluye buscador de texto y lector/campo de código de barras operativo.
- [ ] Las categorías de productos se presentan en pestañas de filtrado horizontal intuitivas.
- [ ] La cuadrícula de productos renderiza tarjetas con nombre completo, precio destacado y respuesta táctil/click inmediata para agregar al carrito.

### Verificación Técnica y Calidad
- [ ] Todas las pruebas unitarias y de componentes en Vitest pasan al 100%.
- [ ] La inspección en Chrome DevTools confirma 0 errores en consola JS y renderizado responsivo adecuado tanto en pantalla principal de mostrador como en 375px.
- [ ] La ejecución del puente Harness² (`scripts/architecture/run_agency_sdd_bridge.py`) valida los invariantes del arnés y confirma la optimización del proceso con 0 violaciones arquitectónicas.


## 2026-11-08T14:22:51Z
Por favor, orquestar el equipo multi-agente de Teamwork para ejecutar este plan de trabajo de manera secuencial y quirúrgica, comenzando por la Tarea 1. Plan Integral de Refactorización y Desarrollo Frontend: Interfaz POS — La Pezcadería S.A.S. bajo metodología SDD v3.0 (SPEC-057).

Integrity mode: development

## Verification Resources
- Especificación: `specs/spec_057_pos_integral_refactor_frontend.md`
- Plan y Checklist: `specs/spec_057_plan_checklist.md`
- Pruebas y verificación: `src/tests/posCartEditableRow.test.tsx`, `npx tsc --noEmit`, `vitest`

## Requirements

### R1. Fila de Carrito con Navegación [Tab] y Edición en Línea (Tarea 1)
Estructurar el carrito en `src/views/pos/components/POSMultivendorCart.tsx` con filas editables donde Cantidad y Precio Unitario sean navegables continuamente mediante la tecla [Tab], botón micro [+ Desc] para descuento por ítem, flexbox vertical estricto (85% espacio para ítems) y suite de pruebas TDD en `src/tests/posCartEditableRow.test.tsx`.

### R2. Motor de Descuento Global de Comanda (Tarea 2)
Implementar botón anclado `+ Descuento (F4)` en el pie del carrito/zona de totales con selector [% / $] y recálculo financiero reactivo instantáneo (<10ms) en Zustand.

### R3. Trigger Táctil de Pesaje Manual (Tarea 3)
Desplegar inmediatamente el modal de teclado numérico táctil en pantalla (`ManualWeightModal`) para digitación manual rápida en kilogramos al hacer clic o escanear productos a granel (KG Balanza) en `src/views/pos/POSMultivendorView.tsx`.

### R4. Interceptor Global de Atajos de Teclado (Tarea 4)
Implementar interceptor global de atajos de teclado para POS: F8, Ctrl+K, F6, F2, F9 y Esc.

### R5. Validación Comercial y PIN de Supervisor (Tarea 5)
Aplicar fluidamente la edición de precio unitario o descuento en línea si está dentro de margen. Si el Descuento > 10% o el Precio Propuesto < Costo Base + 15%, exigir obligatoriamente PIN de supervisor (4 dígitos) vía `SupervisorPinModal`.

### R6. Calidad, Virtualización y Quality Gate Final (Tarea 6)
Mantener la botonera inferior de paginación `< Anterior 1 2 3 ... Siguiente >` para la matriz de 18 tarjetas (6×3) virtualizando el dataset en memoria para transiciones < 16ms (60 FPS). Validar con `tsc --noEmit`, suite Vitest 100% verde y validación responsive.

## Acceptance Criteria

### Carrito Editable y TDD (Tarea 1)
- [ ] Cada fila del carrito en `src/views/pos/components/POSMultivendorCart.tsx` contiene inputs numéricos continuos de Cantidad y Precio Unitario que permiten navegación continua con la tecla [Tab].
- [ ] Cada fila del carrito cuenta con un botón micro [+ Desc] para aplicar descuento por ítem.
- [ ] El contenedor de ítems del carrito utiliza flexbox vertical estricto ocupando el 85% del espacio vertical.
- [ ] La suite TDD `src/tests/posCartEditableRow.test.tsx` está implementada y pasa al 100% con Vitest.

### Descuento Global (Tarea 2)
- [ ] El botón anclado `+ Descuento (F4)` en la zona de totales permite seleccionar descuento por porcentaje (%) o monto fijo ($).
- [ ] El recálculo de totales en Zustand toma menos de 10ms tras aplicar el descuento.

### Pesaje Manual KG Balanza (Tarea 3)
- [ ] Al seleccionar o escanear un ítem a granel / balanza, se abre automáticamente `ManualWeightModal` con teclado táctil numérico para ingresar el peso en kg en `src/views/pos/POSMultivendorView.tsx`.

### Atajos de Teclado (Tarea 4)
- [ ] Los atajos de teclado F8, Ctrl+K, F6, F2, F9 y Esc ejecutan las acciones de navegación y comanda correspondientes sin colisionar con atajos del navegador.

### Control Comercial y PIN (Tarea 5)
- [ ] Si Descuento <= 10% y Precio Propuesto >= Costo Base + 15%, la edición de precio o descuento se aplica directamente sin requerir PIN.
- [ ] Si Descuento > 10% o Precio Propuesto < Costo Base + 15%, se bloquea la confirmación hasta validar un PIN de 4 dígitos en `SupervisorPinModal`.

### Quality Gate y Rendimiento (Tarea 6)
- [ ] La matriz de catálogo de 18 tarjetas (6×3) mantiene la botonera inferior de paginación `< Anterior 1 2 3 ... Siguiente >` virtualizando el dataset en memoria con transiciones de página a 60 FPS (< 16ms).
- [ ] `npx tsc --noEmit` ejecuta sin ningún error de tipado TypeScript.
- [ ] Todos los tests de Vitest pasan en verde (0 fallos).
- [ ] La interfaz se renderiza correctamente sin desbordamientos en responsive (375px móvil y desktop).


## 2026-11-08T15:13:12Z
El usuario ha confirmado formalmente la aprobación del Hito M1 y autoriza proceder con la Tarea 2 (Hito M2): Motor de Descuento Global de Comanda (+ Descuento F4) en el pie del carrito y recálculo financiero reactivo (<10ms) en Zustand.

Por favor continuar con la ejecución secuencial quirúrgica bajo metodología SDD v3.0 / TDD.


## 2026-11-09T11:36:08Z
El usuario ha aprobado formalmente la continuación del proyecto y autoriza proceder inmediatamente con la ejecución secuencial quirúrgica de la Tarea 3 (Hito M3) bajo SDD v3.0 / TDD:

Tarea 3 (Hito M3):
- Trigger táctil de pesaje manual con teclado numérico en pantalla (ManualWeightModal.tsx) para productos de peso variable (KG Balanza) al hacer clic o escanearlos en src/views/pos/components/POSMultivendorView.tsx y catálogo.
- Apertura inmediata del teclado táctil numérico con botones grandes (>= 48px) para digitación manual rápida en kg.
- Suite de pruebas TDD en src/tests/posManualWeightModal.test.tsx (o equivalente canónico) verificando apertura, confirmación de peso, recálculo en carrito y cierre.
- Verificación de tipos tsc --noEmit y suite Vitest.

Por favor reanudar la orquestación y desplegar el equipo para el Hito M3.


## 2026-11-09T12:24:39Z
El usuario ha confirmado formalmente la aprobación del Hito M3 y autoriza proceder inmediatamente con la Tarea 4 (Hito M4: Interceptor Global de Atajos de Teclado F8, Ctrl+K, F6, F2, F9, Esc) bajo metodología SDD v3.0 / TDD.

Por favor continuar con la ejecución secuencial quirúrgica de la Tarea 4.
