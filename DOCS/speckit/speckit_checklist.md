# Lista de Verificación de Calidad: Refactorización y Buenas Prácticas de Frontend (v1.0)

Esta lista de verificación valida los criterios de calidad, completitud y mitigación de riesgos para la refactorización de `PricingView.tsx` y la centralización de los tipos globales de TypeScript.

## 1. Arquitectura y Tipado Estricto (TypeScript)
- [ ] **Declaración Centralizada**: Todos los tipos e interfaces de negocio (`Cliente`, `Proveedor`, `Conductor`, `DevolucionPedido`, `ProductCatalog`, `ProductPricing`, `Product`) están definidos en [src/types/erp.types.ts](file:///c:/Users/PERSONAL/Documents/Aplicaciones/maestro_ERP_Pezcaderia/src/types/erp.types.ts).
- [ ] **Compatibilidad de Re-exportación**: `src/App.tsx` re-exporta los tipos migrados sin romper la compatibilidad para el resto del proyecto.
- [ ] **Cero Warnings de Importación Circular**: Se valida que la carga de tipos y hooks no genere ciclos de importación bloqueantes (TypeScript/ESLint).
- [ ] **Cero Any**: Los casts del tipo `any` en llamadas a cotizaciones o clientes han sido erradicados y reemplazados por sus interfaces correspondientes.

## 2. Desacoplamiento de Lógica (Hook usePricing)
- [ ] **Pureza Lógica**: El hook `usePricing` contiene únicamente lógica de negocio, manipulación de estados reactivos y consumo de los 7 stores de Zustand. No contiene elementos JSX, importaciones de estilos ni código de UI directa.
- [ ] **Aislamiento de Alertas**: `usePricing` no importa ni invoca a `SweetAlert2`. Devuelve callbacks como `onSuccess` o `onError` para que la vista ejecute las ventanas emergentes.
- [ ] **Reducción de Deuda**: El tamaño del archivo `PricingView.tsx` se ha reducido en al menos un 40%, delegando la complejidad al hook.
- [ ] **Memoización de Cálculos**: Los cálculos de subtotales, recargos, IVAs e históricos de fidelidad se realizan con `useMemo` dentro del hook para evitar recalculación innecesaria en re-renders.

## 3. Pruebas Unitarias y de Integración (TDD)
- [ ] **Tests de Regresión**: El 100% de los tests unitarios existentes en `src/tests/` (incluyendo inventarios y POS) siguen ejecutándose y pasando con éxito.
- [ ] **Tests Unitarios del Hook**: Se han diseñado y ejecutado pruebas unitarias para `usePricing.ts` verificando:
  * Inicialización correcta de la cotización.
  * Vinculación de un cliente y aplicación de su tipo de precio correspondiente (POS, Restaurante, Mayorista).
  * Aplicación del histórico de fidelidad de tarifas (`lastClientPrices`).
  * Consolidación final de la cotización aprobada (Zustand state update).

## 4. Estética y Buenas Prácticas de UI (React 18)
- [ ] **Cero Bloqueos**: El flujo de ruteo de la app en `App.tsx` no se interrumpe y la interfaz responde instantáneamente.
- [ ] **Transiciones y Hover**: Se incorporan micro-interacciones (hover en botón de aplicación de tarifa histórica, animaciones suaves en modales) según estándares premium de diseño web.
