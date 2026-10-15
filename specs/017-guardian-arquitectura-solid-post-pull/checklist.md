# Lista de Verificación de Calidad Arquitectónica (/speckit.checklist)

**Código:** SPEC-017  
**Título:** Checklist de Gobernanza del Master Architect — SOLID, Clean Code y Límites Arquitectónicos  
**Estado:** PENDIENTE DE APROBACIÓN HUMANA  
**Fecha:** 2026-10-15  
**Fase de Ciclo:** Spec Kit v3.0 — Paso 3 (`/speckit.checklist`)  
**Estándar de Referencia:** Clean Architecture (Robert C. Martin), Domain-Driven Design (Eric Evans) y Google Antigravity Quality Gates.  

---

## 1. Principios SOLID

- [ ] **CH-SOLID-01 (Single Responsibility):** Ningún archivo de servicio, store o vista excede las 600 líneas de código sin justificación arquitectónica explícita.
- [ ] **CH-SOLID-02 (Single Responsibility en Vistas):** Ninguna vista en `src/views/` contiene lógica de cálculo contable, tributario o queries SQL directas.
- [ ] **CH-SOLID-03 (Open/Closed):** Las extensiones de funcionalidad comercial (descuentos, promociones, reglas de alistamiento) se estructuran como estrategias o composiciones sin alterar clases probadas.
- [ ] **CH-SOLID-04 (Liskov Substitution):** Cualquier implementación de adaptadores de datos (`IDataService`, `LocalDataService`, `SupabaseDataService`) cumple el 100% de los métodos de la interfaz sin lanzar excepciones de "no implementado".
- [ ] **CH-SOLID-05 (Interface Segregation):** Las interfaces de contratos en `src/types/` están segregadas por casos de uso y evitan contratos monolíticos.
- [ ] **CH-SOLID-06 (Dependency Inversion):** Los servicios de aplicación y componentes React consumen abstracciones (`IDataService`, contratos de tipos) en lugar de crear instancias acopladas de librerías de red.

---

## 2. Límites Arquitectónicos y Aislamiento de Dominio (Hexagonal)

- [ ] **CH-BOUND-01 (Dominio Puro Inmaculado):** Los archivos en `src/types/` y módulos de cálculo de negocio determinista NO contienen importaciones de `@supabase/supabase-js`, `axios`, `express`, `prisma` ni `localStorage`.
- [ ] **CH-BOUND-02 (Regla de Flujo de Dependencias):** Las dependencias apuntan hacia adentro: `src/views/` $\rightarrow$ `src/services/` y `src/store/` $\rightarrow$ `src/types/`. Queda bloqueada cualquier referencia inversa.
- [ ] **CH-BOUND-03 (Anti-Patrón Controlador Gordo):** Las vistas React operan únicamente como orquestadores de presentación y despacho de eventos, delegando la mutación de estado a los stores y servicios transaccionales.

---

## 3. Código Limpio y Principio DRY (Don't Repeat Yourself)

- [ ] **CH-DRY-01 (Punto Único de Verdad Tributaria):** El cálculo de retenciones NIIF, ICA y base gravable solo se realiza a través de `B2BSalesService` o `financialAuditService`.
- [ ] **CH-DRY-02 (Punto Único de Verdad Catch Weight):** La fórmula de calibre y cálculo nominal ($(\text{min} + \text{max})/2 \times \text{piezas}$) reside centralizada en un helper canónico reutilizable.
- [ ] **CH-DRY-03 (Tolerancia Cero a Strings Mágicos de Navegación):** Todas las rutas de la aplicación utilizan el enum tipado `AppRouteId` sin cadenas de texto sueltas.

---

## 4. Patrones de Diseño y Nomenclatura Ubicua

- [ ] **CH-PAT-01 (Estrategias y Fábricas):** Las bifurcaciones complejas de modalidades de venta (`PESO_DIRECTO`, `CATCH_WEIGHT_PIEZAS`, `UNIDADES_FIJAS`) están modeladas bajo un patrón formal y predecible.
- [ ] **CH-PAT-02 (Vocabulario Ubicuo):** Se respeta el glosario del dominio pesquero y ERP (`Cuarto Frío`, `Lote FEFO`, `Precinto de Canastilla`, `Manifiesto de Ruta`, `Arqueo Ciego`).

---

## 5. Harness de Auditoría Automática Post-Pull

- [ ] **CH-PERF-01 (Velocidad de Ejecución):** El script `scripts/architecture/audit-solid-boundaries.cjs` ejecuta el escaneo completo en menos de 2.0 segundos.
- [ ] **CH-PERF-02 (Integración en Ciclo de Vida):** El hook `.husky/post-merge` y el comando `npm run session:pull` disparan la auditoría como paso obligatorio de sincronización.
- [ ] **CH-PERF-03 (Scorecard Visual y Diagnóstico Accionable):** La salida en consola presenta un tablero claro con las violaciones clasificadas por archivo, línea y regla infringida, finalizando con código de salida `1` ante violaciones críticas y `0` ante salud estructural aprobada.

---

**Siguiente Paso Obligatorio del Flujo:** Esperar la aprobación explícita del usuario sobre esta lista de verificación (`/speckit.checklist`) para proceder con el plan técnico (`/speckit.plan`).
