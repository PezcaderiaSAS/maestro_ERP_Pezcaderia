# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-27 - SPEC-036 en Curso)
- **Estado Global:** Sistema 100% bajo el Sistema de Diseño Oficial **Dark Glassmorphism V8** ([`DesignSystem_V8.md`](DesignSystem_V8.md)).
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Master Architect SOLID con 0 violaciones (`passed = true`), y 5 Diagramas Mermaid aprobados.
- **Suite Vitest:** **100% pruebas verdes pasando**, suite completa operativa.
- **Frameworks IA (Tétrada Canónica):** Google Harness² y Agency Swarm co-ejecutados a costo $0 para SDD v3.0.

## Módulos y Especificaciones Certificadas
1. **SPEC-032 (PRODUCCIÓN CERTIFICADA):** Arquitectura multivendedor, caja única centralizada, terminales POS y consola SuperAdmin desplegada en producción.
2. **SPEC-036 (AUTH, LOGIN DUAL, ONBOARDING EMPRESAS & USER MGMT):**
   - `TASK-036-01` ✅: Esquemas Zod para creación de usuarios, cambio forzoso de clave y matriz de permisos granulares.
   - `TASK-036-02` ✅: `UserManagementService` con clave por defecto = cédula, flag `mustChangePassword` y Supabase Auth PKCE.
   - `TASK-036-03` ✅: Asistente `TenantOnboardingWizard.tsx` en 2 pasos (Empresa y Administrador provisional).
   - `TASK-036-04` ✅: `LoginView.tsx` dual (Login / Registro) con bloqueo y `MandatoryChangePasswordModal.tsx`.
   - **Próxima Tarea (Apertura):** `TASK-036-05` (Modal de Creación de Usuarios con Matriz de Checkboxes Personalizada).

## Despliegue a Producción (Vercel & Supabase)
- **Vercel (Frontend SPA):** En vivo en [`https://maestro-erp-pezcaderia.vercel.app`](https://maestro-erp-pezcaderia.vercel.app). 0 errores en consola JS, PWA activa, Dark Glassmorphism V8.
- **Supabase (Backend PostgreSQL):** Proyecto en la nube activo (`gmvdrbtnogxafamdjzat`).
- **Ecosistema MCP:** 100% operativo (Chrome-DevTools, Context7, Upstash Redis PONG).

