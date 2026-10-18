# Checklist de Calidad y Estándares de Industria (SPEC-021)

**Código:** SPEC-021  
**Título:** Sincronización Resiliente Offline-First, Heartbeat de Conectividad y Cola Outbox Avanzada para POS y Facturación SIIGO Nube API v2  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.checklist`  

---

## 1. Estándares Offline-First & Resiliencia en Punto de Venta
- [ ] **CHK-01 [Garantía Cero Pérdida de Datos]:** Las transacciones registradas en estado offline deben persistirse en IndexedDB (`MaestroPescaderiaOfflineDB`, almacén `caja_outbox`) con durabilidad transaccional antes de dar feedback de éxito en UI.
- [ ] **CHK-02 [Emisión Fricción Cero en Mostrador]:** La finalización del cobro y emisión de la tirilla física interna (`VTA-xxxx`) debe completarse en menos de 500ms sin depender de promesas remotas o resolución DNS.
- [ ] **CHK-03 [Idempotencia Estricta]:** Toda transacción encolada en Outbox debe poseer una clave de idempotencia inmutable `idempotencyKey = md5(empresaId + ventaId + consecutivoInterno)` para evitar que reintentos generen facturas duplicadas en SIIGO o en Supabase.
- [ ] **CHK-04 [Aislamiento de Errores Fatales]:** Si un documento encolado tiene errores sintácticos o de validación tributaria (HTTP 400 Bad Request por NIT inexistente), debe marcarse como `ERROR_FATAL_DATOS` sin detener ni congelar el procesamiento del resto de las transacciones válidas de la cola.

---

## 2. Detección Dual de Conectividad y Heartbeat
- [ ] **CHK-05 [Detección Reactiva Nativa]:** Suscripción a eventos `window.addEventListener('online')` y `'offline'` para respuesta inmediata ante reconexión o corte de cable/red.
- [ ] **CHK-06 [Heartbeat Activo cada 15s]:** Verificación periódica activa con ping HTTP liviano (timeout 3000ms) para detectar falsos positivos ("captive portals", WiFi conectado sin internet real o fibra intermitente).
- [ ] **CHK-07 [Filtro de Ruido / Debounce]:** Aplicar un debounce de 2 segundos en transiciones de red para evitar ráfagas de sincronizaciones ante conexiones intermitentes.

---

## 3. Worker de Sincronización & Exponential Backoff
- [ ] **CHK-08 [Algoritmo de Retroceso Exponencial]:** Reintentos automáticos programados con tiempos de espera progresivos (`1s, 5s, 15s, 30s`) y un tope de 5 intentos por documento.
- [ ] **CHK-09 [Procesamiento Secuencial FIFO]:** Procesar las facturas electrónicas en estricto orden cronológico para respetar el correlativo fiscal de la resolución DIAN en SIIGO Nube.
- [ ] **CHK-10 [Actualización Atómica Post-Timbrado]:** Al recibir la respuesta HTTP 201 de SIIGO, actualizar de inmediato el registro local con el CUFE, QR y consecutivo fiscal oficial sin alterar inventarios ni saldos de caja.

---

## 4. Ergonomía Táctil y Accesibilidad (WCAG 2.2 AA+ / Regla del Niño de 12 Años)
- [ ] **CHK-11 [Badge Táctil en Topbar >= 48px]:** Badge interactivo con área táctil mínima de $48\text{ px}$, mostrando en tiempo real el estado (`ONLINE` en esmeralda, `OFFLINE` en ámbar con número de ítems en cola).
- [ ] **CHK-12 [Botón 'Forzar Sincronización' >= 48px]:** Botón manual de sincronización asistida en el modal de cola con altura mínima de $48\text{ px}$ y spinner accesible de carga.
- [ ] **CHK-13 [Cero Imágenes Externas]:** 100% iconografía vectorial semántica con Lucide React (`Wifi`, `WifiOff`, `RefreshCw`, `CheckCircle2`, `AlertTriangle`, `Database`).
- [ ] **CHK-14 [Feedback Silencioso sin Bloqueo]:** Al sincronizar exitosamente en background, emitir únicamente un toast visual no invasivo en la esquina superior sin interrumpir la operación de caja en curso.
