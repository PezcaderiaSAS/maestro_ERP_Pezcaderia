# odoo18-architecture

**Description:** Arquitectura lógica global, ORM, seguridad y patrones de diseño de Odoo 18. Úsala como base conceptual para diseñar la estructura del sistema.

## Instrucciones

1. **Patrón MVC y Modelos de Datos**:
   - Analiza los patrones de diseño del ORM de Odoo 18 (e.g., herencia por prototipo/delegación, campos calculados con dependencias `depends`, restricciones `@constrains`).
   - Adapta el diseño relacional a un esquema compatible con TypeScript y persistencia en `localDb.ts`.
   - Separa la lógica de negocio (servicios/hooks) de la interfaz de usuario (views/components).

2. **Seguridad y Control de Acceso**:
   - Adopta el concepto de Access Rights (permisos CRUD por modelo/rol) y Record Rules (reglas de dominio para filtrar filas basadas en el contexto del usuario, ej. el rol de cajero vs. jefe de bodega).
   - Asegura la aplicación consistente de estos permisos en todos los puntos de entrada de datos (POS, inventario, reportes).

3. **Ciclo de Vida y Estados de Documentos**:
   - Todos los documentos principales (órdenes de compra, pedidos, traslados) deben tener un campo de estado (`state`) explícito que gobierne sus transiciones permitidas (máquina de estados).
   - Registra siempre un historial/logs de cambios (kardex/auditoría) para cada transición de estado o modificación crítica.

4. **Reglas de Negocio Adaptadas**:
   - No generes código nativo de Odoo ni dependencias. Traduce los conceptos de Odoo 18 a la arquitectura actual de React, TypeScript y persistencia local del ERP.
