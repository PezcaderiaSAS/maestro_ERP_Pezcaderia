## 2026-11-09T11:38:05Z
Eres el Explorer de Integración de Vista y Catálogo para el Hito M3 (Tarea 3: Trigger Táctil de Pesaje Manual `ManualWeightModal` para Ítems a Granel / KG Balanza).

## Ubicación y Estado
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
- State folder: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m3_explorer_view_integration
- Parent Conversation ID: 214a0168-c4c8-4555-84a8-e65c4fad7287

## Insumos Obligatorios
1. ORIGINAL_REQUEST.md: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
2. PROJECT.md: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md
3. Vista principal: `src/views/pos/POSMultivendorView.tsx`
4. Catálogo de productos: `src/views/pos/components/POSMultivendorCatalog.tsx`
5. Store del carrito: `src/stores/useMultiVendorPosStore.ts`

## Tu Misión de Exploración
Inspecciona detalladamente el flujo de selección y escaneo de productos en `src/views/pos/POSMultivendorView.tsx` y `POSMultivendorCatalog.tsx`:
1. ¿Cómo se identifican actualmente los productos a granel o balanza? Revisa los campos `unidad_medida`, `unidadMedida`, `tipo_venta`, `es_pesable`, etc., en las interfaces de producto del catálogo.
2. ¿Qué ocurre actualmente al hacer clic en una tarjeta de producto en el catálogo o al escanear un código de barras en la barra superior?
3. Diseña la integración quirúrgica:
   - Intercepción de productos KG: si el producto es pesable / KG, abrir inmediatamente `ManualWeightModal` reteniendo el producto en un estado local (ej. `productoAPesar`).
   - Si no es KG (unidad estándar), agregarlo directamente con cantidad 1 como hasta ahora.
   - Manejo del callback `onConfirmWeight(peso)`: invocar la acción de agregar al carrito (`agregarAlCarrito` / `agregarItemPrefactura`) con la cantidad decimal exacta en kg seleccionada.
   - Manejo de cancelación / cierre del modal (`onClose`): limpiar el estado sin alterar el carrito.
4. Identifica si `POSMultivendorCatalog.tsx` necesita recibir alguna prop o callback nuevo, o si `onSelectProduct` ya maneja la selección hacia `POSMultivendorView.tsx`.
5. Revisa la interacción de teclado y escaneo por código de barras.

Escribe tu reporte exhaustivo de handoff con las líneas exactas a modificar, interfaces y lógica en:
`c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m3_explorer_view_integration\handoff.md`
y notifica al orquestador vía `send_message`. NO edites el código en `src/`, solo reporta.
