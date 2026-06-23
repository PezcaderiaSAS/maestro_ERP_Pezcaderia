# Business Rules: Tablas de la Verdad — MaestroPescadería ERP

**Versión:** 2.1 | **Fecha:** 2026-06-22 | **Estado:** APROBADO

> **REGLA PRIMORDIAL - IDIOMA OFICIAL**: Todos los textos de la interfaz de usuario, etiquetas, alertas, mensajes de validación, comentarios de código y documentación deben estar estrictamente en idioma español.
> 
> **INSTRUCCIÓN PARA LA IA**: Antes de implementar cualquier lógica que afecte inventario, facturación, pedidos, caja, nómina o producción, DEBES consultar este documento y referenciar la regla aplicable con un comentario `// RN-XX`.

---

## Módulo 1: Inventario y WMS (Gestión de Stock)

### RN-01 — Stock nunca negativo
```
DADO un intento de egreso de inventario (venta, traslado, producción)
CUANDO la cantidad_a_egresar > stock_disponible_en_bodega
ENTONCES:
  - La operación es BLOQUEADA completamente (no se descuenta parcialmente).
  - Se retorna error: "Stock insuficiente. Disponible: {X} {unidad}".
  - No se registra ningún movimiento de inventario.
  
ENCADENAMIENTO:
  - Esta regla actúa como validación mandatoria y bloqueante previa a:
    - Traslados (RN-02)
    - Alistamiento de pedidos (RN-18)
    - Procesamiento de materias primas en Producción (RN-08)
```

### RN-02 — Traslado atómico entre bodegas
```
DADO un traslado de productos entre Bodega_Origen y Bodega_Destino
CUANDO se confirma el traslado
ENTONCES:
  - En una única transacción atómica de base de datos:
    - stock[Bodega_Origen][producto] -= cantidad_trasladada
    - stock[Bodega_Destino][producto] += cantidad_trasladada
  - Si CUALQUIERA de las dos operaciones falla o viola RN-01 (stock origen insuficiente), AMBAS se revierten por completo.
  - Se registra un movimiento en Kardex de tipo "TRASLADO" especificando origen, destino y lote.
```

### RN-03 — Lotes FEFO (First Expired, First Out)
```
DADO una salida de inventario de un producto con múltiples lotes activos
CUANDO el sistema sugiere qué lote descontar
ENTONCES:
  - Se DEBE ordenar y pre-seleccionar el lote con fecha de vencimiento más próxima.
  - El usuario con rol ADMIN, BODEGUERO o VENDEDOR puede anular manualmente la sugerencia, pero esta acción queda registrada en la bitácora de auditoría del movimiento.
```

### RN-30 — Soft Deletes de Entidades de Negocio
```
DADO el intento de eliminación de una entidad maestra (Cliente, Proveedor, Producto, Categoría)
CUANDO el usuario NO tiene rol ADMIN
ENTONCES:
  - La entidad se actualiza a activo = false (Soft Delete).
  - No se elimina físicamente del almacenamiento.
  - Se mantiene disponible para históricos de reportes y transacciones pasadas.
```

### RN-59 — Ciclo de vida y protección de bodegas (WMS)
```
DADO el intento de edición, desactivación o eliminación de una bodega
CUANDO la bodega es "Bodega Principal" o "Bodega Averías" (bodegas esenciales)
ENTONCES:
  - El sistema BLOQUEA la operación de edición de nombre, desactivación o eliminación.
  - Se retorna error: "La bodega '{Nombre}' es esencial para el sistema y no puede ser modificada, desactivada ni eliminada."

DADO el intento de desactivación o eliminación de una bodega personalizada
CUANDO existen productos en el catálogo con stock > 0 en dicha bodega
ENTONCES:
  - La operación es BLOQUEADA.
  - Se retorna error: "No se puede eliminar o desactivar la bodega '{Nombre}' porque contiene productos con stock activo."
```

---

## Módulo 2: POS (Punto de Venta) y Caja

### RN-12 — Gaveta de dinero: autorización requerida
```
DADO el comando de apertura de gaveta de dinero física
CUANDO se intenta enviar la orden a la ticketera ESC/POS
ENTONCES:
  La apertura solo es válida en DOS casos:
    CASO A: Confirmación del registro y pago total de una venta en efectivo en el POS.
    CASO B: Un usuario con rol ADMIN o FACTURADOR ingresa su PIN de autorización manualmente.
  
  En cualquier otro caso: el comando de apertura de cajón es BLOQUEADO y se genera una alerta.
```

