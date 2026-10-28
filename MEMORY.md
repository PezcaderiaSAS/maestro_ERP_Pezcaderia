# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-28 - SDD v3.0)
- **Estado Global:** Dark Glassmorphism V8 (`#070A10`), retícula 8px, composite GPU 120 FPS.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Vitest 100% verde (1.185 tests acumulados en 181 suites).
- **Cierre de Sesión Blindado:** `MacWindowControls` desacoplado (`isAppLevel`), botón explícito en sidebar y limpieza total de tokens/sesión hacia `LoginView`.
- **Armonización UI & Cero Desbordamiento:** `lg:pl-[284px]` / `lg:pl-[88px]`, scrollWidth = clientWidth (1280px), eliminación de colores chillones en POS y Topbar.
- **Multivendedor - Caja Única (Ferretería Josase):** Barra táctil de 5 asesores de mostrador (Diego Díaz, Santiago Pallares, etc.), emisión de preventas y cobro centralizado en `PendingOrdersDrawer`.
- **UltraAdmin Global:** `pezcaderia.2022@gmail.com` con GOD_MODE irrestricto, bypass de RLS y conmutación en 1 toque.

## Módulos y Especificaciones Certificadas
1. **SPEC-035 a SPEC-039:** Autenticación OAuth, Onboarding, Multivendedor, Ergonomía Laptop, WCAG AAA.
2. **SPEC-040 (CERO-LATENCIA CATÁLOGOS MASIVOS & PRECIOS B2B) ✅ COMPLETADA (100%):**
   - Benchmarks 3X (16.000 ítems, 30.000 clientes), Web Worker sub-2ms y mesa de cotizaciones con reserva hard-hold.
3. **TASK-HOTFIX-UI-LOGOUT (CIERRE DE SESIÓN & ARMONIZACIÓN POS JOSASE) ✅ COMPLETADA:**
   - Cierre de sesión certificado en producción con Chromium DevTools, retorno a LoginView y prueba de preventas en caja única.

## Cola de Tareas Pendientes para Próxima Sesión tras `git pull` (WIP = 1)
1. **SPEC-041 (INICIO INMEDIATO POST-PULL): Sincronización Bidireccional Supabase <-> IndexedDB (Outbox Worker Resiliente)**:
   - Tarea 1: Esquemas Zod y validadores de deltas de sincronización (`deltaSync.schema.ts`).
   - Tarea 2: Manejador de conflictos OCC (Optimistic Concurrency Control) en `useOutboxSyncStore`.
   - Tarea 3: Web Worker en background para transmisión en lotes de 500 registros sin bloqueo de UI.

## Despliegue a Producción (Vercel & Supabase)
- **Vercel (Frontend SPA):** [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). Despliegue activo con guardia de autenticación, Login Dual OAuth/Email, Onboarding corporativo y 0 errores en consola JS.
- **Supabase (Backend PostgreSQL):** Proyecto activo (`gmvdrbtnogxafamdjzat`). Auth GoTrue & Postgres Pooler 100% conectados.
- **Validación Swarm & Harness²:** Arquitectura auditada y certificada con bucle DevTools en Desktop (1280x800) y Móvil (375x667).
