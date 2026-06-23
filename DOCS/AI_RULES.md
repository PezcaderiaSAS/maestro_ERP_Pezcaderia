# Reglas del Proyecto: MaestroPescadería ERP
> **USO**: Adjunta este archivo con `@DOCS/AI_RULES.md` al inicio de cada conversación con Antigravity para activar el contexto completo del proyecto.

---

## 1. Identidad y Reglas Primordiales del Proyecto

- **Idioma Oficial**: **REGLA PRIMORDIAL: Todos los textos de la interfaz de usuario, etiquetas, alertas, mensajes de validación, comentarios de código y documentación deben estar estrictamente en idioma español.**
- **Nombre**: MaestroPescadería ERP
- **Stack**: React 18 + TypeScript 5 + Vite 5 + Supabase (pendiente migración)
- **Persistencia actual**: `localStorage` via `src/services/localDb.ts`
- **Fase actual**: Desarrollo local. La migración a Supabase es una fase posterior separada.
- **Metodología**: Spec Driven Development (SDD). Ver `DOCS/spec_driven_development.md`.

---

## 2. Reglas de TypeScript

- **OBLIGATORIO**: Todas las funciones deben tener tipos de retorno explícitos.
- **PROHIBIDO**: Usar `any`. Usar `unknown` + type guards si el tipo no es conocido.
- **OBLIGATORIO**: Definir interfaces/tipos en el mismo archivo si son locales, o en `src/types/` si son compartidos.
- **PROHIBIDO**: `var`. Usar `const` por defecto, `let` solo cuando sea necesario mutar.
- **OBLIGATORIO**: Exportar los tipos junto con los componentes/funciones que los usan.

```typescript
// ✅ CORRECTO
interface ProductoInput { sku: string; nombre: string; precio: number; }
function crearProducto(input: ProductoInput): Producto { ... }

// ❌ INCORRECTO
function crearProducto(input: any) { ... }
```

---

## 3. Reglas de React y Componentes

- **OBLIGATORIO**: Componentes funcionales con arrow functions. No usar `class components`.
- **OBLIGATORIO**: Props tipadas con interfaz nombrada `[NombreComponente]Props`.
- **PROHIBIDO**: Lógica de negocio dentro de componentes JSX. La lógica va en funciones de servicio o hooks.
- **OBLIGATORIO**: Los archivos de vista (`*View.tsx`) deben orquestar; no deben contener lógica de negocio inline.
- **PREFERIDO**: Componentes de menos de 300 líneas. Si supera este límite, extraer sub-componentes.
- **PROHIBIDO**: Comentarios redundantes que solo repiten lo que el código ya dice.

```typescript
// ✅ CORRECTO
interface POSViewProps { userId: string; }
const POSView = ({ userId }: POSViewProps): JSX.Element => { ... }

// ❌ INCORRECTO
const POSView = (props: any) => { ... }
```

---

## 4. Reglas de Nombrado

- **Archivos de Vista**: `PascalCase` + sufijo `View` → `POSView.tsx`, `InventoryView.tsx`
- **Archivos de Servicio**: `camelCase` + sufijo `Service` → `posService.ts`, `inventoryService.ts`
- **Archivos de Hook**: prefijo `use` + `PascalCase` → `usePOS.ts`, `useInventory.ts`
- **Interfaces/Types**: `PascalCase` → `Producto`, `Pedido`, `Cliente`
- **Constantes globales**: `SCREAMING_SNAKE_CASE` → `MAX_STOCK_ALERT = 5`
- **Variables y funciones**: `camelCase` → `calcularTotal()`, `stockActual`

---

## 5. Reglas de Servicios y Datos

- **OBLIGATORIO**: Toda lectura/escritura de `localStorage` debe pasar por `localDb.ts`. No usar `localStorage.getItem()` directamente en componentes.
- **OBLIGATORIO**: Cada módulo debe tener su propio archivo de servicio en `src/services/`.
- **PATRÓN**: Los servicios deben retornar `{ data, error }` para manejo consistente de errores.
- **PROHIBIDO**: `console.log` en producción. Usar `console.warn` o `console.error` solo para casos de error real.

