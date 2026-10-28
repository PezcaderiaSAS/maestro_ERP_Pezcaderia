// src/types/b2bQuotation.types.ts
// Tipos TypeScript para Cotizaciones B2B y Conversión a Preventa POS

export type QuotationStatus =
  | 'BORRADOR'
  | 'EMITIDA'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'CONVERTIDA'
  | 'VENCIDA';

export interface B2BQuotationItem {
  id: string;
  productoSku: string;
  nombre: string;
  cantidad: number;
  precioUnitarioPactado: number;
  tarifaAplicada: 'DETAL' | 'MAYORISTA';
  descuentoPct: number;
  subtotalItem: number;
  observaciones?: string;
}

export interface B2BQuotation {
  id: string;
  tenantId: string;
  codigoCotizacion: string;
  clienteId: string;
  asesorUsuarioId: string;
  estado: QuotationStatus;
  items: B2BQuotationItem[];
  subtotal: number;
  totalDescuentos: number;
  totalImpuestos: number;
  totalGeneral: number;
  diasVigencia: number;
  fechaEmision: string;
  fechaVencimiento: string;
  convertidaPrefacturaId?: string;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuotationToPosConversion {
  cotizacionId: string;
  tenantId: string;
  bodegaId: string;
  vendedorId: string;
  tipoPreventa: 'MOSTRADOR_B2B' | 'CONTRATISTA' | 'DESPACHO_PROGRAMADO';
}

