# Control de Calidad 1: Aclaraciones de Dominio y Arquitectura (/speckit.clarify)

- **Especificación:** SPEC-022 (Compras, Proveedores y Recepción con Trazabilidad FEFO en Muelle)
- **Fecha:** 2026-10-18
- **Estado:** COMPLETADO Y ACORDADO CON EL USUARIO

---

## 1. Decisiones Clave de Dominio y UX/UI

### Q1: Punto de Acceso Principal en la UI
- **Decisión Acordada:** Pestaña directa y dedicada en la Navegación Principal (`AppRouteId.DOCK_PURCHASES` - 'Recepción en Muelle & Compras'), manteniendo interoperabilidad directa desde la vista de Inventario (`AppRouteId.INVENTORY`).
- **Impacto Arquitectónico:** Permite al operario de muelle acceder en 1 toque directo desde el menú lateral/topbar sin necesidad de navegar dentro de sub-pestañas complejas de inventario.

### Q2: Asignación y Formato del Código de Lote FEFO
- **Decisión Acordada:** Generación automática determinista con formato canónico:
  $$\text{Código Lote} = \text{LOT-YYYYMMDD-PROV-SEC}$$
  (ejemplo: `LOT-20261018-MARP-001`).
  Se incluye un campo táctil opcional y botón 1-toque para anexar el número de lote de fábrica o número de guía de transporte del camión cuando el producto provenga de distribuidor/piscifactoría con certificación de origen.
- **Impacto Arquitectónico:** Garantiza trazabilidad tanto para faena artesanal propia/costera (sin lote de origen) como para despachos industriales de terceros.

### Q3: Tratamiento Financiero de Compras a Crédito y Contado
- **Decisión Acordada:**
  1. **Compras a Crédito:** Se crea de forma automática e integrada un registro de pasivo en `cuentas_por_pagar` (`useAccountsPayableStore` / servicio `accountsPayableService.ts`), calculando la fecha de vencimiento según el plazo comercial registrado en el proveedor (`dias_credito`).
  2. **Compras de Contado:** Se debita de inmediato el monto total del saldo en efectivo de la caja activa mediante `cashService.registrarMovimiento` con concepto `EGRESO_COMPRA_MERCANCIA`, garantizando cuadre estricto de caja ciega.
- **Impacto Arquitectónico:** Cierra la brecha entre operaciones WMS de muelle y la tesorería / estados financieros del ERP.

---

## 2. Alineación con las Reglas Preceptivas
- **Regla del Niño de 12 Años:** targets $\ge 48\text{ px}$, botón principal $\ge 56\text{ px}$, Stepper guiado $\le 3$ pasos, cero imágenes externas (100% Lucide React).
- **Light Mode WCAG 2.2 AA+:** Fondos slate claros, textos pizarra de alto contraste $> 4.5:1$ y semáforo térmico esmeralda/ámbar/rojo.
- **Catch Weight Pesaje Muelle:** Tara canastilla estándar $2.0\text{ kg}$, descuento por hielo $0-15\%$ y cálculo determinista.
