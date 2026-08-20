# Especificación Base de Requerimiento (Spec / SDD)
**Proyecto:** MaestroPescaderia ERP  
**Fecha:** 2026-08-13  
**Comando Trigger:** `/speckit.specify` | Metodología C-R-T-C-O (`prompt-optimizer`)  
**Estado:** PENDIENTE DE APROBACIÓN POR EL USUARIO  

---

## 1. Visión General y Objetivos (El "QUÉ")

Crear e implementar la **Hoja de Ruta de Desarrollo Integral (Master Development Roadmap)** para el ERP **MaestroPescadería**, basada en un análisis profundo del grafo de conocimiento local (`graphify-out/`), los 13 módulos de arquitectura de la plataforma y el plan de microservicios.

La Hoja de Ruta se estructura en **5 Fases Ejecutables**:

### 📍 Fase 1: Estabilización de Arquitectura & Saneamiento de Deuda Técnica (Prioridad Alta)
* **Resolución de Importaciones Circulares**: Eliminar los 7 ciclos de dependencia circular detectados por Graphify entre Vistas, Modales y Servicios (ej. `App.tsx <-> CashFlowView.tsx <-> cashService.ts`, `AperturaCajaModal`, `ArqueoCajaModal`).
* **Desacoplamiento Data-Driven**: Migrar las vistas principales (`CRMView`, `DashboardView`, `HRView`) para que consuman servicios modulares bajo contratos `IDataService` en lugar de acceder directamente al store global monolítico (`useAppStore`).
* **Tipado Estricto & Modularidad**: Reducir el tamaño de componentes monolíticos (>400 líneas) e independizar los stores Zustand por dominio funcional.

### 📍 Fase 2: Consolidación de WMS, Inventario ABC Pareto & Configuración Dinámica de Bodegas
* **Configuración Dinámica de Bodegas**: Finalizar la integración del gestor `WarehouseConfigManager` y desacoplar los arreglos estáticos de bodegas en `App.tsx`, `TransferForm.tsx` y `PurchaseOrderForm.tsx`.
* **Motor Inventario Pareto ABC (80/20)**: Cumplir con la regla constitucional del ERP priorizando la categorización de inventario por impacto financiero (Clase A: 80% valor, Clase B: 15%, Clase C: 5%).
* **Control de Trazabilidad FEFO & Mermas**: Reforzar el control de lotes First Expired, First Out y el límite de mermas en producción (PIN de supervisión al superar 35%).

### 📍 Fase 3: Modularización de Cajas, Cartera B2B y Políticas RLS en Supabase
* **Aislamiento de Flujo de Caja**: Separar la gestión de turnos de caja POS (`TurnoCaja`, `CashFlowView`) de las pasarelas digitales.
* **Cartera y Crédito B2B**: Implementar la validación automática de cupos de crédito y control de saldos a favor con Notas Crédito en `ClientService`.
* **Seguridad RLS (Row Level Security)**: Aplicar políticas RLS estrictas en PostgreSQL/Supabase para aislar el acceso multi-rol y multi-bodega.

### 📍 Fase 4: Microservicio Backend Spring Boot 4 (Java 21+ Virtual Threads)
* **Escafoldado de Microservicio Desacoplado**: Crear la infraestructura en Java 21+ para procesar operaciones de computación intensiva (Cálculo Pareto ABC, Facturación en Lote y Motor de Promociones Odoo 18).
* **Servidor de Recursos OAuth2**: Configurar `SecurityConfig.java` para autenticación federada mediante la validación de tokens JWT emitidos por Supabase Auth.
* **Integración Dual-API en React**: Desarrollar el adaptador de servicio `SpringAnalisisAbcService.ts` que implementa `IAnalisisAbcService`.

### 📍 Fase 5: Integración B2B, SIIGO API, Logística de Rutas & Twenty CRM
* **Facturación Electrónica (SIIGO API)**: Emisión automática y manual de facturas electrónicas, remisiones y notas crédito con logs de auditoría.
* **Logística de Despacho y Rutas**: Planillas de ruta con cuadre de caja obligatorio a la entrega del conductor.
* **Sincronización Twenty CRM**: Integración bidireccional de oportunidades comerciales B2B.

---

## 2. Justificación Técnica y de Negocio (El "POR QUÉ")

El análisis del Grafo de Conocimiento (`graphify-out/GRAPH_REPORT.md` - 550 archivos, 4,794 nodos, 395 comunidades) revela las siguientes necesidades críticas:

1. **Riesgo de Inestabilidad en Build/HMR**: Existen ciclos de importación activos entre `App.tsx`, `CashFlowView` y `cashService`. En Vite/React 18, esto produce errores de "cannot access before initialization" o renderizados infinitos en producción.
2. **Cumplimiento de la Constitución del ERP**: La regla constitucional exige arquitectura **Data-Driven**, separación estricta entre capa de vista y capa de servicio, UI en Tailwind CSS, alertas con SweetAlert2 y cálculo de inventario basado en Pareto ABC 80/20.
3. **Escalabilidad y Ahorro de Recursos ($0 USD Stack)**: Delegar el procesamiento pesado (Análisis ABC masivo, promociones complejas) a Spring Boot 4 con Virtual Threads de Java 21 permite mantener un frontend React fluido (<100ms de respuesta) sin costos de infraestructura.

---

## 3. Matriz de Dependencias e Impacto (Evidencia de Graphify)

| Componente / Módulo | Dependencias Clave Detectadas | Nivel de Riesgo | Acción Requerida en la Hoja de Ruta |
| :--- | :--- | :--- | :--- |
| **`cashService.ts` / `CashFlowView.tsx`** | `App.tsx`, `AperturaCajaModal`, `CierreCajaModal` | 🔴 **CRÍTICO** | Romper ciclos de dependencia extrayendo tipos e interfaces a `src/types/cash.types.ts`. |
| **`WarehouseConfigManager.tsx` / `App.tsx`** | `useInventoryStore`, `localDb.ts`, `TransferForm` | 🟡 **MEDIO** | Reemplazar dependencias estáticas de bodegas por el estado dinámico en `localDb`. |
| **`CRMView` / `DashboardView` / `HRView`** | `useAppStore`, `IDataService` | 🟡 **MEDIO** | Refactorizar vistas para consumir adaptadores de servicios inmutables. |
| **Microservicio Spring Boot 4** | `Supabase JWT`, `AnalisisAbcItemRecord` | 🟢 **NUEVO** | Crear el contrato OpenAPI v3 e implementar endpoints Java 21. |

---

## 4. Criterios de Aceptación de la Especificación

- [x] **Sin Lecturas Masivas de Código**: La investigación y mapeo se realizaron estrictamente utilizando el grafo de conocimiento local `graphify-out/` y documentación preexistente.
- [x] **Estructura C-R-T-C-O**: Formulación clara de Contexto, Rol, Tarea, Restricciones y Formato de Salida.
- [x] **Delimitación de Fases**: 5 Fases secuenciales bien definidas con priorización técnica.
- [ ] **Aprobación del Usuario**: Esperar confirmación explícita del usuario antes de proceder a la creación/edición de código o componentes.

---

*Especificación base registrada en `.specify/specification.md` bajo la metodología Spec-Driven Development.*
