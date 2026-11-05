# Original User Request

## Approved Task Prompt — 2026-11-05T15:50:04Z

Usa todos los agentes disponibles que sean experto en ui/ux, /swarm. Optimizar la pantalla de ventas de MaestroPescaderia ERP para el flujo completo multivendedor - caja única, resolviendo el colapso vertical y la falta de legibilidad del carrito de ventas para garantizar visualización clara y ergonomía operativa en producción. Si el grupo de desarrollo considera hacer desde 0 o rehacer nuevamente todo el frontend de POS con el flujo completo de multivendedor - caja única, puede hacerlo.

Integrity mode: development

## Requirements

### R1. Restauración de la legibilidad y espacio vertical del carrito de ventas
Optimizar la jerarquía visual de `CartPanel` y componentes asociados para que la lista de productos (`cart-items-container` / `.pos-cart-items-list`) disponga de un área de visualización expandida con scroll vertical prioritario, permitiendo leer con total claridad cada ítem agregado (nombre, cantidad, precio unitario, peso/unidad y subtotal) incluso con múltiples productos (ej. 12+ ítems). Si el equipo lo considera óptimo, tiene autorización de rehacer o refactorizar integralmente el frontend del POS para el flujo multivendedor - caja única.

### R2. Reorganización ergonómica de ventas en espera y controles secundarios
Reestructurar la distribución de `ParkedOrdersBar`, la cabecera (cliente, estado de turno, botones de acción) y el pie de totales/acciones en el panel de ventas de modo que no canibalicen el espacio del listado de productos, manteniendo acceso ágil y ergonómico a pedidos en espera para el flujo multivendedor según decida el equipo.

### R3. Consulta y alineación de diseño con enjambre (/swarm) y tokens táctiles
Utilizar la especialización de agentes UI/UX y la ideación técnica mediante `/swarm` (`tools/agency-swarm/run_cli.py -a ui`) para optimizar la ergonomía y jerarquía visual en pantallas táctiles de POS y portátiles de mostrador.

## Acceptance Criteria

### Legibilidad y visualización del carrito
- [ ] La lista de productos en el carrito dispone de altura flexible y scroll vertical funcional independiente que permite visualizar y revisar todos los productos agregados (incluyendo listas de 12 o más ítems) sin colapsar el contenedor.
- [ ] Cada fila de producto muestra de manera clara y legible sus datos esenciales: nombre del producto, cantidad/peso, precio unitario y subtotal.

### Ergonomía de ventas en espera y controles
- [ ] La barra de ventas en espera (`ParkedOrdersBar`) y los controles de cabecera y pie permiten alternar pedidos y visualizar totales sin canibalizar el espacio del visor de productos en el flujo multivendedor - caja única.
- [ ] El pie de totales y botones de cobro/liquidación permanecen anclados y visibles sin desbordar ni recortar la lista de ítems.

### Verificación técnica y estabilidad
- [ ] La suite de pruebas del repositorio en Vitest (`npm test` o `npx vitest run`) pasa sin regresiones en los componentes del POS.
- [ ] La verificación de tipos con TypeScript (`npx tsc --noEmit`) se ejecuta sin errores.
- [ ] Cero errores o advertencias en consola de JavaScript y adaptabilidad visual verificada mediante Chrome DevTools.