```typescript
// ✅ PATRÓN DE SERVICIO CORRECTO
export function obtenerProductos(): { data: Producto[]; error: string | null } {
  try {
    const data = load('productsCatalog', []);
    return { data, error: null };
  } catch (e) {
    return { data: [], error: 'Error al cargar productos' };
  }
}
```

---

## 6. Reglas del Proceso SDD

- **OBLIGATORIO**: Antes de implementar cualquier feature nueva, debe existir un `SPEC` aprobado en `DOCS/SPECS/`.
- **OBLIGATORIO**: Referenciar la regla de negocio aplicable con un comentario `// RN-XX` donde sea relevante.
- **OBLIGATORIO**: Al refactorizar un módulo monolítico, seguir el plan de extracción definido en su SPEC.
- **PROHIBIDO**: Delegar decisiones de arquitectura a la IA sin un SPEC previo. La IA ejecuta; el SPEC decide.

---

## 7. Reglas de Testing

- **Framework**: Vitest
- **Convención de archivo**: `[nombreModulo].test.ts` en carpeta `src/tests/`
- **OBLIGATORIO**: Todo SPEC aprobado debe tener al menos tests para los casos de éxito y los casos de error de sus reglas de negocio críticas.
- **PROHIBIDO**: Tests que no tengan assertions (`expect`).

---

## 8. Contexto de Módulos Activos

| Módulo | Archivo/Ruta actual | SPEC | Estado |
|---|---|---|---|
| Módulo 1: POS (Punto de Venta) | `src/views/POSView.tsx` | `SPEC_POS.md` | Refactoring pendiente |
| Módulo 2: Ventas B2B | `src/views/OrderKanbanView.tsx` | `SPEC_B2B.md` (Por crear) | Refactoring pendiente |
| Módulo 3: Inventario y WMS | `src/views/InventoryView.tsx` | `SPEC_INVENTORY.md` | Refactoring pendiente |
| Módulo 4: Compras | `src/views/PurchasesView.tsx` | `SPEC_PURCHASES.md` (Por crear) | Por implementar |
| Módulo 5: Gastos | `src/views/ExpensesView.tsx` | `SPEC_EXPENSES.md` (Por crear) | Por implementar |
| Módulo 6: Producción | `src/views/ProductionView.tsx` | `SPEC_PRODUCTION.md` (Por crear) | Por implementar |
| Módulo 7: Facturación / Historial | `src/views/InvoicesView.tsx` | `SPEC_BILLING.md` (Por crear) | Por implementar |
| Módulo 8: RRHH y Nómina | `src/views/PayrollView.tsx` | `SPEC_RRHH_NOMINA.md` | Refactoring pendiente |
| Módulo 9: Logística | `src/views/LogisticsView.tsx` | `SPEC_LOGISTICS.md` (Por crear) | Por implementar |
| Módulo 10: Informes (Reportes) | `src/views/ReportsView.tsx` | `SPEC_REPORTS.md` (Por crear) | Por implementar |
| Módulo 11: Cajas y Flujo de Caja | `src/views/CashFlowView.tsx` | `SPEC_CASHFLOW.md` (Por crear) | Por implementar |
| Módulo 12: Clientes y Cartera | `src/views/ClientsView.tsx` | `SPEC_CLIENTS.md` (Por crear) | Estable |
| Módulo 13: CRM | `src/views/CRMView.tsx` | `SPEC_CRM.md` (Por crear) | Integrado (Twenty) |

---

## 9. Archivos Clave de Referencia

- `DOCS/spec_driven_development.md` — Guía del proceso SDD
- `DOCS/system_design.md` — Arquitectura de módulos
- `DOCS/business_rules.md` — Tablas de la Verdad
- `DOCS/SPECS/SPEC_[MODULO].md` — SPEC del módulo en cuestión
- `DOCUMENTACION_ERP_WMS_PEZCADERIA.md` — Especificación funcional completa
- `plan_arquitectura_unificada_pezca.md` — Diseño de base de datos PostgreSQL
