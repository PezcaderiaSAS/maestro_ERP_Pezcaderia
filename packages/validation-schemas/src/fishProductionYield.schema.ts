import { z } from 'zod';

/**
 * Tipo de salida o corte en el proceso de fileteo / despiece
 */
export const TipoSalidaCorteEnum = z.enum([
  'PRODUCTO_PRINCIPAL_FILETE',
  'COPRODUCTO_CABEZA_ESPINAZO',
  'SUBPRODUCTO_RETAZO_PULPA',
  'MERMA_TECNICA_NO_APROVECHABLE',
]);
export type TipoSalidaCorte = z.infer<typeof TipoSalidaCorteEnum>;

/**
 * Esquema para cada corte o subproducto obtenido
 */
export const SalidaCorteDespieceSchema = z.object({
  id: z.string().optional(),
  productoId: z.string().min(1, 'El ID de producto es requerido'),
  sku: z.string().min(1, 'El SKU es requerido'),
  nombreCorte: z.string().min(2, 'Nombre del corte (ej. Filete de Corvina, Cabezas para sopa)'),
  tipoSalida: TipoSalidaCorteEnum,
  pesoObtenidoKg: z.number().min(0, 'El peso no puede ser negativo'),
  factorValorMercado: z
    .number()
    .min(0, 'El factor no puede ser negativo')
    .default(1.0), // Filete = 1.4 - 1.8, Cabeza/Espinazo = 0.2 - 0.4, Retazo = 0.8, Merma = 0.0
});
export type SalidaCorteDespiece = z.infer<typeof SalidaCorteDespieceSchema>;

/**
 * Estándares oficiales de rendimiento por especie pesquera (Base de conocimiento zoológico/industrial)
 */
export interface EspecieYieldStandard {
  especie: string;
  rendimientoFileteOptimoMinPct: number; // Ej. Corvina: 42%
  rendimientoFileteOptimoMaxPct: number; // Ej. Corvina: 46%
  mermaTecnicaMaxPermitidaPct: number;  // Ej. 25%
}

export const ESTANDARES_RENDIMIENTO_ESPECIES: Record<string, EspecieYieldStandard> = {
  CORVINA: {
    especie: 'Corvina',
    rendimientoFileteOptimoMinPct: 42.0,
    rendimientoFileteOptimoMaxPct: 46.0,
    mermaTecnicaMaxPermitidaPct: 24.0,
  },
  PARGO_ROJO: {
    especie: 'Pargo Rojo',
    rendimientoFileteOptimoMinPct: 40.0,
    rendimientoFileteOptimoMaxPct: 45.0,
    mermaTecnicaMaxPermitidaPct: 25.0,
  },
  ROBALO: {
    especie: 'Robalo',
    rendimientoFileteOptimoMinPct: 43.0,
    rendimientoFileteOptimoMaxPct: 48.0,
    mermaTecnicaMaxPermitidaPct: 22.0,
  },
  SALMON: {
    especie: 'Salmón',
    rendimientoFileteOptimoMinPct: 48.0,
    rendimientoFileteOptimoMaxPct: 54.0,
    mermaTecnicaMaxPermitidaPct: 18.0,
  },
  TRUCHA: {
    especie: 'Trucha Arcoíris',
    rendimientoFileteOptimoMinPct: 47.0,
    rendimientoFileteOptimoMaxPct: 52.0,
    mermaTecnicaMaxPermitidaPct: 20.0,
  },
  TILAPIA: {
    especie: 'Tilapia Roja',
    rendimientoFileteOptimoMinPct: 33.0,
    rendimientoFileteOptimoMaxPct: 38.0,
    mermaTecnicaMaxPermitidaPct: 30.0,
  },
};

/**
 * Esquema de Orden de Producción, Transformación y Fileteo de Pescado Entero
 */
export const OrdenProduccionDespieceSchema = z.object({
  id: z.string().optional(),
  consecutivoOrden: z.string().min(1, 'El número de orden es requerido'),
  fechaTransformacion: z.string().min(1, 'La fecha es requerida'),
  bodegaOrigenId: z.string().min(1, 'Cuarto frío de materia prima requerido'),
  bodegaDestinoId: z.string().min(1, 'Cuarto frío de destino requerido'),
  loteMadreMuelleId: z.string().min(1, 'El lote madre de origen es obligatorio para trazabilidad'),
  materiaPrimaProductoId: z.string().min(1, 'Producto de materia prima requerido'),
  materiaPrimaSku: z.string().min(1, 'SKU de materia prima requerido'),
  materiaPrimaNombre: z.string().min(2, 'Nombre de la materia prima'),
  especieClave: z.string().min(2, 'Clave de especie para estándar de rendimiento'),
  pesoInicialMateriaPrimaKg: z.number().positive('El peso inicial a procesar debe ser mayor a 0'),
  costoKiloMateriaPrima: z.number().positive('El costo por kilo de materia prima debe ser mayor a 0'),
  fileteadorNombre: z.string().min(2, 'Nombre del maestro fileteador u operario'),
  fileteadorIdentificacion: z.string().min(5, 'Identificación del fileteador'),
  cortesObtenidos: z.array(SalidaCorteDespieceSchema).min(1, 'Debe registrar al menos un corte o salida'),
  temperaturaSalaC: z.number().min(0).max(18, 'La sala de despiece no debe superar los 18°C').default(10.0),
  observacionesProduccion: z.string().max(1000).optional(),
});
export type OrdenProduccionDespiece = z.infer<typeof OrdenProduccionDespieceSchema>;

