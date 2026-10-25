# Plan Técnico de Implementación: SPEC-028 — Precios Dinámicos, Márgenes Multicanal y Módulo de Mermas (Admin)

**Código:** SPEC-028  
**Fase:** /speckit.plan (SDD v3.0)  
**Fecha:** 2026-10-24  
**Estado:** PENDIENTE_APROBACION_USUARIO  
**Regla Constitucional:** PROHIBIDO escribir código de implementación en esta fase. Esperar confirmación formal del usuario.

---

## 1. Arquitectura Técnica y Estrategia de Diseño

El sistema se implementará bajo una estricta separación de capas guiada por principios **SOLID** y el protocolo Brownfield v2.2:

```
[Presentación (React 18 / Light Mode WCAG AA+)]
  ├── PricingView.tsx (Pestañas: Catálogo, Precios, Cotizaciones, Mermas & Márgenes)
  ├── PricingConfigManager.tsx (Admin Panel para Buffers y Márgenes Maestros)
  ├── PricingSimulatorTab.tsx (Simulador Reactivo Multicanal en Tiempo Real)
  ├── PricingChannelCard.tsx (Tarjeta Visual por Canal: POS, HORECA, Mayorista)
  ├── BatchCategoryRecalculateModal.tsx (Modal de Previsualización en Lote)
  └── PriceHistoryAuditDrawer.tsx (Auditoría NIIF de Snapshots)
         │
         ▼
[Estado Reactivo y Orquestación (Hooks)]
  └── usePricingEngine.ts (Gestor de Estado, Simulación en Tiempo Real y Mutaciones)
         │
         ▼
[Contratos de Validación (Zod & TypeScript)]
  ├── packages/validation-schemas/src/pricingEngine.schema.ts
  └── src/types/pricingEngine.types.ts
         │
         ▼
[Servicios de Dominio Puro (Lógica de Negocio Determinista)]
  ├── pricingCalculationService.ts (Fórmulas Matemáticas Puras, Buffers e IVA)
  ├── pricingConfigService.ts (Persistencia y Carga de Parámetros Globales/Categoría)
  └── marginAuditService.ts (Guardias de Seguridad: Venta Bajo Costo y Margen Mínimo)
         │
         ▼
[Persistencia y Bus de Eventos]
  ├── localDb (Claves: 'pricingGlobalConfig', 'productsCatalog', 'preciosHistorico')
  └── useEventStore (Eventos: 'PRICING_CONFIG_UPDATED', 'PRICING_SNAPSHOT_SAVED')
```

---

## 2. Contratos de Datos y Esquemas Zod

### 2.1 Archivo: `packages/validation-schemas/src/pricingEngine.schema.ts`
Definirá los esquemas en tiempo de ejecución:

