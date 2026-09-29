# Tareas de Implementación: Re-Ingeniería Enterprise-Grade

## [x] 📋 Tarea 1: Re-Arquitectura Monorepo y Optimización de Dependencias [@agency-software-architect]
- **Archivos:** [`pnpm-workspace.yaml`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/pnpm-workspace.yaml), [`package.json`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/package.json), [`packages/database-shared/package.json`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/packages/database-shared/package.json), [`packages/validation-schemas/package.json`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/packages/validation-schemas/package.json)
- **Estado:** Completado
- **Acciones:**
  - `pnpm-workspace.yaml` actualizado con `packages/*` y `allowBuilds` para Prisma.
  - Creadas las carpetas `packages/database-shared` y `packages/validation-schemas`.
  - Desinstalada la dependencia vulnerable/duplicada `xlsx` y migrado `BulkUploadModal.tsx` a `exceljs`.
  - Instalado `zod` y sincronizadas las dependencias con `pnpm install` (código 0).

## [x] 📋 Tarea 2: Aislamiento Multi-Empresa, RLS y Prisma [@agency-data-engineer]
- **Archivos:** [`packages/database-shared/schema.prisma`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/packages/database-shared/schema.prisma), [`database/23_enterprise_multi_tenant_rls.sql`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/database/23_enterprise_multi_tenant_rls.sql)
- **Estado:** Completado
- **Acciones:**
  - Modelo `schema.prisma` creado con relaciones multi-tenant completas (`Empresa`, `Usuario`, `Tercero`, `Empleado`, `Producto`, `Cotizacion`, `Pedido`, `Caja`).
  - Creada la migración SQL `23_enterprise_multi_tenant_rls.sql` con función híbrida resiliente `get_current_empresa_id()`, RLS policies de aislamiento por tenant e interceptación JWT con fallback a `usuarios`.
  - Triggers con bloques `EXCEPTION` estructurados (`validar_merma_despiece` con código `P0001` y `desactivar_acceso_empleado`).

## [x] 📋 Tarea 3: Robustez de Backend, Try-Catch y Esquemas Zod [@agency-backend-architect]
- **Archivos:** [`src/lib/safeApi.ts`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/src/lib/safeApi.ts), [`packages/validation-schemas/src/pricing.schema.ts`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/packages/validation-schemas/src/pricing.schema.ts)
- **Estado:** Completado
- **Acciones:**
  - Creado `safeDatabaseExecute<T>` y `sanitizeErrorMessage` con respuestas estandarizadas `{ success, data, error, message, statusCode }` y alertas limpias con SweetAlert2.
  - Diseñada la máquina de estados documental y validación con Zod en `pricing.schema.ts` (`BORRADOR` -> `ENVIADA` -> `APROBADA` -> `VENDIDA` -> `CANCELADA`) con verificación estricta de roles (RBAC).

## [x] 📋 Tarea 4: Refactorización Estética y Densidad Linear [@agency-ui-finish-gate-reviewer]
- **Archivos:** [`src/components/ui/DenseTableRow.tsx`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/src/components/ui/DenseTableRow.tsx), [`src/components/ui/DenseBadge.tsx`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/src/components/ui/DenseBadge.tsx), [`src/components/ui/FluidResponsiveCard.tsx`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/src/components/ui/FluidResponsiveCard.tsx), [`src/views/pricing/components/QuoteHistoryTab.tsx`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/src/views/pricing/components/QuoteHistoryTab.tsx)
- **Estado:** Completado
- **Acciones:**
  - Creados componentes atómicos reutilizables con tokens estilo Linear (filas de 28-32px, `text-xs`, mono para números, `border-zinc-800`).
  - Refactorizado `QuoteHistoryTab.tsx` implementando vista desktop con densidad quirúrgica y vista móvil/tablet con tarjetas fluidas antifugas horizontales.

## [x] 📋 Tarea 5: Gobernanza Legal (Habeas Data) y Pruebas E2E Live [@agency-legal-compliance-checker]
- **Archivos:** [`src/components/legal/ConsentGateModal.tsx`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/src/components/legal/ConsentGateModal.tsx), [`src/App.tsx`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/src/App.tsx), [`tests/e2e/multi-tenant-security.spec.ts`](file:///c:/Users/USUARIO/Documents/Aplicaciones/maestr_pezca/tests/e2e/multi-tenant-security.spec.ts)
- **Estado:** Completado
- **Acciones:**
  - Implementado `ConsentGateModal.tsx` con consentimiento bloqueante para la Ley 1581 de 2012 y persistencia en `localStorage` con timestamp auditado.
  - Integrado en la raíz de renderizado de `App.tsx`.
  - Creada suite de pruebas Playwright en `tests/e2e/multi-tenant-security.spec.ts` validando aislamiento RLS, intercepción de payloads corruptos y comportamiento del modal legal.
  - Verificada la compilación limpia del bundle de producción con Vite (`✓ built in 10.94s`).
