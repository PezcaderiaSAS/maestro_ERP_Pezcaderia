# Lista de Verificación de Calidad (Checklist): SPEC-035

**Código:** SPEC-035  
**Título:** Autenticación OAuth 2.0 PKCE, Onboarding de Primer Tenant y Gestión de Invitaciones RBAC  
**Fase:** Spec Kit SDD v3.0 — `/speckit.checklist`  
**Fecha:** 2026-10-26  

---

## 1. Seguridad & Autenticación OAuth 2.0
- [ ] **Flujo PKCE Estricto:** Verificación de que la autenticación OAuth utiliza el flujo PKCE (Proof Key for Code Exchange) para prevenir intercepciones de tokens en cliente.
- [ ] **Aislamiento Multi-Tenant (RLS):** Garantizar que ninguna consulta pueda leer registros de otra empresa (`WHERE tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id'`).
- [ ] **Validación Criptográfica de Invitaciones:** Los tokens de invitación deben ser strings de alta entropía (UUID v4 / crypto random) con tiempo de expiración estricto (7 días) y un solo uso.
- [ ] **Inmutabilidad de Propietario (`is_owner`):** El usuario que crea el tenant no puede ser despojado de su rol de Administrador ni eliminado por otro usuario invitado.

## 2. Experiencia de Usuario & UI/UX V8 Dark Glassmorphism
- [ ] **Estética Abisal V8:** Aplicación estricta de `#070A10`, `backdrop-blur-xl`, bordes `border-white/10` y sin fondos grises planos.
- [ ] **Onboarding Fricción Cero (2 Pasos):** Asistente fluido que aprovisiona automáticamente la Bodega Principal y Caja 01 en < 30 segundos.
- [ ] **Link Copiable con 1-Clic:** Modal de invitación con botón de copiar enlace al portapapeles y feedback visual con SweetAlert2.
- [ ] **Filtrado Dinámico del Sidebar:** El menú lateral de navegación debe ocultar automáticamente todos los módulos no autorizados para el rol del usuario conectado.
- [ ] **Selector de Desarrollo:** Opciones colapsables de cambio rápido de rol visibles únicamente cuando `import.meta.env.DEV === true`.

## 3. Contratos de Datos & Validación Zod
- [ ] Esquema Zod `OnboardingTenantSchema` (Razón Social, NIT con formato colombiano, Ciudad, Teléfono).
- [ ] Esquema Zod `EmployeeInvitationSchema` (Email válido, Rol dentro del enum permitido: `ADMIN`, `VENDEDOR`, `CAJERO`, `BODEGUERO`, `SUPERVISOR`, `CONTADOR`).
- [ ] Esquema Zod `AcceptInvitationSchema` (Token válido, User ID autenticado).

## 4. Gobernanza de Código & TDD
- [ ] Pruebas unitarias de esquemas Zod (validación de payloads correctos y rechazo de formatos inválidos).
- [ ] Pruebas de integración de `useAuthStore` (transición de estados: `unauthenticated` -> `onboarding` -> `authenticated`).
- [ ] Pruebas de componentes con React Testing Library para `LoginView`, `TenantOnboardingModal` y `EmployeeInviteModal`.
- [ ] Verificación de 0 errores TypeScript (`tsc --noEmit`).
- [ ] 100% de tests de la suite Vitest pasando (actualmente 954/954).