/**
 * Función matemática determinista para calcular rendimiento, merma, prorrateo de costos y auditoría
 */
export function calcularRendimientoYCosteoDespiece(
  pesoInicialKg: number,
  costoKiloMP: number,
  cortes: SalidaCorteDespiece[],
  especieClave: string
) {
  const costoTotalMP = pesoInicialKg * costoKiloMP;
  let pesoTotalSalidasKg = 0;
  let pesoFileteKg = 0;
  let pesoMermaKg = 0;

  // 1. Sumar pesos y clasificar
  cortes.forEach((c) => {
    pesoTotalSalidasKg += c.pesoObtenidoKg;
    if (c.tipoSalida === 'PRODUCTO_PRINCIPAL_FILETE') {
      pesoFileteKg += c.pesoObtenidoKg;
    } else if (c.tipoSalida === 'MERMA_TECNICA_NO_APROVECHABLE') {
      pesoMermaKg += c.pesoObtenidoKg;
    }
  });

  // Si hay una diferencia entre pesoInicial y la suma de cortes, se ajusta a merma no contabilizada
  const mermaFaltante = Math.max(0, pesoInicialKg - pesoTotalSalidasKg);
  const mermaTotalKg = pesoMermaKg + mermaFaltante;

  const rendimientoFileteRealPct = Number(((pesoFileteKg / pesoInicialKg) * 100).toFixed(2));
  const mermaRealPct = Number(((mermaTotalKg / pesoInicialKg) * 100).toFixed(2));

  // 2. Auditoría contra estándar de especie
  const claveUpper = especieClave.toUpperCase().replace(/\s+/g, '_');
  const estandar = ESTANDARES_RENDIMIENTO_ESPECIES[claveUpper] || {
    especie: especieClave,
    rendimientoFileteOptimoMinPct: 40.0,
    rendimientoFileteOptimoMaxPct: 48.0,
    mermaTecnicaMaxPermitidaPct: 25.0,
  };

  let calificacionRendimiento: 'OPTIMO_EXCELENTE' | 'ALERTA_AMBAR_BAJO' | 'CRITICO_ROJO_DESVIACION' = 'OPTIMO_EXCELENTE';
  let mensajeAuditoria = 'Rendimiento en rango óptimo según estándar de especie.';

  if (rendimientoFileteRealPct < estandar.rendimientoFileteOptimoMinPct) {
    const delta = estandar.rendimientoFileteOptimoMinPct - rendimientoFileteRealPct;
    if (delta <= 2.5) {
      calificacionRendimiento = 'ALERTA_AMBAR_BAJO';
      mensajeAuditoria = `Rendimiento de filete (${rendimientoFileteRealPct}%) está ${delta.toFixed(1)}% por debajo del mínimo esperado (${estandar.rendimientoFileteOptimoMinPct}%).`;
    } else {
      calificacionRendimiento = 'CRITICO_ROJO_DESVIACION';
      mensajeAuditoria = `ALERTA CRÍTICA: Desviación severa de fileteo (${rendimientoFileteRealPct}% vs estándar mín ${estandar.rendimientoFileteOptimoMinPct}%). Posible corte deficiente o merma de músculo en espinazo.`;
    }
  }

  // 3. Prorrateo de Costos por Valor Relativo de Mercado (Absorption Costing)
  // La merma tiene factor 0; solo los productos comercializables absorben costo
  let sumaFactoresComerciales = 0;
  const cortesConFactores = cortes.map((corte) => {
    // Si es merma, factor de mercado es 0
    const factorAplicado = corte.tipoSalida === 'MERMA_TECNICA_NO_APROVECHABLE' ? 0 : Math.max(0.01, corte.factorValorMercado);
    const puntosPonderados = corte.pesoObtenidoKg * factorAplicado;
    sumaFactoresComerciales += puntosPonderados;
    return {
      ...corte,
      factorAplicado,
      puntosPonderados,
    };
  });

  const cortesLiquidados = cortesConFactores.map((corte) => {
    let costoTotalAsignado = 0;
    let costoUnitarioPorKg = 0;

    if (corte.pesoObtenidoKg > 0 && sumaFactoresComerciales > 0 && corte.tipoSalida !== 'MERMA_TECNICA_NO_APROVECHABLE') {
      const porcentajeAbsorcion = corte.puntosPonderados / sumaFactoresComerciales;
      costoTotalAsignado = Math.round(costoTotalMP * porcentajeAbsorcion);
      costoUnitarioPorKg = Math.round(costoTotalAsignado / corte.pesoObtenidoKg);
    }

    return {
      productoId: corte.productoId,
      sku: corte.sku,
      nombreCorte: corte.nombreCorte,
      tipoSalida: corte.tipoSalida,
      pesoObtenidoKg: corte.pesoObtenidoKg,
      rendimientoSobreMPPct: Number(((corte.pesoObtenidoKg / pesoInicialKg) * 100).toFixed(2)),
      costoTotalAsignado,
      costoUnitarioPorKg,
    };
  });

  return {
    pesoInicialKg,
    costoTotalMP,
    pesoFileteKg: Number(pesoFileteKg.toFixed(2)),
    rendimientoFileteRealPct,
    mermaTotalKg: Number(mermaTotalKg.toFixed(2)),
    mermaRealPct,
    estandarEspecie: estandar,
    calificacionRendimiento,
    mensajeAuditoria,
    cortesLiquidados,
  };
}
