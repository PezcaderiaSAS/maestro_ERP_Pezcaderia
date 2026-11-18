# Plan de Implementación y Lista de Verificación (SPEC-065)

**Módulo:** Flujo Diario de Caja, Separación de Roles RBAC y Conmutador de Empresas Ergonómico  
**Alineación:** SDD v3.0, Lean Kanban (WIP = 1), WCAG 2.2 AA+, Dark Glassmorphism / Light Mode POS  

---

## 1. Decisiones Acordadas en el Protocolo `/grill-me`

1. **Conmutador de Empresas (UI/UX):**
   - **Seleccionado:** Popover flotante compacto anclado al botón del encabezado. Conmuta en 1 clic, auto-cierra de inmediato y notifica vía Toast suave sin oscurecer ni tapar la pantalla del POS.
2. **Apertura de Caja (Base Inicial):**
   - **Seleccionado:** Entrada directa del monto total con opción colapsable de desglose detallado de billetes/monedas (operación ágil y flexible).
3. **Bloqueo Operativo con Caja Cerrada:**
   - **Seleccionado:** Despliegue automático del Asistente de Apertura de Caja al ingresar como cajero si no hay turno activo, bloqueando botones de cobro hasta abrir turno.

---

## 2. Checklist de Verificación de Calidad (/speckit.checklist)

- [ ] **CH-01 (UI/UX No Invasiva):** El conmutador de empresas ya no abre un modal en pantalla completa que tape el POS. Se despliega como popover compacto (`w-84`) bajo el botón.
- [ ] **CH-02 (Conmutación Instantánea):** Al hacer clic en una empresa en el popover, se aplica el cambio en `useAuthStore`, se invocan los stores del tenant correspondiente (`ferreteriaJosaseService`) y el popover se cierra automáticamente.
- [ ] **CH-03 (Gatekeeper de Caja Cerrada):** Si un cajero ingresa a la vista POS sin turno abierto (`estado !== 'ABIERTO'`), el sistema no permite facturar ni cobrar; el botón principal indica claramente "Abrir Turno Requerido" y abre el modal de apertura.
- [ ] **CH-04 (Apertura Ágil):** `AperturaCajaModal` permite digitar la base directamente (ej. $100.000) o desglosar denominaciones si se requiere mayor control.
- [ ] **CH-05 (Separación Estricta de Roles):** El rol `VENDEDOR_MOSTRADOR` únicamente tiene habilitado el botón "Emitir Comanda (F6)" y no puede acceder a cobros directos en efectivo ni a la administración de cajas.
- [ ] **CH-06 (Auditoría e Inmutabilidad):** Todo movimiento de apertura genera un registro formal en `turnos_caja` y un movimiento de tipo `INGRESO_BASE_INICIAL` en `movimientos_caja`.
- [ ] **CH-07 (Quality Gate):** Cero errores en `tsc --noEmit`, suite Vitest al 100% pasando y verificación DevTools móvil (375 px) y escritorio.

---

## 3. Plan Técnico Detallado (/speckit.plan)

### Fase 1: Componente `TenantDropdownPopover`
- Implementar `src/components/layout/TenantDropdownPopover.tsx` utilizando React Portal o posicionamiento absoluto con ref `useRef` y detector de clic externo (`mousedown`).
- Integrar lista de tenants desde `superAdminService.getTenants()`.
- Al conmutar:
  - `useAuthStore.getState().switchTenant(...)`
  - Si es Ferretería Josase (`tenant-03`): `ferreteriaJosaseService.applyToStores()`
  - Si es La Pezcadería (`tenant-01`): `ferreteriaJosaseService.restorePezcaderiaStores()`
  - Toast SweetAlert2 breve (`timer: 2000`).
- Reemplazar el disparador en `src/components/layout/EnterpriseTopbar.tsx` y `src/views/pos/components/POSMultivendorLightHeader.tsx`.

### Fase 2: Rediseño Ergonómico de `AperturaCajaModal`
- Modificar `src/views/pos/components/AperturaCajaModal.tsx`:
  - Entrada numérica principal de base de efectivo formateada (`NumericFormat` con prefijo `$ `).
  - Sugerencia de saldo base predeterminado ($100.000 COP) en 1 toque.
  - Acordeón colapsable opcional "Desglose por denominaciones" (billetes de 100k, 50k, 20k, 10k, 5k, 2k y monedas).
  - Integración reactiva con `useCashStore.abrirTurno()`.

### Fase 3: Gatekeeper de Turno y Separación de Roles en `POSView`
- Modificar `src/views/POSView.tsx`:
  - Detectar reactivamente si el usuario actual es Cajero (`isModoCajero === true` o rol cajero).
  - Si `!isTurnoAbierto`:
    - Auto-abrir `AperturaCajaModal` al montar el POS.
    - Cambiar el botón de pago/cobro por un botón bloqueado con estilo ámbar/rojo: "🔒 Apertura de Caja Requerida".
  - Si el usuario es Vendedor Mostrador:
    - Ocultar botones de arqueo y cobro directo; solo permitir "Emitir Comanda (F6)".

### Fase 4: Pruebas y Validación TDD
- Crear pruebas unitarias para `TenantDropdownPopover`.
- Crear pruebas de integración para el gatekeeper de turno de caja en `POSView`.
- Ejecutar `tsc --noEmit` y suite de tests.