### RN-13 — Lectura de balanza con fallback manual
```
DADO un producto de venta a granel en el POS
CUANDO se intenta leer el peso en tiempo real desde la balanza conectada
ENTONCES:
  CASO ÉXITO: Web Serial API retorna el string de peso → se parsea y carga automáticamente en la línea de venta.
  
  CASO ERROR (balanza desconectada, error de puerto o timeout > 3 segundos):
    - El sistema muestra una alerta: "Balanza no detectada. Ingrese el peso manualmente."
    - Se habilita el campo de entrada numérica para ingreso manual.
    - El movimiento de venta queda marcado con la bandera "PESO_MANUAL" para reportes de auditoría.
```

### RN-43 — Redondeo de Efectivo (POS - Colombia)
```
DADO un pago en el POS
CUANDO el método de pago seleccionado por el cliente es EFECTIVO (Cash)
ENTONCES:
  - El total a pagar de la transacción se redondea al múltiplo de $100 COP más cercano POR ENCIMA (Ceiling rounding) para evitar el uso de monedas de baja denominación (ej. $50).
    Ejemplo: $12,410 COP se redondea a $12,500 COP.
    Ejemplo: $12,450 COP se redondea a $12,500 COP.
  - La diferencia entre el total real y el total redondeado se registra automáticamente como "Ajuste por Redondeo de Caja".
  - Si el pago es electrónico (tarjeta, transferencia, Rappi, etc.), se cobra el valor exacto con decimales sin aplicar redondeo.
```

### RN-44 — Apertura y Cierre de Turno de Caja (Arqueo)
```
DADO el inicio de jornada de un cajero en el POS
CUANDO el sistema evalúa los permisos para registrar ventas
ENTONCES:
  - El sistema BLOQUEA cualquier registro de venta si no existe un registro activo de "Apertura de Caja" para el día y cajero en curso (saldo base obligatorio).
  - Al realizar el "Cierre de Turno/Caja", el cajero debe declarar obligatoriamente el efectivo físico en gaveta.
  - El sistema calcula la diferencia contra el balance teórico (Base + Ventas Efectivo - Egresos Caja).
  - Si hay descuadre (sobrante o faltante), el sistema requiere una justificación escrita obligatoria y notifica automáticamente al administrador.
  
ENCADENAMIENTO:
  - Las transacciones provenientes de integraciones digitales (Rappi/Siigo) deben aislarse del arqueo de caja física según RN-25.
```

---

## Módulo 3: B2B y Gestión Comercial (Pedidos y Despacho)

### RN-04 — Flujo de estados de pedido es unidireccional
```
DADO un pedido comercial
CUANDO se intenta modificar su estado
ENTONCES:
  - Solo son válidas las transiciones estrictamente secuenciales:
    CREADO → LISTO → EN_DESPACHO → ENTREGADO → FACTURADO → PAGADO
  - El estado ANULADO es un estado terminal que solo puede alcanzarse desde CREADO o LISTO.
  - Intentar retroceder un estado (ej. de FACTURADO a ENTREGADO) es BLOQUEADO de manera absoluta.
  - Si un pedido B2B falla la tolerancia de peso (RN-18) o excede el cupo de crédito (RN-20), se bifurca a estados de pausa específicos ('PAUSADO', 'PAUSADO_POR_CREDITO').
```

### RN-05 — Facturación basada en alistamiento y entrega
```
DADO un pedido en tránsito hacia facturación (validación administrativa)
CUANDO se genera la factura/tiquete correspondiente para pasar a FACTURADO
ENTONCES:
  - Si el pedido.estado !== 'ENTREGADO': la operación es BLOQUEADA.
  - Mensaje: "El pedido debe estar en estado ENTREGADO para poder ser facturado administrativamente".
  - La factura se liquida utilizando los pesos REALES medidos en el Cuarto Frío durante el alistamiento (guardados en el estado LISTO), y no los estimados del pedido original.
  - La facturación electrónica con Siigo se ejecuta de manera condicional:
    - Si el cliente tiene activa la opción de "Facturación Electrónica Automática", el sistema genera la factura con Siigo inmediatamente al pasar a FACTURADO.
    - Si requiere facturación electrónica manual, se habilita un botón "Emitir Factura Electrónica" para que el usuario la envíe cuando lo desee.
    - En caso contrario, se genera un tiquete de venta interno.
```

