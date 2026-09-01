---
name: saas-multi-tenant-security
description: Arquitectura de seguridad multi-inquilino (Multi-Tenancy), aislamiento criptográfico con Supabase RLS, roles jerárquicos RBAC y particionado lógico en capa gratuita.
---

# SaaS Multi-Tenant Security & Isolation Skill

Esta skill define la arquitectura de **Multi-Tenancy lógico** y **Control de Acceso Basado en Roles (RBAC)** para operar múltiples sedes, empresas o franquicias en **MaestroPescaderia ERP** dentro de una única base de datos Supabase en capa gratuita.

---

## 1. Principios de Aislamiento Lógico (Multi-Tenancy)

1. **Inyección de Identidad Segura en JWT**:
   - El `tenant_id` y el `role` del usuario se almacenan en `raw_app_meta_data` dentro de `auth.users` de Supabase (inmutable desde el cliente).
   - El cliente SPA nunca puede falsificar su `tenant_id`.

2. **Políticas Row Level Security (RLS) Estrictas**:
   - Toda tabla de negocio (`products`, `orders`, `inventory_lots`, `cash_shifts`, `invoices`) debe tener habilitado RLS y una columna `tenant_id UUID NOT NULL`.
   - Las políticas RLS deben utilizar la función `current_tenant_id()` para filtrar automáticamente todas las consultas `SELECT`, `INSERT`, `UPDATE` y `DELETE`.

---

## 2. Jerarquía de Roles RBAC

| Rol | Alcance de Acceso | Permisos Clave |
| :--- | :--- | :--- |
| **`super_admin`** | Plataforma Global | Crear nuevos tenants, auditoría de cuotas y métricas globales. |
| **`company_admin`** | Tenant Completo | Configuración de empresa, maestros contables, empleados y precios. |
| **`warehouse_manager`**| WMS / Cuartos Fríos | Ingreso de lotes, despiece, mermas, transferencias y picking FEFO. |
| **`cashier_pos`** | Punto de Venta & Caja | Facturación POS, apertura y arqueo de caja ciega asignada. |
| **`accountant`** | Contabilidad & Nómina | Liquidación de nómina, estados financieros, libros auxiliares y DIAN. |

---

## 3. Plantilla DDL de Seguridad RLS

```sql
-- Función de resolución de Tenant desde JWT
CREATE OR REPLACE FUNCTION auth.tenant_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'tenant_id', '')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Trigger automático para asignar tenant_id en inserts
CREATE OR REPLACE FUNCTION set_tenant_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := auth.tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
