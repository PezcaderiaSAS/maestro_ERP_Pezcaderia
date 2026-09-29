# Especificación Técnica SDD: Modernización Integral del Módulo de Caja POS
## Sistema de Arqueo, Billeteras Digitales, Alivios de Caja y Persistencia Enterprise

**ID:** SPEC-002-POS-CASH-ENGINE  
**Fecha:** 29 de Septiembre de 2026  
**Estatus:** APROBADA (Vía /grill-me + /prompt-optimize-pro)  
**Roles del Enjambre:**  
- `@agency-software-architect`: Arquitectura general, máquina de estados y orquestación.
- `@agency-data-engineer`: Modelo relacional Supabase, RLS multi-tenant, RPCs transaccionales con bloqueo pesimista y asientos contables.
- `@agency-ui-reviewer`: Experiencia de usuario en mostrador, botones de denominación rápida, visor de cambio gigante y atajos de teclado.
- `@agency-quality-engineer`: Esquemas Zod deterministas, pruebas unitarias Vitest y pruebas E2E con Playwright.

---

## 1. Visión y Objetivos de Negocio
Modernizar el módulo de Caja POS de **La Pezcaderia ERP** para ofrecer una experiencia en mostrador **ultrarrápida, fluida y simple de operar para los cajeros**, respaldada por una arquitectura empresarial segura en Supabase con:
1. **Cobro Táctil y Rápido en Mostrador**: Atajos de teclado (`Enter`, `Espacio`, `Esc`), botones de denominación de billetes ($10k, $20k, $50k, $100k, Pago Exacto) y visor de vuelto/cambio en tamaño gigante para evitar errores humanos.
2. **Medios de Pago Colombianos Integrados**: Registro directo de **Nequi**, **Daviplata**, **QR Bancolombia**, **Datafono**, **Efectivo** y ventas a **Crédito**, con soporte para pagos divididos (*split payment*).
3. **Arqueo Mixto Configurable por Rol**: Cierre de turno asistido o 100% ciego (el cajero desglosa billetes y monedas sin ver el saldo teórico; el supervisor audita diferencias).
4. **Control de Retiros Parciales (*Drop / Alivio de Caja*)**: Alerta preventiva configurable al alcanzar el tope máximo de efectivo en gaveta (ej. $1.500.000 COP) y botón manual para traslados seguros a Caja Mayor con comprobante impreso.
5. **Tratamiento Contable de Descuadres**: Umbral de tolerancia para redondeos (< $5.000 COP); descuadres mayores generan registro de faltante (responsabilidad del trabajador) o sobrante (ingreso extraordinario) con justificación obligatoria.

---

## 2. Reglas de Negocio Inmutables (RN)

- **RN-C01 (Apertura Obligatoria de Turno)**: Ningún operador puede facturar en el POS sin un turno abierto con su base inicial de efectivo registrada.
- **RN-C02 (Arqueo Configurable por Rol)**: Los cajeros estándar realizan arqueo ciego (sin visualización del monto esperado en sistema). Los usuarios con rol `ADMIN` o `SUPERVISOR` pueden realizar arqueo asistido.
- **RN-C03 (Visor de Cambio Instantáneo)**: En pagos en efectivo, el sistema calcula de inmediato el cambio (`efectivoRecibido - totalVenta`), bloqueando el cobro si el valor recibido es inferior al monto a pagar.
- **RN-C04 (Alerta de Tope de Gaveta)**: Si `efectivoActualEnGaveta >= topeMaximoConfigurable`, el sistema muestra una notificación visual amigable sugiriendo realizar un *Retiro Parcial* hacia Caja Mayor.
- **RN-C05 (Tolerancia y Asiento de Descuadre)**:
  - Si `|diferenciaArqueo| <= umbralTolerancia` (defecto $5.000 COP): Se cataloga como ajuste normal por redondeo de cambio.
  - Si `diferenciaArqueo < -umbralTolerancia` (Faltante): Requiere justificación del cajero y genera cuenta por cobrar a trabajador.
  - Si `diferenciaArqueo > umbralTolerancia` (Sobrante): Requiere justificación y se registra como ingreso extraordinario.
- **RN-C06 (Multi-Tenant Estricto)**: Todas las operaciones de caja se vinculan obligatoriamente a `empresa_id` con políticas RLS activas en Supabase.

---

## 3. Modelo de Datos Relacional (Supabase PostgreSQL)

### 3.1. Tablas Principales
1. **`cajas_pos`**: Cajas físicas y terminales asignadas a bodegas o puntos de venta.
   - `id UUID PRIMARY KEY`, `empresa_id UUID`, `bodega_id UUID`, `nombre VARCHAR(100)`, `tope_efectivo_maximo NUMERIC`, `modo_arqueo_ciego BOOLEAN DEFAULT TRUE`, `activa BOOLEAN DEFAULT TRUE`.
2. **`turnos_pos`**: Turnos de operación de cada cajero.
   - `id UUID PRIMARY KEY`, `empresa_id UUID`, `caja_id UUID`, `cajero_id UUID`, `fecha_apertura TIMESTAMPTZ`, `fecha_cierre TIMESTAMPTZ`, `base_inicial NUMERIC`, `total_efectivo NUMERIC`, `total_nequi NUMERIC`, `total_daviplata NUMERIC`, `total_tarjeta NUMERIC`, `total_credito NUMERIC`, `total_retiros_parciales NUMERIC`, `saldo_esperado_efectivo NUMERIC`, `saldo_real_declarado NUMERIC`, `diferencia NUMERIC`, `estado VARCHAR(20) CHECK (estado IN ('ABIERTO', 'CERRADO', 'AUDITADO'))`.
3. **`arqueos_pos_detalles`**: Desglose físico de billetes ($100k, $50k, $20k, $10k, $5k, $2k) y monedas ($1.000, $500, $200, $100, $50).
4. **`movimientos_pos_caja`**: Libro de ingresos, egresos, ventas y retiros parciales del turno.
