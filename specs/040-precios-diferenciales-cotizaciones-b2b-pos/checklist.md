# Lista de Verificación de Calidad: SPEC-040
## Quality Gate Checklist — `/speckit.checklist`

- **Código:** SPEC-040
- **Fase:** Spec Kit SDD v3.0 — `/speckit.checklist`
- **Fecha:** 2026-10-28

---

### Criterios de Aceptación y Estándares de Industria

#### 1. Persistencia & Aislamiento de Datos (IndexedDB Multi-Tenant)
- [ ] La base de datos local se nombra de forma determinista: `PezcaderiaERP_{tenantId}`.
- [ ] No existe ninguna tabla compartida entre tenants distintos en el almacenamiento del navegador.
- [ ] Todas las transacciones de escritura y lectura son asíncronas basadas en Promises nativas.
- [ ] Se implementa manejo de errores ante fallo de apertura de IndexedDB o modo incógnito restringido con fallback seguro en memoria.
- [ ] Capacidad de almacenar 20.000 ítems y 30.000 clientes sin superar límites de cuota del navegador.

#### 2. Motor de Búsqueda Off-Thread (Web Worker)
- [ ] El Web Worker se carga como módulo ESM nativo de Vite (`new Worker(..., { type: 'module' })`).
- [ ] El hilo principal de React nunca realiza bucles de búsqueda iterativos (`.filter()`) sobre el dataset masivo completo.
- [ ] El Worker responde a consultas de búsqueda en menos de **2 milisegundos**.
- [ ] Soporta búsqueda por SKU exacto, código de barras y búsqueda difusa (Fuzzy Search) por palabras del nombre o marca.
- [ ] Soporta límite y paginación de resultados (por defecto retorna el Top 80 más relevantes).

#### 3. Renderizado y Rendimiento Frontend (120 FPS & Virtualización)
- [ ] La grilla de productos y la lista de clientes utilizan virtualización headless (`useVirtualGrid`).
- [ ] El número total de nodos DOM en la vista de búsqueda nunca excede los 50 elementos, independientemente del total de resultados.
- [ ] La tasa de refresco se mantiene en **120 FPS** estables durante el scroll continuo en pantalla de laptop (1366x768) y escritorio (1080p).
- [ ] No existen saltos visuales (Layout Shift) al reciclar tarjetas en la grilla virtual.

#### 4. Precios Diferenciales & Cotizaciones B2B POS
- [ ] Cada ítem del catálogo soporta `precioDetal`, `precioMayorista` y `cantidadMinimaMayorista`.
- [ ] Si la cantidad agregada es $\ge$ `cantidadMinimaMayorista`, el precio conmuta automáticamente a mayorista.
- [ ] Si el cliente tiene perfil `MAYORISTA` o `CONTRATISTA`, se aplica precio mayorista desde la primera unidad.
- [ ] La conversión de Cotización B2B a Preventa POS se ejecuta en un solo clic, generando preventa en `pos_prefacturas` y reservando stock en bodega (`Hard-Hold`).
- [ ] El Kanban de Caja Central (SPEC-037) visualiza la preventa generada desde cotización y permite su recaudo inmediato.

#### 5. Calidad de Código & Integridad
- [ ] Cero errores de compilación estricta con `npx tsc --noEmit`.
- [ ] Suite de pruebas unitarias y de integración TDD pasando al 100% en Vitest ($\ge 80\%$ de cobertura).
- [ ] Cero errores no controlados en la consola JS de Chrome DevTools.
- [ ] Respeto absoluto del Dark Glassmorphism V8 (`#070A10`), retícula de 8px y WCAG 2.2 AA+.

