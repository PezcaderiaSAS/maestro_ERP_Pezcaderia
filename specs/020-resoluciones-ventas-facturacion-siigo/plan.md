# Plan Técnico de Implementación (SPEC-020)

**Código:** SPEC-020  
**Título:** Sistema Maestro de Resoluciones de Ventas, Consecutivo Dual y Facturación Electrónica DIAN para SIIGO Nube API V2  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.plan`  

---

## 1. Arquitectura de Datos y Tipos TypeScript

### 1.1 Contrato de Tipos: `src/types/resoluciones.types.ts`
```typescript
export type TipoResolucion = 'CONTROL_INTERNO' | 'FACTURA_ELECTRONICA_DIAN' | 'POS_NO_ELECTRONICO';

export type EstadoSincronizacionSiigo = 'PENDIENTE' | 'EN_PROCESO' | 'SINCRONIZADO' | 'ERROR_REINTENTO' | 'NO_APLICA';

export interface ResolucionVenta {
  id: string;
  tenantId?: string;
  nombre: string;
  tipo: TipoResolucion;
  prefijo: string;
  numeroResolucion?: string;
  fechaExpedicion?: string;
  fechaVencimiento?: string;
  rangoDesde: number;
  rangoHasta: number;
  consecutivoActual: number; // Empate con el último emitido en SIIGO
  siigoDocumentId?: number;  // ID numérico del comprobante en Siigo Nube API
  claveTecnica?: string;
  esPredeterminada: boolean;
  activa: boolean;
  alertaUmbralConsecutivos: number; // Por defecto 100
  alertaUmbralDias: number;         // Por defecto 30
}

export interface FacturaElectronicaRegistro {
  id: string;
  ventaId: string;
  resolucionId: string;
  prefijo: string;
  numeroConsecutivo: number;
  consecutivoCompleto: string; // Ej: "FEVP-1541"
  fechaEmision: string;
  clienteNit: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteDireccion?: string;
  clienteCiudadDane?: string;
  siigoInvoiceId?: string;
  cufe?: string;
  qrUrl?: string;
  estadoSiigo: EstadoSincronizacionSiigo;
  ultimoError?: string;
  fechaSincronizacion?: string;
}

export interface SiigoQueueItem {
  id: string;
  facturaElectronicaId: string;
  ventaId: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'FALLIDO';
  intentos: number;
  maxIntentos: number;
  proximoIntento: string;
  payloadSiigo: any; // Estructura JSON Siigo API v2
  respuestaSiigo?: any;
  fechaCreacion: string;
}
```

---

## 2. Capa de Servicios y Lógica de Negocio

### 2.1 `src/services/resolucionService.ts`
- **`getResolucionPredeterminada(tipo)`**: Obtiene la resolución activa predeterminada.
- **`consumirSiguienteConsecutivo(resolucionId)`**: Función transaccional atómica que valida el rango máximo, incrementa en +1 el `consecutivoActual` y retorna el número generado con su prefijo.
- **`verificarAlertasResolucion(resolucion)`**: Evalúa si faltan $<100$ números o $<30$ días de vigencia para alertar al usuario.
- **`actualizarUltimoConsecutivoSiigo(resolucionId, nuevoNumero)`**: Permite al administrador sincronizar el punto de partida con el número que ya lleva emitido SIIGO Nube.

### 2.2 `src/services/siigoPayloadMapper.ts`
- Transforma la venta del ERP al esquema estricto de **SIIGO Nube API v2 (`POST /v2/invoices`)**:
  - `document: { id: resolucion.siigoDocumentId }`
  - `date: "YYYY-MM-DD"`
  - `customer: { identification, branch_office: 0 }`
  - `items: [{ code, description, quantity, price, taxes: [{ id, percentage }] }]`
  - `payments: [{ id, value, due_date }]`
  - `send_dian: true`

### 2.3 `src/services/siigoExportService.ts`
- Genera archivos en formato Excel (`.xlsx` o `.csv` delimitado por comas) con las columnas requeridas por el importador contable de Siigo Nube para contingencias operativas o cargas masivas.

### 2.4 `src/store/useResolucionStore.ts`
- Store reactivo (Zustand) con persistencia en `localStorage`/IndexedDB para la gestión de resoluciones y la cola de facturación electrónica.

---

## 3. Capa de Presentación y Ergonomía Táctil (UI/UX)

1. **Módulo de Configuración de Resoluciones:**
   - [`src/views/settings/ResolucionesConfigView.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/settings/ResolucionesConfigView.tsx)
   - Permite listar, crear y editar resoluciones. Visualización de barra de consumo del rango con semáforo (Verde $>20\%$, Ámbar $<10\%$, Rojo $<2\%$).
2. **Switch de Facturación Electrónica en Checkout POS:**
   - [`src/views/pos/components/PosElectronicInvoiceToggle.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/PosElectronicInvoiceToggle.tsx)
   - Botón táctil ergonómico ($\ge 48\text{ px}$) con feedback visual claro (Verde Esmeralda activo / Pizarra inactivo) e integración en [`PaymentPanel.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/PaymentPanel.tsx).
3. **Modal de Post-Facturación Electrónica:**
   - [`src/views/pos/components/QuickConvertToElectronicInvoiceModal.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/QuickConvertToElectronicInvoiceModal.tsx)
   - Accesible desde el historial de ventas o arqueo: 1 toque para emitir factura electrónica a una venta previa completando datos tributarios del cliente sin duplicar stock ni dinero.
4. **Monitor de Sincronización y Cola Outbox SIIGO:**
   - [`src/views/pos/components/SiigoQueueMonitorModal.tsx`](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/pos/components/SiigoQueueMonitorModal.tsx)
   - Muestra facturas pendientes, sincronizadas y con error, con botón de reintento inmediato y botón de exportación CSV para el contador.

---

## 4. Plan de Pruebas Unitarias TDD (Vitest)
1. **`src/tests/resolucionesConsecutivoDual.test.ts`**:
   - Verificación de asignación obligatoria de consecutivo interno.
   - Asignación atómica de consecutivo fiscal DIAN empatado con Siigo.
   - Prevención de desbordamiento de rango y alertas de agotamiento.
2. **`src/tests/posElectronicInvoicingFlow.test.tsx`**:
   - Evaluación de predeterminación en triple nivel (sucursal, cliente, checkout switch).
   - Post-facturación sin duplicación de inventario ni caja.
3. **`src/tests/siigoPayloadAndExport.test.ts`**:
   - Validación del schema JSON estricto para SIIGO API v2 (`send_dian: true`).
   - Exportación de archivo CSV para el importador de Siigo.