### RN-18 — Umbral de tolerancia de peso en alistamiento B2B
```
DADO un pedido B2B en estado CREADO
CUANDO se digitan los pesos reales obtenidos en báscula de despacho
ENTONCES:
  diferencia_pct = |(peso_real - peso_estimado) / peso_estimado| * 100
  
  SI diferencia_pct > 5%:
    - El pedido cambia automáticamente al estado "PAUSADO" (bloqueando su paso a LISTO).
    - Se requiere la aprobación explícita de un Administrador o Supervisor de Ventas (mediante ingreso de PIN o credenciales) para renegociar el precio/cantidad y desbloquear el pedido hacia LISTO.
```

### RN-20 — Cupo de crédito B2B
```
DADO una facturación a crédito de un cliente B2B
CUANDO se intenta emitir la factura para pasar a FACTURADO
ENTONCES:
  deuda_propuesta = saldo_cartera_actual_del_cliente + total_factura_neto
  
  SI deuda_propuesta > cupo_credito_autorizado_cliente:
    - La facturación es BLOQUEADA automáticamente.
    - El pedido se asigna al estado "PAUSADO_POR_CREDITO".
    - Mensaje de error: "Cupo de crédito excedido. Cupo disponible: {cupo_actual}".
    - Requiere desbloqueo administrativo por cartera o abono previo a la deuda para poder facturar.
```

### RN-45 — Control de Margen de Precio Mínimo
```
DADO un intento de venta o cotización de una línea de producto en el POS o módulo B2B
CUANDO precio_venta_propuesto < costo_adquisicion_real (precio_compra de la orden recibida + flete prorrateado)
ENTONCES:
  - La línea del ítem es bloqueada y se resalta con alerta roja de pérdida de margen.
  - El sistema BLOQUEA la confirmación del pedido.
  - Solo un usuario con rol ADMIN o un supervisor con PIN de autorización autorizado puede forzar el desbloqueo de la línea y permitir la venta por debajo del costo.
```

---

## Módulo 4: Devoluciones y Cartera (Finanzas)

### RN-11 — Devolución genera nota de crédito atómica
```
DADO una devolución de mercancía registrada por el transportador en ruta o recibida en bodega
CUANDO se procesa y valida la devolución física
ENTONCES:
  En una transacción atómica de base de datos:
    1. Se ingresa el stock devuelto según RN-16 (según su estado físico).
    2. Se reduce el saldo en cartera del cliente: cartera[cliente] -= valor_devolucion.
    3. Se genera y asocia una Nota de Crédito al ID de la factura origen.
    4. El estado del saldo a favor cambia a "RECIBIDA_BODEGA" (RN-17).
  
  Si cualquiera de estas operaciones falla, toda la transacción se revierte.
```

### RN-16 — Reingreso condicional de devoluciones físicas
```
DADO el retorno físico de mercancía devuelta a la bodega principal
CUANDO el Jefe de Bodega inspecciona e ingresa el estado físico del producto
ENTONCES:
  SI estado_mercancia === 'BUEN_ESTADO':
    - stock[bodega_principal][producto] += cantidad_física (vuelve a estar disponible para la venta).
  SI estado_mercancia === 'AVERIA' o 'CUARENTENA':
    - stock[bodega_averias][producto] += cantidad_física (bloqueado para venta, destinado a descarte o merma).
  - Se registra obligatoriamente un movimiento en Kardex de tipo "ENTRADA_DEVOLUCION" detallando la bodega destino y estado.
```

### RN-17 — Saldo a favor automático en cartera
```
DADO una devolución en estado RECIBIDA_BODEGA
CUANDO se consolida el estado de cuenta del cliente
ENTONCES:
  - El monto (cantidad * precio_pactado_en_factura_origen) se expone inmediatamente como saldo a favor disponible en la Cartera del cliente.
  - Este saldo queda en estado "DISPONIBLE" y puede ser cruzado en facturas futuras (RN-19).
```

### RN-19 — Cruce contable de saldos a favor
```
DADO el proceso de facturación de un nuevo pedido B2B
CUANDO se aplican los saldos a favor "DISPONIBLES" del cliente
ENTONCES:
  - total_saldos_a_favor = SUM(valor de notas seleccionadas).
  - total_factura_neto = total_factura_original - total_saldos_a_favor.
  - El estado de los saldos cruzados cambia a "APLICADA" en cartera.
  - Se registra el cruce contable en el recibo de caja de la nueva factura.
```

