# Lista de Verificación de Calidad y Estándares de Industria (SPEC-023)

**Código:** SPEC-023  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.checklist`  
**Fecha:** 2026-10-19  

---

## 1. Estándar PWA Móvil y Arquitectura Offline-First
- [ ] **CH-01:** La aplicación opera en modo standalone a través de la ruta `/repartidor` (`AppRouteId.DRIVER_PORTAL`), sin barras de navegación de escritorio (`EnterpriseSidebar`, `EnterpriseTopbar`) que resten espacio útil.
- [ ] **CH-02:** Persistencia local en IndexedDB (`MaestroPescaderiaOfflineDB`) de los manifiestos asignados, paradas y pedidos para consulta inmediata sin señal celular.
- [ ] **CH-03:** Encolado seguro de transacciones de entrega en la cola outbox (`caja_outbox_v2` / `entregas_outbox`) con hash determinista de idempotencia para prevenir duplicidades.
- [ ] **CH-04:** Sincronización automática silenciosa mediante `backgroundSyncWorker` al detectar reconexión a través del `NetworkHeartbeat` de 15 segundos.

---

## 2. Inocuidad Sanitaria y Cadena de Frío HACCP en Ruta
- [ ] **CH-05:** Captura obligatoria de temperatura de cava o furgón (°C) al arribar a cada parada de entrega.
- [ ] **CH-06:** Evaluación en vivo mediante el componente semafórico tricolor (`ThermalTrafficLightBadge`):
  - $\le 4.0^\circ\text{C}$: Verde Óptimo (Cadena de frío preservada).
  - $4.1^\circ\text{C}\text{ a }7.0^\circ\text{C}$: Ámbar Precaución (Refuerzo térmico requerido).
  - $> 7.0^\circ\text{C}$: Rojo Alerta Sanitaria (Bloqueo o autorización de emergencia).

---

## 3. Evidencia Legal y Firma Digital Táctil
- [ ] **CH-07:** Lienzo de firma nativo HTML5 Canvas (`DriverSignaturePadCanvas.tsx`) con 0 dependencias externas y alta respuesta táctil.
- [ ] **CH-08:** Botón de "Borrar / Repetir Firma" $\ge 48\times 48\text{ px}$ y botón de "Aceptar Firma" $\ge 56\text{ px}$.
- [ ] **CH-09:** Validación obligatoria de Nombre Completo y Cédula de la persona que recibe la mercancía en el local del cliente.
- [ ] **CH-10:** Exportación de la firma en formato DataURL PNG comprimido en Base64 asociada indisolublemente al registro de entrega.

---

## 4. Metrología B2B, Devoluciones y Recaudo en Terreno
- [ ] **CH-11:** Desglose claro de ítems entregados con verificación de kilos y lotes FEFO perecederos.
- [ ] **CH-12:** Capacidad de registrar devoluciones parciales especificando producto, kilos rechazados y motivo (daño, calibre, empaque).
- [ ] **CH-13:** Reingreso automático de los ítems devueltos al almacén bajo estado `CUARENTENA_CALIDAD`.
- [ ] **CH-14:** Recálculo instantáneo del saldo a recaudar en pesos colombianos enteros (SPEC-009) ante rechazos parciales.
- [ ] **CH-15:** Soporte para recaudo en efectivo o registro de comprobante de transferencia bancaria si la venta es contraentrega.

---

## 5. Ergonomía Táctil en Terreno ("Regla del Niño de 12 Años")
- [ ] **CH-16:** Todos los botones secundarios, inputs de texto y selectores tienen una dimensión táctil mínima de $\ge 48\times 48\text{ px}$ (`min-h-[48px]`).
- [ ] **CH-17:** Los botones de acción principal tienen una altura mínima de $\ge 56\text{ px}$ (`h-14` / `min-h-[56px]`) con tipografía bold de alto impacto visual.
- [ ] **CH-18:** Acciones de comunicación rápida a 1 solo toque:
  - Botón táctil `tel:[numero]` para llamada directa al encargado de compras del cliente.
  - Botón táctil para abrir coordenadas del cliente directamente en Waze o Google Maps.
- [ ] **CH-19:** Cumplimiento estricto de Light Mode WCAG 2.2 AA+ (ratios de contraste $\ge 4.5:1$ y $\ge 7:1$) con excelente legibilidad bajo luz solar directa.
- [ ] **CH-20:** CERO imágenes externas (`<img>` = 0). Iconografía 100% vectorial semántica con Lucide React a costo $0.

---

## 6. Clean Architecture, Modularidad y Quality Gate
- [ ] **CH-21:** Modularización estricta respetando el Principio de Responsabilidad Única (SRP): ningún archivo de componente superará las 400 líneas de código útil.
- [ ] **CH-22:** Compilación TypeScript estricta (`tsc --noEmit`) con 0 errores y 0 warnings.
- [ ] **CH-23:** Cobertura de pruebas unitarias y de integración TDD $\ge 80\%$ en suites dedicadas.
- [ ] **CH-24:** Auditoría Master Architect SOLID (`audit-solid-boundaries.cjs`) aprobada con 0 violaciones críticas.
- [ ] **CH-25:** Bucle interactivo con Chrome DevTools MCP en vivo con 0 errores en consola JS y renderizado responsivo verificado en viewport móvil (375 px).

---

*Lista de verificación formal lista para revisión.*
