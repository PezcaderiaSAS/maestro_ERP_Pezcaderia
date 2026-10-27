# Control de Calidad 1: /speckit.clarify (SPEC-036)

**Código:** SPEC-036  
**Fase:** /speckit.clarify (SDD v3.0)  
**Ticket:** AUTH-ONBOARDING-USER-MGMT-V8  
**Fecha:** 2026-10-27  

---

## 1. Matriz de Clarificaciones y Mitigación de Riesgos

| ID | Área / Dimensión | Ambigüedad o Riesgo Identificado | Resolución Técnica Acordada |
| :--- | :--- | :--- | :--- |
| **CLR-01** | **Supabase Auth 2.0 Integration** | ¿Cómo se aprovecha Supabase Auth para usuarios creados por el administrador con contraseña predeterminada? | Se utiliza `supabase.auth.signUp({ email, password: identificacion, options: { data: { full_name, identificacion, role, must_change_password: true } } })`. El backend o adapter local almacena la metadata y marca la bandera `must_change_password: true`. |
| **CLR-02** | **Cédula como Contraseña Inicial** | Riesgo de seguridad por predictibilidad de la cédula como credencial inicial (señalado por Agency Swarm). | **Mitigación Estricta:** Al detectar `must_change_password === true`, la sesión queda en estado provisional `MUST_CHANGE_PASSWORD`. El usuario no puede navegar ni consultar APIs del ERP hasta que invoque `supabase.auth.updateUser({ password: newPassword })`, actualizando su credencial personal. |
| **CLR-03** | **Matriz de Permisos por Checkbox** | ¿Cómo se evalúan los permisos si un usuario tiene un rol asignado pero sus checkboxes difieren? | La matriz de permisos por checkboxes tiene **precedencia explícita**: si un permiso está en `true` o `false` en la matriz del usuario, se respeta ese valor; si no está definido, hereda los permisos por defecto de su rol base. |
| **CLR-04** | **Aprovisionamiento Atómico de Empresa** | ¿Qué ocurre si falla la creación de la bodega o caja durante el registro de la empresa? | El servicio `tenantOnboardingService` ejecuta el alta dentro de una transacción atómica coordinada: si falla la creación de la empresa o de su bodega inicial, se cancela la creación del admin y se informa con SweetAlert2. |
| **CLR-05** | **Offline & Fallback Resilience** | ¿Cómo opera el login si el usuario no tiene conexión a internet? | Si Supabase no responde o está en modo offline, el sistema consulta el almacén local seguro (`LocalDb` / IndexedDB) para validar la última sesión persistida y permitir el cobro en terminales POS en modo contingencia. |

---

## 2. Decisiones Arquitectónicas Derivadas de /grill-me

1. **Registro Guiado en 2 Pasos:**
   - Paso 1: Datos de la Empresa (Razón Social, NIT, Ciudad, Teléfono).
   - Paso 2: Datos del Administrador Fundador (Nombre, Cédula, Correo, Celular).
2. **Formulario Compacto de Usuario:**
   - Campos estrictos obligatorios: Nombre completo, Cédula (contraseña provisional), Correo (login), Celular y Rol base.
3. **Matriz 100% Personalizada por Checkboxes:**
   - Interfaz con interruptores/checkboxes organizada por módulos (POS, Caja, Inventario, Compras, Configuración).
4. **Pantalla Dual V8:**
   - Dark Glassmorphism V8 (`#070A10`), toggle superior interactivo `[Iniciar Sesión] | [Registrar Empresa]` sin recarga de página.
5. **Selector Multi-Empresa:**
   - Directo si pertenece a 1 empresa; selector modal si tiene varias empresas activas.
