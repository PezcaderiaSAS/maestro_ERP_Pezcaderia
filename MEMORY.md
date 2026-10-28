# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-28 - SDD v3.0)
- **Estado Global:** Dark Glassmorphism V8 (`#070A10`), retícula 8px, composite GPU 120 FPS.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Vitest 100% verde (50/50 en SPEC-040, 1.183 tests acumulados en 181 suites).
- **Multi-Tenant & Ferretería Josase:** Catálogo real de 5.351 ítems y 9.550 clientes dimensionado a escala 3X (16.053 ítems, 30.000 clientes) bajo arquitectura IndexedDB segregada (`PezcaderiaERP_{tenantId}`).
- **Cero-Latencia Off-Thread:** Web Worker nativo de búsqueda difusa sub-2ms y virtualización headless DOM ligera (`useVirtualGrid`).
- **Precios Diferenciales & Cotizaciones B2B:** Motor `differentialPricingService`, `b2bQuotationService` y mesa de cotizaciones con conversión atómica a preventa POS y reserva de stock (`Hard-Hold`).
- **UltraAdmin Global:** `pezcaderia.2022@gmail.com` con GOD_MODE irrestricto, bypass de RLS y conmutación en 1 toque.

## Módulos y Especificaciones Certificadas
1. **SPEC-035 (AUTENTICACIÓN OAUTH 2.0, ONBOARDING Y ROLES RBAC) ✅ COMPLETADA**
2. **SPEC-036 (GESTIÓN DE USUARIOS, ONBOARDING & MULTI-EMPRESA) ✅ COMPLETADA**
3. **SPEC-037 (PREVENTAS MULTIVENDEDOR, KANBAN CAJA ÚNICA Y DESPACHO VERIFICADO) ✅ COMPLETADA**
4. **SPEC-038 (ERGONOMÍA UX Y OPTIMIZACIÓN LAPTOP 1366x768) ✅ COMPLETADA**
5. **SPEC-039 (CALIDAD FRONTEND, WCAG AAA Y E2E MULTIVENDEDOR) ✅ COMPLETADA**
6. **SPEC-040 (CERO-LATENCIA CATÁLOGOS MASIVOS & PRECIOS B2B) ✅ COMPLETADA (7/7 Tareas - 100%):**
   - `TASK-040-01` a `TASK-040-07` certificadas con TDD, benchmarks 3X y bucle Chrome DevTools (0 errores JS, vista 375px/1280px).

## Cola de Tareas Pendientes para Próxima Sesión tras `git pull` (WIP = 1)
1. **SPEC-041 (INICIO INMEDIATO POST-PULL): Sincronización Bidireccional Supabase <-> IndexedDB (Outbox Worker Resiliente)**:
   - Tarea 1: Esquemas Zod y validadores de deltas de sincronización (`deltaSync.schema.ts`).
   - Tarea 2: Manejador de conflictos OCC (Optimistic Concurrency Control) en `useOutboxSyncStore`.
   - Tarea 3: Web Worker en background para transmisión en lotes de 500 registros sin bloqueo de UI.

## Despliegue a Producción (Vercel & Supabase)
- **Vercel (Frontend SPA):** [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). Despliegue activo con guardia de autenticación, Login Dual OAuth/Email, Onboarding corporativo y 0 errores en consola JS.
- **Supabase (Backend PostgreSQL):** Proyecto activo (`gmvdrbtnogxafamdjzat`). Auth GoTrue & Postgres Pooler 100% conectados.
- **Validación Swarm & Harness²:** Arquitectura auditada y certificada con bucle DevTools en Desktop (1280x800) y Móvil (375x667).
