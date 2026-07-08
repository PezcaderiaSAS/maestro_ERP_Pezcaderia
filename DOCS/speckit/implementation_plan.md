# Plan de Implementación: Corrección de Colapso de Grid en POS (v2.0)

Este documento detalla el plan técnico para restaurar la rejilla responsiva de dos columnas en el POS del ERP y solucionar los conflictos de especificidad de CSS, según la especificación aprobada.

## Propuesta de Cambios

Para resolver de forma limpia y definitiva el colapso del grid en escritorio y mantener la consistencia en todas las resoluciones, implementaremos un diseño basado en **Tailwind CSS puro** y eliminaremos las propiedades estructurales redundantes de los archivos CSS globales.

---

## 🛠️ Cambios por Componente

### 1. Estilos Globales: [src/index.css](file:///c:/Users/PERSONAL/Documents/Aplicaciones/maestro_ERP_Pezcaderia/src/index.css)

Removeremos las propiedades de diseño de las clases `.pos-layout` y `.pos-products-grid` para evitar colisiones de especificidad con Tailwind:

```css
/* Modificar en src/index.css */
.pos-layout {
  /* Eliminar display: flex, height, overflow y flex: 1 */
  /* Dejar únicamente variables o transiciones si son necesarias */
}

.pos-products-grid {
  /* Eliminar display: grid, grid-template-columns, gap y overflow-y */
  /* Dejar únicamente paddings menores de ser necesario */
}
```

### 2. Vista de Cartera: [src/views/ARView.tsx](file:///c:/Users/PERSONAL/Documents/Aplicaciones/maestro_ERP_Pezcaderia/src/views/ARView.tsx)

Dado que `ARView.tsx` consume la clase `.pos-layout` y asume que tiene `display: flex`, agregaremos la clase `flex` de Tailwind a su contenedor para evitar regresiones de diseño:

```diff
- <div className="pos-layout animate-fade-in" style={{ flexDirection: 'column', gap: '20px', padding: '20px', overflowY: 'auto' }}>
+ <div className="pos-layout flex animate-fade-in" style={{ flexDirection: 'column', gap: '20px', padding: '20px', overflowY: 'auto' }}>
```

### 3. Layout del POS: [src/views/POSView.tsx](file:///c:/Users/PERSONAL/Documents/Aplicaciones/maestro_ERP_Pezcaderia/src/views/POSView.tsx)

1. Ajustar el contenedor raíz del POS para usar el patrón de Shell del ERP (`h-screen flex flex-col overflow-hidden`):
   ```diff
   - <div className="pos-layout animate-fade-in relative" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
   + <div className="pos-layout w-full h-full flex flex-col overflow-hidden gap-4 animate-fade-in relative">
   ```
2. Modificar la división del catálogo y el carrito a partir del breakpoint de escritorio (`lg:grid lg:grid-cols-[7fr_3fr]`):
   ```diff
   - <div className="pos-layout min-h-[calc(100vh-130px)] lg:h-[calc(100vh-64px)] lg:overflow-hidden animate-fade-in flex flex-col lg:grid lg:grid-cols-[7fr_3fr] gap-4 lg:gap-5 w-full m-0 p-0 bg-transparent shadow-none border-none pt-2">
   + <div className="flex-1 min-h-0 w-full flex flex-col lg:grid lg:grid-cols-[7fr_3fr] gap-4 lg:gap-5 overflow-hidden m-0 p-0 bg-transparent shadow-none border-none pt-2">
   ```
3. Agregar contención de altura al panel del carrito (`min-h-0 h-full flex flex-col`):
   ```diff
   - <div className="pos-sidebar-cart flex-none h-[75vh] lg:sticky lg:top-6 lg:h-[calc(100vh-120px)] flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
   + <div className="pos-sidebar-cart flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-full min-h-0">
   ```

### 4. Panel de Catálogo: [src/views/pos/components/ProductSearchPanel.tsx](file:///c:/Users/PERSONAL/Documents/Aplicaciones/maestro_ERP_Pezcaderia/src/views/pos/components/ProductSearchPanel.tsx)

1. Sincronizar el contenedor del catálogo para respetar los límites de altura (`min-h-0 flex-1`):
   ```diff
   - <div className="pos-catalog flex-1 lg:flex-none h-full lg:h-full flex flex-col overflow-hidden">
   + <div className="pos-catalog flex-1 flex flex-col overflow-hidden min-h-0">
   ```
2. Asegurar que el grid de tarjetas sea responsivo puro (`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`) y no sufra sobreescritura de CSS manual:
   ```diff
   - <div className="pos-products-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto flex-1 pb-4" data-testid="product-grid">
   + <div className="pos-products-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto flex-1 pb-4 min-h-0" data-testid="product-grid">
   ```

---

## 🧪 Plan de Verificación

### Pruebas Automatizadas
* Ejecutar la suite de pruebas unitarias existente del POS:
  ```bash
  npx.cmd vitest run src/tests/usePOSCart.test.ts
  ```
* Validar que la compilación de TypeScript siga libre de errores:
  ```bash
  npx.cmd tsc --noEmit
  ```

### Verificación Manual y Visual
* Iniciar el servidor local de desarrollo (`npm.cmd run dev` o `npm run dev` tras bypass de políticas).
* Cargar la vista de **Punto de Venta (POS)** en la resolución de escritorio y validar que:
  * El catálogo y el carrito estén uno al lado del otro en proporción `70% / 30%`.
  * La columna del catálogo mantenga sus 4 columnas de productos y el carrito permanezca a la derecha sin desbordamientos de pantalla.
  * Cambiar a resoluciones medianas (tabletas) y verificar que los elementos se apilen verticalmente de forma ordenada.