### RN-46 — Encadenamiento de Devoluciones y Notas de Crédito
```
DADO un intento de registrar una devolución (RN-11) o generar una Nota de Crédito
CUANDO se evalúa la factura y pedido de origen
ENTONCES:
  - El pedido origen DEBE estar estrictamente en estado FACTURADO, ENTREGADO o PAGADO.
  - Se prohíbe completamente generar notas de crédito o devoluciones sobre borradores, cotizaciones o pedidos anulados.
```

---

## Módulo 5: Producción y Mermas

### RN-08 — Conservación de masa en producción
```
DADO una orden de producción para transformación de materia prima (MP) a producto terminado (PT)
CUANDO se registra el resultado de la producción
ENTONCES:
  - Se verifica la suficiencia de stock de la Materia Prima según RN-01.
  - kg_materia_prima_salida = stock descontado de MP.
  - kg_producto_terminado_entrada = stock ingresado de PT.
  - merma_kg = kg_materia_prima_salida - kg_producto_terminado_entrada.
  
  VALIDACIÓN DE SEGURIDAD:
    SI kg_producto_terminado_entrada > kg_materia_prima_salida (merma_kg < 0):
      - La transacción es BLOQUEADA.
      - Mensaje de error: "El producto terminado no puede superar el peso de la materia prima ingresada".
```

### RN-09 — Tolerancia de merma con PIN de autorización
```
DADO el resultado de una orden de producción
CUANDO se calcula el porcentaje de merma: merma_pct = (merma_kg / kg_materia_prima) * 100
ENTONCES:
  SI merma_pct <= 35%:
    - Se registra la producción con estado "APROBADA_AUTOMATICA".
  
  SI merma_pct > 35%:
    - El sistema muestra una alerta roja persistente.
    - Se BLOQUEA el guardado y requiere obligatoriamente:
      a) Justificación de merma (mínimo 20 caracteres).
      b) PIN de 4 dígitos de un usuario ADMIN o Jefe de Bodega autorizado.
    - Si el PIN es válido, se registra con estado "APROBADA_CON_SUPERVISION".
    - Si el PIN es inválido, la operación es RECHAZADA.
```

---

## Módulo 6: Logística y Cuadre de Rutas

### RN-10 — Cierre de ruta con cuadre de caja obligatorio
```
DADO el proceso de liquidación de una ruta de entrega
CUANDO el administrador intenta realizar el cierre de la ruta
ENTONCES:
  balance_teorico = SUM(total_factura para pedidos CONTADO entregados) - gastos_ruta_autorizados
  diferencia = recaudo_fisico_entregado - balance_teorico
  
  SI diferencia == 0:
    - La ruta se marca con estado "LIQUIDADA".
  
  SI diferencia != 0 (faltante o sobrante):
    - El sistema bloquea el cierre directo.
    - Requiere ingresar obligatoriamente una justificación escrita detallada del descuadre.
    - Solo tras guardar la justificación y con aprobación (PIN) del rol ADMIN o ADMINISTRATIVO se permite pasar el estado a "LIQUIDADA_CON_NOVEDAD".
```

---

## Módulo 7: Integraciones y Webhooks (Middleware / Rappi / Siigo)

### RN-21 — Autenticación obligatoria de webhooks externos
```
DADO una petición entrante a los endpoints de API de integraciones o webhooks
CUANDO se evalúa la autenticidad de la petición
ENTONCES:
  - El encabezado de la petición debe contener una firma HMAC-SHA256 válida, calculada con la clave secreta compartida de la integración.
  - Si falta la firma o no coincide con la calculada localmente, se rechaza la petición inmediatamente con un código HTTP 401 Unauthorized.
```

### RN-22 — Idempotencia estricta en webhooks
```
DADO un payload recibido vía webhook externo (ej. ID de orden Rappi)
CUANDO se procesa la solicitud
ENTONCES:
  - Se busca el identificador único externo en la tabla de logs de integraciones.
  - Si ya existe registrado: se descarta el procesamiento duplicado y se responde inmediatamente un código HTTP 202 Accepted para evitar bucles.
```

### RN-23 — Procesamiento asíncrono
```
DADO un pedido entrante aprobado por integraciones digitales
CUANDO ingresa al flujo del ERP
ENTONCES:
  - El payload se inserta en una cola local de mensajería (Queue).
  - Un worker procesa las órdenes de manera secuencial (FIFO) para evitar colisiones de stock concurrente y asegurar cumplimiento de RN-01.
```

