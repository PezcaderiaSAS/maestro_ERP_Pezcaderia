# Especificación Técnica: Enterprise Hardening & Performance Architecture

**ID:** `SPEC-004-ENTERPRISE-HARDENING`  
**Estado:** `Aprobado (Post-Interview /grill-me)`  
**Fecha:** 30 de Septiembre de 2026  
**Dominio:** Seguridad, Cumplimiento Legal (Habeas Data), Rendimiento de Base de Datos y Arquitectura Frontend  

---

## 1. Contexto y Objetivos

A partir de la auditoría técnica exhaustiva del sistema ERP/WMS/POS, se identificaron cuatro falencias críticas que vulneran la seguridad operativa, la validez probatoria legal y la escalabilidad del sistema bajo alta concurrencia. 

Esta especificación establece los requisitos funcionales, contratos de datos y arquitectura de solución acordados para la remediación integral.

---

## 2. Requisitos y Especificaciones Técnicas

### 2.1 Requisito 1: Erradicación de Puertas Traseras y Autorización Criptográfica
- **Problema Actual:** `database/26_operational_flows_guards.sql` y componentes de vista (`InventoryView.tsx`, `ArqueoCajaModal.tsx`) autorizan mermas >35%, omisión FEFO y arqueos usando el PIN hardcodeado `'1234'`, `'4321'` o cadenas `'admin'`/`'super'`.
- **Comportamiento Esperado:**
  1. Se eliminan todas las referencias a `'1234'`, `'4321'`, `'admin'` y `'super'` del código fuente y de los procedimientos almacenados en SQL.
  2. La autorización para operaciones críticas se valida en la RPC de Supabase mediante el contexto de sesión autenticado (`auth.uid()`).
  3. Se verifica que el usuario autenticado posea el rol `SUPERVISOR` o `ADMIN` en la tabla de asignación de roles o claims del JWT (`app_metadata.role`).
  4. Si un operador sin rol privilegiado intenta ejecutar la operación, la RPC aborta con el código de error `ERR_SUPERVISOR_REQUIRED` (código SQLSTATE `P0001`).
  5. Todo intento de autorización registra un evento inmutable en `auditoria_operaciones` con ID de usuario, IP, sucursal y payload.

---

### 2.2 Requisito 2: Persistencia Legal Inmutable de Consentimiento (Ley 1581)
- **Problema Actual:** El consentimiento para el tratamiento de datos personales se almacena únicamente en `localStorage` (`erp_habeas_data_consent`), careciendo de validez probatoria ante auditorías de la SIC o reclamos de privacidad.
- **Comportamiento Esperado:**
  1. **Modelo de Datos en Supabase:**
     ```sql
     CREATE TABLE public.legal_consents_audit (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
       empresa_id UUID NOT NULL REFERENCES public.empresas(id),
       user_id UUID NOT NULL REFERENCES auth.users(id),
       regulation VARCHAR(100) NOT NULL DEFAULT 'Ley 1581 de 2012 / RGPD',
       version_politica VARCHAR(50) NOT NULL,
       status VARCHAR(20) NOT NULL CHECK (status IN ('ACEPTADO', 'REVOCADO')),
       ip_address VARCHAR(45),
       user_agent TEXT,
       accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       metadata JSONB DEFAULT '{}'::jsonb
     );
     ```
  2. **Políticas RLS:** Solo inserciones autenticadas para el propio `user_id`. Modificaciones (`UPDATE`/`DELETE`) estrictamente bloqueadas.
  3. **Comportamiento en Frontend:** `ConsentGateModal.tsx` consulta si el usuario activo tiene un registro de consentimiento para la versión vigente de la política (`v1.0.0-enterprise`). Al aceptar, realiza un `insert` en `legal_consents_audit` y actualiza la caché local en `localStorage` para evitar latencia en cargas subsecuentes de la SPA.

---

