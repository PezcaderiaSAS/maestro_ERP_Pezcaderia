# Plan de Implementación: SaaS Enterprise Architecture Scaling

**ID:** `PLAN-005-SAAS-SCALING`  
**Referencia:** [`spec.md`](./spec.md)  
**Metodología:** Spec-Driven Development (`/spec-kit`) & Agency Swarm (`/swarm`)

---

## 🏛️ Asignación de Especialistas (Agency Swarm)

| Especialista | Rol Principal | Entregables Clave |
| :--- | :--- | :--- |
| **DataEngineer** | Base de datos & PostgreSQL | `database/34_uuid_v7_historical_migration.sql` (remaping histórico seguro con FKs). |
| **SoftwareArchitect** | Capa Serverless & Contratos | Estructura de Supabase Edge Functions (`supabase/functions/pos-checkout/`), DTOs y cliente seguro. |
| **UIReviewer** | Frontend & Estado | Instalación de `@tanstack/react-query`, `QueryClient` optimizado y Skeletons Zero-CLS. |
| **QualityEngineer** | Calidad & Certificación | Pruebas de integración, verificación de memoria y no-regresión de suites de tests. |

---

## 📅 Fases de Ejecución

### Fase 1: Base de Datos — Migración Histórica y Defaults UUIDv7 (DataEngineer)
1. Elaborar `database/34_uuid_v7_historical_migration.sql`.
2. Incluir mecanismo transaccional con tabla de mapeo temporal `uuid_migration_map` para actualizar claves primarias y claves foráneas en cascada controlada.
3. Actualizar `DEFAULT` en tablas críticas: `ventas_pos`, `inventario_movimientos`, `detalle_pedidos`, `despachos_wms`, `turnos_caja`.

### Fase 2: Capa API Intermedia — Supabase Edge Functions (SoftwareArchitect)
1. Diseñar el servicio de orquestación transaccional `src/services/edgeFunctionService.ts`.
2. Definir la función de backend `pos-checkout-orchestrator` que recibe la solicitud de checkout, valida el stock en memoria de Edge Function y ejecuta la mutación atómica.
3. Aislar llamadas a servicios externos (SIIGO, DIAN) protegiendo las credenciales en el entorno de Supabase Edge.

### Fase 3: Frontend — TanStack Query v5 & Racionalización de Estado (UIReviewer)
1. Instalar `@tanstack/react-query` en `package.json`.
2. Crear `src/lib/queryClient.ts` con configuración estricta de `staleTime` (30s) y `gcTime` (5min) para terminales de baja memoria.
3. Envolver `App.tsx` en `QueryClientProvider`.
4. Crear hooks modulares de servidor: `src/hooks/useInventoryQueries.ts`.
5. Racionalizar los stores de Zustand existentes, manteniendo en `useInventoryStore` solo el estado de filtros, paginación y selección actual.

### Fase 4: Experiencia de Usuario & Shimmer Skeletons (UIReviewer + QualityEngineer)
1. Crear `src/components/ui/ShimmerSkeleton.tsx` aplicando el Tridecálogo del CSS Moderno (`@layer`, `isolation: isolate`, `min-height`, `dark:bg-slate-800`).
2. Integrar skeletons en tablas de inventario y widgets de KPI para garantizar Zero Cumulative Layout Shift (CLS = 0).
3. Escribir pruebas unitarias en `src/tests/tanstackQueryIntegration.test.ts`.
4. Certificar ejecución de `npm run test:run` y `npm run build`.
