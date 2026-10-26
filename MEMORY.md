# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-26 - SPEC-035 en Curso)
- **Estado Global:** Sistema 100% bajo el Sistema de Diseño Oficial **Dark Glassmorphism V8** ([`DesignSystem_V8.md`](DesignSystem_V8.md)).
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Master Architect SOLID con 0 violaciones (`passed = true`), y 5 Diagramas Mermaid aprobados.
- **Suite Vitest:** **142 suites pasando (142/142), 980/980 tests verdes (100% pasando)**.
- **Frameworks IA (Tétrada Canónica):** Google Harness² y Agency Swarm co-ejecutados a costo $0 para SDD v3.0.

## Módulos y Especificaciones Certificadas
1. **SPEC-034 (CERTIFICADA - MULTIVENDOR-CONCURRENT-CASH-SUPERADMIN-V8):** Motor concurrencia caja única (8 terminales POS con consecutivo atómico y `SELECT FOR UPDATE`), panel Super Admin (`#070A10`), y carga masiva 2.000 filas en < 35 ms.
2. **SPEC-035 (En Progreso - AUTENTICACIÓN OAUTH 2.0 & MULTI-TENANT ONBOARDING):**
   - **TASK-035-01 [CERTIFICADA]:** Tipos TypeScript y contratos Zod para OAuth, creación de empresa e invitaciones (`auth.schema.test.ts` 12/12 verdes).
   - **TASK-035-02 [CERTIFICADA]:** Servicios `authService.ts` y `tenantOnboardingService.ts` con aprovisionamiento de Bodega 1 y Caja 01 (`authService.test.ts` 6/6 verdes).
   - **TASK-035-03 [CERTIFICADA]:** Store reactivo `useAuthStore.ts` con sincronización bidireccional a `useAppStore` y soporte para invitaciones con token de 7 días (`useAuthStore.test.ts` 8/8 verdes).
   - **Próxima Tarea Prioritaria (WIP = 1):** `TASK-035-04: LoginView.tsx` y `DevFastLoginDrawer.tsx` con Dark Glassmorphism V8.

## Despliegue a Producción Certificado (Vercel & Supabase)
- **Vercel (Frontend SPA):** En vivo en [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). 0 errores en consola JS, PWA activa, tema Dark Glassmorphism V8.
- **Supabase (Backend PostgreSQL):** Proyecto en la nube reactivado (`gmvdrbtnogxafamdjzat`). 7/7 migraciones aplicadas al 100% con `supabase db push`.
- **Ecosistema MCP:** 100% operativo (Context7, Chrome-DevTools, Stitch, Gemini AI Studio, Upstash Redis PONG).
