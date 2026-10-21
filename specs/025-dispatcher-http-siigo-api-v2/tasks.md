# Matriz de Tareas de Implementación: SPEC-025 (Actualizada Post-Análisis)

**Código:** SPEC-025  
**Título:** Dispatcher HTTP Real SIIGO Nube API v2  
**Fase:** Spec Kit v3.0 — `/speckit.tasks` (Post-Análisis de Consistencia)  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). Ejecución Quirúrgica TDD.  
**Estado:** CULMINADA Y CERTIFICADA AL 100% (Quality Gates Verdes, 46/46 Tests, DevTools Validado)  

---

## Matriz de Tareas Secuenciales (WIP = 1)

### `TASK-025-01`: Esquemas Zod y Contratos de Validación de Integración SIIGO [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Definir los esquemas de validación y tipos TypeScript para la configuración de credenciales corporativas, respuestas de autenticación `/auth`, timbrado de facturas `/v1/invoices` y diagnóstico.
- **Entregables:**
  - `packages/validation-schemas/src/siigoConfig.schema.ts`: Esquema `SiigoCredentialsConfigSchema` con validación de email, longitud mínima de clave, URL base y flag de sandbox; esquema `SiigoTestPingSchema` y funciones `validarCredencialesSiigo` y `enmascararAccessKey`.
  - Exportación en `packages/validation-schemas/src/index.ts`.
  - `src/types/siigo.types.ts`: Interfaces `SiigoAuthResponse`, `SiigoInvoiceResponse`, `SiigoErrorResponse`, `SiigoTestPingResult`, `SiigoDispatchResult`, `SiigoStampInfo`, `SiigoConfigState`.
  - `src/tests/siigoConfig.schema.test.ts`: Suite de pruebas unitarias TDD completa con **11/11 tests verdes (100% pasando)**.
- **Quality Gate:** Tests unitarios pasando al 100%, `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas (385 archivos analizados en 269 ms).

---

### `TASK-025-02`: Servicio de Autenticación SIIGO con Mutex de Concurrencia y Caché de Token [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Implementar `SiigoAuthService` para adquirir el token Bearer mediante `POST /auth`, cachearlo con TTL de 24 horas y resolver llamadas concurrentes mediante un mutex de promesa única.
- **Entregables:**
  - `src/services/siigoAuthService.ts`: Métodos `getValidToken()`, `invalidateToken()`, `isTokenValid()`, `isSimulatedMode()`, `probarConexion()`, margen proactivo de 10 min, mutex `authPromise` de deduplicación de llamadas simultáneas y soporte de token virtual para modo simulación/sandbox.
  - `src/tests/siigoAuthService.test.ts`: Suite TDD con mocks de Axios cubriendo autenticación exitosa, reutilización de token en caché, deduplicación de llamadas simultáneas y modo sandbox con **9/9 tests verdes (100% pasando)**.
- **Quality Gate:** Tests pasando al 100%, `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas (387 archivos analizados en 377 ms).

---

### `TASK-025-03`: Dispatcher HTTP Transmisor de Facturas y Clasificación de Errores DIAN [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Desarrollar `SiigoHttpDispatcher` conforme al contrato `OutboxTransmitterFn` para enviar facturas a `POST /v1/invoices`, extraer CUFE/QR y clasificar respuestas 201, 400 (`ERROR_FATAL_DATOS`), 401 (reintento tras renovar token) y 429/5xx (`ERROR_REINTENTO`).
- **Entregables:**
  - `src/services/siigoHttpDispatcher.ts`: Clase `SiigoHttpDispatcher` con método `transmitirFactura(item: OfflineOutboxItem)`, clase de error estructurada `SiigoDispatchError`, auto-renovación ante 401, timeout de 10.000 ms, generador de simulación fiscal `buildSimulatedFiscalResult` y método `setConfigGetter`.
  - `src/tests/siigoHttpDispatcher.test.ts`: Suite de pruebas unitarias TDD con **7/7 tests verdes (100% pasando)** cubriendo timbrado 201, captura de CUFE/QR, manejo de 400 Bad Request, auto-renovación ante 401, 429 Rate Limit y 503 Service Unavailable.
