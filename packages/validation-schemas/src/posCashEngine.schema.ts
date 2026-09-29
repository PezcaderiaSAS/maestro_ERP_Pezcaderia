import { z } from 'zod';

// ============================================================================
// DENOMINACIONES DE MONEDA COLOMBIANA (COP)
// ============================================================================
export const DENOMINACIONES_COLOMBIA = [
  { valor: 100000, etiqueta: '$100.000', tipo: 'BILLETE' as const },
  { valor: 50000,  etiqueta: '$50.000',  tipo: 'BILLETE' as const },
  { valor: 20000,  etiqueta: '$20.000',  tipo: 'BILLETE' as const },
  { valor: 10000,  etiqueta: '$10.000',  tipo: 'BILLETE' as const },
  { valor: 5000,   etiqueta: '$5.000',   tipo: 'BILLETE' as const },
  { valor: 2000,   etiqueta: '$2.000',   tipo: 'BILLETE' as const },
  { valor: 1000,   etiqueta: '$1.000',   tipo: 'MONEDA' as const },
  { valor: 500,    etiqueta: '$500',     tipo: 'MONEDA' as const },
  { valor: 200,    etiqueta: '$200',     tipo: 'MONEDA' as const },
  { valor: 100,    etiqueta: '$100',     tipo: 'MONEDA' as const },
  { valor: 50,     etiqueta: '$50',      tipo: 'MONEDA' as const },
] as const;

// Botones de efectivo sugerido en mostrador
export const BILLETES_RAPIDOS_SUGERIDOS = [10000, 20000, 50000, 100000] as const;

// ============================================================================
// ESQUEMAS ZOD
// ============================================================================

export const MetodoPagoPosSchema = z.enum([
  'EFECTIVO',
  'NEQUI',
  'DAVIPLATA',
  'QR_BANCOLOMBIA',
  'DATAFONO',
  'CREDITO',
]);

export type MetodoPagoPos = z.infer<typeof MetodoPagoPosSchema>;

export const DenominacionConteoSchema = z.object({
  valor: z.number().positive(),
  etiqueta: z.string(),
  tipo: z.enum(['BILLETE', 'MONEDA']),
  cantidad: z.number().int().min(0),
});

export type DenominacionConteo = z.infer<typeof DenominacionConteoSchema>;

export const AperturaTurnoInputSchema = z.object({
  empresa_id: z.string().uuid().optional(),
  caja_id: z.string().uuid(),
  cajero_id: z.string().uuid(),
  cajero_nombre: z.string().min(2),
  base_inicial: z.number().min(0),
});

export type AperturaTurnoInput = z.infer<typeof AperturaTurnoInputSchema>;

export const RetiroParcialInputSchema = z.object({
  empresa_id: z.string().uuid().optional(),
  turno_id: z.string().uuid(),
  monto_retiro: z.number().positive('El monto del retiro debe ser mayor a cero'),
  motivo: z.string().min(5, 'Debe especificar el motivo del retiro de efectivo'),
  cajero_nombre: z.string().min(2),
  supervisor_nombre: z.string().min(2, 'Debe indicar el supervisor que autoriza'),
});

export type RetiroParcialInput = z.infer<typeof RetiroParcialInputSchema>;

export const CierreTurnoInputSchema = z.object({
  empresa_id: z.string().uuid().optional(),
  turno_id: z.string().uuid(),
  denominaciones: z.array(DenominacionConteoSchema).min(1),
  justificacion: z.string().optional().nullable(),
  supervisor_id: z.string().uuid().optional().nullable(),
  supervisor_nombre: z.string().optional().nullable(),
});

export type CierreTurnoInput = z.infer<typeof CierreTurnoInputSchema>;

// ============================================================================
// FUNCIONES DETERMINISTAS DE CÁLCULO DE CAJA
// ============================================================================

/**
 * Calcula el cambio o vuelto en efectivo.
 * Retorna error si el efectivo recibido es menor al total a pagar.
 */
export function calcularCambioEfectivo(totalAPagar: number, efectivoRecibido: number): {
  valido: boolean;
  cambio: number;
  faltante: number;
} {
  const diff = Math.round((efectivoRecibido - totalAPagar) * 100) / 100;
  if (diff < 0) {
    return {
      valido: false,
      cambio: 0,
      faltante: Math.abs(diff),
    };
  }
  return {
    valido: true,
    cambio: diff,
    faltante: 0,
  };
}

/**
 * Calcula el total físico a partir del desglose de billetes y monedas.
 */
export function calcularTotalConteoFisico(conteos: DenominacionConteo[]): number {
  return conteos.reduce((acc, c) => acc + (c.valor * (c.cantidad || 0)), 0);
}

/**
 * Evalúa la diferencia de arqueo y su categorización según el umbral de tolerancia.
 */
export function evaluarDescuadreArqueo(
  saldoEsperado: number,
  saldoDeclarado: number,
  umbralTolerancia: number = 5000
): {
  diferencia: number;
  tipo: 'EXACTO' | 'TOLERANCIA_REDONDEO' | 'FALTANTE' | 'SOBRANTE';
  requiereAutorizacion: boolean;
  descripcion: string;
} {
  const diferencia = Math.round((saldoDeclarado - saldoEsperado) * 100) / 100;
  if (diferencia === 0) {
    return {
      diferencia: 0,
      tipo: 'EXACTO',
      requiereAutorizacion: false,
      descripcion: 'Arqueo perfecto: Sin diferencias.',
    };
  }
  if (Math.abs(diferencia) <= umbralTolerancia) {
    return {
      diferencia,
      tipo: 'TOLERANCIA_REDONDEO',
      requiereAutorizacion: false,
      descripcion: `Diferencia de $${Math.abs(diferencia).toLocaleString('es-CO')} dentro de la tolerancia de redondeo ($${umbralTolerancia.toLocaleString('es-CO')}).`,
    };
  }
  if (diferencia < -umbralTolerancia) {
    return {
      diferencia,
      tipo: 'FALTANTE',
      requiereAutorizacion: true,
      descripcion: `Faltante de caja por $${Math.abs(diferencia).toLocaleString('es-CO')}. Requiere justificación y autorización de supervisor.`,
    };
  }
  return {
    diferencia,
    tipo: 'SOBRANTE',
    requiereAutorizacion: true,
    descripcion: `Sobrante de caja por $${diferencia.toLocaleString('es-CO')}. Requiere justificación y registro en otros ingresos.`,
  };
}
