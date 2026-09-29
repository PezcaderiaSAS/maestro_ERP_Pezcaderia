# Especificación Técnica: Re-Ingeniería Enterprise-Grade
**Proyecto:** La Pezcadería ERP (`maestro_ERP_Pezcaderia`)  
**Fecha:** 2026-09-28  
**Metodología:** Spec-Driven Development (GitHub Spec Kit) + Agency Multi-Agent Alignment  

---

## 1. Contexto y Objetivos

El sistema ERP actual requiere una transición a un estándar empresarial de alta gama (*Enterprise-Grade*), blindando el aislamiento de datos entre empresas (Multi-Tenancy), optimizando el rendimiento de base de datos con políticas RLS infalibles, garantizando la captura estricta de excepciones sin filtración de trazas internas, formalizando el monorepo y elevando la interfaz a la estética densa y fluida de Linear.

---

## 2. Decisiones de Diseño Acordadas (Grill-Me)

1. **Paso 1 (Monorepo):** Migración gradual. Configuración de `pnpm-workspace.yaml` manteniendo la compatibilidad en raíz mientras se crea `packages/database-shared` (con Prisma `schema.prisma` y migraciones SQL) y `packages/validation-schemas` (Zod). Limpieza de dependencias duplicadas eliminando `xlsx` para consolidar `exceljs`, e instalando `zod`.
2. **Paso 2 (Multi-Tenant y RLS):** Aislamiento híbrido resiliente mediante función `get_current_empresa_id()` que lee de `auth.jwt()` con fallback seguro a la tabla `usuarios`. Políticas RLS en tablas operativas y captura de excepciones en triggers SQL con códigos legibles para PostgREST. Creación del modelo Prisma representativo en `packages/database-shared/schema.prisma`.
3. **Paso 3 (Backend & Error Envelope):** Capa de servicios unificada con helper tipado `safeDatabaseExecute<T>` que devuelva `{ success, data, error, message, statusCode }` e інтеgre notificaciones limpias con SweetAlert2. Máquina de estados documental para cotizaciones con esquemas Zod y validación RBAC.
4. **Paso 4 (UI Linear Density):** Componentes atómicos reutilizables (`DenseTableRow`, `DenseBadge`, `FluidPricingItem`, `FluidResponsiveCard`) con altura de fila 28-32px, tipografía `text-xs` (12px), íconos 14-16px, bordes de bajo contraste `border-zinc-800` y adaptación responsive fluida para evitar scroll horizontal.
5. **Paso 5 (Legal & E2E):** Modal de consentimiento global bloqueante para Habeas Data (Ley 1581 de 2012 / RGPD) con registro de firma y timestamp, junto con la suite de pruebas E2E en Playwright para verificar aislamiento RLS y detención de cargas útiles alteradas.

---

## 3. Arquitectura del Monorepo Gradual

```
maestro_ERP_Pezcaderia/
├── pnpm-workspace.yaml
├── package.json
├── packages/
│   ├── database-shared/
│   │   ├── package.json
│   │   ├── schema.prisma
│   │   └── migrations/
│   │       └── 23_enterprise_multi_tenant_rls.sql
│   └── validation-schemas/
│       ├── package.json
│       └── src/
│           ├── pricing.schema.ts
│           └── index.ts
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── DenseTableRow.tsx
│   │   │   ├── DenseBadge.tsx
│   │   │   └── FluidResponsiveCard.tsx
│   │   └── legal/
│   │       └── ConsentGateModal.tsx
│   ├── lib/
│   │   └── safeApi.ts
│   └── views/
│       └── PricingView.tsx
└── tests/
    └── e2e/
        └── multi-tenant-security.spec.ts
```
