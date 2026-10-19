import { load, save } from './localDb';
import {
  calcularPesajeMuelleNeto,
  calcularLiquidacionTotalMuelle
} from '../../packages/validation-schemas/src/dockPurchasesReceiving.schema';
import { accountsPayableService, calcularFechaVencimiento } from './accountsPayableService';
import { registrarLoteFEFO } from './inventoryService';
import { cashService } from './cashService';

export interface PartidaRecepcionInput {
  productoId: string;
  productoNombre: string;
  sku?: string;
  cantidadCanastillas: number;
  pesoBrutoKg: number;
  taraCanastillaKg?: number; // 2.0 default
  porcentajeHielo: number;   // 0-15
  precioKgAcordado: number;
  calibre?: string;
  loteOrigenManual?: string;
}

export interface FinalizarRecepcionMuelleInput {
  proveedorId: string;
  proveedorNombre: string;
  proveedorNit: string;
  placaVehiculo: string;
  conductorNombre: string;
  temperaturaCava: number;
  fechaFaena: string; // YYYY-MM-DD
  tipoConservacion: 'FRESCO' | 'CONGELADO';
  formaPago: 'CONTADO' | 'CREDITO' | 'TRANSFERENCIA';
  diasCredito?: number;
  bodegaDestinoId?: string;
  bodegaDestinoNombre?: string;
  usuarioId?: string;
  observaciones?: string;
  partidas: PartidaRecepcionInput[];
}

export interface LoteGeneradoItem {
  loteId: string;
  codigoLote: string;
  productoId: string;
  productoNombre: string;
  pesoNetoKg: number;
  fechaVencimiento: string;
}

export interface RecepcionMuelleResult {
  consecutivoMuelle: string;
  proveedorNombre: string;
  totalKilosNetos: number;
  totalCompraCOP: number;
  formaPago: string;
  lotesGenerados: LoteGeneradoItem[];
  cuentaPorPagarId?: string;
  movimientoCajaId?: string;
  createdAt: string;
}

export interface RecepcionMuelleRegistro extends RecepcionMuelleResult {
  proveedorId: string;
  proveedorNit: string;
  placaVehiculo: string;
  conductorNombre: string;
  temperaturaCava: number;
  fechaFaena: string;
  tipoConservacion: 'FRESCO' | 'CONGELADO';
  bodegaDestinoId: string;
  bodegaDestinoNombre: string;
  observaciones?: string;
}

// Fallback en memoria
let inMemoryRecepciones: RecepcionMuelleRegistro[] = [];
let hasInitializedMemory = false;

function getStore(): RecepcionMuelleRegistro[] {
  try {
    const list = load<RecepcionMuelleRegistro[]>('dock_purchases', []);
    if (list && list.length > 0) {
      inMemoryRecepciones = list;
      hasInitializedMemory = true;
      return list;
    }
  } catch {
    // Continuar en memoria si falla localStorage
  }

  if (!hasInitializedMemory) {
    hasInitializedMemory = true;
  }
  return inMemoryRecepciones;
}

function persistStore(list: RecepcionMuelleRegistro[]): void {
  inMemoryRecepciones = [...list];
  try {
    save('dock_purchases', list);
  } catch {
    // Continuar en memoria
  }
}

