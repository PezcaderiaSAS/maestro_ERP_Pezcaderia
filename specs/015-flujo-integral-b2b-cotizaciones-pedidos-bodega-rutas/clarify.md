# Control de Calidad 1: Clarificación y Mitigación de Riesgos (/speckit.clarify)

**Código:** SPEC-015  
**Título:** Clarificación de Decisiones Técnicas y de Negocio — Flujo Integral B2B End-to-End  
**Estado:** APPROVED (Decisiones Validadas por el Usuario)  
**Fecha:** 2026-10-15  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.clarify` (Completado)  

---

## 1. Decisiones Técnicas y de Negocio Validadas

1. **Recálculo Financiero de Peso Real vs Nominal (Catch Weight):**
   - **Decisión:** Ajustar automáticamente el subtotal al peso real exacto ($kg\text{ real} \times \text{precio pactado}$) dentro de una tolerancia de $\pm 5\%$, alertando al operario si excede el rango.
   - **Efecto:** Facturación y cobro exactos al gramo, eliminando mermas no facturadas y reclamos del cliente.

2. **Consolidación de Pedidos en Manifiestos de Rutas:**
   - **Decisión:** Agrupación por zonas geográficas en la bandeja de despacho (`DeliveryRoutesTab`) con check-in obligatorio de temperatura del furgón refrigerado y odómetro de salida.
   - **Efecto:** Garantiza cadena de frío ($-18^\circ\text{C}$ / $0-4^\circ\text{C}$) y auditoría logística de kilometraje.

3. **Manejo de Devoluciones y Rechazos Parciales:**
   - **Decisión:** Permitir entrega parcial (`ENTREGADO_PARCIAL`), descontar el valor en tiempo real del cobro del conductor (efectivo o transferencia) y registrar el producto devuelto con destino físico a `CUARENTENA_CALIDAD` en bodega para análisis de inocuidad.
   - **Efecto:** Operación continua sin frenar entregas de ítems conformes y trazabilidad sanitaria inmediata.

Para garantizar que el flujo de comercialización, alistamiento y distribución B2B opere con fricción cero y sin inconsistencias entre ventas, almacén y tesorería, se han identificado las siguientes áreas críticas:

### Riesgo 1: Descuadre entre Peso Cotizado y Peso Real Facturado (Catch Weight)
* **Contexto:** En el despiece y manipulación de pescado fresco/congelado (ej. Róbalo, Salmón, Corvina entera o filete), es imposible garantizar que una pieza pese exactamente el valor nominal pedido (ej. 10 kg).
* **Impacto:** Si la factura se emite por el peso nominal y se entrega menos pescado, el cliente reclama; si se entrega más pescado sin cobrar la diferencia, la pescadería asume una merma económica no registrada.
* **Propuesta Arquitectónica:** Liquidar el pedido con base en el **peso real registrado en báscula de cuarto frío**, ajustando automáticamente el valor total a cobrar ($COP = \text{peso\_real\_kg} \times \text{precio\_kg}$) dentro de un umbral de tolerancia pactado de $\pm 5\%$. Si la variación excede el $\pm 5\%$, el sistema emite una alerta preventiva al operario.

### Riesgo 2: Asignación de Pedidos a Furgón Refrigerado (Ruteo Dinámico vs Manual)
* **Contexto:** Los pedidos en estado `LISTO` pueden requerir consolidación según la capacidad volumétrica o de carga del camión (Hino, NHR, Furgón Refrigerado) y la zona de entrega en Bucaramanga y el área metropolitana.
* **Propuesta Arquitectónica:** Utilizar la bandeja centralizada de `DeliveryRoutesTab` donde el despachador agrupa pedidos `LISTO` por sector/zona geográfica (`Cabecera`, `Centro`, `Cañaveral`, `Girón`, `Piedecuesta`), valida que la temperatura del furgón sea apta ($-18^\circ\text{C}$ / $0-4^\circ\text{C}$) y asigna formalmente al conductor repartidor con su odómetro inicial.

### Riesgo 3: Rechazos Parciales y Devoluciones en el Sitio de Entrega
* **Contexto:** Al momento de la entrega, un restaurante puede aceptar el pescado entero pero rechazar una caja de camarón por pérdida de vacío o daño en el empaque durante el transporte.
* **Impacto:** Obligar al conductor a rechazar el pedido completo paraliza la operación y genera fricción comercial.
* **Propuesta Arquitectónica:** Permitir la entrega parcial (`ENTREGADO_PARCIAL`), descontando en tiempo real el monto del ítem devuelto del total a cobrar (tanto en efectivo como en transferencia), registrando la causal de rechazo (`CADENA_FRIO`, `EMPAQUE_AVERIADO`, `CALIBRE_INCORRECTO`) y asignando el producto devuelto a `CUARENTENA_CALIDAD` en bodega para auditoría de calidad.

### Riesgo 4: Trazabilidad Inmutable de los 3 Actores (Anti-Repudio)
* **Contexto:** Conflictos operativos sobre quién autorizó un precio con descuento, quién pesó el lote con diferencia de kilos o quién recibió el pago en efectivo en la ruta.
* **Propuesta Arquitectónica:** Estampar `vendedorId` en la creación del pedido, `operarioAlistadorId` en la confirmación del pesaje/remisión y `conductorRepartidorId` en el check-in de ruta y comprobante de entrega con firma táctil en pantalla.

---

## 2. Puntos de Decisión Sometidos al Usuario (/grill-me)

1. **Recálculo de Peso Real:** ¿Aprobar el recálculo automático del total a pagar con base en el peso real del pescado pesado en cuarto frío con tolerancia de $\pm 5\%$?
2. **Consolidación en Manifiesto:** ¿Aprobar la agrupación por zonas en el módulo de despacho con check-in de temperatura del furgón?
3. **Devoluciones Parciales en Sitio:** ¿Aprobar la liquidación con descuento inmediato en el cobro del conductor y segregación a cuarentena?
