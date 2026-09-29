import { load, save } from './localDb';
import {
  OrdenProduccionDespieceSchema,
  calcularRendimientoYCosteoDespiece,
  type OrdenProduccionDespiece,
  type SalidaCorteDespiece,
} from '../../packages/validation-schemas/src/fishProductionYield.schema';
import { registrarEntrada, registrarSalida, validarStock } from './inventoryService';
import type { ResultadoOperacion } from '../types/common.types';

const STORAGE_KEY_PRODUCCION = 'fish_yield_orders';

export interface ResumenKpiFileteador {
  fileteadorNombre: string;
  totalKilosProcesados: number;
  totalKilosFilete: number;
  promedioRendimientoFiletePct: number;
  totalOrdenes: number;
  ordenesOptimas: number;
  ordenesConAlerta: number;
}

/**
 * Procesa y registra una orden de transformación y fileteo con auditoría de rendimiento
 */
export function procesarOrdenDespieceYield(
  datos: Omit<OrdenProduccionDespiece, 'id' | 'consecutivoOrden'>
): ResultadoOperacion<{
  orden: any;
}> {
  try {
    const ordenesExistentes = load<any[]>(STORAGE_KEY_PRODUCCION, []);
    const hoyStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const consecutivo = `OP-FILETE-${hoyStr}-${(ordenesExistentes.length + 1).toString().padStart(3, '0')}`;

    const ordenCompleta: OrdenProduccionDespiece = {
      ...datos,
      id: crypto.randomUUID?.() || `op-yield-${Date.now()}`,
      consecutivoOrden: consecutivo,
    };

    // Validar esquema Zod
    const validacion = OrdenProduccionDespieceSchema.safeParse(ordenCompleta);
    if (!validacion.success) {
      const msg = validacion.error.issues.map((i) => i.message).join(' | ');
      return { data: null, error: `Validación fallida: ${msg}` };
    }

    // Validar stock disponible en la bodega de origen
    const valStock = validarStock(
      ordenCompleta.materiaPrimaProductoId,
      ordenCompleta.bodegaOrigenId,
      ordenCompleta.pesoInicialMateriaPrimaKg
    );
    if (valStock.error) {
      return { data: null, error: `Stock insuficiente en origen: ${valStock.error}` };
    }

    // Calcular rendimiento, merma, prorrateo de costos y auditoría
    const calculo = calcularRendimientoYCosteoDespiece(
      ordenCompleta.pesoInicialMateriaPrimaKg,
      ordenCompleta.costoKiloMateriaPrima,
      ordenCompleta.cortesObtenidos,
      ordenCompleta.especieClave
    );

    // 1. Descontar materia prima de la bodega de origen
    registrarSalida({
      bodegaId: ordenCompleta.bodegaOrigenId,
      productoId: ordenCompleta.materiaPrimaProductoId,
      cantidad: ordenCompleta.pesoInicialMateriaPrimaKg,
      referenciaId: `${consecutivo}-CONSUMO-MP`,
    });

    // 2. Ingresar los cortes aprovechables con lote derivado y costo prorrateado
    const cortesConLote = calculo.cortesLiquidados.map((corte, idx) => {
      const sufijo =
        corte.tipoSalida === 'PRODUCTO_PRINCIPAL_FILETE'
          ? 'FIL'
          : corte.tipoSalida === 'COPRODUCTO_CABEZA_ESPINAZO'
          ? 'CAB'
          : corte.tipoSalida === 'SUBPRODUCTO_RETAZO_PULPA'
          ? 'RET'
          : 'MER';

      const codigoLoteDerivado = `LOTE-PROD-${hoyStr}-${(ordenesExistentes.length + 1).toString().padStart(3, '0')}-${sufijo}-${idx + 1}`;

      if (corte.pesoObtenidoKg > 0 && corte.tipoSalida !== 'MERMA_TECNICA_NO_APROVECHABLE') {
        registrarEntrada({
          bodegaId: ordenCompleta.bodegaDestinoId,
          productoId: corte.productoId,
          cantidad: corte.pesoObtenidoKg,
          costoUnitario: corte.costoUnitarioPorKg,
          referenciaId: `${consecutivo}-${corte.nombreCorte}`,
        });
      }

      return {
        ...corte,
        codigoLoteDerivado,
      };
    });

    const ordenRegistrada = {
      ...ordenCompleta,
      calculoRendimiento: calculo,
      cortesFinales: cortesConLote,
      estado: 'FINALIZADA',
      fechaFinalizada: new Date().toISOString(),
    };

    ordenesExistentes.unshift(ordenRegistrada);
    save(STORAGE_KEY_PRODUCCION, ordenesExistentes);

    return {
      data: {
        orden: ordenRegistrada,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error al procesar el fileteo y despiece' };
  }
}

/**
 * Obtiene el historial de órdenes de transformación procesadas
 */
export function obtenerOrdenesDespiece(): any[] {
  return load<any[]>(STORAGE_KEY_PRODUCCION, []);
}

/**
 * Consolida los KPIs de eficiencia y rendimiento por maestro fileteador
 */
export function obtenerKpisFileteadores(): ResumenKpiFileteador[] {
  const ordenes = load<any[]>(STORAGE_KEY_PRODUCCION, []);
  const mapa = new Map<string, ResumenKpiFileteador>();

  ordenes.forEach((o) => {
    const nombre = o.fileteadorNombre || 'Operario No Asignado';
    const actual = mapa.get(nombre) || {
      fileteadorNombre: nombre,
      totalKilosProcesados: 0,
      totalKilosFilete: 0,
      promedioRendimientoFiletePct: 0,
      totalOrdenes: 0,
      ordenesOptimas: 0,
      ordenesConAlerta: 0,
    };

    actual.totalKilosProcesados += o.pesoInicialMateriaPrimaKg || 0;
    actual.totalKilosFilete += o.calculoRendimiento?.pesoFileteKg || 0;
    actual.totalOrdenes += 1;

    if (o.calculoRendimiento?.calificacionRendimiento === 'OPTIMO_EXCELENTE') {
      actual.ordenesOptimas += 1;
    } else {
      actual.ordenesConAlerta += 1;
    }

    mapa.set(nombre, actual);
  });

  return Array.from(mapa.values()).map((kpi) => ({
    ...kpi,
    promedioRendimientoFiletePct:
      kpi.totalKilosProcesados > 0
        ? Number(((kpi.totalKilosFilete / kpi.totalKilosProcesados) * 100).toFixed(2))
        : 0,
  }));
}
