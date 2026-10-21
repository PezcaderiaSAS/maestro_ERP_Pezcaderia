# Lista de Verificación de Calidad y Estándares: SPEC-025

**Código:** SPEC-025  
**Título:** Dispatcher HTTP Real SIIGO Nube API v2  
**Fase:** Spec Kit v3.0 — `/speckit.checklist`  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`)  

---

## 1. Estándares de Integración API Fiscal SIIGO Nube & DIAN
- [ ] **CHK-INT-01 (Autenticación Bearer):** `POST /auth` implementado con credenciales corporativas (`username` y `access_key`), extrayendo `access_token` y `expires_in`.
- [ ] **CHK-INT-02 (Caché de Token & Mutex):** Almacenamiento seguro del token en memoria con TTL de 24 horas y margen de refresco proactivo de 10 minutos. Prevención de concurrencia mediante mutex de promesa única.
- [ ] **CHK-INT-03 (Headers Oficiales):** Peticiones a `/v1/invoices` incluyen encabezados `Content-Type: application/json`, `Authorization: Bearer <token>` y `Partner-Id: LaPezcaderiaERP`.
- [ ] **CHK-INT-04 (Mapeo Completo DIAN):** Despacho estructurado de ítems con código, precio entero en COP (`Math.round`), porcentaje de IVA e identificación del cliente (fallback a consumidor final `222222222222` si no se especifica NIT).
- [ ] **CHK-INT-05 (Captura Fiscal):** Extracción de `stamp.cufe`, `stamp.qr`, `id` de factura y número fiscal consecutivo emitido por SIIGO.

---

## 2. Resiliencia, Idempotencia y Manejo de Fallos
- [ ] **CHK-RES-01 (Aislamiento de Error 400 Bad Request):** Clasificación inmediata de rechazos de datos como `ERROR_FATAL_DATOS` en la outbox sin detener la cola de otras facturas.
- [ ] **CHK-RES-02 (Auto-Refresco ante 401 Unauthorized):** Invalida el token en memoria de forma transparente y reintenta el despacho una única vez antes de marcar error.
- [ ] **CHK-RES-03 (Retroceso Exponencial con Jitter):** Errores transitorios (429 Rate Limit, 5xx Server Error, timeout o pérdida de red) programan reintento con backoff exponencial y jitter aleatorio.
- [ ] **CHK-RES-04 (Idempotencia Determinista):** Inclusión de `idempotencyKey` en los registros para garantizar que ninguna factura se duplique en SIIGO.
- [ ] **CHK-RES-05 (Modo Simulación / Sandbox Transparente):** Cuando `isSandbox === true` o no existan credenciales configuradas, la aplicación genera respuestas fiscales simuladas sin arrojar excepciones ni frenar la venta en caja.

---

## 3. Seguridad de Datos & Gobernanza (OWASP)
- [ ] **CHK-SEC-01 (Cero Fugas de Secretos):** La clave API `access_key` nunca se imprime en `console.log`, logs de auditoría ni en respuestas de error expuestas en la UI.
- [ ] **CHK-SEC-02 (Sanitización de Payloads):** Los logs de auditoría enmascaran campos sensibles antes de persistir o mostrar en pantalla.
- [ ] **CHK-SEC-03 (Regla de Cero Dependencias Nuevas - RULE-SDD-001):** Implementado exclusivamente sobre librerías ya aprobadas (`axios`, `zustand`, `zod`, `lucide-react`).

---

## 4. Principios Arquitectónicos SOLID & Límites de Capas
- [ ] **CHK-ARC-01 (Principio de Responsabilidad Única - SRP):** Archivos y componentes con menos de 400 líneas útiles.
- [ ] **CHK-ARC-02 (Límites Limpios):** Separación estricta entre la capa de presentación (modales de configuración), lógica de negocio (`SiigoAuthService`, `SiigoHttpDispatcher`) y transporte de red (`axios`).
- [ ] **CHK-ARC-03 (Inversión de Dependencias):** `SiigoHttpDispatcher` implementa el contrato tipado `OutboxTransmitterFn` de `BackgroundSyncWorker` permitiendo sustitución en tests y desacoplamiento total.

---

## 5. Accesibilidad & Ergonomía UI ("Regla del Niño de 12 Años")
- [ ] **CHK-UI-01 (Light Mode WCAG 2.2 AA+):** Contraste superior a 4.5:1 en textos estándar y 7:1 en datos numéricos y estados fiscales.
- [ ] **CHK-UI-02 (Dimensiones Táctiles):** Targets táctiles secundarios $\ge 48\text{ px}$ e interactivos primarios $\ge 56\text{ px}$.
- [ ] **CHK-UI-03 (Cero Imágenes):** 100% iconografía vectorial semántica con Lucide React.
- [ ] **CHK-UI-04 (Diagnóstico en 1 Toque):** Botón táctil gigante "Probar Conexión con SIIGO" con feedback inmediato (spinner táctil y badge de resultado verde/rojo).

---

## 6. Pruebas Automatizadas TDD & Quality Gate
- [ ] **CHK-TST-01 (Cobertura TDD $\ge 90\%$):** Suites de pruebas unitarias cubriendo autenticación, adquisición de token, mutex de concurrencia, despacho de factura, captura de CUFE, clasificación de errores 400/401/429/500 y modo simulación.
- [ ] **CHK-TST-02 (TypeScript Estricto):** `tsc --noEmit` en 0 errores.
- [ ] **CHK-TST-03 (Auditoría Master Architect):** `scripts/architecture/audit-solid-boundaries.cjs` aprobado sin violaciones críticas.
- [ ] **CHK-TST-04 (Bucle DevTools MCP en Vivo):** 0 errores en consola JS y renderizado responsive verificado a 375 px.
