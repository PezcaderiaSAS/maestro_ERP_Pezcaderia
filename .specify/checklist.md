# Lista de Verificación de Calidad (Quality Assurance Checklist - SDD / ISO 25010)

**Proyecto:** MaestroPescaderia ERP  
**Fecha:** 2026-08-13  
**Comando Trigger:** `/speckit.checklist`  
**Documento Fuente:** [`.specify/specification.md`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/.specify/specification.md)  
**Estado:** PENDIENTE DE VALIDACIÓN Y APROBACIÓN POR EL USUARIO  

---

## 📋 1. Compleitud y Claridad de Requerimientos (Completeness & Clarity)

- [x] **R1.1 (Definición de Alcance)**: Las 5 Fases de la Hoja de Ruta responden de manera clara y explícita al "QUÉ" y al "POR QUÉ".
- [ ] **R1.2 (Especificación de Interfaces)**: Todos los contratos entre capas (Vista ↔ Servicio ↔ Store ↔ Supabase DB) están libres de ambigüedad.
- [ ] **R1.3 (Resolución de Deuda Técnica)**: Los 7 ciclos de dependencia circular identificados en Graphify (`cashService.ts`, `App.tsx`, modales de caja) tienen una estrategia de desacoplamiento definida.

---

## 🏛️ 2. Cumplimiento de la Constitución del ERP (Architecture & Business Rules)

- [ ] **R2.1 (Arquitectura Data-Driven)**: Ninguna vista React (`src/views/`) contiene lógica de negocio pesada o manipulación directa de base de datos.
- [ ] **R2.2 (Análisis Inventario ABC Pareto 80/20)**: El motor de valorización de inventario clasifica estrictamente en Pareto 80/20 (Clase A: 80%, Clase B: 15%, Clase C: 5%).
- [ ] **R2.3 (TypeScript Estricto)**: Todos los archivos de tipos en `src/types/` utilizan interfaces explícitas e inmutables, sin uso del tipo `any`.
- [ ] **R2.4 (Estándar de UI/UX)**: La interfaz utiliza Vanilla Tailwind CSS con paletas profesionales y SweetAlert2 para notificaciones/confirmaciones.
- [ ] **R2.5 (Seguridad & RLS)**: Las consultas a PostgreSQL/Supabase aplican políticas Row Level Security (RLS) estrictas por rol y bodega.

---

## ⚙️ 3. Mantenibilidad y Desacoplamiento (Maintainability & Decoupling)

- [x] **R3.1 (Eficiencia de Contexto)**: El análisis estructural se realiza exclusivamente utilizando el Grafo de Conocimiento (`graphify-out/`) sin lecturas masivas.
- [ ] **R3.2 (Modularidad de Componentes)**: Los componentes visuales se dividen de manera modular impidiendo componentes monolíticos de más de 400 líneas.
- [ ] **R3.3 (Aislamiento de Zustand Stores)**: Los stores se dividen por dominio (`useInventoryStore`, `usePurchaseStore`, `useCashStore`) evitando re-renderizados globales innecesarios.

---

## 🧪 4. Verificabilidad y Calidad de Código (Testability & QA Gates)

- [ ] **R4.1 (Pruebas Unitarias)**: Todos los servicios de negocio (`src/services/`) cuentan con pruebas unitarias en Vitest con cobertura >= 80%.
- [ ] **R4.2 (Estrategia Dual-API & Fallback)**: El servicio del microservicio Spring Boot 4 cuenta con un servicio local de fallback (`LocalAnalisisAbcService.ts`) para desarrollo desacoplado.
- [ ] **R4.3 (Integridad WMS / FEFO)**: El control de lotes First Expired, First Out y el límite de mermas (PIN en >35%) están validados por pruebas automáticas.

---

## 🔒 5. Gestión de Riesgos e Infraestructura (Risk & Infrastructure)

- [ ] **R5.1 (Microservicio Spring Boot 4)**: La integración con Java 21 Virtual Threads mantiene latencias de respuesta < 100ms.
- [ ] **R5.2 (Validación de Bodegas Dinámicas)**: Se impide la eliminación o desactivación de cualquier bodega con stock activo (`stock > 0`) en el catálogo.

---

*Lista de Verificación de Calidad registrada en `.specify/checklist.md` bajo el marco Spec-Driven Development.*
