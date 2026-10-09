---
name: wms-cold-storage-inventory
description: Gestión avanzada de almacén (WMS), cuartos fríos, trazabilidad de lotes perecederos FEFO/FIFO, mermas de despiece y algoritmo Pareto ABC (80/20) para MaestroPescaderia ERP.
---

# WMS Cold Storage & Inventory Management Skill

Esta skill define la arquitectura técnica, reglas de negocio y patrones de implementación para el subsistema de **Warehouse Management System (WMS)** especializado en productos perecederos (pescados y mariscos), cuartos fríos y control de inventario de alta precisión en **MaestroPescaderia ERP**.

---

## 1. Fundamentos Arquitectónicos y Principios de Dominio

Basado en los principios de **System Design** y modelos de inventario para perecederos:

1. **Gestión de Lotes y Trazabilidad (Batch Tracking)**:
   - Todo ingreso a cuarto frío debe generar un `lot_number` único con:
     - `catch_date` (Fecha de captura/faena).
     - `reception_date` (Fecha de ingreso a planta).
     - `expiration_date` (Fecha límite de consumo/refrigeración).
     - `temperature_zone` (`congelado_subcero`, `fresco_hielo`, `seco`).
     - `origin_supplier_id` (Proveedor/Barco de origen).

2. **Estrategias de Despacho: FEFO > FIFO**:
   - **FEFO (First-Expired, First-Out)** es la regla mandatoria para productos frescos y refrigerados.
   - El sistema debe sugerir automáticamente los lotes más próximos a vencer en los pedidos de alistamiento (Picking).

3. **Mermas, Rendimiento y Despiece (Yield & Meat Cutting)**:
   - Transformación de materias primas (Pescado Entero $\rightarrow$ Filete + Posta + Merma/Cabeza/Espinazo).
   - Cálculo estricto de factor de conversión y merma operativa:
     $$\text{Rendimiento (\%)} = \left(\frac{\text{Peso Producto Útil (kg)}}{\text{Peso Entero Inicial (kg)}}\right) \times 100$$
     $$\text{Costo Unitario Filete} = \frac{\text{Costo Total Pescado Entero} - \text{Valor Residual Subproductos}}{\text{Peso Útil Filete (kg)}}$$

4. **Clasificación ABC (Principio de Pareto 80/20)**:
   - **Clase A**: 20% de los SKUs que representan el 80% del valor de movimiento / ventas. Conteo cíclico diario/semanal, stocks de seguridad dinámicos.
   - **Clase B**: 30% de los SKUs que representan el 15% del valor.
   - **Clase C**: 50% de los SKUs que representan el 5% del valor restante.

---

## 2. Modelado de Datos (PostgreSQL + Supabase)

### Estructura de Lotes y Ubicaciones WMS:
```sql
-- Ubicaciones físicas en planta
CREATE TABLE wms_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- ej. 'CF-01-RACK-A2'
  zone VARCHAR(30) NOT NULL, -- 'cuarto_frio_1', 'congelador_tunel', 'area_empaque'
  temp_min NUMERIC(4,1) DEFAULT -18.0,
  temp_max NUMERIC(4,1) DEFAULT -15.0,
  capacity_kg NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Lotes perecederos con trazabilidad
CREATE TABLE inventory_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  lot_number VARCHAR(100) UNIQUE NOT NULL,
  location_id UUID REFERENCES wms_locations(id),
  initial_weight_kg NUMERIC(10,3) NOT NULL,
  current_weight_kg NUMERIC(10,3) NOT NULL,
  unit_cost NUMERIC(12,2) NOT NULL,
  reception_date TIMESTAMPTZ DEFAULT now(),
  expiration_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) DEFAULT 'available', -- 'quarantine', 'available', 'reserved', 'depleted'
  metadata JSONB DEFAULT '{}'::jsonb -- Parámetros específicos de especie/talla/empaque
);

-- Índice GIN para búsquedas eficientes en metadata JSONB
CREATE INDEX idx_inventory_lots_metadata ON inventory_lots USING gin (metadata);
CREATE INDEX idx_inventory_lots_fefo ON inventory_lots (product_id, expiration_date ASC) WHERE status = 'available';
```

---

## 3. Lógica de Picking y Reserva Concurrente

Para evitar sobreventa en pedidos simultáneos:
1. **Reserva Atómica**: Al confirmar una línea de pedido B2B o alistamiento en cuarto frío, ejecutar la reserva mediante función RPC en PostgreSQL o lock transaccional (`SELECT ... FOR UPDATE`).
2. **Control de Lotes Parciales**: Si un lote no cubre la cantidad solicitada, el algoritmo de picking debe encadenar lotes bajo FEFO hasta completar el peso requerido.

---

## 4. Checklist para Implementaciones WMS

- [ ] ¿El producto maneja peso variable (`catch_weight`) o unidades fijas?
- [ ] ¿Se aplica FEFO antes de cualquier criterio de fecha de creación?
- [ ] ¿Las operaciones de despiece generan los movimientos contables de merma y stock derivado en una sola transacción ACID?
- [ ] ¿El análisis ABC se almacena en caché para evitar recalcular sumatorias pesadas en cada vista?
