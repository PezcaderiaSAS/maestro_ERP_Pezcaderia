import { load, save } from './localDb';
import {
  RecepcionCompraMuelleSchema,
  calcularLiquidacionMuelle,
  type RecepcionCompraMuelle,
  type PesajeTallaMuelle,
  type DeduccionFaena,
} from '../../packages/validation-schemas/src/dockReceiving.schema';
import { registrarEntrada } from './inventoryService';
import type { ResultadoOperacion } from '../types/common.types';

export interface LoteMadreMuelleItem {
  codigoLoteMadre: string;
  actaId: string;
  consecutivoActa: string;
  especiePescado: string;
  bodegaDestinoId: string;
  fechaRecepcion: string;
  pesoNetoDisponibleKg: number;
  costoPromedioKg: number;
  embarcacionNombre: string;
  patronPescadorNombre: string;
  temperaturaRecepcionC: number;
}

const STORAGE_KEY_RECEPCIONES = 'dock_purchases';

/**
 * Registra una recepción en muelle con inspección sanitaria y liquidación económica al pescador
 */
export function registrarRecepcionMuelle(
  datos: Omit<RecepcionCompraMuelle, 'id' | 'consecutivoActa'>
): ResultadoOperacion<{
  recepcion: RecepcionCompraMuelle & { id: string; codigoLoteMadre: string; liquidacionCalculada: any };
}> {
  try {
    const recepcionesExistentes = load<any[]>(STORAGE_KEY_RECEPCIONES, []);
    const hoyStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const consecutivo = `ACTA-MUELLE-${hoyStr}-${(recepcionesExistentes.length + 1).toString().padStart(3, '0')}`;
    const codigoLoteMadre = `LOTE-MUELLE-${hoyStr}-${(recepcionesExistentes.length + 1).toString().padStart(3, '0')}`;

    const recepcionCompleta = {
      ...datos,
      id: crypto.randomUUID?.() || `rec-muelle-${Date.now()}`,
      consecutivoActa: consecutivo,
    };

    // Validar esquema Zod (lanza error si temp > 6°C o campos faltantes)
    const validacion = RecepcionCompraMuelleSchema.safeParse(recepcionCompleta);
    if (!validacion.success) {
      const msg = validacion.error.issues.map((i) => i.message).join(' | ');
      return { data: null, error: `Validación fallida: ${msg}` };
    }

    // Calcular liquidación matemática determinista
    const liquidacion = calcularLiquidacionMuelle(
      recepcionCompleta.itemsTallas,
      recepcionCompleta.deduccionesFaena || []
    );

    const costoPromedioKg =
      liquidacion.pesoNetoEscurridoTotalKg > 0
        ? Math.round(liquidacion.subtotalCompraPescado / liquidacion.pesoNetoEscurridoTotalKg)
        : 0;

    const registroFinal = {
      ...recepcionCompleta,
      codigoLoteMadre,
      liquidacionCalculada: liquidacion,
      costoPromedioKg,
      estado: 'LIQUIDADA_PAGADA',
      creadoEn: new Date().toISOString(),
    };

    // 1. Guardar en almacenamiento de recepciones
    recepcionesExistentes.unshift(registroFinal);
    save(STORAGE_KEY_RECEPCIONES, recepcionesExistentes);

    // 2. Ingresar la materia prima recibida al inventario de la bodega de destino
    // Cada talla recibida se añade o acumula con su peso neto liquidado
    recepcionCompleta.itemsTallas.forEach((talla, idx) => {
      const netoTallaKg = liquidacion.desgloseTallas[idx]?.pesoNetoLiquidadoKg || 0;
      if (netoTallaKg > 0) {
        // Enlazar al inventario
        registrarEntrada({
          bodegaId: recepcionCompleta.bodegaDestinoId,
          productoId: `prod-${recepcionCompleta.especiePescado.toLowerCase().replace(/\s+/g, '-')}`,
          cantidad: netoTallaKg,
          costoUnitario: talla.precioPorKgAcordado,
          referenciaId: `${consecutivo}-${talla.tallaNombre}`,
        });
      }
    });

    return {
      data: {
        recepcion: registroFinal,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error al procesar la recepción de muelle' };
  }
}

/**
 * Obtiene el historial de recepciones en muelle
 */
export function obtenerRecepcionesMuelle(): any[] {
  return load<any[]>(STORAGE_KEY_RECEPCIONES, []);
}

/**
 * Obtiene los lotes madre disponibles en muelle listos para transformar en planta de fileteo
 */
export function obtenerLotesMadreDisponibles(): LoteMadreMuelleItem[] {
  const recepciones = load<any[]>(STORAGE_KEY_RECEPCIONES, []);
  return recepciones
    .filter((r) => r.estado === 'LIQUIDADA_PAGADA' && r.liquidacionCalculada?.pesoNetoEscurridoTotalKg > 0)
    .map((r) => ({
      codigoLoteMadre: r.codigoLoteMadre,
      actaId: r.id,
      consecutivoActa: r.consecutivoActa,
      especiePescado: r.especiePescado,
      bodegaDestinoId: r.bodegaDestinoId,
      fechaRecepcion: r.fechaRecepcion,
      pesoNetoDisponibleKg: r.liquidacionCalculada.pesoNetoEscurridoTotalKg,
      costoPromedioKg: r.costoPromedioKg,
      embarcacionNombre: r.embarcacionNombre,
      patronPescadorNombre: r.patronPescadorNombre,
      temperaturaRecepcionC: r.inspeccionSanitaria.temperaturaPulpaC,
    }));
}