### RN-24 — Cancelaciones automáticas de integraciones
```
DADO un evento de cancelación recibido desde una integración externa
CUANDO el sistema procesa el pedido en MaestroPescadería
ENTONCES:
  - CASO A: Si el pedido ya está en estado FACTURADO o superior:
    - Se genera automáticamente una Nota de Crédito por el total (RN-11) y se reversa el stock a la Bodega origen.
  - CASO B: Si el pedido está en estado CREADO o LISTO:
    - Se cambia directamente el estado a ANULADO.
    - Si ya estaba en estado LISTO, se liberan y retornan las cantidades al stock disponible.
```

### RN-25 — Aislamiento contable de caja física
```
DADO una venta o devolución procesada de forma digital (Rappi, Siigo u otras plataformas)
CUANDO se calcula la liquidación contable de caja del cajero
ENTONCES:
  - El medio de pago asociado debe clasificarse estrictamente como "Pasarela Externa - {Nombre Plataforma}".
  - Estos saldos contables no deben afectar ni sumarse al balance de efectivo físico declarado por el cajero en su arqueo de caja (RN-44).
```

---

## Módulo 8: Nómina y Recursos Humanos Colombiana

### RN-26 — Días comerciales estándar
```
DADO el cálculo de nómina y prestaciones sociales de un empleado
CUANDO se calcula la cantidad de días transcurridos entre una Fecha_Inicio y Fecha_Fin
ENTONCES:
  - Se aplica la regla estándar colombiana de meses de 30 días (año comercial de 360 días):
    dias = (Año_Fin - Año_Inicio)*360 + (Mes_Fin - Mes_Inicio)*30 + (Día_Fin - Día_Inicio) + 1
  - Febreros y meses de 31 días se normalizan automáticamente a 30 días para efectos de pago.
```

### RN-27 — Auxilio de transporte condicional
```
DADO el cálculo mensual o quincenal de devengos del empleado
CUANDO salario_base_mensual <= (2 * salario_minimo_legal_vigente_SMMLV)
ENTONCES:
  - Se suma el valor del auxilio de transporte legal vigente proporcional a los días laborados.
  - EXCEPCIONES donde NO aplica auxilio:
    - Aprendices del SENA en cualquiera de sus etapas.
    - Contratistas por prestación de servicios independientes.
    - Días en que el empleado estuvo en vacaciones, incapacitado o con licencias.
```

### RN-28 — Fórmulas legales de liquidación definitiva (Prestaciones Sociales)
```
DADO el cálculo de liquidación por retiro o terminación de contrato laboral
CUANDO se calculan los conceptos de ley colombiana
ENTONCES:
  - Cesantías = (Base_Liquidación * Días_Trabajados_Periodo) / 360
  - Intereses de Cesantías = (Cesantías * Días_Trabajados_Periodo * 0.12) / 360
  - Prima de Servicios = (Base_Liquidación * Días_Trabajados_Periodo) / 360
  - Vacaciones = (Salario_Base * Días_Vacaciones_Pendientes) / 720
```

### RN-15 — Egreso de empleado desactiva acceso
```
DADO el registro del retiro/desvinculación de un empleado en nómina
CUANDO se guarda la Fecha_Egreso en su ficha laboral
ENTONCES:
  En una transacción atómica del sistema de usuarios:
    - empleado.estado = 'INACTIVO'
    - usuario_asociado.activo = false (bloquea login en el ERP)
    - usuario_asociado.pin_acceso = null (invalida el acceso rápido en pantallas POS)
  
  Cualquier sesión activa para ese usuario es invalidada y desconectada inmediatamente.
```

---

## Módulo 9: Administración y Seguridad (Control de Accesos)

### RN-14 — Roles: aislamiento estricto de módulos
```
DADO un usuario autenticado en el sistema
CUANDO intenta acceder a las interfaces de la aplicación
ENTONCES:
  Se restringen los accesos según la siguiente matriz de roles:
    - ADMIN: Acceso ilimitado a todos los módulos y operaciones.
    - VENDEDOR: Acceso a Pedidos, Clientes y Dashboard. Bloqueado de Caja, Nómina y WMS.
    - BODEGUERO: Acceso a Inventario, Alistamiento y Producción. Bloqueado de Finanzas, Nómina y costos de compra.
    - FACTURADOR: Acceso a POS, Facturación, Caja y Reportes comerciales. Bloqueado de Nómina y Producción.
    - CONDUCTOR: Acceso exclusivo a ver su Ruta Activa asignada.
    
  Cualquier violación de acceso redirige al usuario a su pantalla de inicio por defecto y registra un aviso de seguridad.
```

---

## Módulo 10: Reportes Analíticos

