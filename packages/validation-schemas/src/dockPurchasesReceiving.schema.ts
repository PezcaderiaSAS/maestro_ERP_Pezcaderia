import { z } from 'zod';

/**
 * Estados del semáforo térmico según normas de inocuidad pesquera (HACCP)
 */
export const EstadoSemaforoTermicoEnum = z.enum([
  'OPTIMO',
  'PRECAUCION',
  'ALERTA_CRITICA'
]);
export type EstadoSemaforoTermico = z.infer<typeof EstadoSemaforoTermicoEnum>;

export interface EvaluacionSemaforoResultado {
  estado: EstadoSemaforoTermico;
  color: 'emerald' | 'amber' | 'rose';
  permitido: boolean;
  mensaje: string;
}

/**
 * Función pura para evaluar la temperatura de la cava del camión según conservación
 */
export function evaluarSemaforoTermico(
  temperaturaCava: number,
  tipoProducto: 'FRESCO' | 'CONGELADO' = 'FRESCO'
): EvaluacionSemaforoResultado {
  if (tipoProducto === 'FRESCO') {
    if (temperaturaCava <= 4.0) {
      return {
        estado: 'OPTIMO',
        color: 'emerald',
        permitido: true,
        mensaje: 'Temperatura Óptima: Cadena de frío preservada correctamente (≤ 4.0°C).'
      };
    }
    if (temperaturaCava <= 7.0) {
      return {
        estado: 'PRECAUCION',
        color: 'amber',
        permitido: true,
        mensaje: 'Precaución: Temperatura límite (4.1°C a 7.0°C). Exige adición inmediata de hielo escama.'
      };
    }
    return {
      estado: 'ALERTA_CRITICA',
      color: 'rose',
      permitido: false,
      mensaje: 'Peligro Sanitario: Temperatura crítica (> 7.0°C). Riesgo de descomposición o rechazo sanitario.'
    };
  }

  // CONGELADO
  if (temperaturaCava <= -18.0) {
    return {
      estado: 'OPTIMO',
      color: 'emerald',
      permitido: true,
      mensaje: 'Temperatura Óptima: Congelación profunda preservada (≤ -18.0°C).'
    };
  }
  if (temperaturaCava <= -15.0) {
    return {
      estado: 'PRECAUCION',
      color: 'amber',
      permitido: true,
      mensaje: 'Precaución: Temperatura de congelación en rango límite (-17.9°C a -15.0°C).'
    };
  }
  return {
    estado: 'ALERTA_CRITICA',
    color: 'rose',
    permitido: false,
    mensaje: 'Peligro Sanitario: Pérdida crítica de congelación (> -15.0°C).'
  };
}

/**
 * Esquema de Furgón y Cadena de Frío al Arribo a Muelle
 */
export const DatosFurgonMuelleSchema = z.object({
  proveedorId: z.string().min(1, 'El proveedor es obligatorio'),
  proveedorNombre: z.string().min(1, 'La razón social del proveedor es obligatoria'),
  placaVehiculo: z.string().min(5, 'Placa de vehículo inválida (mínimo 5 caracteres)').max(10),
  conductorNombre: z.string().min(2, 'El nombre del conductor es obligatorio'),
  temperaturaCava: z.number().min(-35, 'Temperatura inverosímil').max(45, 'Temperatura inverosímil'),
  fechaFaena: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha YYYY-MM-DD inválido'),
  tipoConservacion: z.enum(['FRESCO', 'CONGELADO']).default('FRESCO'),
  loteOrigenManual: z.string().optional()
});
export type DatosFurgonMuelle = z.infer<typeof DatosFurgonMuelleSchema>;

/**
 * Esquema de Pesada Granular de Canastillas Catch Weight en Muelle
 */
