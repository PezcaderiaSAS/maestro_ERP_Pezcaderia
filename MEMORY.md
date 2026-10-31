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
5. **SPEC-050 (COMPRAS, MUELLE & RECEPCIÓN) 🟡 (Fase 1 Completada):**
   - `TASK-050-01` [Completada]: Display industrial de báscula `ScaleIndustrialDisplay.tsx` con botones Fitts $\ge 56\text{px}$.

## Cola de Tareas Priorizada (WIP = 1)
1. **TASK-050-02 [EN COLA - SIGUIENTE]:** Panel Sensorial Visual INVIMA `InvimaQualityChecklist.tsx` (Ojos, Agallas, Olor, Textura).
2. **TASK-050-03 & TASK-050-04:** Conciliación de mermas de viaje y ensamble en `BucaramangaReceivingWizard.tsx`.
3. **FACTURACIÓN ELECTRÓNICA DIAN / SIIGO API v2:** Integración con contingencia Outbox IndexedDB.

## Despliegue a Producción (Vercel & Supabase)
- **Vercel (Frontend SPA):** [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). Despliegue activo, 0 errores consola.
- **Supabase (Backend PostgreSQL):** Proyecto activo (`gmvdrbtnogxafamdjzat`). Auth GoTrue & Postgres Pooler conectados.