### 2.3 Requisito 3: Optimización de Base de Datos (UUIDv7 & Prevención de Deadlocks)
- **Problema Actual:**
  - Uso extendido de `uuid_generate_v4()`, generando dispersión aleatoria en árboles B-Tree y degradación de I/O en tablas de alto volumen (ventas, kardex, auditoría).
  - Bloqueos pesimistas en bucles procedimentales (`FOR item IN ... LOOP SELECT ... FOR UPDATE; UPDATE ...; END LOOP;`) que serializan transacciones y causan deadlocks cuando dos cajas facturan artículos compartidos simultáneamente.
- **Comportamiento Esperado:**
  1. **Generador UUIDv7 (Estándar IETF RFC 9562):** Implementación de una función nativa en PostgreSQL `uuid_generate_v7()` basada en timestamp Unix milisegundos (48 bits) + entropía aleatoria (74 bits), garantizando orden cronológico monotónico.
  2. **Bloqueo en Bloque Ordenado:**
     - En lugar de iterar con `FOR UPDATE` fila por fila, las RPCs de despacho y facturación POS deben ordenar los IDs de los productos antes de adquirir el bloqueo:
       ```sql
       -- Bloqueo atómico ordenado para prevenir deadlocks
       SELECT producto_id, cantidad 
       FROM public.stock_bodegas
       WHERE bodega_id = v_bodega_id 
         AND producto_id = ANY(v_productos_ids_ordenados)
       ORDER BY producto_id
       FOR UPDATE;
       ```
     - Una vez asegurado el bloqueo global del conjunto de productos, se ejecutan las deducciones de inventario de forma segura.

---

### 2.4 Requisito 4: Modernización del Frontend (Manejo de Errores y Estado Híbrido)
- **Problema Actual:**
  - `src/lib/safeApi.ts` evalúa cadenas de texto literales (`raw.includes('violates foreign key')`, `raw.includes('MERMA_EXCESIVA_SIN_PIN')`), lo que se rompe ante cambios de idioma, versiones de Postgres o mensajes del servidor.
  - La aplicación sobreutiliza 19 stores de Zustand locales para datos que corresponden a estado del servidor (Server State), arriesgando datos desincronizados y sobrecarga en memoria.
- **Comportamiento Esperado:**
  1. **Evaluación por Código de Error:**
     `safeApi.ts` debe mapear los códigos numéricos estándar de PostgreSQL / SQLSTATE y códigos de detalle de dominio:
     - `23503`: Violación de Clave Foránea.
     - `23505`: Clave Duplicada / SKU Existente.
     - `23514`: Violación de Restricción Check.
     - `42501`: Violación de Políticas RLS / Permisos Insuficientes.
     - `P0001` con `detail = 'ERR_MERMA_EXCESIVA'`: Merma > 35% requiere supervisor.
     - `P0001` con `detail = 'ERR_SUPERVISOR_REQUIRED'`: Acción restringida a supervisor.
  2. **Arquitectura Híbrida de Estado:**
     - **Zustand:** Mantenido como el motor ultrarrápido para **Client State** (carrito POS activo, inputs de balanza, filtros de UI temporales, sesión activa y cola local Outbox).
     - **TanStack Query (React Query):** Integrado como la capa de **Server State** (consultas de catálogo, inventario, clientes y órdenes con `staleTime`, revalidación inteligente en segundo plano y deduplicación de peticiones de red).

---

## 3. Criterios de Aceptación
1. Cero coincidencias en todo el repositorio para cadenas `'1234'`, `'4321'`, `'admin'` o `'super'` usadas como clave de omisión o autorización.
2. Cada aceptación de consentimiento legal queda respaldada por una fila inmutable en `legal_consents_audit` con su respectivo `user_id` y `accepted_at`.
3. Función `uuid_generate_v7()` probada y asignada por defecto a las nuevas tablas transaccionales.
4. Las pruebas de concurrencia en la RPC de ventas no generan interbloqueos (`deadlocks`) al procesar órdenes concurrentes con SKUs compartidos.
5. `safeApi.ts` gestiona errores mediante `error.code` de PostgreSQL sin fallos ante cambios en el texto del mensaje.
