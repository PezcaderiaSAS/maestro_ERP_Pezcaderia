// src/services/multiVendorCashService.ts
// Servicio de Concurrencia y Liquidación de Caja Única Multivendedor
// Emula y orquesta la RPC atómica PostgreSQL: registrar_venta_pos_concurrente()

import { validarVentaConcurrente } from '../schemas/multiVendorCash.schema';
import type {
  VentaConcurrentePayload,
  ResultadoVentaConcurrente,
  TurnoCentralCompartido,
} from '../types/multiVendorCash.types';

export interface MovimientoCajaConcurrente {
  id: string;
  tenantId: string;
  turnoId: string;
  ventaId: string;
  terminalId: string;
  vendedorId: string;
  tipo: 'INGRESO_VENTA' | 'EGRESO' | 'TRASLADO';
  metodoPago: 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA' | 'CREDITO';
  monto: number;
  consecutivoFactura: string;
  createdAt: string;
}

export class MultiVendorCashService {
  private turnos = new Map<string, TurnoCentralCompartido>();
  private movimientosPorTurno = new Map<string, MovimientoCajaConcurrente[]>();
  private idempotencyStore = new Map<string, ResultadoVentaConcurrente>();
  private stockStore = new Map<string, number>();
  private globalSeqFactura = 0;

  // Lock atómico por producto para emular SELECT FOR UPDATE
  private productLocks = new Map<string, Promise<void>>();

  /**
   * Abre un turno central de caja común a nivel de sucursal
   */
  public abrirTurnoCentral(turno: TurnoCentralCompartido): void {
    this.turnos.set(turno.id, {
      ...turno,
      estado: 'ABIERTO',
      totalVentasEfectivo: 0,
      totalVentasElectronicas: 0,
      movimientosCount: 0,
    });
    if (!this.movimientosPorTurno.has(turno.id)) {
      this.movimientosPorTurno.set(turno.id, []);
    }
  }

  /**
   * Cierra el turno central de caja
   */
  public cerrarTurnoCentral(turnoId: string): void {
    const turno = this.turnos.get(turnoId);
    if (turno) {
      turno.estado = 'CERRADO';
      turno.fechaCierre = new Date().toISOString();
    }
  }

  /**
   * Obtiene la información del turno central activo
   */
  public obtenerTurno(turnoId: string): TurnoCentralCompartido | null {
    return this.turnos.get(turnoId) || null;
  }

  /**
   * Inicializa o ajusta el stock de un ítem para pruebas
   */
  public seedStock(productoId: string, cantidad: number): void {
    this.stockStore.set(productoId, Math.max(0, cantidad));
  }

  /**
   * Consulta el stock disponible
   */
  public obtenerStock(productoId: string): number {
    return this.stockStore.get(productoId) ?? 0;
  }