### RN-41 — Reporte de cantidades compradas por proveedor
```
DADO la solicitud de un reporte consolidado de compras
CUANDO el usuario aplica filtros y genera el reporte
ENTONCES:
  - Se calculan cantidades únicamente de órdenes de compra con estado 'RECIBIDO'. Las órdenes 'SOLICITADO' o 'ANULADO' son excluidas.
  - Se consolida por proveedor: totalKg, totalPesos y cantidad de órdenes recibidas.
  - Se desglosa internamente por SKU detallando cantidad (Kg/unidades) y valor acumulado en COP.
  - Roles autorizados: ADMIN, ADMINISTRATIVO únicamente (bloqueado para Bodegueros y Vendedores por confidencialidad de costos de adquisición, IVA y fletes).
  - Exportación disponible a CSV delimitado por punto y coma conteniendo las columnas normativas especificadas.
```

---

## Módulo 11: Facturación y Precios (Cálculos Globales)

### RN-06 — Descuento por línea y global
```
DADO un pedido o factura con items y descuentos
CUANDO se realiza el cálculo de totales previos a impuestos
ENTONCES:
  - precio_final_linea = precio_lista * (1 - descuento_pct_linea / 100)
  - total_linea = cantidad * precio_final_linea
  - subtotal = SUM(total_linea para todos los items)
  - descuento_global_valor = subtotal * (descuento_global_pct / 100)
  - total_final = subtotal - descuento_global_valor
  
  RESTRICCIÓN: El descuento global total no puede superar al subtotal bruto. total_final no puede ser menor o igual a cero.
```

### RN-07 — Idempotencia en creación de pedidos
```
DADO un intento de creación de pedido proveniente de clientes API o interfaces
CUANDO se suministra un idempotency_key
ENTONCES:
  - Si ya existe un pedido asociado a ese idempotency_key en base de datos:
    - Se omite la creación física del registro duplicado.
    - Se retorna el objeto del pedido existente con una cabecera de confirmación exitosa.
```

### RN-42 — Impuestos y Descuentos (Orden de Cálculo)
```
DADO un pedido con descuentos y artículos gravados con IVA
CUANDO se liquida la transacción
ENTONCES:
  - Los descuentos (tanto por línea como prorrateo del descuento global) deben restarse del precio base ANTES de aplicar la tasa impositiva del IVA.
  - Fórmula:
    1. precio_neto_linea = (precio_lista * (1 - desc_linea)) - porcion_descuento_global
    2. base_iva_linea = precio_neto_linea * cantidad
    3. valor_iva_linea = base_iva_linea * (tarifa_iva / 100)
    4. total_linea = base_iva_linea + valor_iva_linea
```

---

## Módulo 12: Reglas de Módulos Específicos Adicionales

### RN-47 — Visualización de Stock Multibodega en POS
```
DADO el Punto de Venta (POS)
CUANDO un cajero busca o visualiza un producto para la venta rápida
ENTONCES:
  - El sistema debe renderizar en tiempo real el stock disponible de dicho producto en cada una de las bodegas activas de la organización (ej. Bodega Principal, Bodega Punto de Venta, etc.).
  - El cajero solo puede facturar descargando stock de la bodega asociada físicamente a su caja/punto de venta (cumpliendo RN-01).
```

### RN-48 — Selección de Bodegas y Categorías en Inventario
```
DADO el panel de control de Inventario
CUANDO el Jefe de Bodega o Administrador filtra o gestiona existencias
ENTONCES:
  - Se debe permitir filtrar el catálogo por bodega específica o ver el inventario consolidado total.
  - Se debe poder categorizar los productos bajo la estructura jerárquica de 3 niveles (Tipo > Línea > Clase) para clasificar y reportar.
```

### RN-49 — Configuración de Precios y Comisiones por Categoría
```
DADO el configurador de Precios y Comisiones
CUANDO se establece una lista de precios para una Categoría/Línea
ENTONCES:
  - Los productos heredarán automáticamente los márgenes o reglas de precios de su categoría padre, a menos que se defina un precio específico por SKU.
  - Las comisiones de los vendedores comerciales se liquidan en porcentaje basado en la Categoría/Línea de los productos efectivamente vendidos y recaudados.
```

