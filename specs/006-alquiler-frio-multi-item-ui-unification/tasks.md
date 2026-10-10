# Tareas de Implementación: Alquiler de Frío Multi-Producto & Unificación UI/UX Global

**Identificador:** `006-alquiler-frio-multi-item-ui-unification`  
**Estado:** LISTO PARA EJECUCIÓN (Ejecutable en la siguiente sesión)

---

## 📋 Lista de Tareas Atómicas (Ejecutable Paso a Paso)

### Fase 1: Esquemas Zod & Modelos Gravimétricos (`packages/validation-schemas/`)
- [ ] **Tarea 1.1:** Definir `PartidaRecepcionSchema` y `RecepcionMultipleInputSchema` en `coldStorageRental.schema.ts` soportando múltiples partidas con tara y peso neto individual.
- [ ] **Tarea 1.2:** Definir `ClienteRapidoInputSchema` para creación express de clientes con contrato en 15 segundos.
- [ ] **Tarea 1.3:** Definir `ItemDespachoSchema` y `DespachoMultipleInputSchema` con soporte para selección múltiple de lotes y retiro total o parcial.
- [ ] **Tarea 1.4:** Extender `calcularTaraYNetoExacto` para calcular totales consolidados de un arreglo de partidas pesadas sin errores de coma flotante.

---

### Fase 2: Servicios & Persistencia en LocalDb / Supabase (`src/services/`)
- [ ] **Tarea 2.1:** Implementar `coldStorageRentalService.registrarRecepcionMultiple(input: RecepcionMultipleInput)` que guarde cada partida como existencia individual vinculada al mismo consecutivo de acta.
- [ ] **Tarea 2.2:** Implementar `coldStorageRentalService.crearClienteYContratoRapido(input: ClienteRapidoInput)` que inserte cliente en el catálogo y genere contrato activo de forma atómica.
- [ ] **Tarea 2.3:** Implementar `coldStorageRentalService.registrarDespachoMultiple(input: DespachoMultipleInput)` que descuente los inventarios seleccionados y liquide los días correspondientes.
- [ ] **Tarea 2.4:** Adaptar `coldStoragePdfService.ts` para renderizar Actas de Recepción y Salida con tabla multi-partida (desglosando producto, empaque, bultos, tara, kg brutos y kg netos).

---

### Fase 3: Pruebas Unitarias TDD (`src/tests/coldStorageRental.test.ts`)
- [ ] **Tarea 3.1:** Escribir tests para recepción múltiple donde el mismo producto (ej. Corvina) tiene 3 partidas con taras distintas (canastillas 2.0 kg, cajas 0.8 kg, suelto 0.0 kg) verificando la suma exacta.
- [ ] **Tarea 3.2:** Escribir tests para `crearClienteYContratoRapido` verificando la creación sin errores y retorno del nuevo contrato listo para selección.
- [ ] **Tarea 3.3:** Escribir tests para despacho múltiple con retiro total de un lote y parcial de otro.
- [ ] **Tarea 3.4:** Escribir tests de generación de PDF para actas multi-partida sin errores de renderizado.
- [ ] **Tarea 3.5:** Ejecutar `npx vitest run src/tests/coldStorageRental.test.ts` confirmando 100% de tests pasando.

---

### Fase 4: Frontend Táctil - Módulo Alquiler de Frío (`src/views/coldStorageRental/`)
- [ ] **Tarea 4.1:** Construir la interfaz de "Ticket de Pesaje en Vivo" en el modal de recepción:
  - Formulario de partida manual (producto, empaque, tara, peso bruto).
  - Botón `[+ Agregar Partida a la Planilla]`.
  - Tabla dinámica de partidas acumuladas con botón de eliminación y barra de totales gravimétricos.
- [ ] **Tarea 4.2:** Construir el sub-modal flotante de "Creación Rápida de Cliente" accesible con un toque desde el selector de clientes en báscula.
- [ ] **Tarea 4.3:** Construir el modal de despacho múltiple con checklist de existencias activas del cliente y selector total/parcial.
- [ ] **Tarea 4.4:** Verificar que las actas y recibos generados se puedan descargar e imprimir en formato PDF y ticket térmico.

---

### Fase 5: Auditoría & Unificación UI/UX Global (Light Mode WCAG AA+)
- [ ] **Tarea 5.1:** Auditar y unificar vistas operativas de Bodega (`src/views/inventory/InventoryView.tsx`, Kardex y transferencias).
- [ ] **Tarea 5.2:** Auditar y unificar módulo de Recepción de Camión y Compras (`src/views/purchases/RecepcionCamionView.tsx`).
- [ ] **Tarea 5.3:** Auditar y unificar módulo de Despachos B2B y Rutas (`src/views/b2b/B2BView.tsx`).
- [ ] **Tarea 5.4:** Auditar y unificar vistas de Terceros (Clientes, Proveedores y Nómina).
- [ ] **Tarea 5.5:** Verificar que todos los formularios, tablas y modales cumplan con ratio de contraste >= 4.5:1.

---

### Fase 6: Validación Final DevTools & Cierre
- [ ] **Tarea 6.1:** Ejecutar `npx tsc --noEmit` y confirmar 0 errores de tipado.
- [ ] **Tarea 6.2:** Ejecutar la suite global de pruebas `npx vitest run` y confirmar 100% verde.
- [ ] **Tarea 6.3:** Auditar en vivo con Chrome DevTools MCP en `http://127.0.0.1:3000/` en resolución de escritorio (1280x800) y móvil (375x812) confirmando 0 errores y 0 warnings en consola JS.
- [ ] **Tarea 6.4:** Actualizar `MEMORY.md` y `CHANGELOG_AGENTS.md`.
- [ ] **Tarea 6.5:** Confirmar con el usuario, realizar commit convencional y push a GitHub (`origin/main`).
