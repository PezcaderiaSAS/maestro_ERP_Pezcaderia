# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-30 - SDD v3.0)
- **Estado Global:** Dark Glassmorphism V8 (`#070A10`), soporte dual WCAG AA+ (4.5:1 / 7:1), retícula 8px, composite GPU 120 FPS.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Vitest 100% verde (89/89 tests pasando).
- **Multivendedor & Caja Única:** Flujo completo operativo. Login 1-clic Josase con 5 asesores de mostrador.
- **Ergonomía Mostrador & Comandas (SPEC-042) ✅:** Solapamiento resuelto (GlassCard `overflow-hidden`, pie `shrink-0 mt-auto` sin sticky). Cabecera, `DiscountPanel` y `ParkedOrdersBar` unificados en V8. Modal de confirmación de preventa activo.
- **Ventanilla Interactiva:** Cobro con cálculo reactivo de vueltas/cambio y venta a crédito con plazos (8d-60d) y vencimiento en Cartera (`useARStore`).

## Módulos y Especificaciones Certificadas
1. **SPEC-035 a SPEC-039:** Autenticación OAuth, Onboarding, Multivendedor, Ergonomía Laptop, WCAG AAA.
2. **SPEC-040 (CERO-LATENCIA CATÁLOGOS MASIVOS & PRECIOS B2B) ✅ (100%):** Worker sub-2ms y reserva hard-hold.
3. **SPEC-041 (SINCRONIZACIÓN SUPABASE <-> INDEXEDDB OUTBOX) ✅ (100%):** Delta sync, OCC `CLIENT_WINS`, DLQ.
4. **SPEC-042 (AJUSTE ERGONÓMICO MOSTRADOR PARA COMANDAS & VENTANILLA) ✅ (100%):**
   - Eliminación del patrón `sticky bottom-0` que tapaba la cabecera del carrito.
   - Migración de fondos claros a Dark Glassmorphism V8 (`#070A10`, `bg-slate-900/60`, `border-white/10`).
   - Modal de confirmación de comanda para Asesor de Mostrador (`EMITIR PREVENTA / COMANDA F6`).
   - Co-evaluación con Agency Swarm + Google Harness² archivada en `specs/sdd_verification_reports/`.

## Cola de Tareas Priorizada (WIP = 1)
1. **SPEC-043: Facturación Electrónica DIAN / Siigo API v2 & Envío de Tirilla Digital Resiliente**:
   - Tarea 1: Esquemas Zod y validación estricta de payloads para emisión electrónica y CUFE.
   - Tarea 2: Dispatcher outbox en IndexedDB para facturación offline con cola de contingencia DIAN.

## Despliegue a Producción (Vercel & Supabase)
- **Vercel (Frontend SPA):** [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). Despliegue activo, 0 errores consola.
- **Supabase (Backend PostgreSQL):** Proyecto activo (`gmvdrbtnogxafamdjzat`). Auth GoTrue & Postgres Pooler conectados.
