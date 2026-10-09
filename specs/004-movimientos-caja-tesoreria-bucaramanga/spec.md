# Especificación EARS: Movimientos de Dinero, Fletes Bucaramanga y Tesorería Operativa

**Módulo:** Flujo de Cajas, Egresos Operativos y Arqueo Ciego en Bucaramanga  
**Ubicación Operativa:** Bucaramanga, Santander, Colombia  
**Estándar de Diseño:** La Regla de los 12 Años (Tactile First, botones ≥ 48px, 0 jerga técnica o contable)  
**Versión:** 1.0.0 (Protocolo Brownfield v2.2 / SDD Spec-Kit / Grill-Me Validado)

---

## 1. Contexto de Negocio y Operación Local en Bucaramanga
En la sede de Bucaramanga, el movimiento físico de dinero en efectivo y transferencias responde al ritmo operativo de la pescadería:
1. **Llegada del Furgón Refrigerado desde la Costa:** Al recibir el camión (Cartagena, Buenaventura, Barrancabermeja), se debe pagar el flete de transporte al conductor/transportador y liquidar el saldo del pescado de contado o diferirlo a crédito con el proveedor (pasando a Cuentas por Pagar), descontando el anticipo consignado previamente.
2. **Gastos Operativos Diarios de Bodega:** Compra urgente de hielo en escamas para cavas, combustible del furgón de reparto metropolitano, mantenimiento menor de empaques o canastillas plásticas.
3. **Control de Arqueo Ciego en Cajas Menores:** El cajero u operario no debe ver el saldo teórico acumulado para evitar manipulaciones; cuenta billetes y monedas con calculadora táctil rápida y el sistema audita diferencias con umbral de tolerancia de $5.000 COP, generando ticket térmico/PDF para firma física.
4. **Trazabilidad sin Jerga Contable:** Toda la interfaz utiliza términos que cualquier operario o cajero entiende de inmediato: "Plata en Caja", "Pagar Flete del Camión", "Pagar Pescado al Proveedor", "Hielo para Cavas", "Contar Billetes y Monedas", "Cerrar Turno".

---

## 2. Requerimientos en Notación EARS

### 2.1. Requerimientos Ubicuos (Ubiquitous)
- **EARS-U01:** El sistema siempre mantendrá el balance en tiempo real de cada caja activa discriminando por método de pago (`EFECTIVO`, `DATAFONO`, `TRANSFERENCIA`).
- **EARS-U02:** Toda salida de dinero (egreso) quedará registrada de forma inmutable con fecha y hora local colombiana (America/Bogota UTC-5), usuario responsable, concepto claro y referencia al documento origen (número de recepción de compra, furgón o pedido).
- **EARS-U03:** Todos los controles táctiles de caja contarán con un área mínima de interacción de 48x48 px, con colores semánticos inmediatos (Verde = Entrada de plata / Confirmar, Rojo = Salida de plata / Egreso, Azul = Turno de caja / Báscula, Ámbar = Diferencia / Pendiente).

### 2.2. Requerimientos Guiados por Eventos (Event-Driven)
- **EARS-E01:** *CUANDO* el operario finalice una recepción de pescado en `BucaramangaReceivingWizard` y marque el flete o saldo de proveedor como pago de contado, *EL SISTEMA* ofrecerá debitar con un solo toque el monto de la caja activa seleccionada, generando los movimientos de caja enlazados con la placa del camión y consecutivo de recepción.
- **EARS-E02:** *CUANDO* el cajero presione el botón táctil "Egreso Operativo" en `CashFlowView`, *EL SISTEMA* desplegará un modal con pestañas preconfiguradas ("🚚 Pagar Flete Camión", "🐟 Pagar Compra Pescado", "🧊 Hielo / Cava", "💸 Gasto General") con selector asistido de recepciones pendientes.
- **EARS-E03:** *CUANDO* el cajero inicie el arqueo de cierre de caja, *EL SISTEMA* ocultará el saldo teórico (modo arqueo ciego) y abrirá la calculadora visual de denominaciones de billetes ($100k, $50k, $20k, $10k, $5k, $2k) y monedas ($1.000, $500, $200, $100, $50).
- **EARS-E04:** *CUANDO* el arqueo presente una diferencia mayor al umbral de tolerancia ($5.000 COP), *EL SISTEMA* exigirá una justificación escrita obligatoria antes de registrar el ajuste y cerrará el turno generando el comprobante imprimible/PDF.

### 2.3. Requerimientos Guiados por Estado (State-Driven)
- **EARS-S01:** *MIENTRAS* no exista un turno abierto en la caja seleccionada, *EL SISTEMA* inhabilitará los registros de egreso y ventas en dicha caja y mostrará una tarjeta táctil destacada para "Abrir Turno de Caja".
- **EARS-S02:** *MIENTRAS* el rol del usuario sea cajero u operario estándar, *EL SISTEMA* mantendrá bloqueada la visualización del saldo teórico durante el arqueo de cierre.
- **EARS-S03:** *MIENTRAS* el usuario explore el historial en `CashFlowView`, *EL SISTEMA* ofrecerá pestañas táctiles de filtrado rápido ("Todo", "🛒 Ventas", "🚚 Fletes", "🐟 Pescado", "🧊 Insumos y Gastos").

### 2.4. Comportamientos no Deseados y Manejo de Errores (Unwanted Behaviors)
- **EARS-W01:** *SI* el saldo en efectivo de la caja activa es inferior al monto que se intenta pagar en efectivo, *EL SISTEMA* bloqueará el egreso y ofrecerá tres opciones operativas inmediatas:
  1. Registrar como Transferencia Bancaria (Bancolombia/Nequi/Daviplata).
  2. Solicitar un Traslado de Dinero desde Caja Mayor.
  3. Diferir el saldo a Crédito con el Proveedor (Cuentas por Pagar - CxP).
- **EARS-W02:** *SI* un egreso no cuenta con un concepto válido o el monto es menor o igual a cero, *EL SISTEMA* impedirá el envío del formulario.

---

## 3. Criterios de Aceptación (DoD)
1. Integración bidireccional entre `BucaramangaReceivingWizard` y `cashService` para egresos de fletes y pagos de contado.
2. Modal táctil `EgresoOperativoModal.tsx` en `CashFlowView.tsx` con accesos rápidos para fletes de camiones y proveedores de pescado.
3. Manejo de fondos insuficientes con redirección a transferencia bancaria o cuenta por pagar.
4. Arqueo ciego funcional con desglose de denominaciones COP y ticket de arqueo/cierre térmico (80mm/58mm) o PDF.
5. Pestañas táctiles de filtrado rápido en `CashFlowView`.
6. Cero jerga técnica o contable en vistas operativas.
7. 100% de tests unitarios pasando en Vitest y 0 errores en `tsc --noEmit`.
8. Verificación en Chrome DevTools a 375 px (vista móvil) con 0 errores en consola.
