---
name: software-systems-engineer
description: Ingeniero de sistemas y arquitecto integral de software para SaaS, ERP, WMS y CRM, garantizando consistencia, modularidad, patrones de diseño de clase mundial y escalabilidad.
---

# Ingeniero de Software — Skill de Especialista

Esta skill especializada conecta directamente con la base de conocimiento oficial del notebook en Google NotebookLM y establece las directrices técnicas, patrones de diseño y estándares de ingeniería para **La Pezcaderia ERP**.

> **Fuente Oficial de Verdad (NotebookLM):**  
> **Notebook:** `Ingeniero de Software`  
> **Notebook ID:** `77754a0d-dff3-464f-84bc-e8c66316a406`  
> **URL Oficial:** [https://notebook.google.com/notebook/77754a0d-dff3-464f-84bc-e8c66316a406](https://notebook.google.com/notebook/77754a0d-dff3-464f-84bc-e8c66316a406)  
> **Comando de Consulta Rápida:**  
> `nlm query 77754a0d-dff3-464f-84bc-e8c66316a406 "<tu consulta técnica>"`

---

# Arquitectura Core para SaaS, ERP, WMS y CRM

Este documento establece los principios de diseño de sistemas, modelado de dominio y patrones arquitectónicos para aplicaciones empresariales de misión crítica.

---

## 1. Patrones de Multi-Tenancy (Multi-inquilino)

En sistemas B2B (SaaS, ERP, WMS, CRM), cada cliente (empresa u organización) es un *Tenant*. Existen 3 enfoques principales:

### Comparativa de Enfoques

| Estrategia | Aislamiento | Coste de Infraestructura | Complejidad de Migraciones | Recomendación para Coste $0 |
|---|---|---|---|---|
| **Database-per-tenant** | Máximo (físico) | Alto (requiere múltiples instancias o conexiones DB) | Alta (ejecutar N migraciones) | No recomendada para etapa inicial |
| **Schema-per-tenant** | Medio-Alto (lógico) | Medio (una sola DB, esquemas separados en Postgres) | Media (migrar esquema por esquema) | Viable para hasta 100-200 clientes |
| **Shared Database + Row-Level Security (RLS)** | Alto (garantizado por el kernel de Postgres) | Mínimo (1 sola base de datos, 1 conjunto de tablas) | Mínima (1 sola migración global) | **⭐ Elección Ganadora para Coste $0** |

### Implementación de Row-Level Security (RLS) en PostgreSQL
Todas las tablas del negocio (`invoices`, `products`, `inventory_items`, `customers`, `leads`) deben incluir la columna:
```sql
tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
```

Activación y política estricta en PostgreSQL:
```sql
-- 1. Habilitar RLS en la tabla
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

-- 2. Crear política vinculada a la variable de sesión
CREATE POLICY tenant_isolation_policy ON products
FOR ALL
USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
```

En cada petición HTTP, el middleware de backend extrae el `tenant_id` del token JWT verificado y lo inyecta en la conexión:
```sql
SET LOCAL app.current_tenant_id = 'e7b0c950-8912-4c6e-8267-33b669f5bc01';
```
Cualquier consulta posterior (`SELECT * FROM products`) solo devolverá filas del tenant actual, incluso si el desarrollador olvida el `WHERE tenant_id = ...`.

---

## 2. Patrones Específicos por Dominio

### A. ERP: Contabilidad por Partida Doble (Double-Entry Bookkeeping)
Un ERP financiero nunca actualiza balances sobrescribiendo números con `UPDATE accounts SET balance = balance + 100`.
- **Inmutabilidad absoluta**: Solo se insertan asientos (`journal_entries`) con sus líneas (`journal_lines`).
- **Regla de oro de partida doble**: Para cada transacción, la suma de los débitos DEBE ser exactamente igual a la suma de los créditos:
  $$\sum \text{Débitos} = \sum \text{Créditos}$$
- **Estados de Factura**: `DRAFT` $\to$ `VALIDATED` (asiento generado) $\to$ `PAID` / `CANCELLED` (mediante nota de crédito, nunca borrando la factura).

### B. WMS (Warehouse Management System): Consistencia de Inventario
El mayor error en un WMS es la inconsistencia de stock (vender producto que no existe o crear stock negativo).
- **Modelo de 3 Capas de Stock**:
  1. `Stock Físico (On-hand)`: Lo que está físicamente en las estanterías del almacén.
  2. `Stock Reservado (Allocated)`: Lo comprometido en pedidos pendientes de picking.
  3. `Stock Disponible (Available)`: $\text{Físico} - \text{Reservado}$.
- **Transacciones con Bloqueo Pesimista**:
  Para evitar condiciones de carrera (dos órdenes concurrentes reservando el último ítem):
  ```sql
  -- Bloquea la fila del SKU hasta que termine la transacción
  SELECT id, available_quantity 
  FROM inventory_stocks 
  WHERE warehouse_id = :w_id AND sku_id = :sku_id 
  FOR UPDATE;
  ```
- **Kardex (Trazabilidad Total)**: Toda modificación de inventario debe originar un registro en el historial (`inventory_transactions` o Kardex) con: `tipo_movimiento` (RECEPCION, DESPACHO, AJUSTE, TRASLADO), `lote`, `fecha_vencimiento` y `usuario_id`.

### C. CRM: Ciclo de Vida del Lead y Oportunidades
- **Pipeline de Ventas**: Modelo basado en etapas (`stages`) con probabilidades porcentuales de cierre.
- **Auditoría de Actividades**: Modelo polimórfico de interacciones (`calls`, `meetings`, `notes`, `emails`) enlazadas a un `lead_id` o `company_id`.
- **Deduplicación**: Índices únicos condicionales sobre `(tenant_id, LOWER(email))` o normalización de teléfonos con biblioteca `phonenumbers`.

### D. SaaS: Gestión de Tenants y Suscripciones
- **Feature Flags y Tiers**:
  Definir límites en la tabla `tenants` o `subscriptions`:
  ```json
  {
    "plan": "starter",
    "max_users": 5,
    "max_warehouses": 1,
    "features": ["basic_reports", "inventory_tracking"]
  }
  ```
- **Manejo de Roles (RBAC)**:
  - `SuperAdmin` (Dueño del SaaS).
  - `TenantAdmin` (Administrador de la empresa cliente).
  - `WarehouseOperator` / `SalesAgent` / `Accountant` (Roles operativos restringidos).

---

## 3. Máquinas de Estado Finitas (Finite State Machines - FSM)
Para evitar que un pedido, factura o guía de despacho salte a estados ilegales (ej. pasar de `CANCELADO` a `ENVIADO`):
- Definir transiciones permitidas explícitamente en el código de backend (usando Enum o librerías tipo `transitions` o State Machine pattern).
- Cada transición debe disparar eventos de dominio (ej. `OrderPlacedEvent` $\to$ reserva inventario en WMS $\to$ genera borrador de factura en ERP $\to$ notifica al cliente por email).


---

## Directrices de Implementación para el Agente

1. **Consulta Previa Obligatoria:** Cuando se realicen tareas vinculadas a este dominio, utiliza la CLI `nlm query 77754a0d-dff3-464f-84bc-e8c66316a406` para verificar mejores prácticas antes de proponer cambios estructurales.
2. **Modularidad Estricta:** El código debe ser modular, desacoplado y con tipos estrictos en TypeScript o Python.
3. **Inmutabilidad:** Toda mutación de estado debe generar nuevas copias de objetos; nunca mutar arreglos o estados en caliente.
4. **Verificación:** Ejecuta las pruebas automatizadas asociadas (`npm run test:run` o tests unitarios) tras cada modificación.
