# Registro de Clarificación y Calidad: /speckit.clarify (SPEC-032)

**Código:** SPEC-032  
**Fase:** /speckit.clarify (Control de Calidad 1 - SDD v3.0)  
**Ticket:** MULTIVENDOR-CASHIER-PROD-20261030  
**Fecha:** 2026-10-27  

---

## 1. Resoluciones del Protocolo `/grill-me` con el Tech Lead

| Pregunta Crítica | Alternativas Evaluadas | Decisión Aprobada | Justificación Técnica & Operativa |
| :--- | :--- | :--- | :--- |
| **1. Flujo de Caja Única y Concurrencia de 8 Equipos** | A) Cobro Autónomo Multiterminal.<br>B) **Preventa / Comanda Móvil con Cobro Central**. | **Opción B (Preventa Centralizada)** | En una tienda física con 1 sola gaveta de billetes y monedas, permitir que 8 vendedores cobren efectivo genera descontrol en arqueos ciegos. Los 8 vendedores arman preventas y el cajero principal liquida el efectivo en taquilla. |
| **2. Infraestructura de Producción (30-Oct-2026)** | A) **Vercel SPA + Supabase Cloud**.<br>B) Docker On-Premise local. | **Opción A (Vercel + Supabase)** | Cumple con la arquitectura serverless Jamstack del ERP, RLS multinivel y escalabilidad de lectura/escritura con RPCs PostgreSQL. |
| **3. Trazabilidad de Roles y Descuentos** | A) **Modal de PIN de Supervisor en Terminal**.<br>B) Bloqueo estático de interfaz. | **Opción A (PIN de Supervisor)** | Permite agilidad comercial sin que el vendedor tenga que abandonar la terminal; el administrador autoriza la excepción con registro de auditoría. |
| **4. Portal Maestro (Super Admin)** | A) Switch integrado de tenant.<br>B) **Portal Independiente `/superadmin`**. | **Opción B (Ruta `/superadmin`)** | Máximo aislamiento de privilegios. Solo el desarrollador principal y superusuario acceden con credenciales maestras para dar de alta empresas y ver métricas globales. |

---

## 2. Aportes de Agency Swarm (`SoftwareArchitect`)

1. **Control Optimista de Concurrencia (OCC):** Inclusión del campo `version` en la tabla `caja_centralizadora` para detectar y reintentar colisiones si dos transacciones concurrentes impactan el saldo al mismo milisegundo.
2. **Ordenamiento de Locks Pesimistas:** La RPC `registrar_venta_pos_concurrente` bloquea los registros de `stock` ordenando los `producto_id` de forma ascendente (`ORDER BY producto_id ASC`) para eliminar matemáticamente cualquier posibilidad de **Deadlock**.
3. **Idempotencia Transaccional:** Registro obligatorio de `idempotency_key` en memoria y persistencia para que reintentos de red por cortes intermitentes nunca dupliquen cobros ni descuentos de inventario.