### RN-50 — Registro de Compras e Integración de Costos
```
DADO el ingreso de una Orden de Compra (módulo Compras)
CUANDO el pedido cambia a estado 'RECIBIDO'
ENTONCES:
  - En una transacción atómica:
    - Se incrementa el inventario del producto ingresado (cajas/peso real) en la bodega de destino seleccionada.
    - Se actualiza el costo promedio ponderado del producto (Costo_Promedio_Ponderado) en base al precio de compra + flete prorrateado.
    - Se asocia el lote de compra y su fecha de vencimiento (para el cumplimiento de FEFO según RN-03).
```

### RN-51 — Registro y Clasificación Contable de Gastos
```
DADO el registro de un egreso o gasto de operación
CUANDO el usuario ingresa el soporte físico
ENTONCES:
  - El gasto debe clasificarse obligatoriamente en una de las categorías contables predefinidas (Gastos Fijos, Gastos Variables, Impuestos y Tasas).
  - Si el egreso se paga en efectivo de caja, se debe registrar una salida atómica en la caja activa del turno del POS, reduciendo su saldo teórico.
```

### RN-52 — Producción Basada en Recetas (Crafting Workflow)
```
DADO el módulo de Producción
CUANDO se programa la transformación (crafting) de un producto terminado (PT)
ENTONCES:
  - El sistema consume automáticamente las materias primas (MP) requeridas según la receta asociada al PT (soporta consumo recursivo de sub-recetas o insumos intermedios).
  - Se valida el cumplimiento de RN-01 para cada ingrediente de la receta antes de iniciar el proceso.
  - Se aplica el principio de conservación de masa de producción (RN-08) y validación de mermas (RN-09).
```

### RN-53 — Historial de Documentos de Venta
```
DADO el módulo de Facturación / Historial
CUANDO se consulta un documento histórico (Cotización, Remisión, Factura, Nota de Crédito)
ENTONCES:
  - El sistema debe mostrar el detalle completo de los ítems con sus respectivos lotes de despacho.
  - Se debe exponer el historial de cambios de estado del documento y los datos de la persona que autorizó/creó cada estado.
```

### RN-54 — Novedades y Deducciones de Nómina (Colombia)
```
DADO el módulo de Recursos Humanos / Nómina
CUANDO se realiza la liquidación del periodo (mensual o quincenal)
ENTONCES:
  - El sistema debe restar automáticamente las novedades del empleado en dicho periodo (inasistencias, licencias no remuneradas, suspensiones, aportes obligatorios de salud y pensión del 4%).
  - Se deben liquidar y sumar las horas extras y recargos con sus respectivos recargos legales colombianos (diurna, nocturna, dominical).
```

### RN-55 — Planilla de Ruta y Control de Recaudos (Logística)
```
DADO el módulo de Logística
CUANDO un despachador asigna pedidos a un transportador
ENTONCES:
  - Se genera una "Planilla de Ruta" con el listado de pedidos ordenados por prioridad de entrega.
  - Al retornar de la ruta, el transportador debe entregar el valor exacto de los recaudos de contado y cheques recibidos, los cuales se validan en el cuadre de caja (RN-10).
```

### RN-56 — Consolidación de Reportes y Tableros Analíticos
```
DADO el módulo de Informes
CUANDO un usuario ADMIN o ADMINISTRATIVO consulta los tableros de control
ENTONCES:
  - Los reportes de ventas, costos, producción y nómina deben consolidarse extrayendo datos históricos reales.
  - Se debe garantizar la confidencialidad de la información crítica (ej. salarios de empleados, costos de compras) bloqueando el acceso a roles no autorizados (RN-14).
```

### RN-57 — Arqueo de Caja y Flujo de Caja General
```
DADO el módulo de Caja y Flujo de Caja
CUANDO se realiza un cierre o traslado de fondos
ENTONCES:
  - Las transacciones de flujo de caja (ingresos, egresos, traslados) deben consolidarse diariamente.
  - El saldo total de la Caja General debe conciliarse con los saldos de los arqueos de turnos de las cajas del POS (RN-44) y los movimientos bancarios.
```

### RN-58 — Gestión y Segmentación de Clientes
```
DADO el módulo de Clientes
CUANDO se registra o modifica la ficha de un cliente
ENTONCES:
  - Se debe clasificar el tipo de cliente (POS o B2B).
  - Para clientes B2B, es obligatorio definir el cupo de crédito (RN-20), las condiciones de pago (días de vencimiento), el vendedor asignado y si tiene activa la Facturación Electrónica Automática.
```

---

## Índice Rápido de Reglas

