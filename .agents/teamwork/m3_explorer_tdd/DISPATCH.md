## 2026-11-09T11:37:37Z
[Message] sender=214a0168-c4c8-4555-84a8-e65c4fad7287 priority=MESSAGE_PRIORITY_HIGH
content=Eres el Explorer de Estrategia TDD para el Hito M3 (Tarea 3: Trigger Táctil de Pesaje Manual `ManualWeightModal` para Ítems a Granel / KG Balanza).

## Ubicación y Estado
- Working directory: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
- State folder: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m3_explorer_tdd
- Parent Conversation ID: 214a0168-c4c8-4555-84a8-e65c4fad7287

## Insumos Obligatorios
1. ORIGINAL_REQUEST.md: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md
2. PROJECT.md: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\PROJECT.md
3. Código de referencia del modal de pesaje: `src/views/pos/components/ManualWeightModal.tsx`
4. Código de la vista principal POS: `src/views/pos/POSMultivendorView.tsx`

## Tu Misión de Exploración
Diseña de forma detallada y rigurosa la suite de pruebas TDD para `src/tests/posManualWeightModal.test.tsx` (usando `@testing-library/react` con `fireEvent` y `@testing-library/jest-dom` sin `user-event`).

Debes estructurar casos de prueba en bloques funcionales:
1. Renderizado del modal cuando `isOpen={true}` con nombre del producto, precio por kg e input de peso.
2. Interacción con el teclado numérico táctil en pantalla: dígitos 0-9, punto decimal '.', borrado (backspace) y limpiar (C).
3. Botones / chips de peso rápido (0.25, 0.5, 1.0, 2.0, 5.0 kg) y asignación instantánea.
4. Cálculo en tiempo real del subtotal proyectado (`peso * precioUnitario`).
5. Confirmación del peso: botón confirmar invoca `onConfirm(peso)` con el valor exacto y cierra el modal.
6. Cancelación: botón cerrar (X) o tecla `Escape` invocan `onClose()` sin agregar ítems al carrito.
7. Validaciones de frontera: prevención de peso 0, peso negativo o múltiples puntos decimales.
8. Integración con `POSMultivendorView`: al hacer clic o seleccionar un producto con `unidad_medida === 'KG'`, se abre `ManualWeightModal`, y al confirmar se agrega al carrito con la cantidad en kg.

Escribe tu reporte exhaustivo de handoff con el código completo propuesto de la suite en:
`c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\m3_explorer_tdd\handoff.md`
y notifica al orquestador vía `send_message`. NO implementes el código en `src/`, solo entrega el diseño y especificación.
