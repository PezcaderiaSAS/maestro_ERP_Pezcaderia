---
name: erp-architecture
description: >
  Arquitectura profesional del ERP MaestroPescaderia. Úsala cuando diseñes nuevos módulos,
  decidas dónde va el código (view/store/service/DB), evalúes impacto de cambios,
  definas contratos entre capas, o cuando necesites el mapa arquitectónico completo.
  Enforces: separación de capas, Data-Driven, TypeScript estricto, módulos cohesivos.
version: 1.0.0
source: local-code-analysis
---

# ERP Architecture — MaestroPescaderia

## Principios arquitectónicos (inmutables)

1. **Data-Driven estricto** — la UI reacciona a datos; nunca escribe lógica de negocio en vistas
2. **Capas separadas y no invadidas** — View → Store → Service → DataService → DB
3. **TypeScript estricto** — sin `any` en contratos públicos; `any` solo en adaptadores internos documentados
4. **Modularidad por dominio** — cada módulo ERP (POS, Inventario, RRHH, etc.) es autónomo
5. **Offline-first con sync** — IDataService abstrae local vs. Supabase; el modo se configura en runtime
6. **ABC Pareto en inventario** — decisiones de stock priorizan productos categoría A

---

## Mapa de capas

```
┌─────────────────────────────────────────────────────┐
│  VIEWS (src/views/)                                 │
│  React TSX — solo UI, eventos, formateo visual      │
│  Lee del Store, llama acciones del Store            │
│  Usa SweetAlert2 para confirmaciones destructivas   │
├─────────────────────────────────────────────────────┤
│  STORES (src/store/)                                │
│  Zustand — estado reactivo global                   │
│  Llama Services, expone acciones atómicas           │
│  Middleware: zustandConsoleMiddleware               │
├─────────────────────────────────────────────────────┤
│  SERVICES (src/services/)                           │
│  Lógica de negocio pura                             │
│  Dual-API: funciones sync legacy + clase async      │
│  ServiceResponse<T> como contrato de error          │
├─────────────────────────────────────────────────────┤
│  DATA ABSTRACTION (IDataService)                    │
│  LocalDataService  ↔  SupabaseDataService           │
│  Intercambiable sin cambiar código de servicio      │
├─────────────────────────────────────────────────────┤
│  DATABASE (Supabase/PostgreSQL)                     │
│  Tablas + RLS multi-tenant por branch_id            │
│  RPCs SECURITY DEFINER para operaciones atómicas    │
│  pg_cron para clasificación ABC diaria              │
└─────────────────────────────────────────────────────┘
```

---

## Módulos del ERP y sus responsabilidades

| Módulo       | View                  | Store                    | Service                        | DB Key Tables               |
|-------------|----------------------|--------------------------|--------------------------------|-----------------------------|
| POS/Caja    | `POSView.tsx`         | `useCashStore`           | `cashService`, `posService`    | `turnos_caja`, `movimientos_caja` |
| Inventario  | `InventoryView.tsx`   | `useInventoryStore`      | `inventoryService`             | `inventario_movimientos`    |
| Bodegas/WMS | `InventoryView.tsx`   | `useWarehouseStore`      | `warehouseService`             | `bodegas`                   |
| Contabilidad| `AccountingView.tsx`  | `useAccountingStore`     | `accountingService`            | `ledger_entries`, `accounts` |
| AR/Cartera  | `ARView.tsx`          | `useARStore`             | `b2bService`                   | `cartera_facturas`          |
| CRM         | `CRMView.tsx`         | `useClientStore`         | —                              | `clientes`                  |
| RRHH        | `HRView.tsx`          | `useEmployeeStore`       | `payrollService`               | `empleados`, `nomina_*`     |
| Despacho    | `OrderKanbanView.tsx` | `useOrderStore`          | `orderDispatchService`         | `traslados_logistica`       |
| Compras     | —                     | `usePurchaseStore`       | —                              | `ordenes_compra`            |
| Precios     | `PricingView.tsx`     | —                        | —                              | `productos_precios`         |

---

## Regla de decisión: ¿Dónde va este código?

```
¿Es solo presentación / formato visual?          → src/views/ o src/components/
¿Es estado reactivo compartido entre componentes? → src/store/
¿Es validación o lógica de dominio?               → src/services/
¿Es tipado compartido entre capas?                → src/types/
¿Es acceso a datos (localStorage o Supabase)?     → IDataService (services/LocalDataService o SupabaseDataService)
¿Es schema de BD o migración?                     → database/
¿Es hook de React (lifecycle, efectos locales)?   → src/hooks/
```

---

## Tipos del sistema y dónde viven

