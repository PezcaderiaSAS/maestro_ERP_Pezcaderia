# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-29 - SDD v3.0)
- **Estado Global:** Dark Glassmorphism V8 (`#070A10`), soporte dual `pezcaderia-light` WCAG AA+ (4.5:1 / 7:1), retícula 8px, composite GPU 120 FPS.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Vitest 100% verde (77/77 tests UX/E2E pasando en 7 suites).
- **Cero Desbordamiento (375px & Desktop):** `scrollWidth <= clientWidth` certificado con Chromium DevTools (`hasOverflow: false` en móvil 375px y desktop 1280px).
- **Leyes de UX Implementadas:** Fitts (zonas de toque universales $\ge 44\times 44\text{px}$), Hick (simplificación cognitiva de cobro), Doherty (debounce 200ms y feedback $<400\text{ms}$), Miller (stock consolidado con chunking) y Jakob (patrones familiares de POS).
- **Pantallas Prioritarias Certificadas:** POS Multivendedor con switcher móvil `[Catálogo]` / `[Carrito]`, Caja Única con selectores elásticos y sort memoizado, Tablero Kanban de comandas y Catálogos de Clientes/Inventario con búsqueda fluida.

## Módulos y Especificaciones Certificadas
1. **SPEC-035 a SPEC-039:** Autenticación OAuth, Onboarding, Multivendedor, Ergonomía Laptop, WCAG AAA.
2. **SPEC-040 (CERO-LATENCIA CATÁLOGOS MASIVOS & PRECIOS B2B) ✅ COMPLETADA (100%):**
   - Benchmarks 3X (16.000 ítems, 30.000 clientes), Web Worker sub-2ms y cotizaciones con reserva hard-hold.
3. **SPEC-041 (SINCRONIZACIÓN BIDIRECCIONAL SUPABASE <-> INDEXEDDB OUTBOX) ✅ COMPLETADA (100%):**
   - Esquemas Zod delta sync, OCC `CLIENT_WINS`, Dead-Letter Queue (DLQ), Web Worker en lotes de 500 y búsqueda sub-2ms.
4. **AUDITORÍA DE INTEGRIDAD FRONTEND & LEYES DE UX (M1–M5) ✅ COMPLETADA (100%):**
   - 77/77 pruebas automatizadas pasando, 0 errores en consola JS, co-ejecución Google Harness² + Agency Swarm a costo $0.

## Cola de Tareas Pendientes para Próxima Sesión tras `git pull` (WIP = 1)
1. **SPEC-042 (INICIO INMEDIATO POST-PULL): Facturación Electrónica DIAN / Siigo API v2 & Envío de Tirilla Digital Resiliente**:
   - Tarea 1: Esquemas Zod y validación estricta de payloads para emisión electrónica y CUFE.
   - Tarea 2: Dispatcher outbox en IndexedDB para facturación offline con cola de contingencia DIAN.
   - Tarea 3: Generación de tirilla térmica 80mm/58mm y visor digital para WhatsApp/Email.

## Despliegue a Producción (Vercel & Supabase)
- **Vercel (Frontend SPA):** [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). Despliegue activo con guardia de autenticación, Login Dual OAuth/Email, Onboarding corporativo y 0 errores en consola JS.
- **Supabase (Backend PostgreSQL):** Proyecto activo (`gmvdrbtnogxafamdjzat`). Auth GoTrue & Postgres Pooler 100% conectados.
- **Validación Swarm & Harness²:** Arquitectura auditada y certificada con bucle DevTools en Desktop (1280x800) y Móvil (375x667).
