# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-29 - SDD v3.0)
- **Estado Global:** Dark Glassmorphism V8 (`#070A10`), retícula 8px, composite GPU 120 FPS.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Vitest 100% verde (28/28 tests SPEC-041 y suite global intacta).
- **Cierre de Sesión Blindado:** `MacWindowControls` desacoplado (`isAppLevel`), botón explícito en sidebar y retorno limpio a `LoginView`.
- **Armonización UI & Cero Desbordamiento:** `lg:pl-[284px]` / `lg:pl-[88px]`, scrollWidth = clientWidth (1280px), colores ergonómicos en POS y Topbar.
- **Multivendedor - Caja Única (Ferretería Josase):** Asesores de mostrador (Diego Díaz, Santiago Pallares, etc.), emisión de preventas táctiles y cobro centralizado en `PendingOrdersDrawer`.
- **UltraAdmin Global:** `pezcaderia.2022@gmail.com` con GOD_MODE irrestricto, bypass de RLS y conmutación en 1 toque.

## Módulos y Especificaciones Certificadas
1. **SPEC-035 a SPEC-039:** Autenticación OAuth, Onboarding, Multivendedor, Ergonomía Laptop, WCAG AAA.
2. **SPEC-040 (CERO-LATENCIA CATÁLOGOS MASIVOS & PRECIOS B2B) ✅ COMPLETADA (100%):**
   - Benchmarks 3X (16.000 ítems, 30.000 clientes), Web Worker sub-2ms y mesa de cotizaciones con reserva hard-hold.
3. **SPEC-041 (SINCRONIZACIÓN BIDIRECCIONAL SUPABASE <-> INDEXEDDB OUTBOX) ✅ COMPLETADA (100%):**
   - Esquemas Zod de delta sync, OCC `CLIENT_WINS` con descuento delta, Dead-Letter Queue (DLQ), Web Worker en segundo plano (lotes 500 registros, backoff exponencial 1s-60s), motor de búsqueda sub-2ms (`updateDelta` incremental en <15ms) e integración reactiva con `POSView` y `PendingOrdersDrawer`.

## Cola de Tareas Pendientes para Próxima Sesión tras `git pull` (WIP = 1)
1. **SPEC-042 (INICIO INMEDIATO POST-PULL): Facturación Electrónica DIAN / Siigo API v2 & Envío de Tirilla Digital Resiliente**:
   - Tarea 1: Esquemas Zod y validación estricta de payloads para emisión electrónica y CUFE.
   - Tarea 2: Dispatcher outbox en IndexedDB para facturación offline con cola de contingencia DIAN.
   - Tarea 3: Generación de tirilla térmica 80mm/58mm y visor digital para WhatsApp/Email.

## Despliegue a Producción (Vercel & Supabase)
- **Vercel (Frontend SPA):** [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). Despliegue activo con guardia de autenticación, Login Dual OAuth/Email, Onboarding corporativo y 0 errores en consola JS.
- **Supabase (Backend PostgreSQL):** Proyecto activo (`gmvdrbtnogxafamdjzat`). Auth GoTrue & Postgres Pooler 100% conectados.
- **Validación Swarm & Harness²:** Arquitectura auditada y certificada con bucle DevTools en Desktop (1280x800) y Móvil (375x667).
