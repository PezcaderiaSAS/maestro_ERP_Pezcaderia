# Lista de Verificación de Calidad: Corrección de Colapso de Grid en POS (v2.0)

Esta lista de verificación valida los criterios de calidad, completitud y mitigación de riesgos de UI/UX relacionados a la solución del colapso responsivo en la pantalla del Punto de Venta (POS) y conflictos de CSS.

## 1. Diseño Responsivo y Reglas de CSS
- [ ] **Limpieza de CSS Global**: La clase `.pos-layout` en `src/index.css` ya no contiene directivas destructivas de diseño (`display: flex`, `height: calc(...)`, `flex: 1`, `overflow: hidden`) que anulen a las utilidades de Tailwind CSS.
- [ ] **Desacoplamiento de Grid en Catálogo**: La clase `.pos-products-grid` ya no fuerza columnas fijas en `index.css`, permitiendo que el número de columnas varíe fluidamente gracias a las directivas nativas de Tailwind (`grid-cols-2`, `sm:grid-cols-3`, `lg:grid-cols-4`).
- [ ] **Compatibilidad de Módulos (Cuentas por Cobrar)**: El componente secundario `ARView.tsx` renderiza verticalmente sin distorsiones luego de la eliminación de los estilos intrusivos de `.pos-layout`.

## 2. Contención Espacial (Box Model & Shell Pattern)
- [ ] **Alineación de 2 Columnas (70/30) en Escritorio**: En resoluciones de pantalla iguales o superiores a 1024px (`lg`), el Catálogo (70%) y el Carrito de Compras (30%) están perfectamente alineados uno al lado del otro.
- [ ] **Apilamiento Vertical Ordenado (Móviles)**: En pantallas menores a 1024px, el catálogo se muestra primero, apilado limpiamente encima del panel de carrito para asegurar legibilidad en tabletas.
- [ ] **Inmutabilidad de Altura Padre**: El contenedor primario del POS implementa contención efectiva (`overflow-hidden`, `min-h-0` y `h-full`) para impedir que el DOM principal (la página web entera) experimente desbordamiento vertical debido a inventario dinámico.

## 3. Comportamiento en Casos Límite y Scroll Independiente
- [ ] **Scroll Aislado en Catálogo**: Agregar o buscar numerosos productos invoca el scroll bar vertical (`overflow-y-auto`) **exclusivamente** dentro del contenedor del Catálogo (`pos-catalog`), dejando el carrito completamente estático y visible a la derecha.
- [ ] **Scroll Aislado en Carrito**: Escanear y listar múltiples ítems simultáneos en una venta activa provoca un scroll independiente para la sub-vista de líneas del recibo.
- [ ] **Contención Dinámica Segura (`min-h-0`)**: En caso de títulos extensos, SKU sobredimensionados, o componentes flexibles sin altura definida, el layout mantiene su integridad gracias a la regla protectora de flex/grid `min-h-0`.

## 4. Estética de Interfaz e Implementación de Código
- [ ] **Tailwind Estricto**: Todo refactor estructural emplea estrictamente clases utilitarias de Tailwind en JSX, respetando el sistema Data-Driven del ERP.
- [ ] **Flujo de Renderizado React**: Las actualizaciones y remociones de clases en los JSX (`POSView.tsx` y `ProductSearchPanel.tsx`) no rompen referencias `ref` ni comportamientos anidados en la lógica de estados locales.
- [ ] **Cero Errores Transpilados**: Se ha ejecutado una verificación en Typescript (TSC) y todo compila apropiadamente.
