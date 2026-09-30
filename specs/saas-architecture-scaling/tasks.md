# Tareas de Implementación: SaaS Enterprise Architecture Scaling

**ID:** `TASKS-005-SAAS-SCALING`  
**Referencia:** [`spec.md`](./spec.md) | [`plan.md`](./plan.md)  

---

### Fase 1: Base de Datos & Migración UUIDv7 (Especialista: DataEngineer)
- [x] **TASK-1.1**: Crear script de migración SQL `database/34_uuid_v7_historical_migration.sql` con tabla de mapeo temporal, ventana de mantenimiento transaccional y re-enrutamiento de claves foráneas.
- [x] **TASK-1.2**: Establecer `DEFAULT public.uuid_generate_v7()` en las columnas `id` de las tablas transaccionales de alto tráfico (`inventario_movimientos`, `ventas_pos`, `ventas_pos_detalles`, `despachos_wms`).

---

### Fase 2: Capa API Intermedia & Edge Functions (Especialista: SoftwareArchitect)
- [x] **TASK-2.1**: Crear contrato y cliente de Supabase Edge Functions en `src/services/edgeFunctionService.ts`.
- [x] **TASK-2.2**: Definir la lógica desacoplada del orquestador de checkout y facturación en `supabase/functions/pos-checkout/index.ts`.

---

### Fase 3: Estado en Cliente con TanStack Query (Especialista: UIReviewer)
- [x] **TASK-3.1**: Instalar `@tanstack/react-query` en `package.json`.
- [x] **TASK-3.2**: Crear `src/lib/queryClient.ts` con configuración de recolección de basura (`gcTime`) y tiempo de obsolescencia (`staleTime`) optimizados para POS y bodegas.
- [x] **TASK-3.3**: Configurar `QueryClientProvider` en el punto de entrada de la aplicación (`src/App.tsx`).
- [x] **TASK-3.4**: Crear hook modular `src/hooks/useInventoryQueries.ts` para sincronizar datos de productos y stock desde Supabase sin duplicar en Zustand.

---

### Fase 4: Skeletons Zero-CLS & Testing de Calidad (Especialista: QualityEngineer)
- [x] **TASK-4.1**: Crear componentes atómicos de skeleton `src/components/ui/ShimmerSkeleton.tsx` conforme al Tridecálogo del CSS Moderno y `/erp-uiux-design-system`.
- [x] **TASK-4.2**: Crear prueba unitaria en `src/tests/tanstackQueryIntegration.test.ts` verificando el comportamiento de caché, reintentos y desmonte de memoria.
- [x] **TASK-4.3**: Ejecutar `npm run test:run` y `npm run build` para certificar 100% de tests verdes y compilación limpia.
