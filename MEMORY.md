# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-28 - SDD v3.0)
- **Estado Global:** Dark Glassmorphism V8 (`#070A10`), retícula 8px, composite GPU 120 FPS.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Vitest 100% verde (35/35 en SPEC-040, 1.140+ acumulados).
- **Multi-Tenant & Ferretería Josase:** Catálogo real de 5.351 ítems y 9.550 clientes dimensionado a escala 3X (16.000 ítems, 30.000 clientes) bajo arquitectura IndexedDB (`PezcaderiaERP_{tenantId}`).
- **Cero-Latencia Off-Thread:** Web Worker nativo de búsqueda difusa sub-2ms y virtualización headless (`useVirtualGrid`).
- **Precios Diferenciales:** Motor `differentialPricingService` con tarifas Detal vs Mayorista, umbrales y margen mínimo.
- **UltraAdmin Global:** `pezcaderia.2022@gmail.com` con GOD_MODE irrestricto, bypass de RLS y conmutación en 1 toque.

## Módulos y Especificaciones Certificadas
1. **SPEC-035 (AUTENTICACIÓN OAUTH 2.0, ONBOARDING Y ROLES RBAC) ✅ COMPLETADA**
2. **SPEC-036 (GESTIÓN DE USUARIOS, ONBOARDING & MULTI-EMPRESA) ✅ COMPLETADA (100%):**
   - Matriz de permisos, Wizard 2 pasos, Login dual y selector multi-empresa.
3. **SPEC-037 (PREVENTAS MULTIVENDEDOR, KANBAN CAJA ÚNICA Y DESPACHO VERIFICADO) ✅ COMPLETADA**
4. **SPEC-038 (ERGONOMÍA UX Y OPTIMIZACIÓN LAPTOP 1366x768) ✅ COMPLETADA**
5. **SPEC-039 (CALIDAD FRONTEND, WCAG AAA Y E2E MULTIVENDEDOR) ✅ COMPLETADA**
6. **SPEC-040 (CERO-LATENCIA CATÁLOGOS MASIVOS & PRECIOS B2B) 🟡 EN PROGRESO (5/7 Tareas Completadas):**
   - `TASK-040-01` a `TASK-040-05` 100% certificadas con TDD.

## Cola de Tareas Pendientes para Iniciar (WIP = 1)
1. **TASK-040-06 (EN PROCESO - SIGUIENTE ACCIÓN INMEDIATA):** Módulo de Cotizaciones B2B y Conversión Atómica a Preventa POS (`b2bQuotationService.ts` y `ConvertToPosModal.tsx` conectado al Kanban de Caja de SPEC-037).
2. **TASK-040-07:** Ingesta Masiva Escala 3X (16.000 ítems y 30.000 clientes), Bucle Chrome DevTools (0 errores, 375px/1366px) y Quality Gate Final.

## Despliegue a Producción (Vercel & Supabase)
- **Vercel (Frontend SPA):** [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). 0 errores consola JS, PWA activa.
- **Supabase (Backend PostgreSQL):** Proyecto en la nube activo (`gmvdrbtnogxafamdjzat`). RLS bypass activo para UltraAdmin.
- **Ecosistema MCP:** 100% operativo (Chrome-DevTools, Context7, Upstash Redis PONG).
