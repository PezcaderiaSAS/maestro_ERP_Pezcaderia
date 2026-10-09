---
name: wms-cold-storage-rental
description: Gestión de alquiler de cuartos fríos (WMS 3PL), contratos por días/meses, posiciones de 800 kg, inventario en custodia de terceros, actas de recepción/despacho y contabilización de ingresos.
---

# WMS Cold Storage Rental & Third-Party Custody Skill

Esta habilidad define la arquitectura, reglas de negocio y flujos operativos para el servicio de **Alquiler de Cuarto Frío y Custodia de Mercancía 3PL** en MaestroPescaderia ERP.

---

## 🏛️ 1. Principios del Modelo de Negocio 3PL

1. **Unidad Estándar de Almacenamiento (Posición / Slot):**
   - Cada posición física equivale a **800 kilogramos** de capacidad nominal de almacenamiento en cuarto frío.
   - Un cliente contrata $N$ posiciones por un periodo determinado (**Días** o **Meses**).
   - Control de sobrecupo: Si el peso ingresado excede los $800 \text{ kg} \times N$, el sistema alerta y requiere ampliación de contrato o cobro de tarifa por sobrepeso/posición adicional.

2. **Aislamiento Contable del Inventario en Custodia:**
   - La mercancía del cliente **NO es propiedad de la empresa**.
   - **Regla Contable Estricta:** NO debe registrarse en la cuenta de inventario de mercancías (`1435`) ni afectar el costo de venta (`6135`).
   - Se controla en **Cuentas de Orden Fiduciarias / Bienes Recibidos en Custodia** (Cuentas `8105` y `8405`).

3. **Causación y Facturación de Ingresos:**
   - **Ingreso Operacional por Servicio de Almacenamiento:** Cuenta `4155` (Ingresos por Servicios de Alquiler/Bodegaje).
   - **Impuestos:** IVA general del 19% aplicable a servicios de arrendamiento de espacio/bodegaje comercial.
   - **Cuentas por Cobrar:** Cuenta `1305` Clientes Nacionales.
   - **Retenciones Aplicables:** Retención en la fuente por servicios o arrendamiento comercial según perfil tributario del cliente.

---

## 📦 2. Ciclo de Vida del Servicio de Custodia

```mermaid
graph TD
    A[Registro de Cliente 3PL] --> B[Creación de Contrato de Alquiler<br>Posiciones x 800kg | Días o Meses]
    B --> C[Asignación de Slots en Cuarto Frío]
    C --> D[Acta de Recepción / Entrada<br>Pesaje en báscula, Lote, Temp, Fotos]
    D --> E[Inventario en Custodia Activo]
    E --> F[Causación Contable de Alquiler<br>Facturación Periódica o Anticipada]
    E --> G[Acta de Despacho / Salida<br>Entrega Total o Parcial, Pesaje, Saldo Remanente]
    G --> H[Cierre o Renovación de Contrato]
```

---

## 📄 3. Documentos de Soporte Requeridos

1. **Contrato de Alquiler de Espacio Frigorífico:** Define vigencia, cantidad de posiciones (800 kg c/u), tarifa diaria/mensual, temperatura pactada (ej. congelación $-18^\circ\text{C}$ o refrigeración $0-4^\circ\text{C}$), póliza o cláusula de responsabilidad.
2. **Acta de Recepción e Ingreso de Custodia (Documento Equivalente/Remisión de Entrada):**
   - Número consecutivo único.
   - Detalle de productos, empaque, peso bruto, peso tara y peso neto recibido en báscula.
   - Lote del fabricante/cliente y fecha de vencimiento.
   - Posiciones/Slots asignados.
   - Firma del transportador/cliente y del almacenista receptor.
3. **Acta de Despacho y Salida de Custodia:**
   - Detalle de kilos retirados y posiciones liberadas.
   - Validación de balance remanente de mercancía.
   - Paz y salvo contable de pagos de alquiler antes del retiro de la mercancía.
4. **Certificado de Existencias en Custodia:**
   - Reporte descargable en PDF con validez legal que acredita la mercancía resguardada para el cliente en cualquier fecha de corte.

---

## 🔐 4. Modelo de Seguridad Multi-Tenant y Acceso de Clientes

- **Portal de Autoservicio para Clientes:** Los clientes pueden autenticarse con su usuario y consultar en tiempo real su inventario en custodia, movimientos históricos y saldo de días contratados.
- **Supabase RLS:** Cada consulta a `custodia_inventario` y `movimientos_custodia` valida estrictamente que `cliente_id` coincida con el usuario autenticado (`auth.uid()`).
