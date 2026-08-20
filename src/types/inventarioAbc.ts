export enum ClasificacionAbc {
  A = 'A',
  B = 'B',
  C = 'C'
}

export interface AnalisisAbcItemDTO {
  readonly productoId: string;
  readonly codigoSku: string;
  readonly nombreProducto: string;
  readonly valorTotalVentas: number;
  readonly porcentajeAcumulado: number;
  readonly clasificacion: ClasificacionAbc;
}
