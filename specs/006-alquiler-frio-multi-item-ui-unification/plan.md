# Plan de Implementación: Alquiler de Frío Multi-Producto & Unificación UI/UX Global

**Identificador:** `006-alquiler-frio-multi-item-ui-unification`  
**Protocolo:** Brownfield v2.2 / Multi-Agent ECC / SDD Framework  
**Fecha:** 2026-10-10  
**Estado:** LISTO PARA EJECUCIÓN (Ejecutable en la siguiente sesión tras `git pull`)

---

## 1. Arquitectura Técnica & Modelos de Datos

### 1.1 Esquemas Zod (`packages/validation-schemas/src/coldStorageRental.schema.ts`)

```typescript
// 1. Partida Individual de Pesaje en Báscula (Recepción)
export const PartidaRecepcionSchema = z.object({
  id: z.string().uuid(),
  producto_nombre: z.string().min(1, 'Nombre de producto requerido'),
  lote_cliente: z.string().optional().default(''),
  tipo_empaque: z.enum(['CANASTILLAS', 'CAJAS', 'SUELTO']),
  cantidad_bultos: z.number().int().positive('Cantidad de bultos debe ser > 0'),
  tara_unitaria_kg: z.number().nonnegative('Tara unitaria no puede ser negativa'),
  peso_bruto_kg: z.number().positive('Peso bruto debe ser > 0'),
  peso_tara_total_kg: z.number().nonnegative(),
  peso_neto_kg: z.number().positive('El peso neto debe ser estrictamente positivo'),
  temperatura_c: z.number().default(-18.5),
});
export type PartidaRecepcion = z.infer<typeof PartidaRecepcionSchema>;

// 2. Recepción Múltiple Consolidada
export const RecepcionMultipleInputSchema = z.object({
  empresa_id: z.string().uuid().optional(),
  contrato_id: z.string().uuid('Contrato requerido'),
  items: z.array(PartidaRecepcionSchema).min(1, 'Debe incluir al menos una partida de pesaje'),
  transportador_nombre: z.string().min(1, 'Nombre transportador requerido'),
  transportador_cedula: z.string().min(1, 'Cédula transportador requerida'),
  placa_vehiculo: z.string().min(1, 'Placa requerida'),
  temperatura_camion_c: z.number().default(-18.0),
  observaciones: z.string().optional(),
});
export type RecepcionMultipleInput = z.infer<typeof RecepcionMultipleInputSchema>;

// 3. Creación Rápida de Cliente & Contrato In-Situ (15 Segundos)
export const ClienteRapidoInputSchema = z.object({
  razon_social: z.string().min(2, 'Nombre o razón social requerida'),
  numero_identificacion: z.string().min(5, 'Cédula o NIT requerido'),
  telefono: z.string().min(7, 'Teléfono requerido'),
  modalidad_tiempo: z.enum(['DIAS', 'MESES']).default('DIAS'),
  tarifa_pactada: z.number().positive('Tarifa debe ser mayor a 0'),
  capacidad_posiciones: z.number().int().positive().default(1),
});
export type ClienteRapidoInput = z.infer<typeof ClienteRapidoInputSchema>;

// 4. Item de Despacho Múltiple
export const ItemDespachoSchema = z.object({
  inventario_id: z.string().uuid(),
  producto_nombre: z.string(),
  tipo_empaque: z.string(),
  bultos_a_retirar: z.number().int().positive(),
  peso_neto_a_retirar: z.number().positive(),
  es_retiro_total: z.boolean().default(false),
});
export type ItemDespacho = z.infer<typeof ItemDespachoSchema>;

// 5. Despacho Múltiple Consolidado
export const DespachoMultipleInputSchema = z.object({
  contrato_id: z.string().uuid('Contrato requerido'),
  cliente_id: z.string().uuid('Cliente requerido'),
  items: z.array(ItemDespachoSchema).min(1, 'Selecciona al menos un ítem para retirar'),
  transportador_nombre: z.string().min(1, 'Nombre transportador requerido'),
  transportador_cedula: z.string().min(1, 'Cédula transportador requerida'),
  placa_vehiculo: z.string().min(1, 'Placa requerida'),
  observaciones: z.string().optional(),
  autorizar_salida_mora: z.boolean().default(false),
});
export type DespachoMultipleInput = z.infer<typeof DespachoMultipleInputSchema>;
```

---

## 2. Flujo Operativo Táctil ("La Regla de los 12 Años")

