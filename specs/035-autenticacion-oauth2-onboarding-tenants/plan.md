# Plan de Implementación Técnica (Technical Plan): SPEC-035

**Código:** SPEC-035  
**Título:** Autenticación OAuth 2.0 PKCE, Onboarding de Primer Tenant y Gestión de Invitaciones RBAC  
**Fase:** Spec Kit SDD v3.0 — `/speckit.plan`  
**Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). Arquitectura Data-Driven.  
**Estado:** PENDIENTE DE APROBACIÓN HUMANA (Checkpoint 2)  
**Fecha:** 2026-10-26  

---

## 1. Decisiones Arquitectónicas & Estrategia Técnica

Con base en la especificación [spec.md](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/specs/035-autenticacion-oauth2-onboarding-tenants/spec.md), los resultados de Co-Ejecución Swarm + Google Harness² y las directivas acordadas en `/grill-me`:

1. **Autenticación Desacoplada (Supabase GoTrue PKCE + Mock Dev Adapter):**
   - El servicio `authService.ts` implementa el estándar OAuth 2.0 PKCE a través de `@supabase/supabase-js` (`signInWithOAuth({ provider: 'google', options: { redirectTo } })`).
   - Cuenta con un adaptador de desarrollo/pruebas (`mockAuthAdapter`) que permite alternar instantáneamente entre sesiones de prueba sin abrir ventanas emergentes externas durante Vitest y pruebas locales.

2. **Aprovisionamiento Atómico del Primer Tenant (Asistente 2 Pasos):**
   - El servicio `tenantOnboardingService.ts` orquesta la creación del tenant en la base de datos Supabase con la RPC o transacción:
     1. Inserta el registro en `public.tenants` / `public.empresas` con Razón Social, NIT, Ciudad y Teléfono.
     2. Inserta la membresía en `public.tenant_memberships` con `role = 'ADMIN'`, `status = 'active'`, `is_owner = true`.
     3. Inserta automáticamente la Bodega Principal (`codigo: '1'`) y la Caja General (`codigo: 'CAJA-01'`).
     4. Actualiza la sesión activa del usuario inyectando el nuevo `tenant_id`.

3. **Gobernanza de Invitaciones de Empleados con Token Criptográfico:**
   - La tabla `public.tenant_invitations` registra las invitaciones con `token` criptográfico aleatorio, `expires_at = NOW() + INTERVAL '7 days'` y estado `'pending'`.
   - El Administrador obtiene un link seguro para compartir (`/login?invite=TOKEN`).
   - Al autenticarse el empleado con Google OAuth, el servicio canjea el token atómicamente, pasa la invitación a `'accepted'` e inserta la membresía en `tenant_memberships` con el rol indicado.

4. **Filtrado Reactivo del Sidebar por Matriz RBAC:**
   - En `EnterpriseSidebar.tsx`, cada ítem de navegación valida los permisos contra `currentUser.rol`:
     - `ADMIN`: Ve los 17 módulos.
     - `VENDEDOR`: POS, Cotizaciones B2B, Directorio Clientes, Pedidos Mostrador.
     - `CAJERO`: POS, Control de Cajas.
     - `BODEGUERO`: Compras en Muelle, Producción & Yield, Bodegas & WMS, Alistamiento B2B, Despachos & Rutas, Alquiler Cuarto Frío.
     - `SUPERVISOR`: POS, Control de Cajas, Métricas OTIF & SLA, Bodegas & WMS.

---

## 2. Mapa de Archivos & Responsabilidades

```
src/schemas/
└── auth.schema.ts                      # Contratos Zod: Login, TenantOnboarding, EmployeeInvitation

src/types/
└── auth.types.ts                       # Tipos TypeScript: Tenant, Membership, Invitation, Roles RBAC

src/services/
├── authService.ts                      # Orquestador cliente OAuth 2.0 PKCE, sesiones y Mock Mode
└── tenantOnboardingService.ts          # Gestión de empresas, bodega/caja base e invitaciones con token

src/store/
└── useAuthStore.ts                     # Estado reactivo global de autenticación, tenant activo y permisos

src/views/auth/
├── LoginView.tsx                       # Vista de inicio de sesión V8 Dark Glassmorphism con botón Google
└── components/
    ├── TenantOnboardingModal.tsx       # Asistente de 2 pasos para registrar primera empresa
    ├── EmployeeInviteModal.tsx         # Modal de creación y generación de links de invitación
    └── DevFastLoginDrawer.tsx          # Selector colapsable de cambio rápido de rol en modo dev

src/components/layout/
└── EnterpriseSidebar.tsx              # Actualización para filtrar dinámicamente ítems según rol RBAC

src/tests/
├── auth.schema.test.ts                 # Tests unitarios para validación Zod de login e invitaciones
├── authService.test.ts                 # Tests del orquestador OAuth y canje de invitaciones
├── tenantOnboardingService.test.ts     # Tests de creación de empresa, bodega/caja y RLS
└── loginView.test.tsx                  # Tests de UI con React Testing Library
```

---

## 3. Plan de Pruebas Automatizadas (TDD)

1. **RED:** Escribir pruebas unitarias primero para los esquemas Zod en `src/tests/auth.schema.test.ts`.
2. **RED:** Escribir pruebas de lógica para `authService.test.ts` y `tenantOnboardingService.test.ts` simulando:
   - Login por primera vez sin empresa -> Transición a Onboarding.
   - Creación exitosa de empresa -> Aprovisionamiento de Tenant, Bodega y Caja.
   - Generación de token de invitación -> Canje por nuevo usuario con rol `VENDEDOR`.
3. **GREEN:** Implementar esquemas, tipos, servicios y componentes.
4. **REFACTOR:** Asegurar principios SOLID, límites de líneas (< 600 líneas) y verificar con Vitest (`npm run test:run`).
5. **DevTools Loop:** Validar con `chrome-devtools` en `http://localhost:3000/` con 0 errores en consola JS.
