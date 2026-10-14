# Lista de Verificación de Calidad (Quality Checklist): SPEC-013

**Módulo:** Identidad de Usuario, Rol y Vendedor Activo en POS  
**Estándar:** ISO/IEC 25010 (Product Quality) + WCAG 2.2 AA+ + SDD v3.0  
**Fecha:** 2026-10-14  

---

## 1. Integridad y Coherencia de Datos (Data Integrity)
- [ ] **CHK-DAT-01:** La entidad `ActiveUserSession` está fuertemente tipada en TypeScript y exportada centralmente.
- [ ] **CHK-DAT-02:** Los colaboradores en `useEmployeeStore` incluyen el campo `pinAcceso` (4 dígitos numéricos) y un valor por defecto seguro (`'1234'`) para retrocompatibilidad.
- [ ] **CHK-DAT-03:** La homologación entre `rolAcceso` (RRHH) y `UserRole` (`useAppStore`) es determinista y no permite estados inválidos.
- [ ] **CHK-DAT-04:** Cada orden o venta registrada en el POS inyecta obligatoriamente `vendedorId`, `vendedorNombre` y `cajeroId`.
- [ ] **CHK-DAT-05:** La persistencia en `localDb` almacena la última sesión activa del usuario para reanudar el trabajo tras recargar la página.

## 2. Accesibilidad y Frontera UX (Regla del Niño de 12 Años & WCAG 2.2 AA+)
- [ ] **CHK-UX-01:** El teclado numérico del PIN cuenta con teclas táctiles con área de toque mínima de $48 \times 48\text{ px}$.
- [ ] **CHK-UX-02:** Contraste de color superior a 4.5:1 en modo claro para textos y elementos numéricos.
- [ ] **CHK-UX-03:** Feedback táctil y visual inmediato (círculos rellenos para los 4 dígitos del PIN y animación en caso de PIN incorrecto).
- [ ] **CHK-UX-04:** Botón de "Cambiar Vendedor" en el POS claramente diferenciado, visible y accesible en un solo toque sin interrumpir el carrito.
- [ ] **CHK-UX-05:** Cero modales intrusivos o bloqueantes que no permitan cancelar o cerrar.

## 3. Seguridad Operativa y Control de Caja (Security & POS Cash Engine)
- [ ] **CHK-SEC-01:** El PIN no se expone en texto plano en la interfaz durante su digitación (se usan bullets/círculos enmascarados).
- [ ] **CHK-SEC-02:** Múltiples vendedores pueden operar bajo la misma caja física abierta sin forzar arqueos o aperturas intermedias.
- [ ] **CHK-SEC-03:** Si el usuario activo cambia a un rol no autorizado (ej. `bodega`), la navegación hacia el POS se bloquea automáticamente mediante las guardas de `AppRoute`.

## 4. Arquitectura y Spec-Driven Development (Architecture & Clean Code)
- [ ] **CHK-ARC-01:** Cero `magic strings` para el usuario y vendedor. Todo se referencia vía `currentUser.empleadoId` y `currentUser.nombre`.
- [ ] **CHK-ARC-02:** El Topbar visualiza el avatar dinámico del colaborador activo y su nombre real, eliminando el "Yu" hardcodeado.
- [ ] **CHK-ARC-03:** Suite de pruebas unitarias Vitest con cobertura $\ge 90\%$ para la autenticación por PIN, conmutación y persistencia de vendedor.
- [ ] **CHK-ARC-04:** 0 errores de compilación con `tsc --noEmit` y 100% de tests verdes en la suite global (412+ tests).
