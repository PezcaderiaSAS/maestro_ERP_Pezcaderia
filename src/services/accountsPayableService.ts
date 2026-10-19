import { load, save } from './localDb';
import type {
  CuentaPorPagar,
  RegistrarCuentaPorPagarInput,
  RegistrarAbonoInput,
  AbonoCuentaPorPagar
} from '../types/accountsPayable.types';

/**
 * Calcula la fecha de vencimiento sumando días de crédito en tiempo local
 * (Cumple con directriz estricta de no usar UTC para fechas comerciales)
 */
export function calcularFechaVencimiento(fechaEmisionStr: string, diasCredito: number): string {
  const [year, month, day] = fechaEmisionStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  fecha.setDate(fecha.getDate() + diasCredito);

  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Fallback en memoria para tests y SSR
let inMemoryStore: CuentaPorPagar[] = [];
let hasInitializedMemory = false;

function getStore(): CuentaPorPagar[] {
  try {
    const list = load<CuentaPorPagar[]>('cuentasPorPagar', []);
    if (list && list.length > 0) {
      inMemoryStore = list;
      hasInitializedMemory = true;
      return list;
    }
  } catch {
    // Si localStorage falla, usar fallback en memoria
  }

  if (!hasInitializedMemory) {
    hasInitializedMemory = true;
  }
  return inMemoryStore;
}

function persistStore(list: CuentaPorPagar[]): void {
  inMemoryStore = [...list];
  try {
    save('cuentasPorPagar', list);
  } catch {
    // Continuar en memoria si localStorage falla
  }
}

export const accountsPayableService = {
  /**
   * Limpia datos en memoria para aislamiento de pruebas
   */
  limpiarEnMemoria(): void {
    inMemoryStore = [];
    hasInitializedMemory = false;
    try {
      save('cuentasPorPagar', []);
    } catch {
      // Ignorar en testing
    }
  },

  /**
   * Obtiene todas las cuentas por pagar registradas
   */
  obtenerTodas(): CuentaPorPagar[] {
    return getStore();
  },

  /**
   * Obtiene las cuentas con saldo pendiente por pagar
   */
  obtenerPendientes(): CuentaPorPagar[] {
    return getStore().filter(c => c.saldoPendiente > 0 && c.estado !== 'ANULADO');
  },

  /**
   * Obtiene las cuentas de un proveedor específico
   */
  obtenerPorProveedor(proveedorId: string): CuentaPorPagar[] {
    return getStore().filter(c => c.proveedorId === proveedorId);
  },

  /**
   * Registra una nueva cuenta por pagar originada en recepción de muelle o compra a crédito
   */
  registrarCuentaPorPagar(input: RegistrarCuentaPorPagarInput): CuentaPorPagar {
    const list = getStore();
    const fechaEmision = input.fechaEmision;
    const diasCredito = Math.max(1, input.diasCredito);
    const fechaVencimiento = calcularFechaVencimiento(fechaEmision, diasCredito);
    const montoEntero = Math.round(input.montoTotal);

    // Generar ID correlativo: CXP-YYYYMMDD-XXXX
    const fechaCompacta = fechaEmision.replace(/-/g, '');
    const hoyCuentas = list.filter(c => c.id.startsWith(`CXP-${fechaCompacta}-`));
    const consecutivo = String(hoyCuentas.length + 1).padStart(4, '0');
    const id = `CXP-${fechaCompacta}-${consecutivo}`;

    const nuevaCuenta: CuentaPorPagar = {
      id,
      recepcionMuelleId: input.recepcionMuelleId,
      numeroFacturaProveedor: input.numeroFacturaProveedor,
      proveedorId: input.proveedorId,
      proveedorNombre: input.proveedorNombre,
      proveedorNit: input.proveedorNit,
      montoTotal: montoEntero,
      saldoPendiente: montoEntero,
      fechaEmision,
      fechaVencimiento,
      diasCredito,
      estado: 'PENDIENTE',
      abonos: [],
      observaciones: input.observaciones,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [nuevaCuenta, ...list];
    persistStore(updated);
    return nuevaCuenta;
  },

  /**
   * Registra un abono a una cuenta por pagar, recalculando saldo y estado
   */
  registrarAbono(input: RegistrarAbonoInput): CuentaPorPagar {
    const list = getStore();
    const index = list.findIndex(c => c.id === input.cuentaPorPagarId);

    if (index === -1) {
      throw new Error(`Cuenta por pagar no encontrada con ID: ${input.cuentaPorPagarId}`);
    }

    const cuenta = list[index];

    if (input.monto <= 0) {
      throw new Error('El monto del abono debe ser mayor a cero.');
    }

    const montoAbono = Math.round(input.monto);

    if (montoAbono > cuenta.saldoPendiente) {
      throw new Error(
        `El abono ($${montoAbono.toLocaleString('es-CO')}) no puede superar el saldo pendiente ($${cuenta.saldoPendiente.toLocaleString('es-CO')}).`
      );
    }

    const nuevoSaldo = cuenta.saldoPendiente - montoAbono;
    const nuevoEstado = nuevoSaldo === 0 ? 'PAGADO' : 'PAGADO_PARCIAL';

    const nuevoAbono: AbonoCuentaPorPagar = {
      id: `ABN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cuentaPorPagarId: cuenta.id,
      fecha: new Date().toISOString(),
      monto: montoAbono,
      medioPago: input.medioPago,
      referenciaComprobante: input.referenciaComprobante,
      bancoOrigen: input.bancoOrigen,
      usuarioId: input.usuarioId,
      notas: input.notas,
      createdAt: new Date().toISOString()
    };

    const cuentaActualizada: CuentaPorPagar = {
      ...cuenta,
      saldoPendiente: nuevoSaldo,
      estado: nuevoEstado,
      abonos: [...cuenta.abonos, nuevoAbono],
      updatedAt: new Date().toISOString()
    };

    list[index] = cuentaActualizada;
    persistStore(list);
    return cuentaActualizada;
  },

  /**
   * Actualiza estados de vencimiento contra la fecha local actual
   */
  actualizarEstadosVencimiento(): void {
    const list = getStore();
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    let huboCambios = false;
    const actualizadas = list.map(c => {
      if (c.saldoPendiente > 0 && c.estado !== 'ANULADO') {
        if (c.fechaVencimiento < hoyStr && c.estado !== 'VENCIDO') {
          huboCambios = true;
          return { ...c, estado: 'VENCIDO' as const, updatedAt: new Date().toISOString() };
        }
      }
      return c;
    });

    if (huboCambios) {
      persistStore(actualizadas);
    }
  }
};
