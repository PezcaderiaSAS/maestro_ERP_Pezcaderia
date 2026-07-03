// src/types/pos.types.ts

export interface LineaVenta {
  productoId: string;
  sku: string;
  nombre: string;
  cantidad: number;         // En kg para productos a granel, unidades para el resto
  unidad: 'KG' | 'UNIDAD';
  precioLista: number;
  descuentoPct: number;     // Descuento por línea en %
  precioFinal: number;      // precioLista * (1 - descuentoPct/100) — RN-06
  totalLinea: number;       // cantidad * precioFinal — RN-06
  esPesoManual: boolean;    // true si el peso se ingresó manualmente — RN-13
  precioModificadoOriginal?: number; // Precio original antes de edición manual
}

export interface VentaPOS {
  id: string;
  fecha: string;            // ISO 8601
  clienteId: string | null; // null = cliente genérico / mostrador
  cajeroId: string;
  lineas: LineaVenta[];
  subtotal: number;
  descuentoGlobalPct: number;
  descuentoGlobalValor: number;
  totalFinal: number;       // subtotal - descuentoGlobalValor — RN-06
  formaPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CREDITO' | 'MIXTO';
  requiereFacturaElectronica: boolean;
  estadoSiigo: 'NO_REQUERIDO' | 'PENDIENTE' | 'ENVIADO' | 'FALLIDO';
  idempotencyKey: string;   // UUID generado en frontend — RN-07
  turnoActivoId?: string;   // ID del turno bajo el cual se registró la venta
  
  // Compatibilidad con impresión y logs
  actor?: string;
  items?: any[];
  descuento?: number;
  total?: number;
  metodoPago?: 'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO' | 'CONTADO' | 'MIXTO';
  montoPagadoEfectivo?: number;
  montoPagadoTransferencia?: number;
  montoPagadoTarjeta?: number;
  montoPagadoCredito?: number;
  cambioEntregado?: number;
}

export interface ConfiguracionPOS {
  bodegaActivaId: string;
  cajaActivaId: string;
  puertoBalanza: string | null;
  puertoImpresora: string | null;
}

export interface ResultadoOperacion<T> {
  data: T | null;
  error: string | null;
}
