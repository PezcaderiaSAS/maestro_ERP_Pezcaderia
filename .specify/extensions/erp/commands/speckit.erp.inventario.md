# Contexto de Lógica: Inventario y Cuarto Frío

Para cualquier módulo relacionado con el inventario, aplica las siguientes directrices arquitectónicas:

*   **Alistamiento y Pesaje (Catch Weight):** Cuando un pedido pasa de `PRE_ORDEN` a `EN_PREPARACION`, el operario de bodega debe confirmar el peso real de cada ítem.
*   **Estructura de Datos:** Las tablas de Supabase deben soportar `peso_estimado` y `peso_real`. El inventario solo se descuenta formalmente utilizando el `peso_real` confirmado.
*   **Trazabilidad de Lotes:** El código de frontend debe obligar al operario a escanear o seleccionar el Lote específico del cual se está extrayendo el producto para asegurar la trazabilidad.
*   **Análisis ABC:** Las vistas de inventario deben resaltar los productos categoría "A" (Principio de Pareto 80/20). Las alertas de bajo stock deben ser más agresivas para la categoría A.
*   **Integración de Hardware:** Prepara la arquitectura de los componentes de React para una futura integración mediante Web Serial API para capturar el peso directamente de las balanzas locales.
