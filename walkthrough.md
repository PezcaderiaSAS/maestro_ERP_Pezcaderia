# Walkthrough: Centralización de Inventarios e Historial de Precios por Cliente (v2.0)

Este documento detalla la implementación final de las mejoras de control de stock y fidelización de precios por cliente en los módulos de Punto de Venta (POS) y Cotizaciones.

---

## 1. Centralización y Desglose de Stock por Bodega

Hemos migrado el estado de inventarios (`stock`) a un estado centralizado en `App.tsx` con persistencia automática en `localStorage` (`pezcaderia_stock`).
* **Visualización en Tiempo Real**: Tanto en el catálogo del POS como en el buscador del Cotizador (`PricingView.tsx`), los productos ahora muestran claramente sus existencias desglosadas por las tres bodegas principales:
  * **P (Bodega Principal)** (con color dinámico según disponibilidad y buffer de seguridad)
  * **S (Bodega Secundaria)**
  * **A (Bodega Averías)** (destacada en color rosa/rojo)
* **Alertas de Insuficiencia**: Si la cantidad agregada al carrito del POS o al detalle de la cotización supera el stock físico de la **Bodega Principal**, el sistema renderiza automáticamente una advertencia visual destacada en rojo: `⚠️ Insuficiente`.

---

## 2. Deducción de Stock Automatizada al Consolidar Ventas

* **Punto de Venta (POS)**: Al liquidar y facturar exitosamente una venta directa, el sistema descuenta de forma atómica la cantidad vendida de la existencias de la **Bodega Principal** en el estado global.
* **Cotizaciones (PricingView)**: Al transicionar el estado de una cotización aprobada a **Vendida (Sold)**, se ejecuta la misma deducción de stock atómica para todos los productos contenidos en el documento.

---

## 3. Historial de Precios y Fidelización de Clientes

Implementamos un registro inteligente de tarifas por cliente (`lastClientPrices`), persistido en `localStorage` con la clave `pezcaderia_last_client_prices`.

* **Registro Automático**: El sistema guarda la combinación de cliente + SKU + precio unitario cobrado cada vez que se factura una transacción en el POS o se marca una cotización como `Sold`.
* **Botón de Variación y Aplicación en Un Clic**:
  * Al vincular un cliente (por nombre o NIT), el sistema consulta su historial.
  * Si la tarifa actual difiere de la histórica, se muestra un botón amarillo de sugerencia: `💡 Último: $X.XXX (Aplicar)`.
  * Al pulsar el botón, se aplica el precio sugerido (generando un `precioOverride` en la línea de la transacción) y aparece un indicador verde: `✓ Tarifa histórica aplicada`.
  * Se permite restablecer el precio de lista original en cualquier momento.

---

## 4. Adaptabilidad y Corrección de Visualización del Catálogo

* **Solución de Colapso de Tarjetas**: Se corrigió el problema de colapso de las tarjetas del catálogo (donde las imágenes se reducían a 0px y las filas se apretaban) forzando `flex-shrink: 0` en el contenedor de imagen y estableciendo `grid-auto-rows: max-content` en la rejilla del POS.
* **Adaptabilidad de Categorías**: En pantallas móviles y tablets, las pestañas de categorías superiores ahora se envuelven (`flex-wrap: wrap`) y distribuyen proporcionalmente para evitar truncamientos de texto.
