# Contexto de Negocio: B2B y Ventas Externas

Cuando se invoque el contexto B2B, aplica estrictamente las siguientes reglas de negocio para la generación de código y bases de datos en Supabase:

*   **Rol del Vendedor Externo:** El vendedor opera en campo (Ruta T-a-T o HORECA). Su interfaz en React debe ser mobile-first, rápida y offline-capable en la medida de lo posible.
*   **Creación de Pedidos (Estado Inicial):** Los pedidos creados por el vendedor nacen con el estado `PRE_ORDEN`. 
*   **Cantidades Estimadas:** Los valores monetarios y los pesos en esta etapa son *estimaciones* (Catch Weight). El vendedor selecciona "unidades" o "cajas", pero el precio final depende del peso exacto que se confirmará después en bodega.
*   **Validación de Cartera:** Antes de permitir la creación de la `PRE_ORDEN`, el sistema debe consultar en Supabase si el cliente tiene facturas con más de 60 días de mora. Si es así, bloquear la orden o requerir autorización.
*   **Precios Dinámicos:** Los precios a renderizar deben respetar las listas de precios asignadas al cliente B2B específico (ej. precio por volumen o posiciones fijas).
