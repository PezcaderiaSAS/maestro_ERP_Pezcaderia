# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-31 - SDD v3.0)
- **Atmósfera:** Dark Glassmorphism V8 (`#070A10`), WCAG 2.2 AA+/AAA ($\ge 7:1$), retícula 8px, composite GPU 120 FPS.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Vitest 100% verde.
- **Unificación de Sesiones:** Sincronizado con `origin/main`, 0 conflictos, deltas de skills y hooks consolidados.
- **Ecosistema & Manifiesto:** Indexadas 12 skills (incluyendo `design-lab`), 116 workflows y 14 MCPs (`DOCS/ecosystem-manifest.json`).

## Módulos y Especificaciones Certificadas
1. **SPEC-043 (FLUJO MULTIVENDEDOR & CERO-LATENCIA JOSASE) ✅ (100%):** DB local, selector rápido y modal recaudo F9.
2. **SPEC-045 (SINCRONIZACIÓN REALTIME SUPABASE) ✅ (100%):** Broadcast sub-50ms y fallback heartbeat de comandas.
3. **SPEC-046 & SPEC-047 (FLUJO COMERCIAL POS & CAJA SUPERMERCADO) ✅ (100% CERTIFICADO):**
   - Botones táctiles `PosButton` ($\ge 48\text{px}$) y `CartPanel` con desglose ergonómico de cobro.
   - Terminal autoservicio `CashierSupermarketTerminal` con atajos F1-F12, Ticker de turnos y modal de pago mixto F9.
   - 20/20 tests en `commercialFlowSupermarket.test.tsx` y 6/6 en `cashierKanban.test.tsx`.
4. **SPEC-048 (INVENTARIO & BODEGA WMS UI REARCHITECT) ✅ (100% CERTIFICADO):**
   - Bento Grid de 4 KPIs ejecutivos en Dark Glassmorphism (`InventoryBentoKpis.tsx`).
   - Barra flotante sticky de 7 pastillas ergonómicas (`InventoryFloatingPills.tsx`).
   - Barra de acciones prioritarias Fitts $\ge 48\text{px}$ (`InventoryQuickActionBar.tsx`).
   - Ensamblado modular sin lógica pesada en `InventoryView.tsx`. Auditoría DevTools en vivo 0 errores consola.
5. **SPEC-050 (COMPRAS, MUELLE & RECEPCIÓN) ✅ (100% CERTIFICADO):**
   - Display industrial `ScaleIndustrialDisplay` ($\ge 56\text{px}$, font-mono), checklist sensorial INVIMA `InvimaQualityChecklist` y panel de mermas `DockSummaryReconciliation`.
   - Ensamblado en `BucaramangaReceivingWizard.tsx` (10/10 tests, 27/27 dock suite, DevTools 0 errores).
6. **SPEC-051 (CI/CD PIPELINE VERCEL & GITHUB ACTIONS) ✅ (100% CERTIFICADO & DESPLEGADO):**
   - Workflow `.github/workflows/deploy-vercel.yml` con Quality Gates (`tsc` + Vitest 1420 tests).
   - Pipeline prebuilt (`pull` -> `build` -> `deploy --prebuilt`) en `scripts/lifecycle/deploy-vercel.cjs`.
   - Producción activa y verificada en `https://maestro-erp-pezcaderia.vercel.app` (HTTP 200).
   - OCC implementado en `prefacturaService.ts` contra colisión concurrente de cajeros.

## Cola de Tareas Priorizada (WIP = 1)
1. **AUDITORÍA UX INTEGRAL (29 PANTALLAS):** Revisión de leyes de UX y accesibilidad WCAG 2.2 AA+.
2. **VERIFICACIÓN MULTIVENDEDOR / CAJA ÚNICA EN VIVO:** Pruebas de estrés y latencia con base de datos agregada.
3. **FACTURACIÓN ELECTRÓNICA DIAN / SIIGO API v2:** Integración con contingencia Outbox IndexedDB.

## Despliegue a Producción (Vercel & Supabase)
- **Vercel (Frontend SPA):** [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). Despliegue activo, 0 errores consola.
- **Supabase (Backend PostgreSQL):** Proyecto activo (`gmvdrbtnogxafamdjzat`). Auth GoTrue & Postgres Pooler conectados.
