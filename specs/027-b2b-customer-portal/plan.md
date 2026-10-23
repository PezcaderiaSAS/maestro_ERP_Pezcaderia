# Plan de Implementación Técnica: SPEC-027 — Portal B2B HORECA

**Especificación:** SPEC-027 — Portal de Clientes B2B Auto-Servicio HORECA  
**Fase:** /speckit.plan (SDD v3.0)  
**Fecha:** 2026-10-23  
**Arquitectura:** React 18 + Vite + TypeScript Estricto + Supabase RLS Multi-Tenant + Zod  

---

## 1. Arquitectura Técnica & Desacoplamiento

El sistema se estructura en capas independientes bajo los principios SOLID:
- **Capa 1: Esquemas de Datos (Validación Estricta):** Esquemas Zod en `packages/validation-schemas/src/b2bCustomerPortal.schema.ts` y tipos TypeScript en `src/types/b2bCustomerPortal.types.ts`.
- **Capa 2: Motor de Negocio (Servicios):** `src/services/b2bCustomerPortalService.ts` encapsula las reglas de precios pactados, límites de crédito, generación de pedidos para el Kanban WMS y trazabilidad de remisiones.
- **Capa 3: Orquestación Reactiva (Hooks):** `src/hooks/useB2BCustomerPortal.ts` y `src/hooks/useB2BCart.ts` gestionan el estado del carrito, persistencia local y sincronización offline.
- **Capa 4: Presentación UI (Ergonomía Táctil):** Componentes atómicos en `src/views/b2b/portal/components/` y la vista principal `B2BCustomerPortalView.tsx`.
- **Capa 5: Enrutamiento Oficial:** `AppRouteId.B2B_PORTAL = 'portal_b2b'` en `src/routes/AppRoute.ts`.

---

## 2. Esquemas de Datos y Contratos (Zod)

### A. Tipos de Cortes y Empaques Marítimos
```ts
export const B2BProductCutSchema = z.enum([
  'ENTERO_FRESCO',
  'ENTERO_EVISCERADO',
  'FILETE_CON_PIEL',
  'FILETE_SIN_PIEL',
  'RODAJAS',
  'PORCIONES_CALIBRADAS',
  'OTRO_ESPECIAL',
]);

export const B2BPackagingSchema = z.enum([
  'CAJA_TERMICA_HIELO',
  'BOLSA_VACIO',
  'CANASTILLA_RETORNABLE',
  'GRANEL_REFRIGERADO',
]);
```

### B. Línea de Pedido B2B HORECA
```ts
export const B2BOrderLineInputSchema = z.object({
  productoId: z.string().min(1),
  sku: z.string().min(1),
  nombre: z.string().min(1),
  corte: B2BProductCutSchema,
  empaque: B2BPackagingSchema,
  modalidadVenta: z.enum(['KILOGRAMOS_ESTIMADOS', 'PIEZAS_FIJAS']),
  cantidadSolicitada: z.number().positive(),
  piezasEstimadas: z.number().int().nonnegative().optional(),
  precioPactadoCop: z.number().positive(),
  observacionesCorte: z.string().max(300).optional(),
});
```

### C. Creación de Pedido B2B
```ts
export const CreateB2BOrderInputSchema = z.object({
  clienteId: z.string().min(1),
  sucursalEntrega: z.string().min(1),
  direccionEntrega: z.string().min(1),
  fechaRequeridaEntrega: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jornadaRequerida: z.enum(['MANANA', 'TARDE', 'URGENTE_MEDIODIA']),
  formaPago: z.enum(['CREDITO_B2B', 'CONTADO_ANTICIPADO', 'TRANSFERENCIA']),
  lineas: z.array(B2BOrderLineInputSchema).min(1),
  instruccionesCocina: z.string().max(500).optional(),
});
```

