## 2026-10-30T12:02:03Z

This is a single self-contained fix; keep it small and focused. Ajustar el inicio de sesión y control de permisos por rol en el ERP, de modo que los vendedores no tengan acceso a movimientos de caja ni a recaudos de dinero, pero sí puedan emitir preventas en el mostrador y visualizar el avance del flujo de venta en el Kanban en modo sólo lectura sin poder editarlo ni liquidarlo.

Integrity mode: development

## Requirements

### R1. Control de acceso y visibilidad de caja para el rol vendedor
Ocultar por completo las opciones, rutas y vistas relacionadas con movimientos de caja (apertura, cierre, retiros parciales, arqueos y caja central) para los usuarios autenticados con rol de vendedor. Restringir la ejecución de recaudos de dinero y liquidación en ventanilla para este rol, asegurando que las acciones de cobro queden reservadas a los roles autorizados.

### R2. Emisión de preventas y vista de seguimiento de flujo en modo sólo lectura
Permitir a los usuarios con rol de vendedor crear y emitir preventas/comandas normalmente desde el mostrador (POS). Habilitar para ellos la visualización del Kanban de flujo de ventas en modo de sólo lectura para seguir el avance del pedido por sus etapas, asegurando que los botones de confirmación de pago, cobro o edición de pedidos permanezcan inactivos u ocultos para el vendedor.

## Acceptance Criteria

### Control de Permisos y Ocultamiento de Caja
- [ ] Para usuarios con rol vendedor, los accesos, vistas y botones de movimientos de caja (apertura, cierre, retiros, arqueos) no son visibles en la interfaz de navegación ni en los paneles del módulo.
- [ ] Los usuarios con rol vendedor no pueden pulsar botones de cobro, recaudo o "Confirmar Pago de Venta" en el Kanban ni liquidar pedidos en ventanilla.
- [ ] Usuarios con roles autorizados (cajero o admin) conservan acceso completo a las funciones de caja y recaudo.

### Mostrador y Kanban de Ventas
- [ ] Los usuarios con rol vendedor pueden registrar productos y emitir preventas/comandas con éxito desde el POS.
- [ ] Los usuarios con rol vendedor pueden visualizar el Kanban de pedidos para monitorear el avance de las comandas sin opciones de edición ni cobro activas.

### Calidad y Regresión
- [ ] La compilación estricta de TypeScript (`npx tsc --noEmit`) finaliza sin errores.
- [ ] La suite de pruebas unitarias (`npm run test`) pasa al 100%.
- [ ] La navegación y cambio de rol en la interfaz no produce errores ni advertencias no controladas en la consola de JavaScript.

## Verification Resources
- Compilación TypeScript: `npx tsc --noEmit`
- Pruebas automatizadas: `npm run test` (Vitest)
- Verificación interactiva de interfaz en navegador con Chrome DevTools: alternar entre roles (Vendedor, Cajero, Admin) y validar visibilidad de navegación, emisión de comanda en mostrador y restricción de botones de cobro en el Kanban.
