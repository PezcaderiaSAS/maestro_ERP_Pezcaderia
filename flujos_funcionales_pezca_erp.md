# Especificaciones de Flujos Funcionales de Negocio: La Pezcadería ERP (v4.2)

Este documento detalla los 10 flujos funcionales esenciales que gobernarán el ERP unificado de **La Pezcadería S.A.S.**, garantizando que el diseño del frontend y las APIs reflejen con exactitud las reglas operativas reales.

---

## Flujo 1: Autenticación Unificada y Control de Roles (RBAC)
* **Actor**: Todos los empleados con acceso al sistema.
* **Descripción**:
  1. El usuario ingresa a la aplicación web SPA y hace clic en "Iniciar Sesión con Google".
  2. Google retorna la autenticación exitosa con el UID.
  3. El sistema valida el correo y UID contra la tabla `usuarios` (unida a `terceros`).
  4. Si existe, carga en memoria el rol (`ADMIN`, `VENDEDOR`, `FACTURADOR`, `BODEGUERO`, `CONDUCTOR`).
  5. Si el rol es restringido, inhabilita los botones de la barra de navegación lateral correspondientes a otros módulos.

---

## Flujo 2: Registro CRM de Clientes, Ubicación y Visitas de Campo
* **Actor**: Vendedor.
* **Descripción**:
  1. El vendedor inicia su jornada de visitas de campo en la SPA.
  2. Selecciona un cliente de su lista asignada o hace clic en "Nuevo Cliente".
  3. El sistema solicita permiso de ubicación del navegador y registra de manera automática la latitud, longitud, fecha y hora del inicio de la visita.
  4. El vendedor puede actualizar los datos de contacto y dirección del cliente.
  5. Se registra una bitácora de la visita (ej. "No requería producto", "Se agendó pedido para mañana").

---

## Flujo 3: Creación de Pedido con Descuentos Híbridos (POS / Preventa)
* **Actor**: Vendedor o Cajero POS.
* **Descripción**:
  1. El usuario selecciona el cliente (el sistema carga su tipo de precio: `POS`, `RESTAURANTE` o `MAYORISTA`).
  2. Selecciona la bodega origen de despacho.
  3. Agrega productos al carrito. Por cada producto:
     - El sistema calcula el precio final aplicando el descuento de línea (si aplica).
  4. Opcionalmente, se ingresa un descuento global (porcentaje o valor directo) sobre el subtotal acumulado.
  5. El sistema calcula los totales netos.
  6. Al confirmar, se envía la petición incluyendo la cabecera `X-Idempotency-Key` (UUID) para evitar duplicados en red.
  7. El trigger PostgreSQL asigna de forma atómica el número de orden (`PED-XXXXXX`).

---

## Flujo 4: Gestión de Inventario por Bodegas y Lotes (WMS)
* **Actor**: Jefe de Bodega.
* **Descripción**:
  1. Ingreso de compra/abastecimiento: El Jefe de Bodega registra una factura de compra detallando proveedor, bodega de destino, SKU, cantidad y número de lote físico con su fecha de vencimiento.
  2. Al guardar, el trigger del sistema inicializa el registro en `lotes_inventario` y autocalcula la adición de unidades físicas en `stock_bodegas` para la bodega seleccionada.
  3. Consulta de stock: La SPA muestra el stock general consolidado por bodega y permite desplegar el desglose de lotes activos.

---

## Flujo 5: Traslados de Mercancía entre Bodegas
* **Actor**: Jefe de Bodega.
* **Descripción**:
  1. El usuario selecciona la Bodega de Origen y la Bodega de Destino.
  2. Agrega los productos a trasladar especificando el lote y la cantidad.
  3. El sistema valida que el stock del lote de origen tenga disponibilidad suficiente.
  4. Al procesar, el sistema resta las unidades del lote de origen y crea o actualiza las existencias del lote correspondiente en la bodega de destino de manera atómica bajo una transacción única de base de datos.

---