export const dockPurchasesReceivingService = {
  /**
   * Limpia datos en memoria para aislamiento de pruebas
   */
  limpiarEnMemoria(): void {
    inMemoryRecepciones = [];
    hasInitializedMemory = false;
    try {
      save('dock_purchases', []);
    } catch {
      // Ignorar en testing
    }
  },

  /**
   * Obtiene el historial de recepciones en muelle registradas
   */
  obtenerHistorialRecepciones(): RecepcionMuelleRegistro[] {
    return getStore();
  },

  /**
   * Obtiene una recepción por su ID/consecutivo
   */
  obtenerRecepcionPorId(consecutivo: string): RecepcionMuelleRegistro | null {
    return getStore().find(r => r.consecutivoMuelle === consecutivo) || null;
  },

  /**
   * Orquestador transaccional que procesa la recepción completa en muelle
   */
  procesarRecepcionMuelle(input: FinalizarRecepcionMuelleInput): RecepcionMuelleResult {
    if (!input.partidas || input.partidas.length === 0) {
      throw new Error('Debe registrar al menos una partida de pesaje para finalizar la recepción.');
    }

    // 1. Validar metrología de cada partida (peso bruto > tara)
    const partidasCalculadas = input.partidas.map(p => {
      const taraCanastilla = p.taraCanastillaKg ?? 2.0;
      const taraTotal = p.cantidadCanastillas * taraCanastilla;
      if (p.pesoBrutoKg <= taraTotal) {
        throw new Error(
          `El peso bruto (${p.pesoBrutoKg} kg) de ${p.productoNombre} debe ser superior al peso de las canastillas (${taraTotal} kg).`
        );
      }

      const metrologia = calcularPesajeMuelleNeto(
        p.pesoBrutoKg,
        p.cantidadCanastillas,
        p.porcentajeHielo,
        taraCanastilla
      );

      return {
        ...p,
        taraCanastillaKg: taraCanastilla,
        pesoTaraTotalKg: metrologia.pesoTaraTotalKg,
        pesoNetoKg: metrologia.pesoNetoRealKg
      };
    });

    // 2. Liquidación total de la compra (redondeo entero COP)
    const liquidacion = calcularLiquidacionTotalMuelle(
      partidasCalculadas.map(p => ({ pesoNetoKg: p.pesoNetoKg, precioKg: p.precioKgAcordado }))
    );

    // 3. Generar consecutivo de muelle: REC-YYYYMMDD-XXXX
    const historial = getStore();
    const fechaCompacta = input.fechaFaena.replace(/-/g, '');
    const recepcionesHoy = historial.filter(r => r.consecutivoMuelle.startsWith(`REC-${fechaCompacta}-`));
    const consecutivo = String(recepcionesHoy.length + 1).padStart(4, '0');
    const consecutivoMuelle = `REC-${fechaCompacta}-${consecutivo}`;

    // 4. Calcular días de vida útil según conservación
    const diasVidaUtil = input.tipoConservacion === 'FRESCO' ? 8 : 180;
    const fechaVencimientoCalculada = calcularFechaVencimiento(input.fechaFaena, diasVidaUtil);

    // 5. Generar Lotes FEFO y registrar en inventoryService
    const bodegaDestinoId = input.bodegaDestinoId || '1';
    const bodegaDestinoNombre = input.bodegaDestinoNombre || 'Bodega Principal';
    const provPrefix = (input.proveedorId.split('-')[1] || input.proveedorId.substring(0, 4)).toUpperCase().replace(/[^A-Z0-9]/g, '');

    const lotesGenerados: LoteGeneradoItem[] = [];

    partidasCalculadas.forEach((p, idx) => {
      const secLote = String(idx + 1).padStart(4, '0');
      const codigoLote = `LOT-${fechaCompacta}-${provPrefix || 'PROV'}-${secLote}`;

      const resLote = registrarLoteFEFO({
        producto_id: p.productoId,
        sku: p.sku || p.productoId,
        numero_lote: p.loteOrigenManual ? `${codigoLote} (${p.loteOrigenManual})` : codigoLote,
        fecha_ingreso: input.fechaFaena,
        fecha_vencimiento: fechaVencimientoCalculada,
        cantidad_inicial_kg: p.pesoNetoKg,
        cantidad_disponible_kg: p.pesoNetoKg,
        bodega_id: bodegaDestinoId,
        bodega_nombre: bodegaDestinoNombre,
        costo_compra_unitario: p.precioKgAcordado,
        temperatura_almacenamiento: input.tipoConservacion === 'FRESCO' ? '0°C a 2°C' : '-18°C'
      });

      lotesGenerados.push({
        loteId: resLote.data?.id || `lote-${Date.now()}-${idx}`,
        codigoLote,
        productoId: p.productoId,
        productoNombre: p.productoNombre,
        pesoNetoKg: p.pesoNetoKg,
        fechaVencimiento: fechaVencimientoCalculada
      });
    });

    // 6. Integración Financiera: Crédito (CxP) vs Contado (Caja)
    let cuentaPorPagarId: string | undefined;
    let movimientoCajaId: string | undefined;

    if (input.formaPago === 'CREDITO') {
      const diasCredito = input.diasCredito || 15;
      const cuentaCreada = accountsPayableService.registrarCuentaPorPagar({
        recepcionMuelleId: consecutivoMuelle,
        proveedorId: input.proveedorId,
        proveedorNombre: input.proveedorNombre,
        proveedorNit: input.proveedorNit,
        montoTotal: liquidacion.totalCompraCOP,
        fechaEmision: input.fechaFaena,
        diasCredito,
        observaciones: input.observaciones || `Recepción muelle ${consecutivoMuelle} (${liquidacion.totalKilosNetos} kg)`
      });
      cuentaPorPagarId = cuentaCreada.id;
    } else if (input.formaPago === 'CONTADO') {
      // Validar si existe turno abierto en caja
      const turnosAbiertos = cashService.getTurnos().filter(t => t.estado === 'ABIERTO');
      if (turnosAbiertos.length === 0) {
        throw new Error(
          'No hay ningún turno de caja abierto para registrar el egreso de contado. Abra un turno de caja o seleccione forma de pago Crédito.'
        );
      }
      const turnoActivo = turnosAbiertos[0];
      const resMov = cashService.registrarMovimiento(
        turnoActivo.id,
        turnoActivo.cajaId,
        'EGRESO_GASTO',
        'EFECTIVO',
        liquidacion.totalCompraCOP,
        `Pago de contado compra muelle ${consecutivoMuelle} (${input.proveedorNombre})`,
        consecutivoMuelle,
        input.usuarioId || 'operario-muelle'
      );
      if (resMov.data) {
        movimientoCajaId = resMov.data.id;
      }
    }

    // 7. Persistir registro completo en historial de recepciones
    const registro: RecepcionMuelleRegistro = {
      consecutivoMuelle,
      proveedorId: input.proveedorId,
      proveedorNombre: input.proveedorNombre,
      proveedorNit: input.proveedorNit,
      placaVehiculo: input.placaVehiculo,
      conductorNombre: input.conductorNombre,
      temperaturaCava: input.temperaturaCava,
      fechaFaena: input.fechaFaena,
      tipoConservacion: input.tipoConservacion,
      bodegaDestinoId,
      bodegaDestinoNombre,
      totalKilosNetos: liquidacion.totalKilosNetos,
      totalCompraCOP: liquidacion.totalCompraCOP,
      formaPago: input.formaPago,
      lotesGenerados,
      cuentaPorPagarId,
      movimientoCajaId,
      observaciones: input.observaciones,
      createdAt: new Date().toISOString()
    };

    const nuevoHistorial = [registro, ...historial];
    persistStore(nuevoHistorial);

    return {
      consecutivoMuelle,
      proveedorNombre: input.proveedorNombre,
      totalKilosNetos: liquidacion.totalKilosNetos,
      totalCompraCOP: liquidacion.totalCompraCOP,
      formaPago: input.formaPago,
      lotesGenerados,
      cuentaPorPagarId,
      movimientoCajaId,
      createdAt: registro.createdAt
    };
  },

  /**
   * Alias asíncrono ergonómico para componentes UI (Wizards y Forms)
   */
  async finalizarRecepcion(input: FinalizarRecepcionMuelleInput): Promise<RecepcionMuelleResult> {
    return Promise.resolve(this.procesarRecepcionMuelle(input));
  }
};
