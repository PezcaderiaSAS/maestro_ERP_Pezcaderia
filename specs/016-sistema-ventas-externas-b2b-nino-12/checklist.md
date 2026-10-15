# Checklist de Calidad y Estándares de Industria (/speckit.checklist)

**Código:** SPEC-016  
**Título:** Lista de Verificación de Calidad — Sistema de Ventas Externas B2B para Bodega Principal  
**Estado:** DRAFT (Esperando Aprobación Humana)  
**Fecha:** 2026-10-15  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.checklist`  

---

## 1. Terminal Móvil del Vendedor B2B & Usabilidad (Regla del Niño de 12 Años)

- [ ] **CHK-016-01 (Flujo en 3 Pasos Táctiles):** La terminal móvil guía secuencialmente: 1) Selección de Cliente; 2) Catálogo Visual de Bodega Principal; 3) Carrito con fecha de entrega pactada y confirmación en 1 toque.
- [ ] **CHK-016-02 (Semáforo de Cupo de Crédito a la Vista):** La selección de cliente muestra de forma prominente la barra de crédito (cupo total, cupo usado y saldo disponible en COP) con semáforo verde/rojo.
- [ ] **CHK-016-03 (Acción Preventiva ante Cupo Excedido):** Si el pedido excede el cupo disponible, se permite guardar como `PAUSADO_POR_CREDITO` o cambiar la condición de pago a `CONTADO / CONTRA-ENTREGA` con 1 solo toque.
- [ ] **CHK-016-04 (Modelo Catch Weight Dual):** Permite ingresar piezas solicitadas y rango de calibre (ej. 5 truchas de 450-500g), calculando peso nominal estimado de referencia y alertando que la facturación se liquidará por kilo real de báscula.
- [ ] **CHK-016-05 (Stock en Tiempo Real de Bodega Principal):** El catálogo solo muestra productos con inventario físico disponible en la Bodega Principal (Bodega 1) para prevenir ventas sin respaldo.
- [ ] **CHK-016-06 (Ergonomía Táctil WCAG 2.2 AAA):** Todos los botones e inputs interactivos cuentan con target size $\ge 48 \times 48\text{ px}$ con micro-interacciones activas (`active:scale-95`).

---

## 2. Alistamiento WMS en Bodega Principal y Cadena de Frío

- [ ] **CHK-016-07 (Ficha Catch Weight en Cuarto Frío):** El operario visualiza el número de piezas y el calibre solicitado al momento de realizar el pesaje.
- [ ] **CHK-016-08 (Validación Automática de Calibre por Báscula):** Al digitar el peso decimal real (ej. 2.45 kg para 5 piezas), el sistema verifica si el peso promedio por pieza ($490\text{ g}$) se encuentra dentro del rango de calibre (450-500g) y emite un check verde.
- [ ] **CHK-016-09 (Liquidación Exacta por Kilo Real):** El subtotal y total de la orden se recalculan automáticamente multiplicando el peso decimal real por el precio pactado por kilo.
- [ ] **CHK-016-10 (Asignación FEFO y Lote):** Registro obligatorio del código de lote perecedero y temperatura del producto al momento del empaque.
- [ ] **CHK-016-11 (Checklist de Calidad y Precinto):** Verificación de 3 checks (temperatura, empaque y precinto numerado de canastilla) antes de emitir la Remisión WMS con código QR y pasar el pedido a `LISTO`.

---

## 3. Despacho, Entrega en Ruta y Segregación de Devoluciones

- [ ] **CHK-016-12 (Consolidación en Manifiesto con Check-in de Frío):** Verificación obligatoria de temperatura del furgón refrigerado ($\le -15^\circ\text{C}$ congelados / $\le 4^\circ\text{C}$ frescos) y odómetro inicial antes de salir a ruta.
- [ ] **CHK-016-13 (Evidencia de Entrega con Firma Digital):** Captura de firma táctil del cliente en la pantalla del teléfono del conductor y registro de hora de entrega.
- [ ] **CHK-016-14 (Devolución Parcial y Descuento en Sitio):** Ante rechazo por no conformidad (avería, calibre, frío), el sistema descuenta en vivo el valor del cobro del conductor.
- [ ] **CHK-016-15 (Ingreso Inmediato a Cuarentena):** El producto devuelto se ingresa automáticamente al Kardex en `CUARENTENA_CALIDAD` al retorno del vehículo a bodega.

---

## 4. Estándares Técnicos, Accesibilidad y Quality Gate

- [ ] **CHK-016-16 (Modo Claro WCAG 2.2 AA+):** Ratios de contraste $\ge 4.5:1$ en textos y $\ge 3:1$ en bordes y badges bajo iluminación diurna de calle.
- [ ] **CHK-016-17 (TypeScript Estricto):** Cero errores tipográficos o advertencias (`npx tsc --noEmit` código 0).
- [ ] **CHK-016-18 (Suites Vitest TDD):** 100% de pruebas unitarias y de integración pasando en verde.
- [ ] **CHK-016-19 (Auditoría Chrome DevTools MCP):** Cero errores en consola JS en `http://localhost:3000/` y renderizado fluido en viewport móvil de 375 px.

---

**Siguiente Paso del Flujo:** Esperar aprobación del usuario sobre esta Lista de Verificación (`/speckit.checklist`) para proceder con el Plan Técnico de Implementación (`/speckit.plan`).