```typescript
// 1. Configuración de Merma por Categoría / Especie
export const CategoryWasteConfigSchema = z.object({
  id: z.string().min(1),
  categoriaId: z.string().min(1),
  nombreCategoria: z.string().min(1),
  bufferDefaultPct: z.number().min(0).max(50),
  mermaDespiecePct: z.number().min(0).max(40).default(0),
  mermaDescongelacionGlaseoPct: z.number().min(0).max(30).default(0),
  mermaCocinaViscerasPct: z.number().min(0).max(40).default(0),
  descripcion: z.string().optional(),
});

// 2. Márgenes Maestros por Canal
export const ChannelMarginConfigSchema = z.object({
  margenPosPct: z.number().min(1).max(200).default(40),
  margenRestaurantePct: z.number().min(1).max(200).default(30),
  margenMayoristaPct: z.number().min(1).max(200).default(15),
  margenMinimoSeguridadPct: z.number().min(0).max(50).default(10),
});

// 3. Configuración Global Administrable
export const PricingGlobalConfigSchema = z.object({
  id: z.string().default('cfg-pricing-global'),
  version: z.string().default('1.0.0'),
  ultimaActualizacion: z.string(),
  actualizadoPorUsuarioId: z.string(),
  redondeoEnteroCop: z.boolean().default(true),
  bloquearVentaBajoCosto: z.boolean().default(true),
  canales: ChannelMarginConfigSchema,
  categoriasWaste: z.array(CategoryWasteConfigSchema),
});

// 4. Input para Simulación de Producto
export const ProductPricingSimulationInputSchema = z.object({
  productoId: z.string().min(1),
  costoCompraCop: z.number().min(1, 'El costo de compra debe ser estrictamente positivo'),
  categoriaId: z.string().min(1),
  bufferPersonalizadoPct: z.number().min(0).max(50).nullable().optional(),
  regimenIva: z.enum(['EXENTO_O_EXCLUIDO', 'GRAVADO_IVA_19']).default('EXENTO_O_EXCLUIDO'),
  margenPosSobrescritoPct: z.number().min(0).max(200).nullable().optional(),
  margenRestauranteSobrescritoPct: z.number().min(0).max(200).nullable().optional(),
  margenMayoristaSobrescritoPct: z.number().min(0).max(200).nullable().optional(),
});

// 5. Snapshot Inmutable para Auditoría
export const PricingRecordSnapshotSchema = z.object({
  id: z.string().uuid(),
  productoId: z.string().min(1),
  sku: z.string(),
  nombreProducto: z.string(),
  vigenciaDesde: z.string(),
  costoCompraCop: z.number(),
  bufferEfectivoPct: z.number(),
  costoAjustadoCop: z.number(),
  regimenIva: z.enum(['EXENTO_O_EXCLUIDO', 'GRAVADO_IVA_19']),
  precioPosCop: z.number(),
  precioRestauranteCop: z.number(),
  precioMayoristaCop: z.number(),
  margenPosCop: z.number(),
  margenRestauranteCop: z.number(),
  margenMayoristaCop: z.number(),
  margenPosPct: z.number(),
  margenRestaurantePct: z.number(),
  margenMayoristaPct: z.number(),
  motivoCambio: z.string().min(3),
  usuarioId: z.string().min(1),
  usuarioNombre: z.string(),
  excepcionAutorizada: z.boolean().default(false),
});
```

---

## 3. Servicios de Dominio (SOLID)

### 3.1 `pricingCalculationService.ts`
Funciones puras deterministas:
- `calculateAdjustedCost(costoCompraCop, bufferPct, redondeoEntero)`: Aplica $C_{adj} = \text{round}(C \times (1 + \text{buffer}/100))$.
- `calculateChannelTariff(costoAjustadoCop, margenPct, regimenIva, redondeoEntero)`: Proyecta subtotal neto, valor IVA (19% si aplica) y precio final al cliente.
- `evaluateMarginSafety(costoAjustadoCop, precioVentaCop, margenMinimoPct)`: Detecta ventas a pérdida o márgenes bajo el umbral de seguridad.
- `simulateProductPricing(input, globalConfig)`: Orquesta la simulación completa para los 3 canales de un producto en <1ms.

### 3.2 `pricingConfigService.ts`
- Carga de la configuración global persistida en `localDb('pricingGlobalConfig')`.
- Inicialización con defaults profesionales (Salmón: 10%, Pescado Blanco: 8%, Mariscos: 12%, Congelados: 5%, Insumos: 0%).
- Guardado y validación de cambios por el Admin con auditoría inmutable.
- Obtención del buffer efectivo de un producto resolviendo la jerarquía bimodal.

### 3.3 `marginAuditService.ts`
- Verificación de políticas antes de persistir precios.
- Bloqueo duro si `bloquearVentaBajoCosto === true` y algún precio es menor al costo ajustado.
- Exigencia de confirmación con rol `ADMIN` ante excepciones de margen bajo.

---

## 4. Estado y Hooks Reactivos (`usePricingEngine.ts`)

