Crear una vista nueva dedicada y de alto rendimiento para ventas de mostrador tipo tabla en MaestroPescaderia ERP (ruta `/mostrador` o `/pos-tabla`), optimizada para la operación fluida en desktop (1280x800) y móvil/tablet con catálogos masivos de hasta 10.000 productos cargados desde Supabase.

Integrity mode: development

## Requirements

### R1. Barra Superior Condensada y Entrada Rápida de Ítems
Una barra superior condensada de una sola línea con contexto operativo (asesor activo, cliente rápido por Cédula/NIT/Nombre, bodega activa, turno y atajos rápidos) complementada por una cabecera de entrada rápida para escaneo o ingreso directo de código de barras/SKU, selector de variable/precio, cantidad rápida (por defecto 1), valor del producto y botón de adición inmediata a la venta.

### R2. Estructura de Mostrador de Alta Productividad y Diseño Ultra Ligero sin Imágenes
Una interfaz en una ruta dedicada e independiente (`/mostrador` o `/pos-tabla`) que mantenga la vista actual de POS intacta. No es necesario que cargue imágenes de productos; la interfaz debe ser lo más sencilla, fácil de leer y usar posible, basada en tipografía nítida de alto contraste, badges de stock numéricos legibles, catálogo rápido optimizado y tabla pura de venta ("Tu Carrito de Compras") con columnas de Producto, Cantidad, Total, y acciones de edición y eliminación por línea.

### R3. Escala y Fluidez para Catálogo Masivo de hasta 10.000 Productos
Soporte fluido para catálogos masivos de hasta 10.000 productos leídos desde Supabase, con búsqueda instantánea sub-10ms, filtrado reactivo y virtualización de elementos para garantizar que el hilo principal de renderizado permanezca completamente desbloqueado y sin latencia perceptible.

### R4. Navegación 100% por Teclado y Experiencia Táctil Ergonómica
Navegación completa por teclado (flechas arriba/abajo, Enter para seleccionar/agregar, Tab entre campos, atajos F2 comanda/preventa, F6 suspender, F8 búsqueda masiva, F10 cobrar) combinada con botones y controles táctiles ergonómicos optimizados para pantallas de mostrador en desktop (1280x800), tablets y móviles.

### R5. Pie Financiero y Flujo Multivendedor con Derivación a Caja Única
Un pie financiero compacto con subtotal, descuento, impuestos y total prominente de alto contraste, barra de acciones rápidas (selector de medio de cobro, limpiar carrito, descuento, cliente, comanda/preventa, cobrar) e integración plena con el flujo multivendedor mediante generación de preventas consecutivas con correlativo PRE-YYYY-XXXXX asignadas al asesor para su cobro y despacho en caja única.

## Acceptance Criteria

### Rendimiento y Escala
- [ ] La búsqueda y filtrado de productos sobre un catálogo de hasta 10.000 registros de Supabase responde con latencia sub-10ms medida programáticamente.
- [ ] El renderizado de listas y tablas utiliza virtualización sin cargar imágenes ni elementos pesados, manteniendo un desplazamiento fluido a 60 FPS sin bloquear la interfaz de usuario.

### Navegabilidad y Usabilidad
- [ ] Es posible registrar una venta completa de inicio a fin (selección de cliente, adición de productos, modificación de cantidades y comanda) utilizando exclusivamente teclado y atajos (F2, F6, F8, F10, flechas, Enter, Tab).
- [ ] La interfaz se adapta sin desbordamientos ni scroll horizontal accidental tanto en resolución desktop de 1280x800 como en pantallas móviles y tablets.
- [ ] El catálogo y las líneas de venta muestran información nítida con tipografía de alto contraste y badges numéricos sin renderizar imágenes de productos.

### Integración y Flujo Transaccional
- [ ] La nueva vista opera en una ruta dedicada (`/mostrador` o `/pos-tabla`) coexistiendo sin alterar la vista POS existente.
- [ ] Al generar una comanda/preventa (F2), se emite un registro con numeración correlativa PRE-YYYY-XXXXX asignado al asesor y bodega seleccionados, listo para cobro en caja única.
- [ ] Los cálculos de subtotales, descuentos, impuestos y total general se actualizan en tiempo real de forma matemáticamente exacta ante cualquier adición, edición o remoción de ítems.

### Verificación Automatizada
- [ ] El equipo implementa una suite de pruebas automatizadas (pruebas unitarias y de rendimiento) que comprueba los cálculos financieros, la virtualización y la latencia de filtrado.
