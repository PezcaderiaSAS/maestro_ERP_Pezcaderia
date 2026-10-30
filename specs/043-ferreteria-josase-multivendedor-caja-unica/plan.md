# Plan Técnico de Implementación: SPEC-043
## Flujo Integral Multivendedor - Caja Única Kanban con Cero-Latencia para Ferretería Josase

- **Código:** SPEC-043
- **Fase:** Spec Kit SDD v3.0 — `/speckit.plan`
- **Gobernanza:** Master Architect + DataEngineer + UIReviewer + Harness²
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

## 1. Arquitectura Técnica & Patrones de Diseño

El plan se estructura en cuatro (4) capas desacopladas conforme a la directiva Master Architect SOLID:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. CAPA DE PRESENTACIÓN (UI / Dark Glassmorphism V8)                   │
│   • POSView.tsx: Adaptación a Modo Mostrador con layout 1280px / 375px │
│   • VendorTicketSidebar.tsx: Barra lateral de tickets reactivos        │
│   • CartPanel.tsx: Anotaciones de preventa (doble nivel) & botón F6    │
│   • CashierKanbanView.tsx: Tablero Kanban de Caja Única interactivo    │
│   • QuickPaymentMixedModal.tsx: Modal de recaudo mixto rápido          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ 2. CAPA DE ESTADO & REACTIVIDAD (Zustand Stores)                       │
│   • useMultiVendorPosStore.ts: Gestión de terminal y tickets vendedor  │
│   • useCashierKanbanStore.ts: Cola centralizada de preventas           │
│   • useOutboxSyncStore.ts: Despacho de transacciones offline/online    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ 3. CAPA DE VALIDACIÓN & COMPUTO OFF-THREAD                             │
│   • mixedPayment.schema.ts: Esquema Zod de pagos mixtos y vueltas      │
│   • deltaSync.schema.ts: Extensión con notas e ítems de preventa       │
│   • searchEngineCore.ts: Búsqueda difusa sub-2ms en Web Worker         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ 4. CAPA DE PERSISTENCIA RESILIENTE (Zero-LocalStorage)                 │
│   • TenantIndexedDbService: DB aislada 'PezcaderiaERP_tenant-03'       │
│   • ferreteriaJosaseService: Inserción masiva por lotes en IndexedDB   │
│   • Supabase Client: Persistencia relacional con RLS                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes y Módulos a Modificar y Crear

### Módulo A: Persistencia y Búsqueda Cero-Latencia (IndexedDB)
1. **[`src/services/ferreteriaJosaseService.ts`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/services/ferreteriaJosaseService.ts):**
   - Eliminar `localDb.save('clientes', ...)` y `localDb.save('productsCatalog', ...)`.
   - Implementar método `initTenantIndexedDb(tenantId = 'tenant-03')` que realiza `bulkUpsert` de los 9.550 clientes y 5.351 ítems en `TenantIndexedDbService` en segundo plano con chunking de 500 registros para no bloquear la UI.
   - Conectar con `searchEngineCore` para alimentar el índice de búsqueda en memoria/worker.
2. **Selector de Clientes en [`src/views/POSView.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/POSView.tsx):**
   - Reemplazar la búsqueda síncrona destructiva sobre los 9.550 clientes por `fastItemSearchEngine.searchClients(query, { limit: 20 })`.
   - Renderizar como máximo 20 resultados en el DOM de forma instantánea.

### Módulo B: Mostrador del Vendedor y Barra Lateral de Tickets
3. **[`src/components/pos/VendorTicketSidebar.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/components/pos/VendorTicketSidebar.tsx) (NUEVO):**
   - Barra lateral colapsable/expandible ubicada en el lateral del mostrador.
   - Lista los tickets del día emitidos por el `vendedorId` activo (ej: Diego Díaz).
   - Muestra badges de estado: `EN_COLA` (ámbar), `EN_PROCESO` (azul), `COBRADO` (verde con # de factura y monto liquidado).
   - Acciones:
     - Botón "Recuperar / Editar" (solo disponible si el estado es `EN_COLA`).
     - Botón "Cancelar Preventa" (con confirmación rápida).
4. **[`src/views/pos/components/CartPanel.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/CartPanel.tsx):**
   - Anclaje inferior fijo de los botones para evitar solapamiento visual.
   - Incorporar campo "Anotaciones / Instrucciones de Entrega y Caja" para la comanda general.
   - Incorporar botón de nota opcional por ítem (medidas de corte, calibres, referencia).
   - Botón `EMITIR PREVENTA (F6)` conectado con el nuevo payload enriquecido.
   - Ocultar totalmente el panel de cobro/recaudo cuando el usuario sea Asesor Mostrador.

### Módulo C: Taquilla Central de Caja Única y Recaudo Mixto
5. **[`src/schemas/mixedPayment.schema.ts`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/schemas/mixedPayment.schema.ts) (NUEVO):**
   - Contrato Zod con validación matemática estricta:
     ```ts
     export const MixedPaymentSchema = z.object({
       preventaId: z.string(),
       totalVenta: z.number().positive(),
       pagos: z.array(z.object({
         metodo: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO']),
         monto: z.number().positive(),
         referencia: z.string().optional(),
         plazoDias: z.number().int().optional(),
         efectivoRecibido: z.number().optional(),
         vueltas: z.number().optional(),
       })).min(1),
       clienteNombre: z.string(),
       clienteDocumento: z.string().optional(),
       clienteTelefono: z.string().optional(),
     }).refine(data => {
       const sum = data.pagos.reduce((acc, p) => acc + p.monto, 0);
       return Math.abs(sum - data.totalVenta) < 0.01;
     }, { message: 'La suma de los pagos debe ser exactamente igual al total a liquidar.' });
     ```
6. **[`src/views/pos/components/QuickPaymentMixedModal.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/QuickPaymentMixedModal.tsx) (NUEVO):**
   - Modal Dark Glassmorphism optimizado para agilidad de taquilla.
   - Panel izquierdo: Lista de productos de la preventa con inputs interactivos de cantidad y precio para edición libre sin restricciones.
   - Panel derecho: Módulo de pagos divididos con botones rápidos (Efectivo, Bancolombia, Nequi, Tarjeta, Crédito).
   - Cálculo en tiempo real de "Saldo por Cubrir" y botón de autocompletado en 1 clic.
   - En efectivo: display gigante de "Vueltas a Entregar".
   - Al confirmar: liquidar la venta, actualizar estado de la preventa a `COBRADO`, generar movimiento en tesorería y emitir tirilla térmica.
7. **Topbar & Navegación:**
   - Botón en `EnterpriseTopbar.tsx` con atajo `F4` / `F7` para conmutar directamente entre Mostrador POS y Taquilla Central Kanban para roles autorizados (Cajera, Admin).

---

## 3. Estrategia de Pruebas TDD

- **Fase 1 (RED):** Escribir suites de pruebas para:
  1. `ferreteriaJosaseIndexedDb.test.ts`: Verificar inserción en IndexedDB y ausencia de llamadas a `localStorage`.
  2. `vendorTicketSidebar.test.tsx`: Validar renderizado de tickets, recuperación para edición y bloqueo cuando está en taquilla.
  3. `quickPaymentMixedModal.test.tsx`: Validar edición libre de ítems por la cajera, validación Zod de pagos mixtos, cálculo de vueltas y generación de crédito.
- **Fase 2 (GREEN):** Implementar el código quirúrgico en cada archivo.
- **Fase 3 (REFACTOR & DEVTOOLS):** Comprobar 100% tests pasando y validar en vivo en el navegador.
