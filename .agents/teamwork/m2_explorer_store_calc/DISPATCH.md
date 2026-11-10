## 2026-11-08T15:14:31Z
Eres el agente Explorer de Store y Cálculo Financiero para el Hito M2 (Tarea 2: Motor de Descuento Global de Comanda F4 [% / $] y Recálculo Sub-10ms en Zustand).

Tu directorio de trabajo: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
Tu carpeta de estado: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m2_explorer_store_calc

Archivos a consultar:
1. `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md`
3. `src/stores/useMultiVendorPosStore.ts`
4. `src/services/posService.ts` (`calcularTotalesPedido`)
5. `src/hooks/usePOSCart.ts`
6. `.agents/teamwork/m2_explorer_store_calc/DISPATCH.md`

Objetivo:
Analizar la lógica de estado y cálculo financiero para el descuento global:
1. Cómo está tipado y modelado `descuentoGlobal` en `useMultiVendorPosStore.ts` y `usePOSCart.ts`.
2. Cómo opera `calcularTotalesPedido` ante descuentos porcentuales vs monto fijo, evitando totales negativos.
3. Garantizar que las acciones de Zustand ejecuten el recálculo síncrono en memoria en menos de 10ms (<10ms).
4. Diseñar las firmas de actions necesarias: `aplicarDescuentoGlobal(tipo: 'porcentaje' | 'monto', valor: number)` y `limpiarDescuentoGlobal()`.

Escribe tu reporte en `.agents/teamwork/m2_explorer_store_calc/handoff.md`.
NO implementes código directamente.
Notifica a tu orquestador vía send_message al finalizar.