| Código | Módulo | Descripción Corta |
|---|---|---|
| RN-01 | Inventario y WMS | Stock nunca negativo |
| RN-02 | Inventario y WMS | Traslado atómico entre bodegas |
| RN-03 | Inventario y WMS | Lotes FEFO (más próximo a vencer primero) |
| RN-30 | Inventario y WMS | Soft deletes de entidades maestras para no-admins |
| RN-59 | Inventario y WMS | Ciclo de vida y protección de bodegas (WMS) |
| RN-12 | POS y Caja | Gaveta solo abre con pago en efectivo o PIN de supervisor |
| RN-13 | POS y Caja | Lectura de balanza por puerto serial con fallback manual |
| RN-43 | POS y Caja | Redondeo de efectivo al múltiplo de $100 COP más cercano por encima |
| RN-44 | POS y Caja | Apertura de caja obligatoria para vender y arqueo con diferencias |
| RN-04 | B2B y Comercial | Flujo unidireccional estricto de estados de pedido |
| RN-05 | B2B y Comercial | Facturación obligatoria basada en alistamiento real y entrega |
| RN-18 | B2B y Comercial | Margen de peso > 5% en Cuarto Frío pausa pedido y requiere PIN |
| RN-20 | B2B y Comercial | Bloqueo por cupo de crédito B2B excedido |
| RN-45 | B2B y Comercial | Bloqueo de venta por debajo del costo real (adquisición + flete) |
| RN-11 | Devoluciones | Devolución en ruta genera nota de crédito atómica en base de datos |
| RN-16 | Devoluciones | Clasificación física de mercancía (Bodega Principal / Averías) |
| RN-17 | Devoluciones | Exposición de saldo a favor automático e inmediato en cartera |
| RN-19 | Devoluciones | Cruce contable de saldo a favor contra nuevas facturas |
| RN-46 | Devoluciones | Restricción de devoluciones a pedidos FACTURADO/ENTREGADO/PAGADO |
| RN-08 | Producción | Conservación de masa estricta en transformaciones (PT <= MP) |
| RN-09 | Producción | Merma > 35% requiere PIN de supervisor + justificación escrita |
| RN-10 | Logística | Cierre de ruta con cuadre de caja obligatorio y novedades |
| RN-21 | Integraciones | Autenticación de webhooks externos vía firma HMAC-SHA256 |
| RN-22 | Integraciones | Idempotencia en procesamiento de webhooks para evitar duplicados |
| RN-23 | Integraciones | Encolamiento de payloads entrantes para procesamiento FIFO |
| RN-24 | Integraciones | Cancelación externa automática (Facturado -> NC; Previo -> Anulado) |
| RN-25 | Integraciones | Aislamiento de ventas digitales (no afectan arqueo de efectivo) |
| RN-26 | Nómina y RRHH | Cálculo de días bajo estándar comercial de 30 días/mes |
| RN-27 | Nómina y RRHH | Auxilio de transporte condicional a 2 SMMLV con excepciones de ley |
| RN-28 | Nómina y RRHH | Fórmulas de liquidación de prestaciones (Cesantías, Primas, Vacaciones) |
| RN-15 | Nómina y RRHH | Egreso de personal deshabilita accesos y PIN de forma atómica |
| RN-14 | Adm. y Seguridad | Roles con aislamiento y restricción estricta de módulos |
| RN-41 | Reportes | Consolidación y exportación de compras por proveedor |
| RN-06 | Facturación | Cálculo de descuentos por línea y global |
| RN-07 | Facturación | Idempotencia en creación de pedidos comerciales |
| RN-42 | Facturación | Aplicación de descuentos antes del cálculo de impuestos (IVA) |
| RN-47 | POS y Caja | Visualización de Stock Multibodega en POS |
| RN-48 | Inventario y WMS | Selección de Bodegas y Categorías en Inventario |
| RN-49 | Facturación y Precios | Configuración de Precios y Comisiones por Categoría |
| RN-50 | Compras | Registro de Compras e Integración de Costos |
| RN-51 | Gastos | Registro y Clasificación Contable de Gastos |
| RN-52 | Producción | Producción Basada en Recetas (Crafting Workflow) |
| RN-53 | Facturación y Precios | Historial de Documentos de Venta |
| RN-54 | Nómina y RRHH | Novedades y Deducciones de Nómina (Colombia) |
| RN-55 | Logística | Planilla de Ruta y Control de Recaudos (Logística) |
| RN-56 | Reportes | Consolidación de Reportes y Tableros Analíticos |
| RN-57 | Caja y Flujo de Caja | Arqueo de Caja y Flujo de Caja General |
| RN-58 | Clientes | Gestión y Segmentación de Clientes |
