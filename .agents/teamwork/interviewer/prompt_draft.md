Ajuste ergonómico del mostrador para las comandas en el POS y evaluación profesional de ingenieros y arquitectos de datos sobre el ciclo de vida e integridad de la preventa para endurecimiento en producción.

Integrity mode: development

## Requirements

### R1. Ergonomía del Mostrador y Ajuste del Panel de Carrito (`CartPanel.tsx` / `POSView.tsx`)
Ajustar el panel de "CARRITO DE VENTAS" para eliminar fondos blancos en la cabecera del cliente (`pos-cart-header`) integrándolo con la estética Dark Glassmorphism V8 del contenedor.
Corregir la disposición espacial para evitar que el bloque inferior (`Subtotal`, `Impuestos`, `Descuento`) solape o corte los botones de acción rápida de cliente y estado de comanda.
Reorganizar los botones operativos del mostrador (`EMITIR PREVENTA / COMANDA (F6)` y `Vaciar Carrito`) con alta densidad visual y fluidez ergonómica, asegurando visibilidad y usabilidad sin scrolls redundantes ni colisiones de cajas.

### R2. Integridad y Refactorización del Ciclo de Vida de Comanda / Preventa
Asegurar y refactorizar la integridad atómica e inmutabilidad en todo el ciclo de vida: `POS (Asesor)` -> `Prefactura (PENDIENTE_COBRO con retención efectiva de stock)` -> `Caja Central / Ventanilla (EN_COBRO -> PAGADA con efectivo/cambio o crédito con vencimiento registrado en useARStore)` -> `Despacho / Bodega (WMS / DESPACHADA)`.
Actualizar y sincronizar las estructuras de datos, tipos TypeScript (`src/types/prefactura.types.ts`), esquemas Zod (`src/schemas/prefactura.schema.ts`), servicios (`src/services/prefacturaService.ts`) y stores Zustand (`useCashierKanbanStore`, `usePOSCart`, `useARStore`), garantizando consistencia atómica, inmutabilidad y aislamiento multi-tenant.

## Acceptance Criteria

### Ergonomía y Layout Visual (POS / Carrito)
- [ ] La cabecera del carrito y el selector de cliente (`pos-cart-header`) no presentan fondos claros o blancos desalineados, manteniendo coherencia con Dark Glassmorphism V8.
- [ ] No existe solapamiento ni corte vertical entre los botones de acción del cliente y las secciones inferiores de subtotal, impuestos y descuento en resoluciones estándar de mostrador (1024x768, 1366x768 y superiores).
- [ ] Los botones `EMITIR PREVENTA / COMANDA` y `Vaciar Carrito` permanecen completamente visibles, clicables y ergonómicamente accesibles en el viewport operativo sin scrolls innecesarios.

### Arquitectura de Datos y Ciclo de Vida
- [ ] Las transiciones de estado de preventa (`PENDIENTE_COBRO` con reserva de stock -> `EN_COBRO` -> `PAGADA` / crédito en `useARStore` -> `DESPACHADA`) se reflejan de forma consistente en los stores Zustand (`usePOSCart`, `useCashierKanbanStore`, `useARStore`) y el servicio `prefacturaService.ts`.
- [ ] Los esquemas Zod (`src/schemas/prefactura.schema.ts`) y tipos TypeScript (`src/types/prefactura.types.ts`) validan todas las cargas útiles del ciclo de vida sin discrepancias de tipos.
- [ ] La compilación TypeScript estricta (`npx tsc --noEmit`) finaliza con 0 errores de tipo.
- [ ] La suite de pruebas de regresión y unitarias con Vitest se ejecuta y pasa al 100%.
- [ ] No se producen errores ni advertencias no controladas en la consola de JavaScript durante la navegación e interacción en el panel de mostrador.

## Verification Resources
- Compilación TypeScript: `npx tsc --noEmit`
- Suite de pruebas automatizadas: `npm run test` (Vitest)
- Verificación visual interactiva en navegador/DevTools para validación de layout responsivo (1024x768 en adelante) y 0 errores en consola.
