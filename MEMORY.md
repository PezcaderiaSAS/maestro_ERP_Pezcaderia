# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-11-18 - SDD v3.0)
- **Atmósfera:** SaaS Light Mode POS / Dark Glassmorphism V8 (`#070A10`), WCAG 2.2 AA+/AAA, retícula 8px.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Vite build 100% exitoso, 36/36 tests de caja y multi-tenant verdes.
- **Ecosistema & Manifiesto:** Indexadas 12 skills, 116 workflows y 14 MCPs (`DOCS/ecosystem-manifest.json`).

## Módulos y Especificaciones Certificadas
1. **SPEC-043 a SPEC-052:** Módulos de caja, sincronización Supabase, muelle/compras, inventario WMS y CI/CD Vercel.
2. **SPEC-056 a SPEC-060:** POS Multivendedor SaaS Light Mode, Refactor integral 6 hitos (M1-M6) y Modal unificado de pagos.
3. **SPEC-061 a SPEC-063:** Refactors arquitectónicos SRP en Omnibox, usePricing y ColdStorage PDF.
4. **SPEC-064 (POS UI/UX OVERFLOW & BODEGA STOCK) ✅ (100%):** Normalizador O(1) de stock multibodega y scroll suave de categorías.
5. **SIDEBAR & PERFORMANCE FREEZE RESOLUTION ✅ (100%):** Cero congelamientos, rascado de middleware y persistencia en escritorio.
6. **FERRETERIA JOSASE INGESTION & CASHIER KANBAN UNBLOCK ✅ (100%):** 9,538 clientes, 5,351 ítems, DB particionada y desbloqueo de Kanban.
7. **MULTI-TENANT POS CATALOG & ZERO OVERFLOW FIX ✅ (100%):** Catálogo categorizado reactivo con guardián en POSView y useDataBootstrapper.
8. **SPEC-065 (POPOVER MULTI-EMPRESA & GATEKEEPER DE CAJA) ✅ (100% CERTIFICADO):**
   - **Popover Ergonómico Flotante:** Reemplazo de modal oscuro invasivo por `TenantDropdownPopover.tsx` de 1-toque en `EnterpriseTopbar` y cabecera POS.
   - **Gatekeeper Diario de Turno:** Bloqueo innegociable de cobros/facturas si la caja está cerrada; despliegue automático de `AperturaCajaModal` para cajero principal con base inicial ($100.000 COP) y actualización inmutable en `useCashStore`.
   - **Separación Estricta de Roles:** Vendedores limitados a emisión de comandas (F6); cobros directos (F2) y arqueo ciego restringidos a cajero y administración.
9. **SPEC-066 (SKELETON ATÓMICO & AUDITORÍA FRONTEND 100/100) ✅ (100% CERTIFICADO):**
   - **Transición Atómica y Skeleton:** Desmontaje inmediato de productos al conmutar empresa (`isSwitchingCatalog`), 18 tarjetas en `POSCatalogSkeletonGrid.tsx` (`CLS = 0`) y defensa heurística `isCatalogMismatched`.
   - **Control de Concurrencia:** Sequence tokens (`transitionSequence`) y `AbortController` cancelan promesas previas en conmutaciones ultrarrápidas.
   - **Auditoría Frontend 100/100:** Cabecera POS neutralizada (`bg-slate-900`) al 30% estructural, aislando el botón F6 (10% acento verde, Von Restorff) y microtextos con contraste WCAG 2.2 AAA ($\ge 7:1$).

## Despliegue a Producción (Vercel & Supabase)
- **Vercel CI/CD (7926313) ✅:** Despliegue en PRODUCCIÓN exitoso (State: READY, HTTP 200). Resuelto descarte de `packages/validation-schemas` en `.vercelignore` y exclusiones en `tsconfig.json`.
- **UI Conmutador Opaco ✅:** Popover y Modal con superficies 100% sólidas (`bg-slate-900`/`bg-slate-950`), sin bleed-through y contraste WCAG AAA.
- **Supabase (Backend PostgreSQL):** Proyecto activo (`gmvdrbtnogxafamdjzat`). Auth GoTrue & Postgres Pooler conectados.
