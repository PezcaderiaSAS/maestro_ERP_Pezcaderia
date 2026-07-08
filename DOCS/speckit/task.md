# Speckit Tasks: Tareas de Refactorización de Frontend y Tipos (Actualizado CC2)

Esta es la lista secuencial y granular de tareas para ejecutar la refactorización de `PricingView.tsx` y la centralización de los tipos de TypeScript, con las mitigaciones del Control de Calidad 2.

## Fase 1: Centralización de Tipos de TypeScript

- [x] 1.1 Crear el archivo [src/types/erp.types.ts](file:///c:/Users/PERSONAL/Documents/Aplicaciones/maestro_ERP_Pezcaderia/src/types/erp.types.ts), documentando explícitamente la distinción semántica entre `Product` (entidad comercial/precios) y `Producto` (entidad física de inventarios).
- [x] 1.2 Mover las interfaces `Cliente`, `Proveedor`, `Conductor`, `DevolucionPedido`, `ProductCatalog`, `ProductPricing` y `Product` desde `src/App.tsx` hacia el nuevo archivo.
- [x] 1.3 Modificar `src/App.tsx` para re-exportar estos tipos desde `src/types/erp.types.ts`, manteniendo la compatibilidad retroactiva.
- [x] 1.4 Validar la compilación estática general ejecutando `npx.cmd tsc --noEmit`.

## Fase 2: Implementación de usePricing

- [x] 2.1 Crear el archivo de hook [src/hooks/usePricing.ts](file:///c:/Users/PERSONAL/Documents/Aplicaciones/maestro_ERP_Pezcaderia/src/hooks/usePricing.ts).
- [x] 2.2 Vincular los stores de Zustand necesarios (`useInventoryStore`, `useOrderStore`, `useAppStore`, `useClientStore`, `useDriverStore`, `useEventStore`, `useReturnStore`).
- [x] 2.3 Implementar la lógica del carrito de cotización, cálculos matemáticos e impuestos utilizando `useMemo`.
- [x] 2.4 Integrar la lectura y escritura de tarifas de fidelidad (`pezcaderia_last_client_prices` en `localStorage`).
- [x] 2.5 Estructurar los retornos de promesas y callbacks de éxito/error (`onSuccess`, `onError`) para desacoplar a `SweetAlert2`.

## Fase 3: Refactorización de PricingView.tsx

- [x] 3.1 Modificar [src/views/PricingView.tsx](file:///c:/Users/PERSONAL/Documents/Aplicaciones/maestro_ERP_Pezcaderia/src/views/PricingView.tsx) para consumir el nuevo hook `usePricing`.
- [x] 3.2 Eliminar imports y variables de estado duplicadas que ahora administra el hook.
- [x] 3.3 Configurar las alertas visuales (`SweetAlert2`) en la vista conectándolas a las respuestas de los callbacks del hook.
- [x] 3.4 Comprobar que la vista reduzca su cantidad de código a menos de 1000 líneas (reducido en ~450 líneas de pura lógica comercial).

## Fase 4: Pruebas y Validación Final

- [x] 4.1 Validar errores de compilación con `npx.cmd tsc --noEmit`.
- [x] 4.2 Escribir e implementar las pruebas unitarias para el hook en `src/tests/usePricing.test.tsx` (asegurando incluir la limpieza del estado de Zustand en el bloque `beforeEach` para aislar las ejecuciones) y correr el suite general con `npx.cmd vitest run src/tests/usePricing.test.tsx`.
- [x] 4.3 Validar flujos de trabajo de forma manual en el servidor local.
