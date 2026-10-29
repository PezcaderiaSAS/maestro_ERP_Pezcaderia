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

## Cola de Tareas Priorizada para Próxima Sesión tras `git pull` (WIP = 1)
1. **EVALUACIÓN POR AGENCIAS (SWARM) Y GOOGLE HARNESS² DEL PLAN ERGONÓMICO DEL MOSTRADOR (PRIORIDAD 1):**
   - Ejecutar `python scripts/architecture/run_agency_sdd_bridge.py -a architect -p "Ajuste ergonómico del mostrador para comandas y ciclo de vida preventa"`.
   - Propose-Probe-Compose a costo $0 para contrastar candidatos de arnés y validar restricciones invariantes.
   - Corregir el solapamiento visual en `CartPanel.tsx` (botones cortados bajo selector de cliente) e integrar Dark Glassmorphism V8.
2. **SPEC-042: Facturación Electrónica DIAN / Siigo API v2 & Envío de Tirilla Digital Resiliente**:
   - Tarea 1: Esquemas Zod y validación estricta de payloads para emisión electrónica y CUFE.
   - Tarea 2: Dispatcher outbox en IndexedDB para facturación offline con cola de contingencia DIAN.

## Despliegue a Producción (Vercel & Supabase)
- **Vercel (Frontend SPA):** [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). Despliegue activo, 0 errores consola.
- **Supabase (Backend PostgreSQL):** Proyecto activo (`gmvdrbtnogxafamdjzat`). Auth GoTrue & Postgres Pooler conectados.