## Flujo 6: Producción, Rendimiento y Validación Táctica de Mermas con PIN
* **Actor**: Jefe de Bodega (Producción).
* **Descripción**:
  1. El bodeguero inicia una "Orden de Producción/Transformación".
  2. Selecciona el producto de materia prima (ej. "Pescado Entero"), el lote físico y la cantidad en kilogramos a procesar.
  3. Selecciona el producto destino terminado (ej. "Filete Limpio") y digita los kilogramos finales resultantes y el número de lote de salida.
  4. El sistema calcula automáticamente la merma física: `materia_prima_kg - producto_terminado_kg`.
  5. **Regla de Tolerancia (35%)**:
     - Si la merma es menor o igual al 35%, el registro se guarda sin trabas.
     - Si la merma supera el 35%, el sistema muestra una alerta roja persistente en la SPA indicando que se requiere obligatoriamente una justificación escrita y la **firma digital de autorización (PIN numérico de 4 dígitos)** del Jefe de Bodega o Administrador.
     - El trigger de base de datos intercepta la petición, verifica que el PIN encriptado sea válido y el rol del autorizador sea `BODEGUERO` o `ADMIN`. Si es inválido, rechaza la transacción.

---

## Flujo 7: Despacho Logístico y Planificación de Ruta
* **Actor**: Administrador o Coordinador de Despacho.
* **Descripción**:
  1. El coordinador crea una nueva "Ruta de Despacho" en la SPA (`RUT-XXXXXX`).
  2. Asigna un conductor y una placa de vehículo.
  3. Selecciona de la lista de pedidos en estado `CREADO` aquellos que van a entregarse en dicha ruta.
  4. Los pedidos cambian su estado a `LISTO` (en tránsito).

---

## Flujo 8: Entrega de Ruta, Gestión de Averías y Cobranza en Campo
* **Actor**: Conductor.
* **Descripción**:
  1. El conductor accede desde su móvil a la SPA (donde solo visualiza su ruta activa).
  2. Visita a cada cliente listado y marca la entrega del pedido:
     - **Entrega Conforme**: Confirma cantidades y el pago (Efectivo, Transferencia o Crédito).
     - **Entrega Parcial / Averías / Devolución**: El conductor digita la cantidad de unidades que sufrieron avería o cambio. El sistema recalcula el total de la factura in-situ, descontando los ítems afectados y enviando los pescados/mariscos devueltos a una bodega virtual de averías.

---

## Flujo 9: Arqueo Logístico y Liquidación de Ruta
* **Actor**: Administrador y Conductor.
* **Descripción**:
  1. Al finalizar el recorrido, el conductor se presenta para la liquidación.
  2. El conductor ingresa en el sistema el efectivo total recaudado y las transferencias realizadas por los clientes.
  3. Registra los gastos de viaje sustentados con foto del soporte físico (ej. Combustible, Peajes, Parqueaderos).
  4. El sistema calcula el balance teórico:
     $$\text{Balance Teórico} = \text{Recaudo Esperado (Pedidos Contado)} - \text{Gastos de Ruta}$$
  5. El administrador ingresa el "Recaudo Físico Entregado".
  6. El sistema detecta automáticamente diferencias (faltantes o sobrantes) y registra la transacción en el libro diario de la `caja` de destino, cerrando el estado de la ruta como `LIQUIDADA`.

---

## Flujo 10: Gestión de Recursos Humanos (Hojas de Vida y Contratación)
* **Actor**: Administrador (Recursos Humanos).
* **Descripción**:
  1. El administrador ingresa al módulo modular de Recursos Humanos dentro del ERP.
  2. Hace clic en "Registrar Empleado".
  3. Ingresa los datos personales del empleado (nombre, cédula, dirección, celular, email, ciudad) los cuales se registran en la tabla base `terceros`.
  4. Digita los datos laborales: fecha de ingreso, cargo (ej. 'Operario de Planta', 'Jefe de Bodega'), salario base y observaciones.
  5. **Carga de Hoja de Vida**: Sube el archivo PDF de la hoja de vida, la cual es cargada en un bucket de almacenamiento seguro de Supabase Storage. El sistema vincula la URL del documento en la tabla `empleados`.
  6. **Aprovisionamiento de Acceso ERP (Opcional)**: Si el empleado requiere ingresar a la aplicación web, el administrador activa la casilla "Permitir Acceso ERP", selecciona el rol correspondiente (`ADMIN`, `VENDEDOR`, `BODEGUERO`, etc.) y define un PIN numérico de acceso que se encripta y guarda en la tabla `usuarios`.
  7. **Egreso/Desvinculación**: Cuando un empleado finaliza su contrato laboral, se mantiene en estado `INACTIVO` y se registra la fecha de egreso, desactivando automáticamente sus credenciales de acceso ERP.
