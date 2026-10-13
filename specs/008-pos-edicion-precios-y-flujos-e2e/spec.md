# Especificación Brownfield SDD 008: POS — Modificación de Precios en Venta & Suite Exhaustiva de Flujos E2E

## 1. Contexto y Justificación de Negocio
En el módulo de Punto de Venta (POS) de La Pezcaderia ERP, los cajeros y administradores requieren flexibilidad comercial al momento de liquidar ventas en mostrador, permitiendo pactar y modificar el precio de venta unitario de cualquier producto en el carrito (ej. descuentos verbales, ajustes por calidad o volumen, acuerdos especiales).
Dicho ajuste no debe perderse durante la transacción ni en el ticket de venta, y cuando se trate de un cliente recurrente identificado, debe actualizar automáticamente su tarifa histórica (`lastClientPrices`).

Adicionalmente, se requiere blindar y certificar la estabilidad operativa del módulo mediante una suite de pruebas automatizadas y de ciclo de vida completo (E2E) que garantice el correcto funcionamiento de los 6 pilares operativos del POS:
1. **Apertura de turno de caja** con base inicial en efectivo.
2. **Venta multi-producto y multi-presentación** (productos en KG a granel y productos en UNIDAD) a Consumidor Final.
3. **Venta guardada (en espera) y retomada con pago mixto** (Efectivo + Transferencia/Nequi).
4. **Venta con precios de venta modificados** (con advertencia de rentabilidad si el precio es menor al costo).
5. **Venta a crédito a cliente registrado** (validación de cupo y registro en cartera de cuentas por cobrar CXC/AR).
6. **Solicitud de reabastecimiento POS** (solicitud formal de traslado interno hacia Bodega Principal).

---

## 2. Requerimientos del Sistema (Notación EARS)

### EARS-U (Ubiquitous - Requerimientos Universales)
- **EARS-U-01:** El sistema DEBE permitir a los usuarios con rol autorizado modificar el precio de venta unitario de cualquier línea de producto activa en el carrito del POS.
- **EARS-U-02:** El sistema DEBE recalcular reactivamente el subtotal de la línea (`cantidad * precioFinal`), el subtotal del pedido y el total final a cobrar cada vez que se modifique un precio unitario o una cantidad.
- **EARS-U-03:** El sistema DEBE preservar el precio modificado en el ticket emitido, en los movimientos contables de caja y en la persistencia del histórico de ventas sin sobrescribirlo con los precios del catálogo maestro.

### EARS-E (Event-Driven - Requerimientos Disparados por Eventos)
- **EARS-E-01 (Apertura de Caja):** CUANDO el cajero abra el turno de caja mediante `cashService.abrirTurno` con una base de efectivo, el sistema DEBE registrar el turno en estado `ABIERTO`, inicializar el saldo en gaveta con la base declarada y habilitar las funciones de cobro y facturación del POS.
- **EARS-E-02 (Clic en Edición de Precio):** CUANDO el usuario haga clic o toque en el precio unitario del producto en la fila del carrito (`LineaVentaRow`), el sistema DEBE abrir un diálogo interactivo táctil para ingresar el nuevo precio unitario por kilo o unidad.
- **EARS-E-03 (Alerta de Rentabilidad):** CUANDO el nuevo precio unitario ingresado sea inferior al costo de compra del producto (`linea.precioCompra`), el sistema DEBE disparar una advertencia SweetAlert2 informando que la rentabilidad está comprometida y solicitando confirmación explícita para aplicar el precio.
- **EARS-E-04 (Insignia y Restablecimiento):** CUANDO un producto tenga un precio modificado respecto a su precio de lista original, el sistema DEBE renderizar en la fila del carrito un badge `✏️ Modificado (Base: $XX.XXX)` y un enlace `Restablecer` que permita regresar al precio de catálogo original en un solo toque.
- **EARS-E-05 (Actualización de Tarifa Histórica):** CUANDO se concrete una venta con precio modificado para un cliente identificado (con NIT/cédula), el sistema DEBE actualizar automáticamente el mapa de tarifas históricas (`lastClientPrices`) de dicho cliente para recordar ese precio en futuras visitas.
- **EARS-E-06 (Venta Guardada y Retomada):** CUANDO el cajero ponga un pedido en espera (`handleGuardarBorrador`), el sistema DEBE archivar el estado completo del carrito (items, cantidades, precios modificados y cliente) en borradores y vaciar el carrito activo. Al presionar `Recuperar`, el sistema DEBE restaurar íntegramente las líneas con sus precios exactos.
- **EARS-E-07 (Cobro Mixto Cuadrado):** CUANDO el cajero seleccione pago mixto, el sistema DEBE permitir desglosar el pago entre múltiples métodos (Efectivo, Nequi, Daviplata, Datáfono, etc.) y exigir que la suma de los montos coincida exactamente con el total final a cobrar antes de autorizar el cierre.
- **EARS-E-08 (Venta a Crédito):** CUANDO se procese una venta a crédito, el sistema DEBE validar que el cliente esté registrado, que el monto no exceda su cupo disponible (`cupoCredito - deudaActual`), solicitar fecha límite de pago y generar la cuenta por cobrar en cartera (`InvoiceAR`) sin ingresar efectivo físico a la gaveta de caja.
- **EARS-E-09 (Solicitud de Reabastecimiento):** CUANDO se solicite reabastecimiento desde el POS (`internalTransferService.solicitarReabastecimientoPOS`), el sistema DEBE generar una solicitud formal de traslado de inventario hacia la bodega del POS con estado `PENDIENTE_APROBACION`.

