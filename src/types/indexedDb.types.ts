// src/types/indexedDb.types.ts
// Tipos TypeScript para la Arquitectura de Persistencia Aislada IndexedDB Multi-Tenant

import type { OutboxTransaction as SchemaOutboxTransaction } from './deltaSync.schema';

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

export type OutboxTransaction = SchemaOutboxTransaction & {
  tipo?: string;
};

export interface SyncMetadata {
  tenantId: string;
  lastSyncTimestamp: string;
  totalProductosSincronizados: number;
  totalClientesSincronizados: number;
  versionEsquema: number;
}

