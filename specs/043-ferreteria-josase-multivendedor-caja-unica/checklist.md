# Lista de Verificación de Calidad: SPEC-043
## Flujo Multivendedor - Caja Única Kanban con Cero-Latencia para Ferretería Josase

- **Código:** SPEC-043
- **Fase:** Spec Kit SDD v3.0 — `/speckit.checklist`
- **Gobernanza:** QualityEngineer + Google Harness² + Master Architect SOLID
- **Estado:** PENDIENTE DE VALIDACIÓN TDD

---

### 1. Requisitos de Rendimiento & Capacidad (Zero-Latency & IndexedDB)
- [ ] **CHK-043-01:** La carga de los 9.550 clientes y 5.351 productos se realiza en `TenantIndexedDbService` sin invocar `localDb.save` ni serializar en `localStorage` (cero excepciones `QuotaExceededError`).
- [ ] **CHK-043-02:** El motor de búsqueda `searchEngineCore` opera en Web Worker off-thread o con debounce reactivo de 150 ms retornando resultados en $\le 2\text{ ms}$.
- [ ] **CHK-043-03:** El modal de selección de clientes y la lista de productos limitan estrictamente la inserción en el DOM a un máximo de 20 elementos simultáneos (cero bloqueos del hilo principal / 120 FPS estables).
- [ ] **CHK-043-04:** La inicialización de Ferretería Josase exhibe un indicador no bloqueante de indexación en segundo plano mientras el vendedor puede operar inmediatamente con 'Consumidor Final (Josase)'.

---

### 2. Segregación de Roles & Ergonomía del Mostrador
- [ ] **CHK-043-05:** Cuando el usuario activo tiene rol de Asesor de Mostrador (`Diego Díaz`, `Luis Banquez`, etc.), los botones de cobro/recaudo y el panel de pagos están 100% ocultos/deshabilitados.
- [ ] **CHK-043-06:** El botón `EMITIR PREVENTA (F6)` genera la comanda con `vendedorId`, `vendedorNombre`, `terminalId`, `notas` generales y `notas` específicas por ítem.
- [ ] **CHK-043-07:** La barra lateral del vendedor (`VendorTicketSidebar`) lista reactivamente sus propios tickets del día, reflejando estados: `EN_COLA` (amarillo), `EN_PROCESO` (azul), `COBRADO` (verde con # de factura) y `CANCELADO` (gris).
- [ ] **CHK-043-08:** El asesor puede recuperar para editar o cancelar un ticket mientras esté en `EN_COLA`. Si la cajera lo tiene abierto en taquilla (`EN_PROCESO`), la edición se bloquea mostrando advertencia.

---

### 3. Taquilla Central de Caja Única & Módulo de Recaudo Mixto
- [ ] **CHK-043-09:** La cajera o admin puede conmutar en 1 clic a la Taquilla Central Kanban desde el Topbar con atajo de teclado (`F4` / `F7`).
- [ ] **CHK-043-10:** Al abrir una tarjeta de preventa en caja, el modal de recaudo rápido permite verificar e inspeccionar todos los ítems, cantidades y precios, permitiendo su ajuste ágil sin trabas de autorización.
- [ ] **CHK-043-11:** El modal soporta división de pago mixto (Efectivo, Tarjeta, Transferencia Bancolombia/Nequi, Crédito) con cálculo reactivo instantáneo del saldo restante por cubrir.
- [ ] **CHK-043-12:** Cuando se ingresa Efectivo, el campo "Efectivo Recibido" calcula en tipografía grande y clara el valor exacto de las "Vueltas / Cambio" a entregar.
- [ ] **CHK-043-13:** Cuando se ingresa Crédito, se permite asignar plazo (8d, 15d, 30d, 60d) tanto para clientes formales con NIT como para Consumidor Final con datos de contacto bajo responsabilidad de caja, generando la cuenta por cobrar en `useARStore`.
- [ ] **CHK-043-14:** Esquema Zod en runtime valida estrictamente que la suma de todos los medios de pago coincida exactamente con el total liquidado de la factura antes de permitir el cierre (`.refine()`).

---

### 4. Gobernanza Brownfield, Tipos & DevTools
- [ ] **CHK-043-15:** `npx tsc --noEmit` debe compilar con **0 errores**.
- [ ] **CHK-043-16:** Suite de pruebas Vitest al 100% verde (incluyendo pruebas de integración del flujo completo mostrador -> preventa -> taquilla -> recaudo mixto).
- [ ] **CHK-043-17:** Bucle Chromium DevTools: 0 errores en consola JS en resolución Desktop (1280px) y Mobile (375px), y verificación de `scrollWidth === clientWidth` (cero desbordamiento).
