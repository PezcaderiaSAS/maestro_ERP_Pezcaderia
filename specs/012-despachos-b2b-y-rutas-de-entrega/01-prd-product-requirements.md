# 01. PRD — Product Requirements Document
## Módulo de Despachos B2B y Rutas de Entrega — La Pezcadería ERP

- **Versión:** 1.0.0
- **Fecha de Creación:** 2026-10-14
- **Estado:** Propuesto (Pendiente Aprobación Humana)
- **Módulo:** Logística, Despachos B2B y Liquidación de Rutas

---

### 1. Resumen Ejecutivo y Declaración del Problema
En la operación de distribución mayorista y HORECA (Hoteles, Restaurantes y Catering) de productos del mar de La Pezcadería, la entrega de productos perecederos (refrigerados y congelados) presenta cuatro fricciones críticas:
1. **Desconexión entre Alistamiento y Despacho:** Los pedidos finalizados en bodega (`OrderKanbanView`) quedan sin agrupación logística inteligente, generando sobrecostos de combustible y desorden en el muelle de carga.
2. **Puntos Ciegos en Calle:** Los conductores no cuentan con una herramienta ágil y offline para registrar paradas de entrega, firmas digitales de recepción conforme y causales de devolución parcial.
3. **Fugas de Dinero en Contra-Entrega (COD):** Los cobros en efectivo y transferencias digitales recaudados en ruta no se concilian formalmente contra la tesorería general (`cashService`), creando descuadres entre los pedidos entregados y el dinero liquidado.
4. **Pérdida de Trazabilidad en Devoluciones y Mermas:** El producto rechazado por el cliente en ruta no reingresa automáticamente al almacén de averías/repesaje, falseando el kardex de inventario.

**Solución a Construir:**
Un sistema unificado de **Torre de Control de Despachos B2B (DispatchView & Kanban)** para consolidar pedidos listos en Manifiestos de Ruta, asignando vehículo y chofer, integrado con un **Portal Móvil Offline-First para Choferes (PWA táctil)** que registra entregas, cobros mixtos, firmas digitales y devoluciones, culminando en un **Proceso Atómico de Liquidación de Ruta** contra Tesorería e Inventario con métricas de gobernanza **OTIF (On-Time In-Full)**.

---

### 2. Personas y Actores del Sistema
| Actor | Rol en ERP | Responsabilidades Clave |
| :--- | :--- | :--- |
| **Jefe de Despachos / Logística** | `admin` / `despachador` | Agrupa pedidos listos en manifiestos, optimiza secuencia de paradas, asigna conductor/vehículo y monitorea rutas activas en tiempo real. |
| **Conductor / Transportista** | `chofer` | Visualiza su manifiesto del día en dispositivo móvil, registra check-in de llegada, entrega producto, captura firma digital y recauda dinero. Funciona 100% offline. |
| **Tesorero / Administrador** | `admin` / `cajero_principal` | Audita la liquidación final de la ruta: recibe el efectivo físico, valida soportes de transferencias digitales, aprueba gastos de ruta (peajes/combustible) y concilia las devoluciones de producto. |
| **Cliente HORECA / Receptor B2B** | Externo | Revisa físicamente el producto recibido, firma digitalmente en pantalla táctil y efectúa el pago acordado. |

---

### 3. Requisitos Funcionales (FR)

#### FR-01: Integración Bidireccional OrderKanban $\leftrightarrow$ Manifiesto de Despacho
- **FR-01.1:** En `OrderKanbanView`, los pedidos en estado `LISTO` deben permitir selección múltiple para la acción rápida *"Crear Manifiesto de Ruta"*.
- **FR-01.2:** Al confirmar y despachar el manifiesto, todos los pedidos vinculados pasan automáticamente de `LISTO` a `EN_DESPACHO`.
- **FR-01.3:** Al registrarse la entrega exitosa en el portal del chofer, el estado del pedido en el Kanban y en `ventas` se actualiza reactivamente a `ENTREGADO`.

