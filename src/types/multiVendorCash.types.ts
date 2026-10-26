// src/types/multiVendorCash.types.ts
// Tipos canónicos para arquitectura concurrente de caja única (8 terminales) y multi-tenant

export type MetodoPagoConcurrente = 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA' | 'CREDITO';

export interface ItemVentaConcurrente {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  loteId?: string;
}

export interface PagoVentaConcurrente {
  metodoPago: MetodoPagoConcurrente;
  monto: number;
  referenciaComprobante?: string;
}

export interface VentaConcurrentePayload {
  idempotencyKey: string;
  tenantId: string;
  turnoId: string;
  terminalId: string; // 'TERM-01' a 'TERM-08'
  vendedorId: string;
  items: ItemVentaConcurrente[];
  pagos: PagoVentaConcurrente[];
  montoTotal: number;
  clienteDocumento?: string;
  clienteNombre?: string;
  fechaLocal?: string;
}

export interface ResultadoVentaConcurrente {
  ok: boolean;
  ventaId?: string;
  consecutivoFactura?: string;
  turnoId?: string;
  montoTotal?: number;
  efectivoCajaAfectado?: number;
  saldoTurnoActualizado?: number;
  fechaEmision?: string;
  error?: string;
  codigoError?: 'CAJA_CERRADA' | 'STOCK_INSUFICIENTE' | 'PERMISO_DENEGADO' | 'IDEMPOTENCY_CONFLICT' | 'CONCURRENCY_ERROR';
}

export interface TurnoCentralCompartido {
  id: string;
  cajaId: string;
  sucursalId: string;
  tenantId: string;
  cajeroAperturaId: string;
  baseInicial: number;
  estado: 'ABIERTO' | 'CERRADO' | 'AUDITADO';
  fechaApertura: string;
  fechaCierre?: string;
  terminalesAutorizadas: string[];
  totalVentasEfectivo?: number;
  totalVentasElectronicas?: number;
  movimientosCount?: number;
}

export type RubroEmpresa = 'PESCADERIA' | 'FERRETERIA' | 'RESTAURANTE' | 'DISTRIBUIDORA' | 'GENERAL';

export interface TenantConfig {
  id: string;
  nombre: string;
  nit: string;
  razonSocial: string;
  rubro: RubroEmpresa;
  activo: boolean;
  maxTerminales: number;
  createdAt: string;
  contactoEmail?: string;
  contactoTelefono?: string;
  sucursalesCount?: number;
}

export interface BulkItemHardwareRow {
  sku: string;
  codigoBarras?: string;
  nombre: string;
  marca?: string;
  categoria: string;
  unidadMedida?: string;
  ubicacionPasillo?: string;
  costoUnitario: number;
  precioDetal: number;
  precioMayorista?: number;
  stockMinimo?: number;
  stockInicial?: number;
}
