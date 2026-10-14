# Desglose de Tareas de Implementación (Tasks): SPEC-013

**Módulo:** Identidad de Usuario, Rol y Vendedor Activo en POS  
**Límite WIP:** 1 tarea a la vez  
**Fecha:** 2026-10-14  

---

## Tarea 1 (TASK-013-01): Modelo de Datos & Utilidades de Roles [COMPLETADA]
* **Objetivo:** Extender la interfaz `Empleado` en [useEmployeeStore.ts](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/store/useEmployeeStore.ts) con `pinAcceso?: string` y `avatarColor?: string`. Crear el módulo utilitario `src/utils/roleMapper.ts` con tipado estricto y seeds iniciales de colaboradores con PIN por defecto (`'1234'`).
* **Test TDD:** Crear `src/tests/posSellerAssignment.test.tsx` verificando el mapeo determinista de roles y la inicialización de credenciales.
* **Resultado:** 100% implementado y probado (4/4 tests verdes).

## Tarea 2 (TASK-013-02): Estado de Sesión Global en `useAppStore` [COMPLETADA]
* **Objetivo:** Incorporar `currentUser: ActiveUserSession | null` y `setCurrentUser()` en [useAppStore.ts](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/store/useAppStore.ts), con persistencia en `localDb` y sincronización inmediata de `userRole`.
* **Test TDD:** Verificar en `src/tests/posSellerAssignment.test.tsx` la reactividad del cambio de usuario y la persistencia local.
* **Resultado:** 100% implementado y probado (3/3 tests verdes).

## Tarea 3 (TASK-013-03): Componente Táctil `UserSwitchModal` (Regla 12 Años) [COMPLETADA]
* **Objetivo:** Crear `src/components/layout/UserSwitchModal.tsx` con selección de colaborador por tarjetas visuales y Keypad numérico táctil (0-9, backspace, 4 bullets enmascarados, feedback visual). Validar PIN contra `pinAcceso`.
* **Test TDD:** Probar renderizado, ingreso de PIN correcto (cierre exitoso) y PIN incorrecto (shake/error).
* **Resultado:** 100% implementado y probado (3/3 tests verdes en la suite; 10/10 en total).

## Tarea 4 (TASK-013-04): Integración en `EnterpriseTopbar` & `POSView` Header [COMPLETADA]
* **Objetivo:**
  1. Reemplazar el avatar estático `"Yu"` en [EnterpriseTopbar.tsx](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/components/layout/EnterpriseTopbar.tsx) por el avatar interactivo del colaborador activo con botón para conmutar usuario.
  2. Agregar el banner de vendedor activo en la barra superior de [POSView.tsx](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/POSView.tsx) con el botón táctil `"Cambiar Vendedor"`.
* **Test TDD:** Verificar que al hacer clic en `"Cambiar Vendedor"` se active el modal sin afectar los ítems del carrito.
* **Resultado:** 100% implementado y probado (1/1 test verde; badge `#pos-seller-badge` y botón conmutador integrados).

## Tarea 5 (TASK-013-05): Trazabilidad de Vendedor en el Motor de Ventas POS [COMPLETADA]
* **Objetivo:** En [POSView.tsx](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/POSView.tsx) (función `handleCobrar` y generación de ventas), inyectar de forma obligatoria `vendedorId: currentUser.empleadoId`, `vendedorNombre: currentUser.nombre` y `cajeroId: currentUser.empleadoId` en la orden y en el movimiento de caja.
* **Test TDD:** Probar que cada venta terminada contenga la atribución exacta del vendedor para reportes de comisiones.
* **Resultado:** 100% implementado y probado (1/1 test verde; campos tipados en `Venta` y persistidos en `pos_orders`).

## Tarea 6 (TASK-013-06): Quality Gate de Cierre & Bucle DevTools [COMPLETADA]
* **Objetivo:** Ejecución de `tsc --noEmit` (0 errores), 100% de tests verdes en Vitest (424 tests), y verificación en vivo con Chrome DevTools (consola JS con 0 errores y responsividad a 375 px).
* **Resultado:** 0 errores en TypeScript estricto, 61 suites pasadas al 100% (424/424 tests verdes). Cierre de especificación exitoso.
