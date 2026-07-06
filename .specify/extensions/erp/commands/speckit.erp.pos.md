# Máquina de Estados: Flujo Central de Pedidos (POS B2B)

Este es el flujo de vida inmutable de un pedido. Al desarrollar componentes de UI o funciones en Supabase RPC, respeta esta transición de estados:

1.  **`PRE_ORDEN` (Vendedor):** Pedido montado por el vendedor externo con valores y pesos iniciales estimados.
2.  **`EN_PREPARACION` (Bodega):** El pedido ingresa alistamiento. Aquí ocurre la "Confirmación de Pesos y Unidades". La UI debe mostrar un checklist claro para el operario.
3.  **`LISTO_PARA_DESPACHO` (Logística):** Los pesos reales están confirmados. El sistema recalcula el valor total exacto del pedido internamente, pero aún no factura.
4.  **`EN_RUTA` (Logística/Conductor):** El pedido ha sido asignado a un vehículo y está en proceso de entrega.
5.  **`ENTREGADO_CON_ACEPTACION` (Cliente/Conductor):** El cliente recibe el producto, verifica pesos y calidad, y da el visto bueno (firma digital o confirmación en la app del conductor).
6.  **`FACTURADO` (Finanzas):** ESTE ES EL ÚNICO MOMENTO DONDE SE GENERA LA FACTURA FINAL. Un Trigger en Supabase o un Edge Function debe tomar el pedido en estado `ENTREGADO_CON_ACEPTACION`, consolidar los pesos reales y generar el documento fiscal y contable final.

*Seguridad:* Ningún pedido puede saltarse un paso. La facturación temprana está estrictamente prohibida en este flujo.
