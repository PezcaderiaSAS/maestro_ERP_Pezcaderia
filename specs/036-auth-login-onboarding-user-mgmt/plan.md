# Plan Técnico de Implementación: /speckit.plan (SPEC-036)

**Código:** SPEC-036  
**Fase:** /speckit.plan (SDD v3.0)  
**Ticket:** AUTH-ONBOARDING-USER-MGMT-V8  
**Fecha:** 2026-10-27  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). TDD Quirúrgico.  

---

## 1. Arquitectura Técnica de la Solución

```
src/
├── schemas/
│   ├── auth.schema.ts               <- Expandido con UserCreationSchema & PasswordChangeSchema
│   └── permissions.schema.ts        <- Matriz canónica de claves de permisos
├── types/
│   ├── auth.types.ts                <- Interfaces UserPermission, TenantData, AuthSessionState
│   └── permissions.types.ts         <- Definición de permisos por módulo
├── services/
│   ├── authService.ts               <- Integración Supabase Auth 2.0 PKCE, login, password change
│   ├── tenantOnboardingService.ts   <- Wizard 2 pasos: registro atómico de tenant + admin inicial
│   └── userManagementService.ts     <- Creación de usuarios, password=cédula, asignación de permisos
├── store/
│   ├── useAuthStore.ts              <- Estado reactivo de sesión, tenant activo y forzar cambio
│   └── usePermissionsStore.ts       <- Store reactivo para consulta de permisos por vista
├── views/
│   ├── auth/
│   │   ├── LoginView.tsx            <- Pantalla Dual V8 (Login / Registro Empresa)
│   │   ├── components/
│   │   │   ├── TenantOnboardingWizard.tsx <- Paso 1 (Empresa) + Paso 2 (Admin Fundador)
│   │   │   ├── MandatoryChangePasswordModal.tsx <- Bloqueo y actualización de contraseña inicial
│   │   │   └── TenantSelectorModal.tsx    <- Modal visual para usuarios multi-empresa
│   └── admin/
│       └── components/
│           └── UserCreationModal.tsx      <- Formulario Compacto + Matriz de Checkboxes
```

---

## 2. Definición de Contratos y Esquemas Zod

### 2.1. Creación de Usuario (`UserCreationSchema`)
```typescript
export const UserCreationSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres'),
  identificacion: z.string().trim().min(5, 'La identificación debe ser válida').regex(/^\d+$/, 'Solo números permitidos'),
  email: z.string().trim().email('Correo electrónico inválido').toLowerCase(),
  telefono: z.string().trim().min(7, 'El teléfono debe tener mínimo 7 dígitos'),
  rol: z.enum(['ADMINISTRADOR', 'VENDEDOR', 'CAJERO', 'BODEGUERO', 'SUPERVISOR', 'CONTADOR']),
  permisosPersonalizados: z.record(z.string(), z.boolean()).optional().default({}),
});
```

### 2.2. Cambio Forzoso de Contraseña (`MandatoryPasswordChangeSchema`)
```typescript
export const MandatoryPasswordChangeSchema = z.object({
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});
```

---

## 3. Flujo Técnico de Registro de Empresa en 2 Pasos

1. **Paso 1: Datos Fiscales de la Empresa**
   - Inputs: Razón Social, NIT con dígito de verificación, Ciudad, Dirección, Teléfono comercial.
   - Validación reactiva Zod en cada pulsación.
   - Botón `Continuar a Datos del Administrador ->` habilitado únicamente si el formulario 1 es 100% válido.
2. **Paso 2: Datos del Administrador Fundador**
   - Inputs: Nombres y Apellidos, Cédula de Ciudadanía, Correo de Acceso y Celular.
   - Contraseña inicial autoasignada internamente = Cédula.
   - Checkbox: "Declaro que soy el representante legal o administrador autorizado".
3. **Ejecución Atómica en `tenantOnboardingService`:**
   - Invoca `supabase.auth.signUp()` con el correo y cédula como password provisional.
   - Crea el registro en tabla `tenants` con estado `ACTIVO`.
   - Crea `tenant_memberships` con `role = 'ADMINISTRADOR'`, `isOwner = true` y todos los permisos en `true`.
   - Crea automáticamente `Bodega Principal` y `Caja 01` asociadas al nuevo `tenant_id`.
   - Actualiza `useAuthStore` y redirige a la consola principal de la nueva empresa.

---

## 4. Matriz de Permisos por Checkbox y Hook `useCanAccess`

Se implementa el hook unificado:
```typescript
export function useCanAccess(permissionKey: string): boolean {
  const { user, permissions } = useAuthStore.getState();
  if (user?.rol === 'ADMINISTRADOR') return true;
  if (permissions[permissionKey] !== undefined) {
    return permissions[permissionKey];
  }
  return getDefaultPermissionForRole(user?.rol, permissionKey);
}
```
Esto permite proteger cualquier botón, pestaña o módulo con:
```tsx
const canMakeDiscounts = useCanAccess('pos.apply_discounts');
{canMakeDiscounts && <button ...>Descuento Especial</button>}
```

---

## 5. Estrategia de Pruebas Automatizadas (TDD)
1. `src/tests/userCreation.schema.test.ts`: Validación de campos obligatorios, formato de cédula y contraseñas.
2. `src/tests/userManagementService.test.ts`: Creación de usuarios con contraseña = cédula, bandera `mustChangePassword` y matriz de permisos.
3. `src/tests/tenantOnboardingWizard.test.tsx`: Renderizado del wizard en 2 pasos y paso fluido entre pantallas.
4. `src/tests/loginViewDual.test.tsx`: Switch entre login y registro, validación de credenciales y modal de primer acceso.
5. `src/tests/mandatoryPasswordChange.test.tsx`: Bloqueo de acceso hasta que se cambie la contraseña provisional.
