# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-11-10 - SDD v3.0)
- **Atmósfera:** SaaS Light Mode POS / Dark Glassmorphism V8 (`#070A10`), WCAG 2.2 AA+/AAA, retícula 8px.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Vite build 100% exitoso, 194/194 tests POS verdes.
- **Ecosistema & Manifiesto:** Indexadas 12 skills, 116 workflows y 14 MCPs (`DOCS/ecosystem-manifest.json`).

## Módulos y Especificaciones Certificadas
1. **SPEC-043 a SPEC-052:** Módulos de caja, sincronización Supabase, muelle/compras, inventario WMS y CI/CD Vercel.
2. **SPEC-056 (POS MULTIVENDEDOR SAAS LIGHT MODE) ✅ (100%):** Cabecera única 56px, catálogo 75% matriz 6x3, carrito 25% con 85% altura y botón F6.
3. **SPEC-057 (PLAN INTEGRAL REFACTOR POS FRONTEND) ✅ (100% CERTIFICADO - 6 HITOS):**
   - **M1 (Fila Carrito Tab & Edit):** Inputs continuos de cantidad y precio con auto-selección, [Tab] cíclico y botón micro `[+ Desc]`.
   - **M2 (Descuento Global F4):** Popover anclado con modo `% / $`, cálculo sub-10ms en Zustand y prevención de total negativo.
   - **M3 (Balanza Táctil Manual):** `ManualWeightModal` con teclado 3x4 ($\ge 48$px), chips de peso rápido y cálculo reactivo en vivo.
   - **M4 (Atajos Globales de Teclado):** `usePOSKeyboardShortcuts` intercepta F8, Ctrl+K, F6, F4, F2, F9, Esc con aislamiento y cero fugas.
   - **M5 (Validación Comercial & PIN):** Margen mínimo 15% sobre costo base y descuento > 10% requieren `SupervisorPinModal` con rollback.
   - **M6 (Catálogo 6x3 & Calidad Final):** Matriz virtualizada 18 tarjetas (6x3), paginación `< Ant ... Sig >`, badge AGOTADO y Vite build verde.

## Despliegue a Producción (Vercel & Supabase)
- **Vercel (Frontend SPA):** `https://maestro-erp-pezcaderia.vercel.app` (HTTP 200).
- **Supabase (Backend PostgreSQL):** Proyecto activo (`gmvdrbtnogxafamdjzat`). Auth GoTrue & Postgres Pooler conectados.
