# Speckit Analyze: Reporte de Consistencia y Alineación Cruzada (v1.0)

**Fecha:** 2026-07-08 | **Estado:** Control de Calidad 2 completado

Este reporte audita la consistencia y alineación cruzada entre la Especificación, el Plan Técnico y la Lista de Tareas para la refactorización de `PricingView.tsx` y la centralización de los tipos del ERP.

---

## ✅ HALLAZGOS DE ALINEACIÓN (Consistencia Confirmada)

### 1. Coherencia en la Estructura de Tipos

* **Análisis**: El Spec, el Plan y las Tareas (Fase 1) están perfectamente alineados en la lista de tipos a centralizar: `Cliente`, `Proveedor`, `Conductor`, `DevolucionPedido`, `ProductCatalog`, `ProductPricing` y `Product`.
* **Mitigación**: La propuesta de re-exportar estos tipos desde `src/App.tsx` hacia `src/types/erp.types.ts` evita dependencias circulares y previene tener que modificar imports en más de 12 archivos satélites (como `InventoryView.tsx`, `POSView.tsx` o `ARView.tsx`), reduciendo el riesgo de regresión de compilación al mínimo.

### 2. Separación Limpia de Lógica e Interfaz (Desacoplamiento de Alertas)

* **Análisis**: Las cotizaciones requieren alertas de confirmación a través de `SweetAlert2` al cambiar el estado a "Vendida". El plan especifica que `usePricing.ts` no importará SweetAlert2, sino que utilizará un sistema de callbacks (`onSuccess`/`onError`).
* **Verificación**: Las tareas 2.5 (en hooks) y 3.3 (en vistas) reflejan exactamente esta arquitectura. Esto simplifica las pruebas unitarias del hook en Vitest al no requerir el mockeo de elementos del DOM de SweetAlert2.

---

## 🚨 FISURAS IDENTIFICADAS (Mitigación de Riesgos)

### FISURA 1 — Confusión de Nombres: `Product` vs `Producto`

* **Hallazgo**: El archivo `src/App.tsx` define `Product` (sin 'o') y `ProductCatalog`. Sin embargo, `src/store/useInventoryStore.ts` define e importa `Producto` (con 'o').
* **Riesgo**: Mezclar ambas interfaces puede causar errores silenciosos de tipado o coerción de tipos (ej: que a `Producto` le hagan falta campos como `precio_venta_mayorista`).
* **Acción de Mitigación**:
  * Mantendremos la distinción de manera limpia en `erp.types.ts`.
  * Documentaremos explícitamente en el código que `Product` representa la entidad con datos comerciales y de precios (para facturación y cotización), mientras que `Producto` (del store de inventario) representa la entidad física de control de existencias.

### FISURA 2 — Entorno de Pruebas de Hooks en Vitest

* **Hallazgo**: La tarea 4.2 y la checklist especifican escribir pruebas unitarias para `usePricing.ts`. Sin embargo, para probar hooks personalizados de React que consumen stores de Zustand, es necesario envolverlos o asegurar que el store de Zustand se limpie entre ejecuciones de pruebas para evitar fugas de estado.
* **Acción de Mitigación (Añadido a Tarea 4.2)**:
  * El archivo de pruebas `src/tests/usePricing.test.tsx` deberá limpiar explícitamente el estado de los stores de Zustand en su bloque `beforeEach` utilizando el método `getState().reset` o similar, garantizando el aislamiento de las pruebas.

---

## 📋 PLAN DE CONTROL DE CALIDAD (Alineación de Entregables)

| Fase | Entregable | Estado de Coherencia | Riesgo Relacionado |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Centralizar tipos | **Consistente** (100% alineado) | Dependencia circular (Resuelto vía re-exportación) |
| **Fase 2** | Hook `usePricing` | **Consistente** (100% alineado) | Acoplamiento de UI (Resuelto vía callbacks) |
| **Fase 3** | Refactorizar vista | **Consistente** (100% alineado) | Bloqueos de ruteo (Resuelto en Tarea 3.1) |
| **Fase 4** | Tests y Compilación | **Consistente** (100% alineado) | Fugas de estado en Zustand (Resuelto en Tarea 4.2) |