### 2.1 Modal de Recepción con Ticket de Pesaje Acumulativo
1. **Paso A: Cliente & Contrato**
   - Selector de cliente activo.
   - Botón visual prominente: `[+ Nuevo Cliente Rápido]` que abre sub-modal en popover sin salir ni limpiar la pantalla.
2. **Paso B: Digitalización de Partida en Báscula**
   - Entrada manual del producto (autocompleta del catálogo o crea en caliente).
   - Selector de empaque táctil (🧺 Canastillas: 2.0 kg, 📦 Cajas: 0.8 kg, 🐟 Suelto: 0.0 kg, o tara personalizada).
   - Digitación de cantidad de bultos y peso bruto de la báscula.
   - Display gravimétrico en tiempo real: muestra la tara total restada y los Kg netos exactos.
   - Botón gigante: `[+ Agregar Partida a la Planilla]`.
3. **Paso C: Bandeja de Partidas (Ticket Acumulado)**
   - Lista dinámica de todas las partidas pesadas en el viaje.
   - Muestra claramente cada renglón: Producto, Empaque, Bultos, Tara Total, Peso Neto y botón de eliminar/corregir renglón.
   - Barra de totales acumulados: `Total Bultos`, `Total Tara (Kg)`, `Total Neto (Kg)`.
4. **Paso D: Confirmación y Emisión**
   - Botón: `[Guardar Recepción y Descargar Acta Consolidada]`.

### 2.2 Modal de Despacho con Checklist de Lotes
1. Selector de cliente.
2. Si el cliente tiene cartera vencida, banner ámbar/rojo con alerta y botón `[Cobrar en Caja Ahora]`.
3. Tabla checklist interactiva de existencias en frío:
   - Casilla de verificación para cada lote.
   - Muestra fecha de ingreso, días en custodia, bultos disponibles y kg disponibles.
   - Selector rápido: `[Retirar Todo]` o input para digitar bultos/kg parciales.
4. Botón: `[Confirmar Salida y Generar Acta de Entrega Consolidada]`.

---

## 3. Plan de Auditoría y Unificación UI/UX Global (Light Mode WCAG AA+)

### Fase 1: Componentes Base & Fundaciones CSS
- Auditar y purgar en `src/index.css` cualquier clase residual que fuerce fondos oscuros o textos transparentes.
- Reforzar componentes atómicos en `src/components/ui/`: `Table`, `Modal`, `Input`, `Select`, `Badge`, `Button`.
- Regla WCAG AA+: fondo `#ffffff` para tablas y modales, cabeceras en `#f1f5f9` o `#f8fafc`, bordes `#cbd5e1`, textos en `#0f172a`.

### Fase 2: Módulos de Operación & Bodega
- `src/views/inventory/InventoryView.tsx` y subpestañas (Kardex, Bodegas, Mermas).
- `src/views/purchases/RecepcionCamionView.tsx` (Recepción de camiones y compras Bucaramanga).
- `src/views/b2b/B2BView.tsx` (Despachos B2B y logística).

### Fase 3: Módulos Administrativos & Terceros
- `src/views/clients/ClientsView.tsx` y `src/views/suppliers/SuppliersView.tsx`.
- `src/views/hr/HRView.tsx` (Nómina y empleados).
- `src/views/cash/CashFlowView.tsx` (Flujo de caja y turnos).

---

## 4. Orquestación Multi-Agente & Roles

| Agente / Workflow | Misión Específica |
| :--- | :--- |
| **`@planner` / `SoftwareArchitect`** | Guardián de la arquitectura de datos, inmutabilidad y cálculo gravimétrico exacto (`Number.EPSILON`). |
| **`@implementer` / `DataEngineer`** | Implementación de esquemas Zod en `packages/validation-schemas/` y lógica de persistencia en `coldStorageRentalService.ts`. |
| **`UIReviewer` / `/swarm --agent ui`** | Maquetación con Tailwind CSS Light Mode WCAG 2.2 AA+ para ticket múltiple, sub-modal rápido y checklist de despacho. |
| **`QualityEngineer` / `tdd-guide`** | Creación y ejecución de tests unitarios TDD en `coldStorageRental.test.ts` (objetivo: >= 45 tests verdes). |
| **`@reviewer` / DevTools MCP Loop** | Auditoría obligatoria en `http://127.0.0.1:3000/` en resolución de escritorio y móvil (375 px) con 0 errores y 0 warnings en consola JS. |
