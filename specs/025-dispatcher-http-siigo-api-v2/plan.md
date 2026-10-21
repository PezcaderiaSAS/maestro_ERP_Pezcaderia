# Plan de Implementación Técnica: SPEC-025

**Código:** SPEC-025  
**Título:** Dispatcher HTTP Real SIIGO Nube API v2  
**Fase:** Spec Kit v3.0 — `/speckit.plan`  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`)  

---

## 1. Arquitectura de Módulos y Límites de Capas

El diseño se estructura en 4 capas estrictas con responsabilidades atómicas y acoplamiento mínimo:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CAPA DE PRESENTACIÓN (UI)                       │
│  - SiigoConfigModal.tsx (Configuración credenciales & Test Ping)       │
│  - SiigoStatusBadge.tsx (Badge semáforo táctil ≥ 48px en Resoluciones) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ consume
┌───────────────────────────────────▼────────────────────────────────────┐
│                      CAPA DE ESTADO REACTIVO (STORE)                   │
│  - useSiigoConfigStore.ts (Zustand + persistencia local segura)        │
│  - useResolucionStore.ts (Actualización fiscal tras despacho)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ consume
┌───────────────────────────────────▼────────────────────────────────────┐
│                    CAPA DE LÓGICA DE NEGOCIO & DESPACHO                │
│  - siigoAuthService.ts (Gestor de token Bearer, TTL y Mutex)           │
│  - siigoHttpDispatcher.ts (Transmisor Outbox, parseo y errores)        │
│  - backgroundSyncWorker.ts (Consumo FIFO y orquestación)               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ consume
┌───────────────────────────────────▼────────────────────────────────────┐
│              CAPA DE INFRAESTRUCTURA DE RED & ALMACENAMIENTO           │
│  - Axios Client (POST /auth, POST /v1/invoices, timeout 10s)           │
│  - OutboxSyncService (IndexedDB caja_outbox_v2)                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Esquemas de Datos y Contratos de Tipos

### 2.1 Esquema de Validación Zod (`siigoConfig.schema.ts`)
```typescript
export const SiigoCredentialsConfigSchema = z.object({
  username: z.string().email('Debe ser un correo electrónico corporativo válido'),
  accessKey: z.string().min(10, 'La access_key de SIIGO debe tener al menos 10 caracteres'),
  isSandbox: z.boolean().default(false),
  partnerId: z.string().default('LaPezcaderiaERP'),
  urlBase: z.string().url().default('https://api.siigo.com'),
});
```

### 2.2 Contratos TypeScript (`src/types/siigo.types.ts`)
- `SiigoAuthResponse`: `{ access_token: string; token_type: string; expires_in: number }`
- `SiigoInvoiceResponse`: `{ id: string; name: string; stamp?: { cufe: string; qr: string } }`
- `SiigoErrorResponse`: `{ status: number; message: string; errors?: Array<{ code: string; message: string; params?: any }> }`
- `SiigoTestPingResult`: `{ success: boolean; latencyMs: number; isSandbox: boolean; error?: string }`

---

## 3. Desglose de Servicios y Algoritmos Clave

### 3.1 `SiigoAuthService` (Gestor de Autenticación con Mutex de Concurrencia)
- **Caché en Memoria:** Variable interna `cachedToken: string | null` y `tokenExpiresAt: number`.
- **Margen Proactivo:** Si `tokenExpiresAt - Date.now() < 600_000` (10 minutos), se considera expirado y se renueva.
- **Mutex de Petición en Vuelo:**
  ```typescript
  private static authPromise: Promise<string> | null = null;
  static async getValidToken(): Promise<string> {
    if (this.isTokenValid()) return this.cachedToken!;
    if (this.authPromise) return this.authPromise; // Reutiliza petición concurrente
    this.authPromise = this.executeAuth();
    try {
      return await this.authPromise;
    } finally {
      this.authPromise = null;
    }
  }
  ```
- **Modo Simulación:** Si `isSandbox === true` o no hay credenciales, retorna un JWT sintético sin realizar llamadas HTTP externas.

### 3.2 `SiigoHttpDispatcher` (Transmisor Oficial de Outbox)
- Implementa `OutboxTransmitterFn = (item: OfflineOutboxItem) => Promise<TransmitterResult>`.
- **Estrategia ante Respuestas:**
  - `Status 201 / 200`: Mapea `cufe = data.stamp?.cufe`, `qrUrl = data.stamp?.qr`, `siigoInvoiceId = data.id`, `numeroFiscal = data.name`.
  - `Status 400 Bad Request`: Captura el mensaje detallado de la DIAN y arroja `SiigoFatalDataError` (el worker marca `ERROR_FATAL_DATOS` en la outbox sin detener la cola).
  - `Status 401 Unauthorized`: Invoca `SiigoAuthService.invalidateToken()`, solicita un nuevo token y reintenta el despacho una única vez.
  - `Status 429 / 5xx / Network Error`: Arroja `SiigoTransientError` (el worker reprograma con retroceso exponencial).

### 3.3 Conexión con `BackgroundSyncWorker`
- Se registra `SiigoHttpDispatcher.transmitirFactura` en el worker para sustituir la simulación temporal por el despachador oficial.

---

## 4. Componentes Visuales y Ergonomía Táctil ("Regla del Niño de 12 Años")

### 4.1 `SiigoConfigModal.tsx`
- Formulario de credenciales con inputs de altura táctil $\ge 48\text{ px}$.
- Toggle switch grande ($\ge 48\text{ px}$) para alternar entre "Modo Producción" y "Modo Simulación / Sandbox".
- Botón táctil primario $\ge 56\text{ px}$ `btn-test-siigo-connection`: ejecuta `probarConexion()` con spinner y feedback visual accesible.
- Cero imágenes externas (100% Lucide React: `KeyRound`, `Zap`, `CheckCircle2`, `AlertTriangle`).

### 4.2 `SiigoStatusBadge.tsx`
- Badge semáforo táctil $\ge 48\text{ px}$ en `ResolucionesConfigView` mostrando:
  - 🟢 **Verde Esmeralda:** Conexión activa con SIIGO Nube (token vigente).
  - 🟡 **Ámbar:** Modo Sandbox / Simulación activo (sin timbrado real).
  - 🔴 **Rojo Carmín:** Error de autenticación o credenciales pendientes.
- Al hacer clic abre directamente el modal de configuración de SIIGO.

---

## 5. Estrategia de Pruebas Unitarias TDD en Vitest

1. **`siigoConfig.schema.test.ts` (Validaciones Zod):**
   - Valida correo corporativo válido, longitud mínima de `access_key` y defaults de `isSandbox`.
2. **`siigoAuthService.test.ts` (Ciclo de Vida de Token):**
   - Prueba obtención de token exitoso contra mock HTTP de Axios.
   - Prueba reutilización de token dentro de la ventana de vigencia.
   - Prueba mutex ante múltiples llamadas concurrentes simultáneas (1 sola llamada a `/auth`).
   - Prueba modo simulación cuando `isSandbox === true`.
3. **`siigoHttpDispatcher.test.ts` (Despacho HTTP y Clasificación de Errores):**
   - Prueba despacho exitoso con timbrado 201 y extracción de `cufe` y `qr`.
   - Prueba manejo de 400 Bad Request arrojando error fatal de datos.
   - Prueba auto-renovación ante 401 y reintento exitoso.
   - Prueba fallos 429 y 500 arrojando error transitorio para backoff.
4. **`siigoComponents.test.tsx` (Pruebas de Componentes UI):**
   - Renderizado en Modo Claro WCAG AA+, targets táctiles $\ge 48\text{ px}$, botón $\ge 56\text{ px}$ y cero etiquetas `<img>`.

---

*Fin del plan técnico de implementación SPEC-025.*