Encapsula la reactividad completa:
1. `globalConfig`: Estado de la configuración maestra de mermas y márgenes.
2. `simulation`: Estado reactivo del producto seleccionado en simulación.
3. `isSaving`: Flag de mutación asíncrona.
4. `saveGlobalConfig(newConfig)`: Mutación con validación Zod y alerta SweetAlert2.
5. `simulate(input)`: Recálculo en caliente ante cualquier variación de sliders o inputs.
6. `commitProductTariffs(productId, tarifas, motivo)`: Persistencia en `preciosHistorico` y actualización del producto en `productsCatalog`.
7. `recalculateCategoryBatch(categoriaId, previewOnly)`: Modo previsualización vs aplicación definitiva en lote.

---

## 5. Componentes de Interfaz de Usuario (Light Mode WCAG AA+)

1. **`PricingConfigManager.tsx`:**
   - Panel accesible exclusivamente si `userRole === 'admin'`.
   - Sliders táctiles y steppers numéricos de $\ge 48\text{ px}$ para editar los márgenes por canal (POS, HORECA, Mayorista).
   - Tabla interactiva para ajustar los buffers de merma de cada categoría con desglose visual de despiece y glaseo.
   - Botón *"Guardar Configuración Maestra"* de $56\text{ px}$ en azul corporativo (`bg-blue-600`).
2. **`PricingSimulatorTab.tsx`:**
   - Buscador predictivo de productos con selector de categoría.
   - Formulario de costo de compra, selector de régimen IVA y toggle para sobreescritura de buffer.
   - Grid de 3 tarjetas de canal (`PricingChannelCard.tsx`) con semáforos cromáticos:
     - Verde (`emerald-600`): Margen óptimo ($\ge 20\%$).
     - Ámbar (`amber-600`): Margen aceptable ($10\% - 19\%$).
     - Rojo (`rose-600`): Alerta crítica ($<10\%$ o venta bajo costo).
   - Botón *"Guardar y Publicar Tarifas"* y botón *"Recalcular Categoría en Lote"*.
3. **`BatchCategoryRecalculateModal.tsx`:**
   - Modal táctil que lista todos los productos de la categoría seleccionada.
   - Muestra tabla comparativa: SKU, Nombre, Costo Actual, Tarifa Vigente, Nueva Tarifa Proyectada y Diferencia en COP.
   - Botón de confirmación con doble verificación SweetAlert2.
4. **`PriceHistoryAuditDrawer.tsx`:**
   - Cajón lateral con historial cronológico de cambios de precio del producto, fecha ISO, motivo de variación y usuario responsable.

---

## 6. Estrategia de Pruebas TDD

1. **Unitarias de Esquemas (`src/tests/pricingEngineSchema.test.ts`):**
   - Validar aceptación de configuraciones correctas.
   - Validar rechazo de buffers $>50\%$ o negativos.
   - Validar rechazo de costos $\le 0$.
2. **Unitarias de Servicios (`src/tests/pricingCalculationService.test.ts`):**
   - Escenario exacto con buffer 10% y márgenes (40%, 30%, 15%).
   - Escenario con régimen IVA 19% y redondeo entero COP.
   - Detección de venta bajo costo y margen insuficiente.
3. **Componentes y Hooks (`src/tests/pricingEngineComponents.test.tsx`):**
   - Renderizado del panel de configuración solo para rol Admin.
   - Simulación reactiva en caliente al cambiar sliders.
   - Despliegue de modal de recálculo masivo.
4. **Verificación en Vivo DevTools MCP:**
   - 0 errores en consola JS en `http://localhost:3000/`.
   - Renderizado móvil a 375 px verificado.

---

## 7. Checkpoint de Control de Calidad SDD v3.0

El plan técnico define detalladamente la arquitectura, contratos, servicios, estado y componentes visuales para implementar SPEC-028.
Siguiendo la gobernanza estricta:
- **No se ha generado ninguna línea de código de producción.**
- Se espera la confirmación explícita del usuario para avanzar al paso `/speckit.tasks`.
