---
name: loyalty-logic-base
description: Lógica de negocio y arquitectura de promociones y lealtad basada en Odoo 18. Úsala para diseñar el motor de promociones.
---

# Habilidad Conceptual: loyalty-logic-base

Esta habilidad establece las directrices lógicas y arquitectónicas para diseñar e integrar un motor de promociones, descuentos y lealtad en la aplicación, tomando como referencia el diseño funcional de Odoo 18 y el repositorio OCA sale-promotion (https://github.com/OCA/sale-promotion).

## Principios de Diseño
1. **Reglas Condicionales (Compra Conjunta / "Buy X Get Y")**:
   - Capacidad de definir reglas basadas en combinaciones de productos (p. ej., comprar un producto de categoría A y recibir un descuento o regalo de categoría B).
   - Umbrales mínimos de cantidad o monto para activar beneficios.
2. **Exclusividad Mutua**:
   - Control de compatibilidad entre promociones (p. ej., "no acumulable con otros descuentos o cupones").
   - Jerarquía y orden de aplicación de reglas de descuento.
3. **Límites de Ámbito**:
   - Límites de uso por usuario (clientes finales o B2B) y por vendedor.
   - Presupuesto máximo asignado a la promoción.
4. **Soporte de Múltiples Regalos**:
   - Reglas que permiten la adición de productos de regalo con costo $0 en el carrito de compras de manera automática o sugerida.
5. **Trazabilidad e Historial sin Envío Automático**:
   - Guardar todo cambio de estado, aplicación de descuento e historial de actividades en una bitácora o historial de logs en el backend/DB.
   - Evitar estrictamente el envío automatizado de correos electrónicos no solicitados a clientes o administradores durante la aplicación de promociones.

## Adaptación al Proyecto Actual
- Integración en la capa de servicios de la aplicación (Typescript/React) y persistencia a través del servicio unificado de `localDb.ts`.
- Lógica desacoplada del framework nativo de Odoo; adaptada a los flujos y modelos del ERP actual.
