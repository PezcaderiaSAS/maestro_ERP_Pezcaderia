---
name: erp-pos-cash-engine
description: Motor de Punto de Venta (POS), control de arqueos de caja ciega, turnos de cajeros, conciliación de medios de pago múltiples y tesorería en MaestroPescaderia ERP.
---

# ERP POS & Cash Treasury Engine Skill

Esta skill define la arquitectura, reglas de negocio y flujos de control para el **Punto de Venta (POS)**, manejo de efectivo, **arqueo de caja ciega**, control de turnos y conciliación de tesorería en **MaestroPescaderia ERP**.

---

## 1. Principios de Seguridad y Auditoría de Caja

1. **Arqueo de Caja Ciega (Blind Cash Count)**:
   - Al momento del cierre de turno, el cajero **NO debe ver** el total esperado por el sistema.
   - El cajero ingresa el desglose físico real de billetes y monedas (denominaciones: $100.000, $50.000, $20.000, $10.000, etc.) y totales de vouchers datáfono/transferencias.
   - El sistema calcula la diferencia ($\text{Diferencia} = \text{Efectivo Declarado} - \text{Efectivo Teórico}$), registrando si hay sobrante o faltante con justificación obligatoria.

2. **Control Estricto de Turnos y Aperturas**:
   - Una caja solo puede tener **un turno abierto** a la vez por usuario.
   - Monto base inicial de caja registrado y firmado electrónicamente.
   - Registro atómico de movimientos de entrada/salida de efectivo extraordinarios (ej. pago a proveedores menores, retiros parciales de seguridad).

3. **Medios de Pago Múltiples (Split Payment)**:
   - Una misma venta puede dividirse en efectivo, transferencia (Nequi/Daviplata/Bancolombia), tarjeta de crédito/débito y crédito a cliente B2B.

---

## 2. Modelado de Datos para Turnos y Arqueos

```sql
-- Sesiones de caja / Turnos
CREATE TABLE cash_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  initial_amount NUMERIC(12,2) NOT NULL DEFAULT 0.0,
  expected_cash NUMERIC(12,2),
  declared_cash NUMERIC(12,2),
  difference NUMERIC(12,2),
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed', 'audited'
  notes TEXT,
  breakdown JSONB DEFAULT '{}'::jsonb -- Desglose de billetes y vouchers
);

-- Movimientos de caja (ingresos / egresos directos)
CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES cash_shifts(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL, -- 'inflow', 'outflow'
  amount NUMERIC(12,2) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'base_inicial', 'retiro_seguridad', 'gasto_menor', 'venta_pos'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. Checklist de Implementación POS & Tesorería

- [ ] ¿El frontend bloquea cualquier venta si no hay un turno de caja abierto para el cajero actual?
- [ ] ¿El modal de cierre de caja oculta el saldo teórico hasta que el usuario confirme el conteo físico?
- [ ] ¿Los pagos con tarjeta o transferencia exigen número de comprobante o referencia bancaria para conciliación?
- [ ] ¿Los tickets de venta en PDF/impresión térmica se generan en el cliente mediante `jspdf` sin consumir cuotas de servidor?
