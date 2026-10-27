# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-26 - SPEC-035 en Curso)
- **Estado Global:** Sistema 100% bajo el Sistema de Diseño Oficial **Dark Glassmorphism V8** ([`DesignSystem_V8.md`](DesignSystem_V8.md)).
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Master Architect SOLID con 0 violaciones (`passed = true`), y 5 Diagramas Mermaid aprobados.
- **Suite Vitest:** **142 suites pasando (142/142), 980/980 tests verdes (100% pasando)**.
- **Frameworks IA (Tétrada Canónica):** Google Harness² y Agency Swarm co-ejecutados a costo $0 para SDD v3.0.

## Módulos y Especificaciones Certificadas
1. **SPEC-032 (CERTIFICADA - ARQUITECTURA MULTIVENDEDOR, CAJA ÚNICA & SUPERADMIN):**
   - 8 terminales POS en preventa/comanda concurrentes con cola central `PendingOrdersDrawer.tsx`.
   - Numpad táctil de PIN de supervisor para descuentos y excepciones (`SupervisorPinModal.tsx`).
   - Consola desacoplada SuperAdmin `/superadmin` con switch dinámico de tenant (`SuperAdminMasterView.tsx`).
   - Módulo de carga masiva de ferretería tolerante CSV/JSON (`BulkHardwareImportModal.tsx`).
   - 100% pruebas en verde (57/57 tests POS/Multivendor/Caja) y build de producción limpio.
2. **SPEC-034 & SPEC-035:** Concurrencia de caja única con bloqueo atómico y autenticación OAuth 2.0 / Onboarding.

## Despliegue a Producción Certificado (Vercel & Supabase)
- **Vercel (Frontend SPA):** En vivo en [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). 0 errores en consola JS, PWA activa, tema Dark Glassmorphism V8.
- **Supabase (Backend PostgreSQL):** Proyecto en la nube reactivado (`gmvdrbtnogxafamdjzat`). 7/7 migraciones aplicadas al 100% con `supabase db push`.
- **Ecosistema MCP:** 100% operativo (Context7, Chrome-DevTools, Stitch, Gemini AI Studio, Upstash Redis PONG).
