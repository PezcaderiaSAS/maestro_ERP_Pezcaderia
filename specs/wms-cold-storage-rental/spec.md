# Especificación Funcional: Módulo de Alquiler de Cuarto Frío y Custodia WMS (3PL)

**Módulo:** `wms-cold-storage-rental`  
**Estado:** Aprobado vía `/grill-me`  
**Fecha:** 28 de Septiembre de 2026  
**Ecosistema:** La Pezcaderia ERP (Supabase, PostgreSQL, React 18, Vite, Tailwind CSS)

---

## 1. Declaración del Problema y Oportunidad

La Pezcaderia cuenta con infraestructura de refrigeración y congelación industrial subutilizada o con capacidad disponible. La empresa requiere prestar el servicio de **Almacenamiento Frigorífico en Custodia a Terceros (WMS 3PL)** para:
1. **Generar Nuevas Líneas de Ingreso Recurrente** registradas de forma transparente en la contabilidad general de la empresa.
2. **Garantizar Seguridad Jurídica y Operativa**: Control estricto de mercancía ajena mediante contratos, actas de recepción, actas de despacho y pesajes verificables en báscula.
3. **Aislamiento Contable Estricto**: Asegurar que la mercancía de los clientes no se mezcle jamás con el inventario propio de la empresa, evitando distorsiones en los balances contables de inventario (Cuenta `1435`) y costo de venta (Cuenta `6135`).

---

## 2. Requerimientos Funcionales Clave

### 2.1 Gestión de Clientes y Contratos de Servicio
- **Registro del Cliente 3PL**: Tercero con NIT/RUT, régimen tributario, datos de contacto y responsables autorizados de retiro.
- **Creación de Contrato de Alquiler**:
  - **Unidad de Medida**: Posiciones de almacenamiento. Cada posición equivale a **800 kilogramos** de capacidad nominal.
  - **Modalidad Temporal**: Por **Días** o por **Meses**.
  - **Tarifas**: Valor pactado por posición/día o posición/mes.
  - **Condiciones de Frío**: Temperatura pactada (Congelación $-18^\circ\text{C}$ a $-25^\circ\text{C}$ o Refrigeración $0^\circ\text{C}$ a $+4^\circ\text{C}$).
  - **Modalidad de Facturación**: Flexible (Anticipada / Prepago o Vencida al corte / despacho).
  - **Cláusula Contable**: Opción de activar Cuentas de Orden Fiduciarias (`8105`/`8405`) para clientes corporativos o aseguradoras.

### 2.2 Catálogo Versátil de Productos en Custodia (SKUs de Clientes)
- Permite registrar los productos específicos del cliente con sus atributos de embalaje:
  1. **Modalidad Solo Peso (Variable)**: Lotes a granel pesados en báscula (ej. atún entero congelado).
  2. **Modalidad Peso Fijo Estandarizado**: Unidades con peso predeterminado (ej. cajas de 20 kg, bloques de 10 kg). El sistema calcula el peso nominal automáticamente y lo valida contra el pesaje bruto.
  3. **Modalidad Mixta (Bultos + Kilos)**: Control dual de cantidad física de cajas/bultos y pesaje gravimétrico en báscula.
  4. **Condiciones de Conservación**: Temperatura requerida y tipo de empaque.

### 2.3 Recepción de Mercancía e Inventario en Custodia
- Registro de **Acta de Recepción e Ingreso**:
  - Fecha/hora, transportador, placa de vehículo.
  - Temperatura de entrada (medición con termómetro infrarrojo/termógrafo).
  - Conteo de bultos/cajas, peso bruto, peso tara y peso neto recibido en báscula.
  - Lote del cliente y fecha de vencimiento.
- **Control de Capacidad y Sobrecupo**:
  - Capacidad contratada: $C = N_{\text{posiciones}} \times 800 \text{ kg}$.
  - Si el peso recibido supera $C$, el sistema alerta y aplica recargo proporcional por kilogramo excedente o asigna una posición adicional según la política aprobada.
- **Cupo Global**: Control de ocupación por capacidad acumulada del cuarto frío sin forzar mapeo individual de coordenadas de rack.

### 2.4 Despacho y Salida de Mercancía
- Registro de **Acta de Despacho y Salida**:
  - Salidas totales o parciales por lote o producto.
  - Validación de báscula (peso despachado).
  - Cálculo de merma natural de frío si aplica:
    $$\% \text{ Merma} = \frac{\text{Peso Entrada} - \text{Peso Salida}}{\text{Peso Entrada}} \times 100$$
  - Cálculo del **Saldo Remanente Exacto** en custodia.
- **Validación de Cartera y Paz y Salvo**:
  - Alerta informativa en pantalla sobre facturas de alquiler vencidas del cliente.
  - Si la mora supera el umbral crítico, requiere aprobación/código de autorización de un usuario Administrador/Gerente para permitir la salida física.

### 2.5 Generación de Documentos de Soporte (Motor PDF)
1. **Contrato de Alquiler de Espacio Frigorífico (PDF)**.
2. **Acta de Recepción e Ingreso de Custodia (PDF)** con pesaje detallado y firmas.
3. **Acta de Despacho y Salida de Custodia (PDF)** con balance remanente y firmas de entrega.
4. **Certificado de Existencias de Inventario en Custodia (PDF)**: Emitido por el operador a solicitud del cliente con fecha de corte oficial.

### 2.6 Integración Contable (Ingresos y Egresos)
- **Ingresos por Alquiler**:
  - Cuenta `4155` (Ingresos Operacionales por Servicios de Alquiler / Bodegaje).
  - Cuenta `2408` (IVA generado 19% sobre servicios de almacenamiento).
  - Cuenta `1305` (Cuentas por Cobrar / Clientes).
  - Cuenta `135515` (Retención en la fuente practicada si el cliente es agente de retención).
- **Cuentas de Orden (Opcional según contrato)**:
  - Cuenta `8105` (Bienes recibidos en custodia) y `8405` (Acreedoras de control).
- **Egresos Operacionales**:
  - Registro de costos directos asociados al mantenimiento, energía eléctrica proporcional e insumos de frío.