### EARS-S (State-Driven - Requerimientos Basados en Estado)
- **EARS-S-01:** MIENTRAS el turno de caja permanezca cerrado o no exista turno activo, el sistema DEBE bloquear los botones de cobro en `PaymentPanel` e inducir la apertura de caja.
- **EARS-S-02:** MIENTRAS existan borradores de pedidos en espera, la barra `ParkedOrdersBar` DEBE mostrar el contador dinámico de pedidos pendientes listos para su recuperación rápida.

### EARS-W (Unwanted Behavior - Casos de Excepción)
- **EARS-W-01:** SI el usuario ingresa un precio de venta menor o igual a cero (excepto obsequios autorizados con subtotal > $20.000), el sistema DEBE rechazar el cambio y mantener el precio previo.
- **EARS-W-02:** SI en una venta a crédito el cliente no tiene cupo suficiente, el sistema DEBE bloquear la transacción mostrando el cupo restante disponible.
- **EARS-W-03:** SI en un cobro mixto la suma de pagos no cuadra al 100% con el total de la venta, el sistema DEBE impedir el cobro indicando el valor sobrante o faltante.

---

## 3. Criterios de Aceptación
1. **Edición Táctil de Precio:** Al dar clic en el precio unitario de una fila, se despliega el prompt, se valida el costo, se actualiza el precio unitario y se recalcula el subtotal y total inmediatamente.
2. **Persistencia del Precio en Venta:** La venta registrada contiene en sus items el precio modificado, reflejado en el ticket y en el reporte de ventas.
3. **Prueba E2E 1 (Apertura de Caja):** Apertura de turno validada con base de $150.000 y estado `ABIERTO`.
4. **Prueba E2E 2 (Multi-Presentación):** Venta de 2.5 kg granel + 3 unidades empacadas a Consumidor Final pagada en efectivo con cambio exacto y stock descontado.
5. **Prueba E2E 3 (Borrador -> Pago Mixto):** Guardado en espera, vaciado de carrito, recuperación intacta y cobro con Efectivo ($50.000) + Nequi ($40.000).
6. **Prueba E2E 4 (Precios Modificados):** Descuento/modificación directa de precio unitario con advertencia de rentabilidad y actualización en `lastClientPrices`.
7. **Prueba E2E 5 (Crédito):** Venta a crédito a cliente con cupo, generando cuenta por cobrar `InvoiceAR` sin alterar gaveta de efectivo.
8. **Prueba E2E 6 (Reabastecimiento):** Solicitud generada con éxito hacia Bodega Principal en estado `PENDIENTE_APROBACION`.
9. **Calidad & DevTools:** 100% tests verdes en Vitest, 0 errores en TypeScript y 0 errores en la consola JS del navegador (375 px y desktop).