#### FR-02: Generador de Manifiestos de Carga y Asignación de Recursos
- **FR-02.1:** El despachador debe seleccionar el Conductor asignado y el Vehículo (con placa y capacidad en kg).
- **FR-02.2:** Cálculo automático del peso total de carga (kg), volumen estimado y valor total de cobros esperados.
- **FR-02.3:** Registro de variables críticas de salida: Odómetro inicial (km), nivel de combustible y temperatura de la cava refrigerada (°C) para control de cadena de frío.
- **FR-02.4:** Generación de Hoja de Ruta / Remisión Consolidada para impresión térmica o PDF.

#### FR-03: Portal Móvil Offline-First para Choferes
- **FR-03.1:** Acceso mediante vista web optimizada para pantallas táctiles móviles (375 px a 420 px).
- **FR-03.2:** Persistencia local en IndexedDB que permite consultar las paradas asignadas y sus detalles sin conexión a internet.
- **FR-03.3:** Registro de eventos de parada:
  - *Check-in Llegada:* Marca de tiempo y captura opcional de geolocalización (lat/long).
  - *Resultado de Entrega:* `ENTREGADO_TOTAL`, `ENTREGADO_PARCIAL` o `RECHAZADO`.
  - *Captura de Firma Digital:* Canvas táctil con trazo suave para firma del receptor, almacenada en base64 / SVG local.
  - *Desglose de Cobro:* Efectivo COP, transferencia digital (con número de comprobante) o crédito B2B autorizado.
  - *Novedades y Devoluciones:* Selección de ítems y kilos rechazados con motivo predeterminado (calibre incorrecto, mal olor, deshidratación, empaque dañado).
- **FR-03.4:** Cola de eventos Outbox con sincronización automática en segundo plano al recuperar señal de red.

#### FR-04: Módulo de Liquidación Estricta de Ruta en Tesorería
- **FR-04.1:** Al finalizar el recorrido, el chofer retorna a base y se abre la *"Liquidación de Manifiesto"*.
- **FR-04.2:** Conciliación obligatoria de cuatro cajas financieras:
  1. Total Efectivo Esperado vs Efectivo Físico Entregado (cálculo de sobrante/faltante con tolerancia $0 COP).
  2. Total Transferencias Digitales reportadas con verificación de comprobante.
  3. Total Ventas a Crédito B2B pasadas a Cartera.
  4. Gastos operativos en ruta justificados (combustible, peajes, parqueaderos).
- **FR-04.3:** Al aprobarse la liquidación, se ejecuta una transacción atómica que:
  - Ingresa el efectivo formalmente a la caja de Tesorería (`cashService`).
  - Genera el movimiento de reingreso al almacén de averías/repesaje por los ítems devueltos.
  - Cambia el estado del Manifiesto a `LIQUIDADA`.

#### FR-05: Tablero de Gobernanza y Métricas OTIF
- **FR-05.1:** Cálculo determinista del indicador **OTIF (On-Time In-Full)**:
  $$\text{OTIF \%} = \frac{\text{Pedidos A Tiempo y 100\% Completos}}{\text{Total Pedidos en Manifiesto}} \times 100$$
- **FR-05.2:** Tiempos promedio de tránsito vs tiempos de atención y descarga en cliente.
- **FR-05.3:** Ranking de cumplimiento de choferes y exportación de reportes a Excel/PDF.

---

### 4. Requisitos No Funcionales (NFR)
- **NFR-01 (Alineación Estética):** Interfaz 100% en Modo Claro (Light Mode) cumpliendo contraste WCAG 2.2 AA+ (ratios $\ge 4.5:1$ y $\ge 7:1$) de acuerdo con `.agents/skills/erp-pos-design-tokens/SKILL.md`.
- **NFR-02 (Rendimiento):** Tiempo de renderizado inicial de `DispatchView` y del Portal del Chofer $\le 200\text{ ms}$; guardado local en Outbox $\le 50\text{ ms}$.
- **NFR-03 (Moneda y Exactitud):** Todos los valores monetarios en pesos colombianos (COP) deben ser números enteros estrictos redondeados deterministamente con `Math.round()`.
- **NFR-04 (Seguridad):** Multi-tenant estricto con RLS en Supabase filtrado por `tenant_id`.
