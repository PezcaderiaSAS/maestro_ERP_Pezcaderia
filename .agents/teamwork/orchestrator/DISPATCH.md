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
