# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-29 - SDD v3.0)
- **Estado Global:** Dark Glassmorphism V8 (`#070A10`), soporte dual `pezcaderia-light` WCAG AA+ (4.5:1 / 7:1), retícula 8px, composite GPU 120 FPS.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Vitest 100% verde (85/85 tests pasando).
- **Multivendedor & Caja Única:** Flujo completo operativo. Login 1-clic Josase con 5 asesores de mostrador.
- **Ventanilla Interactiva:** Cobro con cálculo reactivo de vueltas/cambio y venta a crédito con plazos (8d-60d) y vencimiento en Cartera (`useARStore`).
- **Segregación Mostrador:** Asesores de mostrador sin panel de cobro; disponen exclusivamente de botón `EMITIR PREVENTA (F6)`.

## Módulos y Especificaciones Certificadas
1. **SPEC-035 a SPEC-039:** Autenticación OAuth, Onboarding, Multivendedor, Ergonomía Laptop, WCAG AAA.
2. **SPEC-040 (CERO-LATENCIA CATÁLOGOS MASIVOS & PRECIOS B2B) ✅ (100%):** Worker sub-2ms y reserva hard-hold.
3. **SPEC-041 (SINCRONIZACIÓN SUPABASE <-> INDEXEDDB OUTBOX) ✅ (100%):** Delta sync, OCC `CLIENT_WINS`, DLQ.
4. **FLUJO MULTIVENDEDOR, VENTANILLA Y RECAUDO EN CAJA ÚNICA ✅ (100%):**
   - Cobro en ventanilla con vueltas dinámicas y crédito con sincronización atómica a Cartera (`useARStore`).
   - Segregación estricta asesor mostrador sin cobro (`CartPanel.tsx`) verificado con suites TDD.

## Cola de Tareas Priorizada: SPEC-043 Ferretería Josase (WIP = 1)
1. **SPEC-043 (FLUJO MULTIVENDEDOR - CAJA ÚNICA & CERO-LATENCIA JOSASE) 🎯 (EN PROCESO - WIP = 1):**
   - ✅ **TASK-043-01:** Carga IndexedDB Zero-LocalStorage (9.550 clientes y 5.351 ítems, < 15KB en localStorage).
   - ✅ **TASK-043-02:** Selector clientes instantáneo sub-2ms, debounce 150ms y early break a 20 nodos DOM.
   - ✅ **TASK-043-03:** Anotaciones de despacho en doble nivel (comanda general + ítem) y botón F6 en CartPanel.
   - ✅ **TASK-043-04:** Barra lateral de tickets del vendedor (`VendorTicketSidebar`) con recuperación y estados.
   - 🎯 **TASK-043-05 (EN PROCESO):** Modal profesional de recaudo mixto en taquilla de Caja Única.
   - 📋 **TASK-043-06 (EN COLA):** Conmutación por rol en Topbar, suite Vitest 100% verde y bucle DevTools.
2. **SPEC-042 (FACTURACIÓN ELECTRÓNICA DIAN / SIIGO API v2 & CONTINGENCIA OUTBOX) (EN COLA):**
   - Payloads Zod para CUFE y dispatcher outbox en contingencia.

## Despliegue a Producción (Vercel & Supabase)
- **Vercel (Frontend SPA):** [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). Despliegue activo, 0 errores consola.
- **Supabase (Backend PostgreSQL):** Proyecto activo (`gmvdrbtnogxafamdjzat`). Auth GoTrue & Postgres Pooler conectados.
