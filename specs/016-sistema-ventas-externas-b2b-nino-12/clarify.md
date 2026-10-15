# Control de Calidad 1: Clarificación y Decisiones de Negocio (/speckit.clarify)

**Código:** SPEC-016  
**Título:** Registro de Decisiones de Negocio y Arquitectura — Protocolo /grill-me  
**Estado:** APPROVED (Decisiones Validadas por el Usuario)  
**Fecha:** 2026-10-15  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.clarify`  

---

## 1. Decisiones Consolidadas del Interrogatorio Continuo (/grill-me)

Durante la sesión del protocolo `/grill-me`, se resolvieron las 5 ramas de decisión arquitectónica y operativa:

### Decisión 1: Experiencia de Entrada del Vendedor Externo (Regla del Niño de 12 Años)
* **Resolución:** Implementar una **Terminal Móvil B2B Dedicada (`B2BExternalSalesView`)** en 3 pasos táctiles:
  1. *Selección de Cliente* con barra y semáforo visual de cupo de crédito a simple vista.
  2. *Catálogo Visual* con fotos/iconos y stock en tiempo real de la Bodega Principal (Bodega 1).
  3. *Carrito Rápido* con fecha/jornada de entrega y confirmación en 1 toque.
* **Modelo Catch Weight Dual (Piezas x Calibre $\rightarrow$ Kilo Real):**
  - El cliente puede solicitar: *"5 unidades de trucha de 450 a 500 gramos"*.
  - El vendedor selecciona la cantidad de piezas y el calibre deseado.
  - El sistema muestra un peso nominal aproximado para referencia, pero estipula claramente que **el producto se vende y se factura exclusivamente por KILOS REALES** pesados en báscula de cuarto frío.

### Decisión 2: Gobernanza de Crédito con Semáforo Preventivo
* **Resolución:** Si el pedido excede el cupo disponible del cliente o presenta mora, no se aplica un bloqueo rígido; se muestra un semáforo visual con badge rojo explicativo y se habilita la opción de guardar como solicitud `PAUSADO_POR_CREDITO` para que Cartera/Admin lo autorice, o cambiar la condición de pago a `CONTADO / CONTRA-ENTREGA` con 1 solo toque.

### Decisión 3: Alistamiento Asistido en Cuarto Frío (Bodega Principal WMS)
* **Resolución:** Ficha de alistamiento Catch Weight en pantalla táctil de bodega que muestra:
  - Piezas y calibre pactado (ej. 5 truchas, calibre 450-500g).
  - Lote perecedero bajo política FEFO.
  - Input numérico decimal auto-enfocado para digitar el peso real de la báscula de cuarto frío (ej. 2.45 kg).
  - Validación automática de cumplimiento de calibre ($2450 / 5 = 490\text{ g} \rightarrow$ Check verde dentro de 450-500g) y recálculo automático del total en COP.

### Decisión 4: Verificación, Empaque y Remisión WMS
* **Resolución:** Checklist rápido de 3 puntos (temperatura de conservación apta, empaque íntegro y precinto numerado de canastilla), emisión de la Remisión WMS con código QR y pase automático del pedido a estado `LISTO` en la columna de despacho.

### Decisión 5: Entrega, Cobro y Segregación de Devoluciones a Cuarentena
* **Resolución:** En la terminal móvil del Conductor Repartidor:
  - Registro de entrega con captura de firma digital táctil del cliente en pantalla.
  - En caso de rechazo o no conformidad parcial (ej. empaque averiado o temperatura no óptima), se descuenta el valor en tiempo real del cobro del conductor (efectivo o transferencia).
  - El producto devuelto se rotula y regresa a bodega ingresando automáticamente a `CUARENTENA_CALIDAD` en el Kardex.

---

**Siguiente Paso del Flujo:** Presentar al usuario la especificación (`spec.md`) y las decisiones de clarificación (`clarify.md`) para su aprobación formal antes de proceder con el Checklist de Calidad (`/speckit.checklist`).
