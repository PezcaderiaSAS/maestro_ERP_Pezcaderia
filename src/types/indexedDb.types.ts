// src/types/indexedDb.types.ts
// Tipos TypeScript para la Arquitectura de Persistencia Aislada IndexedDB Multi-Tenant

export interface TenantLocalDbConfig {
  tenantId: string;
  dbName: string;
  version: number;
}

export interface LocalIndexedDbProduct {
  sku: string;
  tenantId: string;
  nombre: string;
  codigoBarras?: string;
  categoria: string;
  precioDetal: number;
  precioMayorista: number;
  cantidadMinimaMayorista: number;
  costoBase?: number;
  margenMinimoPct?: number;
  stockDisponible: number;
  ubicacionPasillo?: string;
  esParetoTop100?: boolean;
  activo: boolean;
  updatedAt: string;
}

export interface LocalIndexedDbClient {
  id: string;
  tenantId: string;
  razonSocialONombre: string;
  nitOCedula: string;
  perfilPrecio: 'DETAL' | 'MAYORISTA' | 'CONTRATISTA' | 'INSTITUCIONAL';
  limiteCredito?: number;
  contactoTelefono?: string;
  contactoEmail?: string;
  esParetoTop100?: boolean;
  updatedAt: string;
}

export interface OutboxTransaction {
  id: string;
  tenantId: string;
  tipo: 'VENTA_POS' | 'RESERVA_STOCK' | 'CREACION_COTIZACION' | 'CAMBIO_PRECIO';
  payload: any;
  intentos: number;
  estado: 'PENDIENTE' | 'PROCESANDO' | 'SINCRONIZADO' | 'FALLIDO';
  creadoEn: string;
  ultimoIntento?: string;
  error?: string;
}

export interface SyncMetadata {
  tenantId: string;
  lastSyncTimestamp: string;
  totalProductosSincronizados: number;
  totalClientesSincronizados: number;
  versionEsquema: number;
}

