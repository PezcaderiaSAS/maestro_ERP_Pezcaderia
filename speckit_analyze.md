# Speckit Analyze: Reporte de Consistencia y Alineación Cruzada

**Fecha:** 2026-07-04 | **Estado:** Control de Calidad 2 completado

---

## ✅ HALLAZGOS POSITIVOS (Alineación Confirmada)

### 1. `categoriaABC` ya existe en el modelo
> `src/types/inventory.types.ts` línea 16 ya contiene el campo `categoriaABC?: 'A' | 'B' | 'C'`.

**Impacto en Plan:** La tarea 1.3 (función RPC `calculate_abc_inventory`) solo necesita **actualizar** ese campo, NO crear columna nueva en la BD. La tarea 4.3 de UI ya tiene el binding listo. ✅

### 2. `LineaPedido` ya tiene campos de parcialidad
> `src/types/orders.types.ts` línea 15-16 ya tiene `cantidadSolicitada` y `cantidadAlistada`.

**Impacto en Plan:** La tarea 1.2 (ALTER TABLE `order_items`) es redundante para los tipos TypeScript — el tipo ya lo soporta. Sin embargo, **la BD de Supabase puede no tenerlos**. SQL sigue siendo necesario para sincronizar el esquema remoto.

### 3. `EstadoPedido` cubre el flujo de despacho
> Incluye `EN_ALISTAMIENTO`, `EN_DESPACHO`, `ENTREGADO`, `PAUSADO_POR_CREDITO`, `ANULADO`. Cubre el happy path de despacho parcial sin cambio de tipo.

### 4. `TipoMovimientoCaja` cubre los ajustes de cierre
> `AJUSTE_SOBRANTE` y `AJUSTE_FALTANTE` ya existen en `cash.types.ts`. El hook del cierre de turno en `cashService.ts` tiene la semántica correcta.

---

## 🚨 FISURAS CRÍTICAS (Bloqueadoras)

### FISURA 1 — Falta `branch_id` en los tipos existentes

**Problema:** El plan (task 1.4) define una política RLS que filtra por `branch_id` en la tabla `orders`, pero ni `Pedido` (orders.types.ts) ni `TurnoCaja` (cash.types.ts) tienen el campo `branch_id`.

**Impacto:** La suscripción Realtime y la política RLS no tendrán nada sobre qué filtrar. Las tasks 3.2 y 1.4 fallarán en ejecución.

**Corrección requerida (Tarea nueva: 0.1):**
Agregar `branch_id: string` a los tipos `Pedido`, `TurnoCaja` y `MovimientoCaja` antes de ejecutar cualquier script SQL o migración de Supabase.

---

### FISURA 2 — `useOrderStore.ts` no expone método de suscripción Realtime

**Problema:** El plan (task 3.2) asume que se añadirá Supabase Realtime al store, pero el store actual usa `localStorage` (`localDb`) como fuente de verdad, no Supabase. No existe `supabaseClient` importado en ningún store.

**Corrección requerida (Tarea nueva: 0.2):**
Verificar si existe `/src/lib/supabaseClient.ts`. Si no existe, crearlo. Definir la estrategia de sincronización: ¿LocalStorage como caché + Supabase como fuente de verdad remota, o migración completa?

---

### FISURA 3 — `ledger_entries` necesita constraint de integridad a nivel SQL

**Problema:** El Plan dice "Regla de Integridad en Aplicación", pero si alguien llama directamente a Supabase (REST/Admin), puede romper la partida doble. En contabilidad real, esta validación **debe estar en la BD mediante un trigger PostgreSQL**.

**Corrección requerida (Mejora en task 1.1):**
Agregar función trigger SQL que rechace asientos donde `SUM(debit) ≠ SUM(credit)` por `reference_id`.

---

### FISURA 4 — `task.md` no incluye migración del catálogo de cuentas inicial (Seed Data)

**Problema:** La tabla `accounts` estará vacía al crearse. El sistema no puede mapear categorías ("Pago Arriendo" → cuenta 5105) sin un catálogo inicial precargado. El UX "a prueba de tontos" depende completamente de este seed.

**Corrección requerida (Tarea nueva: 1.6):**
Crear script SQL de datos iniciales (seed) para la tabla `accounts` con el Plan de Cuentas simplificado en español colombiano (PUC básico). Ej: 1105 Caja, 1110 Banco, 4135 Ventas, 5105 Gastos Operativos.

---

## ⚠️ ADVERTENCIAS (No Bloqueadoras)

### ADVERTENCIA 1 — `DispatchView.tsx` no tiene tarea en Task.md
El plan menciona `DispatchView.tsx` como módulo nuevo, pero `task.md` no tiene una tarea explícita para crearlo.

### ADVERTENCIA 2 — Falta implementación de soft-delete en ledger
El checklist exige que los asientos no puedan eliminarse sin rastro, pero no existe tarea correspondiente en `task.md`.

---

## 📋 PLAN DE CORRECCIONES

| # | Acción | Tipo | Impacto |
|---|--------|------|---------|
| 0.1 | Agregar `branch_id` a tipos `Pedido`, `TurnoCaja`, `MovimientoCaja` | **BLOQUEADOR** | Habilita RLS y Realtime |
| 0.2 | Verificar/Crear `supabaseClient.ts` y definir estrategia offline/online | **BLOQUEADOR** | Habilita todos los stores con Supabase |
| 1.1b | Agregar trigger SQL de validación de balance contable | Mejora crítica | Garantiza integridad partida doble |
| 1.6 | Script SQL de Seed Data para catálogo de cuentas (PUC básico) | **BLOQUEADOR** | Sin esto, el UX simplificado no funciona |
| 4.4 | Añadir tarea para crear `DispatchView.tsx` | Mejora | Completa el módulo de despachos |

---

> [!IMPORTANT]
> **Aprobación Requerida:**
> Se encontraron **4 fisuras críticas** (3 bloqueadoras). Aprueba este reporte para ajustar
> el `task.md` con las correcciones antes de iniciar ejecución de código.
