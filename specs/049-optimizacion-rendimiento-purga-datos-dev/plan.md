# Plan Técnico de Implementación: SPEC-049
## Arquitectura de Optimización Extrema, Desacoplamiento de Datasets y Servicio de Purga/Reset Local-Remoto

- **Código:** SPEC-049
- **Fase:** Spec Kit SDD v3.0 — `/speckit.plan`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto.
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

### 1. Arquitectura de Componentes y Módulos

```
src/
├── data/
│   └── seedLightData.ts              <-- NUEVO: 25 productos y 10 clientes canónicos (< 10KB)
├── schemas/
│   └── purgeConfig.schema.ts          <-- NUEVO: Contratos Zod para operaciones de purga
├── services/
│   ├── databasePurgeService.ts        <-- NUEVO: Orquestador atómico de purga (IDB + LocalStorage + Supabase)
│   └── ferreteriaJosaseService.ts    <-- MODIFICADO: Desacoplado de la carga síncrona obligatoria
├── store/
│   ├── useClientStore.ts             <-- MODIFICADO: Inicialización con fallback ligero sin jank
│   ├── useInventoryStore.ts          <-- MODIFICADO: Inicialización con catálogo ligero
│   └── useAuthStore.ts               <-- MODIFICADO: Eliminación de applyToStores síncrono en login
├── views/
│   ├── auth/LoginView.tsx             <-- MODIFICADO: Login 1-clic instantáneo sin bloqueo
│   └── pos/components/               
│       └── DevPurgeButton.tsx        <-- NUEVO: Botón + Modal de Purga para Topbar y Ajustes
├── components/layout/
│   └── EnterpriseTopbar.tsx          <-- MODIFICADO: Integración del botón de purga rápida
└── tests/
    ├── databasePurgeService.test.ts  <-- NUEVO: Pruebas unitarias de purga y resiembra
    └── seedLightPerformance.test.ts  <-- NUEVO: Benchmark de tiempo de arranque (< 50ms)
```

---

### 2. Especificación de Datos Semilla Ligeros (`seedLightData.ts`)

- **Tamaño total:** Menos de 12 KB (frente a los 8.5 MB anteriores, reducción del 99.8%).
- **25 Productos:**
  - 12 Pescados y Mariscos frescos con precios y mermas (Filete de Salmón, Corvina, Bagre, Camarón Tigre, Tilapia, etc.).
  - 8 Productos de Ferretería base de alta rotación (Martillo de Uña, Disco de Corte 4.5", Cinta Aislante, Tornillo Drywall, etc.).
  - 5 Servicios / Empaques (Hielo picado, Empaque al vacío, etc.).
- **10 Clientes:**
  - `Consumidor Final` (CC: `22222222`, perfil DETAL).
  - 3 Restaurantes (Mar y Fuego, Pescadería del Puerto, etc. - perfil RESTAURANTE).
  - 3 Clientes Mayoristas (Distribuidora del Oriente, Supermercado Central - perfil MAYORISTA).
  - 3 Clientes Ferreteros B2B (Ferretería El Martillo, Constructoras Asociadas).

---

### 3. Servicio de Purga Atómica (`databasePurgeService.ts`)

#### Flujo de Ejecución:
1. **Validación:** Validar `tenantId` con Zod.
2. **Purga Local de IndexedDB:**
   - Invocar `window.indexedDB.deleteDatabase(PezcaderiaERP_${tenantId})`.
   - Invocar `window.indexedDB.deleteDatabase('pezcaderia_outbox_db')`.
3. **Purga de LocalStorage:**
   - Eliminar claves `pezcaderia_clientes`, `pezcaderia_products_catalog`, `pezcaderia_product_pricings`, `pezcaderia_stock`, `lastClientPrices`, `pezca_pos_drafts_v1`.
4. **Purga Remota en Supabase (Transaccional):**
   - Invocar RPC `rpc_purge_tenant_data` en Supabase o query SQL con `SECURITY DEFINER` acotado al `tenant_id`.
   - Vaciado en cascada de `prefacturas`, `movimientos_inventario`, `clientes`, `productos`.
5. **Re-siembra Automática:**
   - Cargar inmediatamente los 25 productos y 10 clientes de `seedLightData` en los stores de Zustand (`useClientStore`, `useInventoryStore`) y en `localStorage`.
   - Duración total estimada: **< 60 milisegundos**.

---

### 4. Modificaciones en el Flujo de Login y Arranque

1. **`LoginView.tsx` y `useAuthStore.ts`:**
   - Eliminar la llamada síncrona `await ferreteriaJosaseService.applyToStores()`.
   - Si los stores están vacíos, inicializar con `seedLightData` de forma sincrónica.
   - El login se vuelve **instantáneo (sub-50ms)**.
2. **`ferreteriaJosaseService.ts`:**
   - Renombrar `applyToStores` a `cargarDatasetMasivoJosaseOptIn()`.
   - Solo se ejecutará si el usuario hace clic expreso en "Cargar Catálogo Masivo para Pruebas de Estrés".

---

### 5. Interfaz de Usuario: Botón en `EnterpriseTopbar`

- Botón Dark Glassmorphism con icono de escoba (`Trash2` / `RotateCcw`) con tooltip: *"Reset & Purga Rápida de Datos de Prueba"*.
- Modal de confirmación SweetAlert2 con diseño oscuro y opciones:
  - *"Se limpiará el almacenamiento local y la base de datos de pruebas en Supabase para el tenant activo, re-sembrando un catálogo ligero de 25 productos y 10 clientes."*
  - Botón: *"Sí, purgar y reiniciar"* / *"Cancelar"*.
