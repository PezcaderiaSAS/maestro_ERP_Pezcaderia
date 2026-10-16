# Checklist de Calidad y Estándares de Industria (SPEC-020)

**Código:** SPEC-020  
**Título:** Sistema Maestro de Resoluciones de Ventas, Consecutivo Dual y Facturación Electrónica DIAN para SIIGO Nube API V2  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.checklist`  

---

## 1. Estándares Tributarios DIAN Colombia & SIIGO Nube API v2
- [ ] **CHK-01 [DIAN / Resolución]:** Toda resolución fiscal debe almacenar número de resolución de 14 dígitos, prefijo (1-4 letras), fecha de inicio y fin de vigencia (máx. 24 meses según DIAN), rango inicial y final.
- [ ] **CHK-02 [Alerta Preventiva de Rango]:** Emitir alerta visual preventiva cuando el rango disponible sea inferior a 100 números o falten menos de 30 días para su vencimiento.
- [ ] **CHK-03 [SIIGO Document Mapping]:** Vinculación formal con el `document.id` numérico de Siigo Nube y mapeo de vendedores (`seller_id`).
- [ ] **CHK-04 [Cliente Fiscal Completo]:** Validar que toda factura electrónica contenga NIT o cédula con dígito de verificación (si aplica), razón social o nombres, dirección física, código DANE de municipio (ej. `11001` para Bogotá), teléfono y correo electrónico obligatorio para recepción de la DIAN.
- [ ] **CHK-05 [Mapeo de Impuestos]:** Soporte de líneas con IVA 19%, IVA 5% o productos excluidos (típico en pescadería/mariscos frescos) asignando el ID de impuesto correspondiente en Siigo.
- [ ] **CHK-06 [Mapeo de Formas de Pago]:** Mapeo de métodos de pago POS (Efectivo, Transferencia Nequi/Daviplata/Bancolombia, Datáfono, Crédito B2B) hacia los IDs de catálogo de formas de pago en Siigo Nube con fecha de vencimiento (`due_date`).

---

## 2. Integridad de Datos y Concurrencia Transaccional
- [ ] **CHK-07 [Consecutivo Dual Inmutable]:** 100% de las ventas del ERP deben recibir un `consecutivo_interno` inmutable sin excepción.
- [ ] **CHK-08 [Incremento Libre de Colisiones]:** El incremento del consecutivo fiscal DIAN debe ejecutarse con protección de concurrencia (bloqueo pesimista o función atómica RPC) para evitar saltos o números duplicados ante ventas simultáneas en múltiples terminales.
- [ ] **CHK-09 [Empate con Consecutivo Actual de SIIGO]:** Permitir definir el último consecutivo emitido en Siigo para que el primer documento generado en el ERP continúe la secuencia correlativa exacta sin chocar.
- [ ] **CHK-10 [Post-Facturación Limpia]:** La conversión de un ticket interno a factura electrónica oficial no debe duplicar el descuento de inventario en bodega ni alterar el arqueo de caja del turno activo.

---

## 3. Resiliencia y Patrón Outbox
- [ ] **CHK-11 [Checkout Desacoplado < 500ms]:** La terminal de punto de venta y despacho no debe quedar congelada esperando la respuesta de Siigo/DIAN; la venta se confirma localmente en $<500\text{ ms}$ y el payload se encola.
- [ ] **CHK-12 [Idempotencia con UUID]:** Cada payload encolado debe contar con una clave de idempotencia única para evitar emisiones duplicadas en Siigo en caso de reintentos por caída de red.
- [ ] **CHK-13 [Exportación Contable de Respaldo]:** Generador de planillas en formato Excel / CSV estructurado según el formato de importación de comprobantes de Siigo Nube para contingencias prolongadas.

---

## 4. Ergonomía Táctil y Accesibilidad (WCAG 2.2 AA+ / Regla del Niño de 12 Años)
- [ ] **CHK-14 [Switch de Factura Electrónica]:** Switch o botón de activación de FEV con tamaño táctil mínimo de $48\text{ px}$ en la pantalla de cobro.
- [ ] **CHK-15 [Botones de Acción y Confirmación]:** Botón principal de confirmar venta o conversión con altura mínima de $\ge 56\text{ px}$, tipografía negrita y feedback `active:scale-95`.
- [ ] **CHK-16 [Cero Imágenes Externas]:** 100% iconografía vectorial con Lucide React (`FileText`, `Send`, `CheckCircle2`, `AlertTriangle`, `Download`, `RefreshCw`) a costo $0.
- [ ] **CHK-17 [Light Mode WCAG AA+]:** Contraste superior a 4.5:1 en textos estándar y 7:1 en datos numéricos, fondo limpio sin brillos molestos en terminales de caja.
