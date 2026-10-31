# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-31 - SDD v3.0)
- **Estado Global:** Dark Glassmorphism V8 (`#070A10`), soporte dual WCAG AA+ (4.5:1 / 7:1), retícula 8px, composite GPU 120 FPS.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Vitest 100% verde.
- **Multivendedor & Caja Única:** Flujo completo operativo. Login 1-clic Josase con 5 asesores de mostrador.
- **Ergonomía Mostrador & Comandas (SPEC-042) ✅:** Solapamiento resuelto (GlassCard `overflow-hidden`, pie `shrink-0 mt-auto` sin sticky). Cabecera, `DiscountPanel` y `ParkedOrdersBar` unificados en V8.
- **Ventanilla Interactiva:** Cobro con cálculo reactivo de vueltas/cambio y venta a crédito con plazos (8d-60d) y vencimiento en Cartera (`useARStore`).

## Módulos y Especificaciones Certificadas
1. **SPEC-035 a SPEC-039:** Autenticación OAuth, Onboarding, Multivendedor, Ergonomía Laptop, WCAG AAA.
2. **SPEC-040 a SPEC-042:** Catálogos masivos sub-2ms, Outbox IndexedDB delta sync y Layout Mostrador V8.
3. **SPEC-043 (FLUJO MULTIVENDEDOR & CERO-LATENCIA JOSASE) ✅ (100%):** DB local, selector rápido y modal recaudo F9.
4. **SPEC-045 (SINCRONIZACIÓN REALTIME SUPABASE PREVENTAS & TAQUILLA) ✅ (100% CERTIFICADO):**
   - Canal multi-tenant `realtime:preventas:${tenantId}` con fallback heartbeat resiliente (10s) si se degrada el WebSocket.
   - Eliminación de polling ciego (4s) en Kanban; actualización reactiva instantánea (<100ms) de columnas.
   - Emisión Broadcast sub-50ms en F6 (`POSView`) y sincronización en vivo de estados en `VendorTicketSidebar`.
   - Quality Gate: 34/34 tests verdes en Vitest, compilación TypeScript estricta con 0 errores y Vite build OK.

## Cola de Tareas Priorizada (WIP = 1)
1. **FACTURACIÓN ELECTRÓNICA DIAN / SIIGO API v2 & CONTINGENCIA OUTBOX (EN COLA):**
   - Payloads Zod para CUFE y dispatcher outbox en contingencia.

## Despliegue a Producción (Vercel & Supabase)
- **Vercel (Frontend SPA):** [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). Despliegue activo, 0 errores consola.
- **Supabase (Backend PostgreSQL):** Proyecto activo (`gmvdrbtnogxafamdjzat`). Auth GoTrue & Postgres Pooler conectados.
