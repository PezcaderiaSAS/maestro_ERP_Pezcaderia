# Lista de Tareas Atómicas de Implementación: SPEC-049
## Optimización Extrema de Rendimiento en Localhost, Purga Automática Local/Remota y Catálogo Ligero de Desarrollo

- **Código:** SPEC-049
- **Fase:** Spec Kit SDD v3.0 — `/speckit.tasks`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto (RED -> GREEN -> REFACTOR).
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

### Tablero Kanban de Implementación (Límite WIP = 1)

```
┌──────────────────────────────────────┬──────────────────────────────────────┬──────────────────────────────────────┐
│         EN PROCESO (WIP = 1)         │              POR HACER               │              TERMINADO               │
├──────────────────────────────────────┼──────────────────────────────────────┼──────────────────────────────────────┤
│ 📋 TASK-049-06: Verificación & QG    │ --- (Cola vacía)                     │ ✅ TASK-049-01: Dataset Semilla      │
│    DevTools Loop & Documentación     │                                      │    Ligero & Esquemas Zod             │
│                                      │                                      │ ✅ TASK-049-02: Servicio Purga Local │
│                                      │                                      │    y Resiembra Atómica               │
│                                      │                                      │ ✅ TASK-049-03: Desacople Josase     │
│                                      │                                      │    en Login & Catálogo Ligero        │
│                                      │                                      │ ✅ TASK-049-04: Script SQL Supabase  │
│                                      │                                      │    RPC Purga Transaccional           │
│                                      │                                      │ ✅ TASK-049-05: Botón Topbar Purga   │
│                                      │                                      │    y Modal SweetAlert2               │
└──────────────────────────────────────┴──────────────────────────────────────┴──────────────────────────────────────┘
```

---

### Desglose Detallado de Tareas Atómicas

#### ✅ `TASK-049-01`: Dataset Semilla Ligero Canónico (`seedLightData.ts`) y Esquemas Zod (`purgeConfig.schema.ts`) [COMPLETADA]
- **Objetivo:** Definir el catálogo semilla ultraligero (< 12KB) con 25 productos (pescados, mariscos, ferretería base) y 10 clientes representativos con perfiles de precio (DETAL, RESTAURANTE, MAYORISTA). Validar opciones de purga con esquemas Zod.
- **Archivos creados:**
  - `src/data/seedLightData.ts` (25 productos, 10 clientes canónicos, stock inicial, < 12KB)
  - `src/schemas/purgeConfig.schema.ts` (esquema Zod de purga)
  - `src/tests/seedLightData.test.ts` (4/4 tests pasando)
- **Criterio de Aceptación:** 100% tipado estricto, 0 errores `tsc`, tamaño de memoria < 15KB. [CUMPLIDO]

---

#### ✅ `TASK-049-02`: Servicio Central de Purga y Resiembra Atómica (`databasePurgeService.ts`) [COMPLETADA]
- **Objetivo:** Implementar la lógica atómica de purga en el navegador: vaciado de `IndexedDB` (`PezcaderiaERP_${tenantId}` y `pezcaderia_outbox_db`), limpieza selectiva de `localStorage` y reinicio inmediato de `useClientStore` y `useInventoryStore` con los datos de `seedLightData`.
- **Archivos creados:**
  - `src/services/databasePurgeService.ts`
  - `src/tests/databasePurgeService.test.ts` (4/4 tests pasando)
- **Criterio de Aceptación:** La función `purgeLocalDatabase()` se ejecuta en < 60ms y deja los stores con exactamente 25 productos y 10 clientes limpios. [CUMPLIDO]

---

#### ✅ `TASK-049-03`: Desacoplamiento de Carga Pesada en `ferreteriaJosaseService.ts`, `LoginView.tsx` y `useAuthStore.ts` [COMPLETADA]
- **Objetivo:** Eliminar la importación obligatoria síncrona de los 8.5MB de JSON en el login y arranque. Dejar `seedLightData` como catálogo inicial por defecto. Convertir la carga de los 14.901 registros de Josase en una acción manual opt-in.
- **Archivos modificados:**
  - `src/store/useAuthStore.ts` (eliminada llamada automática en switchTenant)
  - `src/views/auth/LoginView.tsx` (login demo Josase usa inicialización ligera en ~15ms)
  - `src/components/layout/EnterpriseTopbar.tsx` (alternador de empresa usa catálogo ligero instantáneo)
  - `src/tests/decoupleHeavyJosase.test.ts` (2/2 tests pasando)
- **Criterio de Aceptación:** El login 1-clic y el arranque en `localhost:3000` tardan menos de 150ms sin congelar la pantalla. [CUMPLIDO]

---

#### ✅ `TASK-049-04`: Script SQL RPC de Purga Transaccional en Supabase (`42_rpc_purge_tenant_data.sql`) [COMPLETADA]
- **Objetivo:** Crear la función PL/pgSQL `rpc_purge_tenant_data(p_tenant_id)` con `SECURITY DEFINER` y transaccionalidad segura para purgar prefacturas, movimientos, clientes y productos de prueba en el backend remoto sin romper integridad referencial.
- **Archivos creados:**
  - `database/42_rpc_purge_tenant_data.sql` (función transaccional con control de cascada e informes de filas eliminadas)
  - Integrado y probado en `src/services/databasePurgeService.ts` con tolerancia offline-first
- **Criterio de Aceptación:** La llamada RPC limpia las tablas del tenant en una sola transacción atómica. [CUMPLIDO]

---

#### ✅ `TASK-049-05`: Botón de Reset y Purga Rápida en `EnterpriseTopbar.tsx` y Modal SweetAlert2 [COMPLETADA]
- **Objetivo:** Integrar en el header de la aplicación un botón accesible y elegante con icono de escoba/refresh (`Dark Glassmorphism`). Al hacer clic, solicitar confirmación con SweetAlert2 y ejecutar la purga completa local + remota con feedback visual.
- **Archivos modificados y creados:**
  - `src/components/layout/EnterpriseTopbar.tsx` (botón `#topbar-btn-purge-db` y modal interactivo SweetAlert2)
  - `src/tests/purgeTopbarButton.test.tsx` (3/3 tests pasando)
- **Criterio de Aceptación:** El botón se renderiza perfectamente, el modal informa claramente los alcances y la purga se completa en < 60ms. [CUMPLIDO]

---

#### 📋 `TASK-049-06`: Verificación Integral E2E, Quality Gate & Bucle DevTools
- **Objetivo:** Validar la suite completa de pruebas de regresión, verificar compilación TypeScript estricta (`node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`), empaquetado de producción Vite, y auditar con DevTools (1280px / 375px) asegurando 0 errores en consola y 60 FPS estables.
- **Archivos a verificar:**
  - Suite completa de tests Vitest
  - Auditoría de consola JS en navegador
- **Criterio de Aceptación:** 100% tests verdes, 0 errores `tsc`, Cold Start < 200ms.
