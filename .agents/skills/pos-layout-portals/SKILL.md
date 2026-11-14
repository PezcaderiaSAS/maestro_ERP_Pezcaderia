---
name: pos-layout-portals
description: "Invariantes verificados para portales modales en POS, drawers responsivos sin transform en línea y prevención de desbordamiento en vistas encajonadas."
---

# Patrones Verificados de Portales Modales y Layout Encajonado en POS

Skill extraída mediante `/learn` a partir de hallazgos empíricos en Playwright (desktop `1280px` y móvil `375px`) sobre `EnterpriseSidebar`, `POSMultivendorView`, `ManualWeightModal` y `SupervisorPinModal`.

---

## 1. Aislamiento de Contexto de Apilamiento (`createPortal`) y Drawers Móviles

### Problema
- En viewports estrechos (`375px`), una barra lateral fija (`fixed ... z-50`) puede quedar visible parcial o totalmente encima de los modales si utiliza `style={{ transform: 'translateZ(0)' }}` en línea (que anula `-translate-x-full`) o conserva desplazamiento fijo (`left-3`) al ocultarse.
- Las subvistas renderizadas dentro del `<main>` con ancestros `relative z-10` en [`App.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/App.tsx#L1520) quedan atrapadas en `z-10`, por debajo de barras laterales hermanas (`z-50`).

### Solución Canónica
1. **No usar `style={{ transform }}` en drawers con utilidades `-translate-x-*` / `translate-x-*`**: emplear `will-change-transform` y mover el offset cuando está colapsado en móvil (`left-0 lg:left-3` con `pointer-events-none lg:pointer-events-auto`).
2. **Montar modales críticos en Portal**: envolver el JSX raíz del modal con `typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent` y nivel controlado `z-[100]` (`ManualWeightModal`, `SupervisorPinModal`).

---

## 2. Prevención de Desbordamiento y Scroll Automático en Shell `overflow-hidden`

### Problema
- Si una subvista dentro del layout principal usa `w-screen h-screen` (`100vw × 100vh`) dentro de un contenedor con padding (`px-2.5` o `lg:pl-[88px]`) y `overflow-hidden`, al hacer clic o enfocar controles del panel derecho el navegador ejecuta `scrollLeft > 0` internamente y recorta la columna izquierda.
- En matrices densas de 6 columnas (`lg:grid-cols-6`), filas de múltiples insignias sin envoltorio horizontal (`KG`, `Balanza`, `AGOTADO`) desbordan las tarjetas contiguas.

### Solución Canónica
1. **Usar dimensiones relativas al contenedor en subvistas**: `h-full w-full flex-1 min-h-0 min-w-0` (prohibido `w-screen`/`h-screen` fuera del contenedor raíz en `App.tsx`).
2. **Paneles laterales compatibles con pruebas unitarias en tabs móviles**: combinar `flex-1 lg:flex-none min-w-0 max-w-full` delante de clases heredadas evaluadas por tests (`w-80 sm:w-96 md:w-[380px] lg:w-[420px] shrink-0`).
3. **Encapsular badges densos con `flex-wrap`**: aplicar `flex flex-wrap items-center justify-between gap-1` en cabeceras de tarjeta de catálogo.

---

## 3. Delegación Mutuamente Excluyente de Modales Padre/Hijo

### Problema
- Invocar simultáneamente estado interno (`setScaleModalProduct(product)`) y el callback del padre (`onOpenScaleModal?.(product)`) genera dos instancias `role="dialog"` apiladas (`count: 2`) e intercepta clics en modo estricto.

### Solución Canónica
```ts
const handleOpenScaleModal = (product: Product) => {
  if (onOpenScaleModal) {
    onOpenScaleModal(product);
    return;
  }
  setScaleModalProduct(product);
};
```
Cuando el componente hijo ya resuelve el modal y propaga la cantidad confirmada vía `onAddToCart(product, qty)`, el padre no debe volver a reabrir un segundo modal con `onOpenScaleModal`.