- **Quality Gate:** Cero librerías externas añadidas (RULE-SDD-001), 27/27 tests verdes acumulados en SPEC-025, `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas (389 archivos analizados en 476 ms).

---

### `TASK-025-04`: Store Zustand Reactivo y Conexión con `BackgroundSyncWorker` [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Implementar el store reactivo `useSiigoConfigStore` para persistir los parámetros de conexión y conectar formalmente `SiigoHttpDispatcher` en `BackgroundSyncWorker.setTransmitter(...)`.
- **Entregables:**
  - `src/store/useSiigoConfigStore.ts`: Store Zustand reactivo con persistencia en `localStorage`, métodos `saveConfig`, `clearConfig`, `ejecutarPing`, `setEstadoConexion`, `resetForTesting` y enlace dinámico automático con `SiigoHttpDispatcher.setConfigGetter`.
  - Integración en `src/services/backgroundSyncWorker.ts`: Conexión de `SiigoHttpDispatcher.transmitirFactura` en `defaultTransmit` y en el despacho FIFO con actualización atómica de `useResolucionStore`.
  - `src/tests/siigoStoreAndWorker.test.ts`: Suite de pruebas unitarias TDD con **7/7 tests verdes (100% pasando)** cubriendo inicialización, guardado con ping en vivo, modo sandbox, error de autenticación 401, despacho en segundo plano y aislamiento de error 400 Bad Request como `ERROR_FATAL_DATOS`.
- **Quality Gate:** Tests pasando al 100% (34/34 tests verdes acumulados en SPEC-025), `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas (391 archivos analizados en 511 ms).

---

### `TASK-025-05`: Componentes Táctiles de Configuración y Diagnóstico ("Regla del Niño de 12 Años") [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Construir la interfaz accesible para configuración de credenciales, switch de Sandbox y visualización semafórica del estado de conexión con SIIGO en Resoluciones de Ventas.
- **Entregables:**
  - `src/views/settings/components/SiigoConfigModal.tsx`: Modal táctil con formulario de credenciales, inputs $\ge 48\text{ px}$, toggle de Sandbox y botón primario $\ge 56\text{ px}$ "PROBAR Y GUARDAR CONEXIÓN" con feedback inmediato y diagnóstico en vivo.
  - `src/views/settings/components/SiigoStatusBadge.tsx`: Badge semáforo táctil $\ge 48\text{ px}$ en `ResolucionesConfigView` mostrando el estado en vivo (`ONLINE`, `SANDBOX`, `ERROR`, `NO_CONFIGURADO`), cero imágenes externas.
  - Enlace e integración en `src/views/settings/ResolucionesConfigView.tsx` en la barra superior.
  - `src/tests/siigoComponents.test.tsx`: Suite de renderizado UI (Light Mode WCAG AA+, targets $\ge 48\text{ px}$, botón $\ge 56\text{ px}$, cero etiquetas `<img>`) con **9/9 tests verdes (100% pasando)**.
- **Quality Gate:** Cero imágenes externas (100% Lucide React), archivos $< 400$ líneas (SRP), 43/43 tests verdes acumulados en SPEC-025, `tsc --noEmit` en 0 errores, Master Architect SOLID aprobado sin críticas (394 archivos analizados en 409 ms).

---

### `TASK-025-06`: Suite Integral E2E, Auditoría Master Architect y Quality Gate Final en Vivo [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Ejecutar la batería global de pruebas, auditar límites arquitectónicos y verificar la aplicación en vivo con Chrome DevTools.
- **Entregables:**
  - Batería Vitest de SPEC-025: 6 suites y **46/46 tests verdes (100% pasando)** sin regresiones (`siigoHttpDispatcher`, `siigoStoreAndWorker`, `siigoComponents`, `siigoConfig.schema`, `siigoAuthService`, `siigoPayloadAndExport`).
  - Verificación `tsc --noEmit`: 0 errores de compilación TypeScript.
  - Auditoría Master Architect SOLID (`audit-solid-boundaries.cjs`): 0 violaciones críticas (`passed = true`, 394 archivos analizados en 409 ms).
  - Auditoría de 5 Diagramas Mermaid (`audit-diagrams-compliance.cjs`): 100% de cumplimiento en los 5 diagramas canónicos.
  - Bucle Chrome DevTools MCP en vivo (`http://localhost:3000/`): 0 errores en consola JS y renderizado responsive móvil certificado a 375 px.
  - Sincronización de memoria, tareas y registro de cambios en el proyecto.
- **Quality Gate:** **ESPECIFICACIÓN SPEC-025 CULMINADA AL 100% Y CERTIFICADA CON QUALITY GATE VERDE.**

---

*Fin de la matriz de tareas para SPEC-025.*