### D. Plantilla Recurrente HORECA
```ts
export const B2BRecurringTemplateSchema = z.object({
  id: z.string().optional(),
  clienteId: z.string().min(1),
  nombrePlantilla: z.string().min(3).max(100),
  diasSemana: z.array(z.enum(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'])).min(1),
  jornadaEntrega: z.enum(['MANANA', 'TARDE']),
  activa: z.boolean().default(true),
  lineas: z.array(B2BOrderLineInputSchema).min(1),
});
```

---

## 3. Desglose de Fases de Construcción

### Fase 1: Esquemas Zod y Contratos Tipados
- Crear `packages/validation-schemas/src/b2bCustomerPortal.schema.ts`.
- Crear `src/types/b2bCustomerPortal.types.ts`.
- Escribir y validar suite unitaria `src/tests/b2bCustomerPortalSchema.test.ts`.

### Fase 2: Motor Analítico y Servicio de Negocio
- Implementar `src/services/b2bCustomerPortalService.ts`:
  - `obtenerCatalogoCliente(clienteId, tenantId)`
  - `obtenerEstadoCartera(clienteId)`
  - `crearPedidoB2B(input)` (con validación de crédito -> `CREADO` vs `PENDIENTE_APROBACION_CARTERA`)
  - `crearOActualizarPlantilla(templateInput)`
  - `reordenarDesdePlantilla(templateId)`
  - `obtenerTrazabilidadPedido(pedidoId)`
- Escribir y validar suite unitaria `src/tests/b2bCustomerPortalService.test.ts`.

### Fase 3: Hooks Reactivos & Gestión del Carrito
- Implementar `src/hooks/useB2BCart.ts` (manejo de líneas, cortes, subtotales, peso estimado).
- Implementar `src/hooks/useB2BCustomerPortal.ts` (orquestador de cliente activo, catálogo, cartera y pedidos).
- Escribir y validar suite unitaria `src/tests/useB2BCustomerPortal.test.ts`.

### Fase 4: Componentes Atómicos UI Táctiles ("Regla del Niño de 12 Años")
- Crear en `src/views/b2b/portal/components/`:
  - `B2BClientHeaderBar.tsx`: Switcher rápido de cliente para demo/comercial y selector de sucursal.
  - `B2BCreditCardSummary.tsx`: Indicador visual de cupo disponible, facturas por pagar y alerta de sobregiro.
  - `B2BCatalogGrid.tsx`: Cuadrícula táctil de pescados/mariscos con precios del cliente y stock en tiempo real.
  - `B2BItemConfiguratorModal.tsx`: Selector táctil de corte (filete, rodaja, entero) y empaque con hielo.
  - `B2BRecurringTemplatesDrawer.tsx`: Drawer de plantillas semanales con botón "Re-ordenar con 1 Clic".
  - `B2BOrderTrackingTimeline.tsx`: Timeline de estado del pedido (`Alistamiento` -> `Báscula` -> `Ruta` -> `Entregado`).
  - `index.ts`: Archivo barril.
- Escribir y validar suite unitaria `src/tests/b2bPortalComponents.test.tsx`.

### Fase 5: Vista Principal y Enrutamiento en el ERP
- Implementar `src/views/b2b/portal/B2BCustomerPortalView.tsx`.
- Registrar ruta oficial `AppRouteId.B2B_PORTAL = 'portal_b2b'` en `src/routes/AppRoute.ts`.
- Enlazar en `src/components/layout/EnterpriseSidebar.tsx` bajo el dominio Ventas / B2B (`data-testid="nav-portal-b2b"`).
- Integrar caso en `src/App.tsx`.
- Validar `src/tests/appRoute.test.ts` (ahora 25 rutas oficiales) y `src/tests/b2bCustomerPortalView.test.tsx`.

### Fase 6: E2E Playwright y Certificación DevTools MCP
- Escribir suite E2E en `tests/e2e/b2b-customer-portal.spec.ts`.
- Validar flujo completo en Chromium (Creación de orden, Re-orden de plantilla, Vista móvil 375 px).
- Auditoría en vivo con DevTools: 0 errores JS en consola.
