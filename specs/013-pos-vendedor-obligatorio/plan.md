# Plan de Implementación Técnica (Plan): SPEC-013

**Módulo:** Identidad de Usuario, Rol y Vendedor Activo en POS  
**Estado:** DRAFT (Esperando Aprobación)  
**Arquitectura:** React 18 + TypeScript estricto + Zustand + Tailwind CSS + LocalStorage/Supabase  
**Fecha:** 2026-10-14  

---

## 1. Arquitectura de Estado y Modelo de Datos

### 1.1. Ampliación del Modelo `Empleado` ([useEmployeeStore.ts](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/store/useEmployeeStore.ts))
Se agrega el campo `pinAcceso?: string` (4 dígitos) y `avatarColor?: string` a la interfaz `Empleado`.
```typescript
export interface Empleado {
  id: string;
  nombre: string;
  identificacion: string;
  rolAcceso: 'ADMINISTRADOR' | 'VENDEDOR' | 'BODEGUERO' | 'REPARTIDOR' | 'GERENTE';
  cargo: string;
  pinAcceso?: string; // 4 dígitos numéricos, ej: '1234'
  avatarColor?: string; // HSL o tailwind gradient
  // ... resto de campos existentes
}
```

### 1.2. Mapeo Canónico de Roles (`rolAcceso` $\leftrightarrow$ `UserRole`)
Función utilitaria pura en `src/utils/roleMapper.ts`:
- `'ADMINISTRADOR'` | `'GERENTE'` $\rightarrow$ `'admin'`
- `'VENDEDOR'` $\rightarrow$ `'vendedor'`
- `'BODEGUERO'` $\rightarrow$ `'bodega'`
- `'REPARTIDOR'` $\rightarrow$ `'administrativo'`

### 1.3. Estado de Sesión en `useAppStore.ts`
Se incorpora `currentUser: ActiveUserSession | null` y las acciones:
- `setCurrentUser(user: ActiveUserSession)`: persiste en `localDb.save('currentUser', user)` y sincroniza automáticamente `userRole = user.rol`.
- `logoutUser()`: limpia la sesión actual y solicita PIN para reingresar.

---

## 2. Componentes UI / UX (Regla del Niño de 12 Años)

### 2.1. `UserSwitchModal.tsx` (`src/components/layout/UserSwitchModal.tsx`)
Modal accesible desde el Topbar o disparado por el POS:
1. **Paso 1 (Selección de Perfil):** Grid de tarjetas grandes con avatar, iniciales, nombre y badge del rol.
2. **Paso 2 (Digitación de PIN):** Keypad táctil 0-9 con botones amplios ($\ge 56\text{ px}$), tecla de retroceso ("⌫"), 4 indicadores circulares de PIN enmascarado.
3. Validación contra el `pinAcceso` del empleado (por defecto `'1234'`).
4. Al validar exitosamente, llama a `setCurrentUser(...)` y cierra el modal con alerta visual SweetAlert2 toast amigable.

### 2.2. Actualización de `EnterpriseTopbar.tsx`
- Reemplazar el contenedor estático `"Yu"` por un botón interactivo táctil:
  `[Avatar con Iniciales] [Nombre Corto] [Badge Rol]`.
- Al hacer clic, abre `UserSwitchModal` para alternar usuario rápidamente.

### 2.3. Cabecera Contextual del POS (`POSView.tsx`)
- En la barra superior del POS, se renderiza un panel de identificación de vendedor activo:
  `Vendedor: [Avatar] Carlos Vendedor (Mostrador) | [Botón: Cambiar Vendedor]`.
- Si no hay usuario activo o el usuario activo tiene rol `bodega` (sin acceso a POS), el POS abre automáticamente `UserSwitchModal`.
- Al facturar (`handleCobrar`), se incluye en la transacción:
  ```typescript
  vendedorId: currentUser.empleadoId,
  vendedorNombre: currentUser.nombre,
  cajeroId: currentUser.empleadoId,
  ```

---

## 3. Estrategia de Pruebas TDD (Quality Gate)
- **Suite de Pruebas:** `src/tests/posSellerAssignment.test.tsx`
  1. Test de mapeo de roles `rolAcceso` a `UserRole`.
  2. Test de validación de PIN en `UserSwitchModal` (éxito vs error con PIN erróneo).
  3. Test de persistencia de sesión en `useAppStore`.
  4. Test de inyección de `vendedorId` y `vendedorNombre` en la venta de POS.
  5. Test de cambio de vendedor sin perder los ítems en el carrito.
- **Verificación de Regresión:**
  - `tsc --noEmit` con 0 errores.
  - Ejecución de los 412 tests existentes en Vitest manteniendo el 100% verde.
  - Bucle DevTools (0 errores en consola JS y renderizado en 375 px).
