# Especificación de Requerimiento (Spec): Identidad de Usuario, Rol y Vendedor Activo en POS

**Código:** SPEC-013  
**Título:** Autenticación por PIN Táctil, Gobernanza de Roles y Trazabilidad de Vendedor en POS  
**Estado:** DRAFT (Esperando Aprobación)  
**Autor:** Principal Software Engineer (SDD)  
**Fecha:** 2026-10-14  

---

## 1. Resumen Ejecutivo y Propósito ("Por qué")
Actualmente en La Pezcadería ERP, el usuario activo se reduce a un string global genérico (`userRole: 'admin' | 'vendedor' | 'bodega' | 'administrativo'`), sin vincular la persona real que opera la terminal. En el punto de venta (POS), las ventas se registran con el actor genérico del rol (`usuarioResponsable: userRole || 'cajero-pos'`), lo que imposibilita:
1. Saber con certeza qué colaborador exacto atendió a cada cliente o cobró cada ticket.
2. Generar informes de rendimiento y comisiones por vendedor.
3. Realizar auditorías precisas ante descuadres de caja o devoluciones.

**Propósito:** Establecer una única fuente de verdad de identidad (`currentUser: ActiveUserSession`) originada en el directorio de colaboradores de RRHH (`useEmployeeStore`), con un mecanismo de autenticación rápido mediante PIN de 4 dígitos táctil (diseñado bajo la Regla del Niño de 12 Años). Cada usuario autenticado tendrá su rol respectivo gobernando la navegación (`AppRoute`), y en el POS será quien firme y genere de forma obligatoria las ventas para su reporte de comisiones.

---

## 2. Definición del Requerimiento ("Qué")

### 2.1. Entidad Canónica de Sesión (`ActiveUserSession`)
En `src/store/useAppStore.ts` y `src/types/auth.types.ts`:
```typescript
export interface ActiveUserSession {
  empleadoId: string;
  nombre: string;
  identificacion: string;
  cargo: string;
  rol: UserRole; // 'admin' | 'vendedor' | 'bodega' | 'administrativo'
  avatarColor?: string;
  turnoIniciadoAt: string;
}
```

### 2.2. Fuente de Verdad Unificada en RRHH (`useEmployeeStore`)
- Cada colaborador en `Empleado` (`useEmployeeStore.ts`) tendrá un campo opcional/por defecto `pinAcceso: string` (4 dígitos numéricos, por defecto `'1234'`).
- Los roles de acceso de RRHH (`rolAcceso`) se homologan biyectivamente a `UserRole`:
  - `ADMINISTRADOR` / `GERENTE` $\rightarrow$ `'admin'`
  - `VENDEDOR` $\rightarrow$ `'vendedor'`
  - `BODEGUERO` $\rightarrow$ `'bodega'`
  - `REPARTIDOR` / Otro $\rightarrow$ `'administrativo'`

### 2.3. Modal Táctil de Selección de Colaborador y PIN (`UserSwitchModal`)
- Diseñado para pantallas táctiles y tablets:
  - Paso 1: Cuadrícula visual de avatares grandes con nombre del colaborador y cargo.
  - Paso 2: Teclado numérico táctil grande (Keypad 0-9) con 4 círculos de feedback para ingresar el PIN.
  - Validación instantánea: si el PIN es correcto, fija la sesión activa, actualiza el avatar y rol en el Topbar, y desbloquea el POS. Si es incorrecto, emite shake animation y sonido de error.

### 2.4. Comportamiento en el Módulo POS (`POSView`)
- **Sesión Continua:** El vendedor permanece autenticado ticket tras ticket.
- **Header Contextual:** En la parte superior del POS se renderiza un badge táctil prominente:
  `[Avatar] Nombre del Vendedor (Vendedor) | Botón: Cambiar Vendedor`.
- **Gobernanza de Cobro:** Al presionar `Cobrar` o generar un ticket, el payload de la orden inyecta obligatoriamente:
  - `vendedorId: currentUser.empleadoId`
  - `vendedorNombre: currentUser.nombre`
  - `cajeroId: currentUser.empleadoId`
- **Reportes de Ventas por Vendedor:** En `CashFlowView` y `DashboardView`, se habilita la pestaña o métrica de **Ventas por Vendedor** agrupando total vendido, número de tickets y comisión estimada.

---

## 3. Requerimientos Funcionales en Notación EARS

### EARS-01: Autenticación Obligatoria al Cargar
* **Condición Ubicua:** El sistema SIEMPRE debe mantener un colaborador activo en `useAppStore.currentUser`. Si no existe sesión previa en `localDb`, debe abrir automáticamente el `UserSwitchModal` con los colaboradores de prueba iniciales (ej. Yurgen Admin, Carlos Vendedor, Diana Mostrador).

### EARS-02: Conmutación de Vendedor en POS
* **Evento (When):** Cuando el operario pulsa el botón táctil "Cambiar Vendedor" en el encabezado del POS,
* **Acción:** El sistema debe suspender la interacción del carrito actual (manteniéndolo intacto) y abrir el `UserSwitchModal` para que el nuevo vendedor ingrese su PIN.

### EARS-03: Paso Seguro del Vendedor al Ticket
* **Evento (When):** Cuando se confirma un cobro en efectivo, transferencia o tarjeta en `PaymentPanel`,
* **Acción:** El sistema debe registrar de forma inmutable el `vendedorId` y `vendedorNombre` en la transacción de venta y en el movimiento de caja respectivo.

### EARS-04: Turno de Caja Compartido
* **Condición de Estado (While):** Mientras la caja física tenga un turno abierto (`turnoActivo.estado === 'ABIERTO'`),
* **Acción:** Cualquier colaborador con rol `vendedor` o `admin` podrá registrar ventas bajo esa misma caja física sin exigir apertura ni cierre de caja individual, quedando cada venta atribuida a su respectivo `vendedorId`.

---

## 4. Criterios de Aceptación (Quality Gate)
1. **Zero Magic Strings:** El vendedor e identidad se extraen de `currentUser` en `useAppStore`.
2. **Pruebas Automatizadas TDD:** Suite completa en `src/tests/posSellerAssignment.test.tsx` validando selección de vendedor, ingreso de PIN, cambio de vendedor y atribución de ventas en tickets.
3. **Regla del Niño de 12 Años:** El modal táctil debe tener botones de mínimo 48x48px, texto de alto contraste WCAG AA+ y teclado numérico intuitivo.
4. **100% Tests Verdes:** Cero regresiones en la suite global Vitest (412+ tests).
