# Lista de Tareas Atómicas (Atomic Tasks): SPEC-035

**Código:** SPEC-035  
**Título:** Autenticación OAuth 2.0 PKCE, Onboarding de Primer Tenant y Gestión de Invitaciones RBAC  
**Fase:** Spec Kit SDD v3.0 — `/speckit.tasks`  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). TDD Quirúrgico.  
**Estado:** PENDIENTE DE APROBACIÓN HUMANA (Checkpoint 3)  
**Fecha:** 2026-10-26  

---

## Tareas de Implementación Secuencial

- [x] **TASK-035-01: Contratos Zod y Tipos TypeScript de Autenticación y Tenants**
  - **Archivos:** `src/schemas/auth.schema.ts`, `src/types/auth.types.ts`, `src/tests/auth.schema.test.ts`
  - **Objetivo:** Definir las interfaces TypeScript y validadores Zod para: login OAuth, registro de primera empresa (Razón social, NIT, Ciudad, Teléfono), generación de invitaciones de empleados y canje de tokens.
  - **TDD:** 12/12 pruebas unitarias pasando al 100% en `auth.schema.test.ts` y 0 errores en `tsc --noEmit`.

- [x] **TASK-035-02: Orquestador OAuth y Servicio de Onboarding & Invitaciones**
  - **Archivos:** `src/services/authService.ts`, `src/services/tenantOnboardingService.ts`, `src/tests/authService.test.ts`
  - **Objetivo:** Implementar la lógica cliente para Supabase Auth OAuth 2.0 PKCE, el adaptador de emulación para desarrollo/tests, la creación atómica del tenant (con bodega 1 y caja 01) y la emisión/canje de invitaciones de empleados con token seguro.
  - **TDD:** 6/6 pruebas unitarias pasando al 100% en `authService.test.ts` y 0 errores en `tsc --noEmit`.

- [x] **TASK-035-03: Store Global de Autenticación y Control de Sesión (Zustand)**
  - **Archivos:** `src/store/useAuthStore.ts`, `src/tests/useAuthStore.test.ts`
  - **Objetivo:** Crear el store reactivo que gestiona el estado de sesión (`unauthenticated`, `needs_onboarding`, `authenticated`), el tenant activo, el rol y la sincronización con `localDb` y `useAppStore`.
  - **TDD:** 8/8 pruebas unitarias pasando al 100% en `useAuthStore.test.ts` y 0 errores en `tsc --noEmit`.

- [ ] **TASK-035-04: Vista Oficial de Inicio de Sesión V8 Dark Glassmorphism**
  - **Archivos:** `src/views/auth/LoginView.tsx`, `src/views/auth/components/DevFastLoginDrawer.tsx`, `src/tests/loginView.test.tsx`
  - **Objetivo:** Desarrollar la pantalla de bienvenida corporativa en estética Abisal V8 (`#070A10`), con el botón prominente "Continuar con Google", campo de acceso por correo y el cajón colapsable de cambio rápido de rol para desarrollo.
  - **TDD:** Pruebas de renderizado y eventos con React Testing Library.

- [ ] **TASK-035-05: Modales de Onboarding de Empresa y de Invitación de Empleados**
  - **Archivos:** `src/views/auth/components/TenantOnboardingModal.tsx`, `src/views/auth/components/EmployeeInviteModal.tsx`
  - **Objetivo:** Crear el modal de registro de empresa en 2 pasos para nuevos administradores y el modal de generación de links de invitación copiables con 1 clic para invitar colaboradores.

- [ ] **TASK-035-06: Filtrado Dinámico de Módulos por Roles RBAC en Sidebar**
  - **Archivos:** `src/components/layout/EnterpriseSidebar.tsx`, `src/tests/enterpriseSidebarRbac.test.tsx`
  - **Objetivo:** Actualizar el Sidebar principal para que cada usuario visualice **únicamente los módulos correspondientes a su rol asignado** (Admin ve todo; Vendedor ve POS y Cotizaciones; Cajero ve POS y Cajas; Bodeguero ve WMS y Muelle).

- [ ] **TASK-035-07: Migración SQL Supabase & Bucle de Calidad Integral**
  - **Archivos:** `supabase/migrations/20261026190000_tenants_and_invitations.sql`, `MEMORY.md`
  - **Objetivo:** Crear el script SQL para la base de datos Supabase con las tablas `tenants`, `tenant_memberships`, `tenant_invitations` y las políticas RLS. Ejecutar `tsc --noEmit`, suite completa Vitest (100% verde) y verificación con `chrome-devtools`.
