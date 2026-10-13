# Especificación Brownfield SDD 010: Inventario Multi-Sucursal, Abastecimiento Dependiente y Reportes Trazables por Punto de Venta

## 1. Contexto y Justificación de Negocio
En la operación de La Pezcadería ERP:
1. **Estructura Jerárquica de Bodegas:** La empresa opera con una **Bodega Principal** (centro de almacenamiento primario y cuartos fríos) y una o más **Sucursales / Bodegas Secundarias** que actúan como Puntos de Venta (POS).
2. **Inventario Aislado pero Dependiente:**
   - Cada Punto de Venta posee su propio saldo de inventario físico independiente.
   - Los Puntos de Venta dependen de la Bodega Principal para su aprovisionamiento; no pueden generar stock espontáneo.
   - Siempre debe existir inventario verificado en la Bodega Principal para autorizar y ejecutar el abastecimiento hacia las sucursales.
3. **Traslado Rápido desde Compras:**
   - Cuando un furgón o embarque arriba y se liquida en la Bodega Principal, el operador puede ordenar un traslado rápido inmediato de parte o la totalidad del lote al Punto de Venta requerido.
4. **Ventas y Trazabilidad Independiente:**
   - Las ventas realizadas en mostrador descuentan stock en tiempo real únicamente del Punto de Venta seleccionado.
   - Cada movimiento (recepción de compra, despacho inter-bodega, entrada a mostrador, venta POS, merma) debe ser 100% auditable y diferenciable por sucursal.
5. **Módulo de Reportes de Sucursal:**
   - Generación de reportes independientes de ventas, transferencias recibidas, márgenes y movimientos por punto de venta, exportables a formatos CSV y PDF.

---

## 2. Requerimientos del Sistema (Notación EARS)

### EARS-U (Ubiquitous - Requerimientos Universales)
- **EARS-U-01:** El sistema DEBE asociar cada turno y venta del POS a una bodega de punto de venta específica (`bodegaId`), descontando stock exclusivamente de dicha ubicación.
- **EARS-U-02:** El sistema DEBE mantener un registro segregado de stock por producto y por bodega (`StockItem: { bodegaId, productoId, cantidad }`).
- **EARS-U-03:** El sistema DEBE registrar todo movimiento de inventario con su bodega origen, bodega destino, tipo de transacción y responsable (`MovimientoInventario`).

### EARS-E (Event-Driven - Requerimientos Disparados por Eventos)
- **EARS-E-01 (Venta en Mostrador con Bloqueo y Bypass):** CUANDO se intente finalizar una venta en el POS, el sistema DEBE validar el stock local de la sucursal. SI el stock es insuficiente, el sistema DEBE bloquear la finalización y activar un modal de bypass guiado que muestra la existencia en Bodega Principal y permite autorizar una transferencia inmediata del faltante.
- **EARS-E-02 (Traslado Rápido en Recepción de Compra y Panel):** CUANDO finalice la recepción de compra en `BucaramangaReceivingWizard`, el sistema DEBE preguntar de forma inmediata si se desea transferir parte del lote recibido a un Punto de Venta (flujo dual). Igualmente, el botón "Abastecimiento Rápido" DEBE permanecer accesible permanentemente en el módulo de Inventario y Kardex.
- **EARS-E-03 (Solicitud de Reabastecimiento):** CUANDO un cajero o supervisor de punto de venta solicite reabastecimiento, el sistema DEBE validar si la Bodega Principal cuenta con stock suficiente antes de autorizar el despacho.
- **EARS-E-04 (Filtrado de Reportes Multi-Nivel):** CUANDO un operador consulte el módulo de reportes, el sistema DEBE filtrar por defecto a su sucursal asignada. CUANDO un usuario con rol de Administrador o Gerente consulte reportes, el sistema DEBE permitir alternar entre cualquier sucursal y visualizar un informe consolidado comparativo general.

### EARS-S (State-Driven - Requerimientos Basados en Estado)
- **EARS-S-01:** MIENTRAS un punto de venta esté en operación, el cajero DEBE visualizar en el catálogo y en el carrito el stock disponible específicamente en su bodega local, con indicador visual si el stock llega al umbral de seguridad.
- **EARS-S-02:** MIENTRAS la Bodega Principal no tenga stock suficiente de un SKU, el sistema DEBE bloquear la aprobación de despachos de reabastecimiento hacia las sucursales, advirtiendo al despachador.
- **EARS-S-03:** MIENTRAS no se defina una lista de precios específica por sucursal, el POS DEBE aplicar el precio estándar centralizado (`precioVentaPOS`) de cada producto.

### EARS-W (Unwanted Behavior - Casos de Excepción)
- **EARS-W-01:** SI una sucursal intenta vender en saldo negativo sin stock ni en mostrador ni en Bodega Principal, el sistema DEBE bloquear la transacción impidiendo descuadres contables.
- **EARS-W-02:** SI se intenta trasladar stock hacia un punto de venta inactivo o inexistente, el sistema DEBE rechazar la transacción con un mensaje descriptivo de validación.

---

## 3. Criterios de Aceptación
1. **Aislamiento de Stock en Venta:** Vender 5 kg de Corvina en el POS Sucursal Norte reduce el stock de Sucursal Norte de 20 a 15 kg, dejando intacto el stock de Bodega Principal (500 kg).
2. **Abastecimiento con Validación de Origen:** Una solicitud de traslado de 50 kg solo se aprueba si Bodega Principal tiene $\ge 50$ kg. Al aprobarse, reduce Bodega Principal e incrementa Sucursal Destino.
3. **Reportes por Punto de Venta:** Vista dedicada en el ERP que permite filtrar por sucursal, mostrando:
   - Total Ventas COP y Kilos por Sucursal.
   - Desglose de ingresos por medio de pago (Efectivo, Nequi, Tarjetas, Crédito).
   - Historial de transferencias recibidas desde Bodega Principal.
   - Botón de exportación a CSV y PDF.
4. **Calidad y Cobertura:** 100% pruebas unitarias e integración en Vitest pasando, y 0 errores en consola JS auditado con DevTools.