```
src/types/
  erp.types.ts          ← Tipos transversales (Cliente, Proveedor, Empleado)
  inventory.types.ts    ← Producto, MovimientoInventario
  pos.types.ts          ← ItemCarrito, Venta
  cash.types.ts         ← TurnoCaja, MovimientoCaja
  caja.types.ts         ← AperturaCaja, ArqueoCaja
  orders.types.ts       ← OrdenCompra, Cotizacion
  auth.types.ts         ← UserSession, Role
  services.types.ts     ← IDataService, ServiceResponse (contratos de capas)
  accounting.ts         ← LedgerEntry, ReferenceType
```

**Regla:** Un tipo de dominio NUNCA se define en el archivo de la vista. Siempre en `src/types/`.

---

## Patrón de componente View

```tsx
// src/views/ModuloView.tsx
import { useEffect } from 'react';
import { useModuloStore } from '../store/useModuloStore';
import Swal from 'sweetalert2';

const ModuloView = () => {
  // 1. Solo hooks y estado del store
  const { entidades, loadEntidades, isLoading } = useModuloStore();

  // 2. Efectos de carga inicial
  useEffect(() => { loadEntidades(); }, []);

  // 3. Handlers delgados — delegan al store/service
  const handleEliminar = async (id: string) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar registro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    // Llamar al store, NO al service directamente
    const { error } = await useModuloStore.getState().eliminarEntidad(id);
    if (error) {
      Swal.fire('Error', error, 'error');
    } else {
      Swal.fire('Eliminado', 'Registro eliminado correctamente.', 'success');
    }
  };

  // 4. JSX limpio con Tailwind
  return (
    <div className="p-4">
      {isLoading && <p>Cargando...</p>}
      {/* UI aquí */}
    </div>
  );
};
```

**Anti-patrones en vistas:**
```tsx
// ❌ MAL — lógica de negocio en la vista
const handleGuardar = () => {
  if (precio < 0) throw new Error('...');  // ← va en el service
  const stockActual = Object.values(stock).reduce(...); // ← va en el service
};

// ❌ MAL — acceso directo a Supabase desde la vista
const { data } = await supabase.from('productos').select('*');

// ✅ BIEN — delegar al store
const handleGuardar = async () => {
  const { error } = await useInventoryStore.getState().guardarProducto(form);
  if (error) Swal.fire('Error', error, 'error');
};
```

---

## Flujo de una operación POS (ejemplo de referencia)

```
Usuario presiona "Cobrar" en PaymentPanel
         ↓
PaymentPanel.onConfirmarPago()
         ↓
POSView.handleConfirmarPago()           ← delgado: solo llama al store
         ↓
useCashStore.registrarVenta(items, pago)
         ↓
cashService.procesarVenta()             ← lógica de negocio
  ├── inventoryService.registrarSalida()   ← decrementa stock
  └── accountingService.recordCategorizedTransaction('SALE_CASH')  ← asiento doble
         ↓
IDataService.create('movimientos_caja', ...)  ← persiste
         ↓
Supabase RPC record_ledger_transaction()  ← partida doble atómica
```

---

## Convención de archivos nuevos

```
# Nuevo módulo "Devoluciones"
src/
  views/DevolucionesView.tsx      ← vista principal
  views/devoluciones/             ← sub-componentes si la vista > 300 líneas
    components/
      DevolucionForm.tsx
      DevolucionesTable.tsx
  store/useDevolucionStore.ts     ← Zustand store
  services/devolucionService.ts  ← lógica de negocio + dual-API
  types/devoluciones.types.ts    ← tipos del dominio
database/
  23_devoluciones.sql             ← migración de esquema
```

---

## Señales de alerta arquitectónica (detectar y corregir)

| Señal | Problema | Corrección |
|-------|----------|------------|
| `supabase.from()` en un `.tsx` | Acceso directo a BD desde vista | Mover al service |
| Función > 80 líneas en una vista | Lógica de negocio en vista | Extraer al service |
| `any[]` como tipo de estado en el store | Tipado insuficiente | Definir interfaz en `types/` |
| `console.error(e)` sin retornar error al usuario | Error silencioso | Retornar `ServiceResponse` |
| Store que hace dos `await dataService.*` sin Promise.all | Secuencial innecesario | Paralelizar con `Promise.all` |
| Vista que importa directamente del service | Acoplamiento view-service | Enrutar via store |
| Migración sin `IF NOT EXISTS` | No idempotente | Agregar guarda idempotente |

---

## Checklist al diseñar un nuevo módulo ERP

- [ ] Definir tipos en `src/types/modulo.types.ts`
- [ ] Crear service con Dual-API (sync + async class)
- [ ] Crear store Zustand con `setModuloDataService` exportado
- [ ] Vista que solo lee del store y delega acciones
- [ ] Migración SQL numerada con RLS y campos estándar
- [ ] RPC para operaciones que tocan múltiples tablas
- [ ] Asiento contable doble si hay dinero involucrado
- [ ] Clasificación ABC si hay stock involucrado
- [ ] Agregar ruta en `App.tsx` con lazy import
- [ ] Agregar entrada en sidebar de navegación
