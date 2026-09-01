---
name: pos-cash
description: Motor de Punto de Venta (POS), control de arqueos de caja ciega, turnos de cajeros y tesorería.
---

# Workflow: /pos-cash

Activa y ejecuta las directrices de la skill `erp-pos-cash-engine` ubicada en `.agents/skills/erp-pos-cash-engine/SKILL.md`.

## Objetivo
Implementar, refactorizar o validar el motor de POS, control de aperturas/cierres de turnos, arqueos de caja ciega y múltiples medios de pago.

## Pasos de Ejecución
1. **Validar Estado del Turno de Caja**:
   - Asegurar que no existan operaciones de venta sin un turno `cash_shift` con estado `'open'`.
2. **Implementar Flujo de Caja Ciega**:
   - En el cierre de turno, ocultar el saldo teórico y solicitar el conteo físico de billetes, monedas y vouchers.
3. **Calcular Descuadre y Notificar**:
   - Registrar la diferencia atómicamente con nota de auditoría.
4. **Validar Comprobantes y Tickets**:
   - Generación de tickets PDF e impresión térmica en el navegador (`jspdf`).
