# Lista de Verificación de Calidad: /speckit.checklist (SPEC-036)

**Código:** SPEC-036  
**Fase:** /speckit.checklist (SDD v3.0)  
**Ticket:** AUTH-ONBOARDING-USER-MGMT-V8  
**Fecha:** 2026-10-27  

---

## 1. Estándares de Seguridad y Autenticación (NIST & OWASP)
- [ ] **OWASP Top 10 A07 (Identification and Authentication Failures):** Contraseñas hasheadas de forma segura en Supabase Auth (bcrypt).
- [ ] **NIST SP 800-63B (Temporary Credentials):** Las contraseñas iniciales basadas en cédula son estrictamente temporales; el flag `must_change_password` impide el uso prolongado de credenciales predecibles.
- [ ] **Validación Zod Estricta en Frontera:** Todos los formularios validan formato de correo RFC 5322, longitud mínima de contraseña (8 caracteres al cambiar), NIT numérico con dígito y teléfono mínimo 7 dígitos.
- [ ] **Sanitización de Entradas:** Limpieza de espacios en blanco (`trim`), minúsculas forzadas en correos (`toLowerCase()`) y remoción de caracteres no numéricos en cédulas.

---

## 2. Integración Supabase Auth 2.0 & Multi-Tenancy
- [ ] **PKCE Flow:** Configuración de `signInWithOAuth` con flujo PKCE y persistencia segura de token de sesión (`persistSession: true`).
- [ ] **Tenant Isolation:** Cada usuario y empleado queda estrictamente indexado por `tenant_id` en las tablas `tenant_memberships` y `user_permissions`.
- [ ] **Aprovisionamiento Transaccional:** El registro de empresa garantiza la creación simultánea de la membresía de `owner`, la primera Bodega y la primera Caja.

---

## 3. Experiencia de Usuario & Sistema de Diseño Dark Glassmorphism V8
- [ ] **Paleta Abisal V8:** Fondo `#070A10`, contenedores con `bg-slate-900/60`, bordes sutiles `border-white/10` y desenfoque `backdrop-blur-xl`.
- [ ] **Ergonomía Táctil (Regla de los 48 px):** Todos los botones, campos de texto y checkboxes tienen una zona interactiva mínima de 48 px.
- [ ] **Alertas Intuitivas:** Notificaciones con SweetAlert2 para errores de autenticación, éxito de registro y confirmaciones.
- [ ] **Mobile Responsive (375 px):** Renderizado perfecto y usable en pantallas de smartphones sin desbordamiento horizontal.

---

## 4. Gobernanza y Calidad de Código
- [ ] **TDD Quirúrgico:** Cada componente o servicio cuenta con su suite de pruebas unitarias en Vitest con 100% pasando antes de integrarse.
- [ ] **TypeScript Estricto:** `tsc --noEmit` ejecutado con 0 errores y sin uso de `any` inseguro.
- [ ] **GitNexus Blast Radius:** Análisis de impacto en nivel `low` sin alterar flujos existentes del POS o WMS.
- [ ] **DevTools MCP Loop:** 0 errores en consola JavaScript del navegador.