export const PesadaCanastillaMuelleSchema = z.object({
  id: z.string().min(1),
  productoId: z.string().min(1, 'El producto es obligatorio'),
  productoNombre: z.string().min(1, 'El nombre del producto es obligatorio'),
  cantidadCanastillas: z.number().int().min(1, 'Debe registrar al menos 1 canastilla'),
  pesoBrutoKg: z.number().positive('El peso bruto debe ser mayor a 0'),
  taraCanastillaKg: z.number().default(2.0),
  porcentajeHielo: z.number().min(0).max(15).default(0),
  precioKgAcordado: z.number().positive('El precio acordado por kg debe ser mayor a 0'),
  calibre: z.string().optional()
}).superRefine((data, ctx) => {
  const taraTotal = data.cantidadCanastillas * data.taraCanastillaKg;
  if (data.pesoBrutoKg <= taraTotal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pesoBrutoKg'],
      message: `El peso bruto (${data.pesoBrutoKg} kg) debe ser superior al peso de las canastillas (${taraTotal} kg).`
    });
  }
});
export type PesadaCanastillaMuelle = z.infer<typeof PesadaCanastillaMuelleSchema>;

/**
 * Resultado metrológico del pesaje con deducción de tara y porcentaje de hielo
 */
export interface CalculoPesajeMuelleResultado {
  pesoTaraTotalKg: number;
  pesoConHieloKg: number;
  descuentoHieloKg: number;
  pesoNetoRealKg: number;
}

/**
 * Función pura metrológica para calcular tara fija de canastilla (2.0 kg) y hielo (0-15%)
 */
export function calcularPesajeMuelleNeto(
  pesoBrutoKg: number,
  cantidadCanastillas: number,
  porcentajeHielo: number,
  taraPorCanastillaKg = 2.0
): CalculoPesajeMuelleResultado {
  const pesoTaraTotalKg = Number((cantidadCanastillas * taraPorCanastillaKg).toFixed(2));
  const pesoConHieloKg = Math.max(0, Number((pesoBrutoKg - pesoTaraTotalKg).toFixed(2)));
  // Tope de seguridad comercial: máximo 15% de hielo
  const factorHielo = Math.min(Math.max(porcentajeHielo, 0), 15) / 100;
  const descuentoHieloKg = Number((pesoConHieloKg * factorHielo).toFixed(2));
  const pesoNetoRealKg = Number((pesoConHieloKg - descuentoHieloKg).toFixed(2));

  return {
    pesoTaraTotalKg,
    pesoConHieloKg,
    descuentoHieloKg,
    pesoNetoRealKg
  };
}

/**
 * Esquema de Liquidación Financiera en Muelle
 */
export const LiquidacionCompraMuelleSchema = z.object({
  formaPago: z.enum(['CONTADO', 'CREDITO', 'TRANSFERENCIA']),
  diasCredito: z.number().int().min(1, 'Los días de crédito deben ser mayores a 0').optional(),
  totalKilosNetos: z.number().positive('Total de kilos netos debe ser mayor a 0'),
  totalCompraCOP: z.number().int().positive('Total de compra en COP debe ser un entero positivo'),
  observaciones: z.string().max(500).optional(),
  cuartoFrioDestinoId: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.formaPago === 'CREDITO') {
    if (!data.diasCredito || data.diasCredito <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['diasCredito'],
        message: 'Para compras a crédito debe especificar un plazo de días válido (ej. 8, 15, 30 días).'
      });
    }
  }
});
export type LiquidacionCompraMuelle = z.infer<typeof LiquidacionCompraMuelleSchema>;

/**
 * Función pura para liquidar compras en pesos COP enteros (Regla SPEC-009)
 */
export function calcularLiquidacionTotalMuelle(
  partidas: Array<{ pesoNetoKg: number; precioKg: number }>
): {
  totalKilosNetos: number;
  totalCompraCOP: number;
} {
  let totalKilosNetos = 0;
  let totalCompraCOP = 0;

  for (const p of partidas) {
    totalKilosNetos += p.pesoNetoKg;
    // Subtotal redondeado a peso entero COP
    const subtotal = Math.round(p.pesoNetoKg * p.precioKg);
    totalCompraCOP += subtotal;
  }

  return {
    totalKilosNetos: Number(totalKilosNetos.toFixed(2)),
    totalCompraCOP: Math.round(totalCompraCOP)
  };
}