  /**
   * Orquesta la RPC atómica `registrar_venta_pos_concurrente`
   * Maneja aislamiento, control de idempotencia, SELECT FOR UPDATE en stock y actualización de ledger inmutable.
   */
  public async registrarVentaConcurrente(
    payload: VentaConcurrentePayload
  ): Promise<ResultadoVentaConcurrente> {
    // 1. Verificación de Idempotencia
    if (this.idempotencyStore.has(payload.idempotencyKey)) {
      return this.idempotencyStore.get(payload.idempotencyKey)!;
    }

    // 2. Validación de Contrato Zod
    const validation = validarVentaConcurrente(payload);
    if (!validation.success || !validation.data) {
      return {
        ok: false,
        error: validation.error || 'Payload de venta inválido',
        codigoError: 'CONCURRENCY_ERROR',
      };
    }

    // 3. Verificación de Turno de Caja Central
    const turno = this.turnos.get(payload.turnoId);
    if (!turno || turno.estado !== 'ABIERTO') {
      return {
        ok: false,
        error: `El turno de caja central (${payload.turnoId}) no existe o está cerrado. Se requiere apertura centralizada.`,
        codigoError: 'CAJA_CERRADA',
      };
    }

    // 4. Bloqueo Pesimista Atómico de Stock (SELECT FOR UPDATE)
    // Se adquieren locks secuenciales ordenados por ID de producto para evitar Deadlocks
    const itemIds = [...new Set(payload.items.map((i) => i.productoId))].sort();
    
    // Función de ejecución crítica atómica
    const executeCriticalSection = async (): Promise<ResultadoVentaConcurrente> => {
      // 4.1 Validar existencia y stock suficiente
      for (const item of payload.items) {
        const stockActual = this.stockStore.get(item.productoId) ?? 0;
        if (stockActual < item.cantidad) {
          return {
            ok: false,
            error: `Stock insuficiente para ${item.nombre}. Disponible: ${stockActual}, Solicitado: ${item.cantidad}`,
            codigoError: 'STOCK_INSUFICIENTE',
          };
        }
      }

      // 4.2 Deducir stock de forma atómica
      for (const item of payload.items) {
        const stockActual = this.stockStore.get(item.productoId) ?? 0;
        this.stockStore.set(item.productoId, stockActual - item.cantidad);
      }

      // 4.3 Generar Consecutivo de Factura Atómico vía Secuencia (nextval)
      this.globalSeqFactura += 1;
      const numFormatted = String(this.globalSeqFactura).padStart(6, '0');
      const consecutivoFactura = `FAC-${numFormatted}`;
      const ventaId = `vta-${payload.terminalId.toLowerCase()}-${this.globalSeqFactura}`;

      // 4.4 Calcular desglose de pagos
      const efectivoAfectado = payload.pagos
        .filter((p) => p.metodoPago === 'EFECTIVO')
        .reduce((sum, p) => sum + p.monto, 0);

      const electronicoAfectado = payload.pagos
        .filter((p) => p.metodoPago !== 'EFECTIVO')
        .reduce((sum, p) => sum + p.monto, 0);

      // 4.5 Insertar en el Ledger Inmutable (movimientos_caja)
      const movimientosTurno = this.movimientosPorTurno.get(payload.turnoId) || [];
      const nuevoMovimiento: MovimientoCajaConcurrente = {
        id: `mov-${Date.now()}-${this.globalSeqFactura}`,
        tenantId: payload.tenantId,
        turnoId: payload.turnoId,
        ventaId,
        terminalId: payload.terminalId,
        vendedorId: payload.vendedorId,
        tipo: 'INGRESO_VENTA',
        metodoPago: payload.pagos[0]?.metodoPago || 'EFECTIVO',
        monto: payload.montoTotal,
        consecutivoFactura,
        createdAt: payload.fechaLocal || new Date().toISOString(),
      };

      movimientosTurno.push(nuevoMovimiento);
      this.movimientosPorTurno.set(payload.turnoId, movimientosTurno);

      // 4.6 Calcular saldo actualizado en tiempo real
      const saldoActualizado = this.obtenerSaldoCajaAgregado(payload.turnoId);

      // Actualizar contadores del turno central
      turno.totalVentasEfectivo = (turno.totalVentasEfectivo || 0) + efectivoAfectado;
      turno.totalVentasElectronicas = (turno.totalVentasElectronicas || 0) + electronicoAfectado;
      turno.movimientosCount = movimientosTurno.length;

      const resultadoExitoso: ResultadoVentaConcurrente = {
        ok: true,
        ventaId,
        consecutivoFactura,
        turnoId: payload.turnoId,
        montoTotal: payload.montoTotal,
        efectivoCajaAfectado: efectivoAfectado,
        saldoTurnoActualizado: saldoActualizado,
        fechaEmision: nuevoMovimiento.createdAt,
      };

      // Guardar en almacén de idempotencia
      this.idempotencyStore.set(payload.idempotencyKey, resultadoExitoso);

      return resultadoExitoso;
    };

    // Serialización atómica para los productos involucrados
    return this.withProductsLock(itemIds, executeCriticalSection);
  }

  /**
   * Computa el saldo agregado vivo de la caja central: baseInicial + SUM(efectivo)
   */
  public obtenerSaldoCajaAgregado(turnoId: string): number {
    const turno = this.turnos.get(turnoId);
    if (!turno) return 0;

    const movimientos = this.movimientosPorTurno.get(turnoId) || [];
    const totalIngresosEfectivo = movimientos
      .filter((m) => m.tipo === 'INGRESO_VENTA' && m.metodoPago === 'EFECTIVO')
      .reduce((sum, m) => sum + m.monto, 0);

    return turno.baseInicial + totalIngresosEfectivo;
  }

  /**
   * Obtiene el listado de movimientos de auditoría para un turno
   */
  public obtenerMovimientosTurno(turnoId: string): MovimientoCajaConcurrente[] {
    return [...(this.movimientosPorTurno.get(turnoId) || [])];
  }

  /**
   * Mutex granular para emular SELECT FOR UPDATE sobre productos de forma determinista
   */
  private async withProductsLock<T>(
    productIds: string[],
    action: () => Promise<T>
  ): Promise<T> {
    // Si no hay productos, ejecuta directamente
    if (productIds.length === 0) return action();

    // Esperar a que los locks anteriores de estos productos se liberen
    const currentLocks = productIds.map((id) => this.productLocks.get(id) || Promise.resolve());
    await Promise.all(currentLocks);

    let releaseLock!: () => void;
    const newLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    for (const id of productIds) {
      this.productLocks.set(id, newLock);
    }

    try {
      return await action();
    } finally {
      releaseLock();
    }
  }
}

export const multiVendorCashService = new MultiVendorCashService();
