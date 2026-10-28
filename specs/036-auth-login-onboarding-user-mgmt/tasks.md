# Tareas de Implementación: SPEC-036 - Gestión de Usuarios, Onboarding & Multi-Empresa

```
[TASK-036-01: Esquemas Zod & Contratos] ───► [TASK-036-02: UserManagementService & Supabase Auth] ───► [TASK-036-03: Wizard 2 Pasos Registro Empresa] ───► [TASK-036-04: LoginView Dual & Cambio Password] ───► [TASK-036-05: UserCreationModal con Matriz Checkboxes] ───► [TASK-036-06: Selector Multi-Empresa & Quality Gate Final]
```

---

### [x] TASK-036-01: Esquemas Zod y Tipos TypeScript de Usuarios, Contraseñas y Matriz de Permisos - COMPLETADO ✅
- **Objetivo:** Definir `UserCreationSchema`, `MandatoryPasswordChangeSchema`, `PermissionsMatrixSchema` e interfaces TypeScript correspondientes en `src/schemas/` y `src/types/`.
- **Archivos:** `src/schemas/auth.schema.ts`, `src/types/auth.types.ts`, `src/schemas/permissions.schema.ts`, `src/tests/userCreation.schema.test.ts`.
- **Criterio de Aceptación:** Validación estricta de nombres, formato numérico de cédula, correos RFC 5322, celulares y reglas de fortaleza de contraseña. 100% pruebas en verde (8/8 en `userCreation.schema.test.ts` y 34/34 en suite auth global), `tsc --noEmit` con 0 errores.

---

### [x] TASK-036-02: Servicio `userManagementService` y Gestión de Credenciales en Supabase Auth - COMPLETADO ✅
- **Objetivo:** Implementar la lógica para crear usuarios en el tenant asignando su cédula como contraseña predeterminada, marcando `mustChangePassword = true`, y el método para cambiar la contraseña obligatoria en primer login (`updateInitialPassword`).
- **Archivos:** `src/services/userManagementService.ts`, `src/services/authService.ts`, `src/services/localDb.ts`, `src/tests/userManagementService.test.ts`.
- **Criterio de Aceptación:** Creación de usuarios con persistencia segura (Supabase Auth / LocalDb fallback), hashing seguro, verificación de cédula y correo únicos por empresa, cambio forzoso de contraseña en primer acceso, 6/6 tests en verde y `tsc --noEmit` con 0 errores.

---

### [x] TASK-036-03: Componente Guiado de 2 Pasos para Onboarding de Empresa y Administrador - COMPLETADO ✅
- **Objetivo:** Desarrollar el componente de registro guiado: Paso 1 (Datos de la Empresa: Razón Social, NIT, Ciudad, Teléfono) y Paso 2 (Datos del Administrador: Nombre completo, Cédula, Correo corporativo, Celular).
- **Archivos:** `src/views/auth/components/TenantOnboardingWizard.tsx`, `src/services/tenantOnboardingService.ts`, `src/tests/tenantOnboardingWizard.test.tsx`.
- **Criterio de Aceptación:** Transición fluida entre pasos, validaciones en vivo, auto-aprovisionamiento de Bodega 1 y Caja 01, auto-registro del administrador con cédula como contraseña provisional, 4/4 tests en verde y `tsc --noEmit` con 0 errores.

---

### [x] TASK-036-04: Vista Dual de Inicio de Sesión V8 y Modal de Cambio Obligatorio de Contraseña - COMPLETADO ✅
- **Objetivo:** Construir `LoginView.tsx` en estética Dark Glassmorphism V8 (`#070A10`) con toggle superior `[Iniciar Sesión] | [Registrar Empresa]`, integrando el modal forzoso `MandatoryChangePasswordModal.tsx` cuando `mustChangePassword === true`.
- **Archivos:** `src/views/auth/LoginView.tsx`, `src/views/auth/components/MandatoryChangePasswordModal.tsx`, `src/store/useAuthStore.ts`, `src/tests/loginViewDual.test.tsx`.
- **Criterio de Aceptación:** Inicio de sesión exitoso por correo/contraseña y Google OAuth, bloqueo ante contraseñas provisionales hasta su actualización en `MandatoryChangePasswordModal`, 4/4 tests en verde en `loginViewDual.test.tsx` y `tsc --noEmit` con 0 errores.

---

### [x] TASK-036-05: Modal de Creación de Usuarios con Matriz de Checkboxes Personalizada - COMPLETADO ✅
- **Objetivo:** Crear `UserCreationModal.tsx` con formulario compacto (Nombre, Cédula, Correo, Celular, Rol) y matriz interactiva de permisos organizados por módulo (POS, Caja, Inventario, Compras, Configuración).
- **Archivos:** `src/views/admin/components/UserCreationModal.tsx`, `src/views/admin/SuperAdminMasterView.tsx`, `src/tests/userCreationModal.test.tsx`.
- **Criterio de Aceptación:** Creación de usuarios con asignación automática de cédula como password, guardado de permisos granulares por checkbox y feedback con SweetAlert2.
- **Certificación TDD:** 7/7 tests unitarios pasando en `userCreationModal.test.tsx` (26/26 acumulados en SPEC-036), 0 errores en `tsc --noEmit` y suite de integración SuperAdmin pasando al 100%.

---

### [x] TASK-036-06: Selector Visual Multi-Empresa y Quality Gate Final Pre-Despliegue - COMPLETADO ✅
- **Objetivo:** Implementar `TenantSelectorModal.tsx` para usuarios que pertenecen a múltiples empresas (o SuperAdmin/UltraAdmin), ejecutar Quality Gate integral (`tsc --noEmit`, suite completa Vitest, auditoría GitNexus) y validación en Chrome DevTools MCP (375 px y 0 errores consola).
- **Archivos:** `src/views/auth/components/TenantSelectorModal.tsx`, `src/components/layout/EnterpriseTopbar.tsx`, `src/store/useAuthStore.ts`, `src/types/auth.types.ts`, `src/views/auth/components/DevFastLoginDrawer.tsx`, `database/37_tenants_and_invitations.sql`, `src/tests/tenantSelectorModal.test.tsx`, `MEMORY.md`.
- **Criterio de Aceptación:** Conmutación de tenant en 1 toque, sincronización de UltraAdmin `pezcaderia.2022@gmail.com` con GOD_MODE, badges de rubro (PESCADERIA/FERRETERIA), 100% tests en verde (37/37 pruebas), 0 errores en `tsc --noEmit`, 0 errores en consola JS y validación en Chrome DevTools a 375 px.
