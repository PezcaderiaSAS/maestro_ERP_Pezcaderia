import { 
  Caja, 
  TurnoCaja, 
  MovimientoCaja, 
  TrasladoDinero, 
  TipoMovimientoCaja,
  MetodoPago,
  DetalleArqueo
} from '../types/cash.types';
import { ResultadoOperacion } from '../types/common.types';
import * as localDb from './localDb';
import { useWarehouseStore } from '../store/useWarehouseStore';

// Función generadora de IDs local para evitar dependencia circular con App.tsx
const generateId = (prefix: string) => {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
};

class CashService {
  // ==========================================
  // GESTIÓN DE CAJAS
  // ==========================================

  constructor() {
    this.seedCajasParaBodegas();
  }

  public seedCajasParaBodegas(): void {
    let bodegas = useWarehouseStore.getState().bodegas;
    if (bodegas.length === 0) {
      bodegas = localDb.load<any[]>('bodegas', [
        { id: '1', nombre: 'Bodega Principal', activa: true },
        { id: '2', nombre: 'Bodega Averías', activa: true }
      ]);
    }
    const cajas = localDb.load<Caja[]>('cajas', []);
    let modified = false;

    bodegas.forEach(bodega => {
      // 1. Asegurar "Caja Menor" para cada bodega
      const tieneCajaMenor = cajas.some(c => c.bodegaId === bodega.nombre && c.nombre.includes('Caja Menor'));
      if (!tieneCajaMenor) {
        cajas.push({
          id: generateId('caja'),
          bodegaId: bodega.nombre,
          nombre: `Caja Menor - ${bodega.nombre}`,
          activa: true
        });
        modified = true;
      }

      // 2. Asegurar "Caja Mayor" SOLO para la Bodega Principal
      if (bodega.id === '1' || bodega.nombre === 'Bodega Principal') {
        const tieneCajaMayor = cajas.some(c => c.bodegaId === bodega.nombre && c.nombre.includes('Caja Mayor'));
        if (!tieneCajaMayor) {
          cajas.push({
            id: generateId('caja'),
            bodegaId: bodega.nombre,
            nombre: `Caja Mayor - ${bodega.nombre}`,
            activa: true
          });
          modified = true;
        }
      }
    });

    if (modified) {
      localDb.save('cajas', cajas);
    }
  }

  public getCajas(): Caja[] {
    return localDb.load<Caja[]>('cajas', []);
  }

  public getCajasPorBodega(bodegaId: string): Caja[] {
    const cajas = this.getCajas();
    return cajas.filter(c => c.bodegaId === bodegaId && c.activa);
  }

  public guardarCaja(caja: Caja): ResultadoOperacion<Caja> {
    try {
      const cajas = this.getCajas();
      const index = cajas.findIndex(c => c.id === caja.id);
      
      if (index >= 0) {
        cajas[index] = caja;
      } else {
        cajas.push(caja);
      }
      
      localDb.save('cajas', cajas);
      return { data: caja, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Error al guardar la caja' };
    }
  }

  // ==========================================
  // GESTIÓN DE TURNOS DE CAJA
  // ==========================================

  public getTurnos(): TurnoCaja[] {
    return localDb.load<TurnoCaja[]>('turnosCaja', []);
  }

  public getTurnoActivo(cajaId: string): TurnoCaja | null {
    const turnos = this.getTurnos();
    return turnos.find(t => t.cajaId === cajaId && t.estado === 'ABIERTO') || null;
  }

  public abrirTurno(cajaId: string, cajeroId: string, baseInicial: number, detalleApertura?: DetalleArqueo): ResultadoOperacion<TurnoCaja> {
    try {
      // Verificar si la caja ya tiene un turno abierto
      const turnoActivo = this.getTurnoActivo(cajaId);
      if (turnoActivo) {
        return { data: null, error: 'La caja ya tiene un turno abierto' };
      }

      const nuevoTurno: TurnoCaja = {
        id: generateId('trn'),
        cajaId,
        cajeroId,
        fechaApertura: new Date().toISOString(),
        fechaCierre: null,
        baseInicial,
        detalleArqueoApertura: detalleApertura,
        saldoTeoricoGlobal: baseInicial,
        totalEfectivo: baseInicial,
        totalDatafono: 0,
        totalTransferencias: 0,
        saldoFisicoEfectivo: null,
        diferenciaEfectivo: null,
        estado: 'ABIERTO',
        justificacion: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: cajeroId
      };

      const turnos = this.getTurnos();
      turnos.push(nuevoTurno);
      localDb.save('turnosCaja', turnos);

      if (baseInicial > 0) {
        this.registrarMovimiento(
          nuevoTurno.id,
          cajaId,
          'INGRESO_BASE_INICIAL',
          'EFECTIVO',
          baseInicial,
          'Apertura de caja - Base Inicial',
          null,
          cajeroId
        );
      }

      return { data: nuevoTurno, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Error al abrir el turno' };
    }
  }

  public cerrarTurno(
    turnoId: string, 
    recaudoFisico: { efectivo: number; datafono: number; transferencia: number; detalleEfectivo?: DetalleArqueo }, 
    justificacion: string | null, 
    usuarioId: string
  ): ResultadoOperacion<TurnoCaja> {
    try {
      const turnos = this.getTurnos();
      const index = turnos.findIndex(t => t.id === turnoId);
      
      if (index === -1) {
        return { data: null, error: 'Turno no encontrado' };
      }

      const turno = turnos[index];
      
      if (turno.estado !== 'ABIERTO') {
        return { data: null, error: 'El turno ya se encuentra cerrado o auditado' };
      }

      const diferenciaEfectivo = recaudoFisico.efectivo - turno.totalEfectivo;
      const diferenciaDatafono = recaudoFisico.datafono - turno.totalDatafono;
      const diferenciaTransferencia = recaudoFisico.transferencia - turno.totalTransferencias;
      const diferenciaTotal = diferenciaEfectivo + diferenciaDatafono + diferenciaTransferencia;

      if (diferenciaTotal !== 0 && (!justificacion || justificacion.trim() === '')) {
        return { data: null, error: 'Debe justificar la diferencia detectada en el cuadre de caja' };
      }

      turno.saldoFisicoEfectivo = recaudoFisico.efectivo;
      turno.diferenciaEfectivo = diferenciaEfectivo;
      turno.saldoFisicoDatafono = recaudoFisico.datafono;
      turno.diferenciaDatafono = diferenciaDatafono;
      turno.saldoFisicoTransferencias = recaudoFisico.transferencia;
      turno.diferenciaTransferencias = diferenciaTransferencia;
      
      if (recaudoFisico.detalleEfectivo) {
        turno.detalleArqueoCierre = recaudoFisico.detalleEfectivo;
      }

      turno.fechaCierre = new Date().toISOString();
      turno.estado = 'CERRADO';
      turno.justificacion = justificacion;
      turno.updatedAt = new Date().toISOString();
      turno.updatedBy = usuarioId;

      turnos[index] = turno;
      localDb.save('turnosCaja', turnos);

      // Registrar movimiento de ajuste automático si hay diferencias
      const registrarAjuste = (diferencia: number, metodoPago: MetodoPago) => {
        if (diferencia !== 0) {
          const tipoAjuste: TipoMovimientoCaja = diferencia > 0 ? 'AJUSTE_SOBRANTE' : 'AJUSTE_FALTANTE';
          this.registrarMovimiento(
            turno.id, 
            turno.cajaId, 
            tipoAjuste, 
            metodoPago,
            Math.abs(diferencia), 
            `Ajuste automático de cierre: ${justificacion}`, 
            null, 
            usuarioId
          );
        }
      };

      registrarAjuste(diferenciaEfectivo, 'EFECTIVO');
      registrarAjuste(diferenciaDatafono, 'DATAFONO');
      registrarAjuste(diferenciaTransferencia, 'TRANSFERENCIA');

      return { data: turno, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Error al cerrar el turno' };
    }
  }

  // ==========================================
  // GESTIÓN DE MOVIMIENTOS
  // ==========================================

  public getMovimientos(turnoId?: string): MovimientoCaja[] {
    const todos = localDb.load<MovimientoCaja[]>('movimientosCaja', []);
    if (turnoId) {
      return todos.filter(m => m.turnoId === turnoId);
    }
    return todos;
  }

  public registrarMovimiento(
    turnoId: string,
    cajaId: string,
    tipo: TipoMovimientoCaja,
    metodoPago: MetodoPago,
    monto: number,
    concepto: string,
    referenciaId: string | null,
    usuarioId: string
  ): ResultadoOperacion<MovimientoCaja> {
    try {
      if (monto <= 0) {
        return { data: null, error: 'El monto debe ser mayor a cero' };
      }

      const turnos = this.getTurnos();
      const turnoIndex = turnos.findIndex(t => t.id === turnoId);

      if (turnoIndex === -1) {
        return { data: null, error: 'Turno no encontrado' };
      }

      const turno = turnos[turnoIndex];
      
      // Permitir ajustes de cierre incluso si está cerrado
      if (turno.estado !== 'ABIERTO' && tipo !== 'AJUSTE_FALTANTE' && tipo !== 'AJUSTE_SOBRANTE') {
        return { data: null, error: 'No se pueden registrar movimientos en un turno cerrado' };
      }

      const nuevoMovimiento: MovimientoCaja = {
        id: generateId('mov'),
        turnoId,
        cajaId,
        tipo,
        metodoPago,
        monto,
        concepto,
        referenciaId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: usuarioId
      };

      // Guardar movimiento
      const movimientos = localDb.load<MovimientoCaja[]>('movimientosCaja', []);
      movimientos.push(nuevoMovimiento);
      localDb.save('movimientosCaja', movimientos);

      // Actualizar saldos del turno (Ajustes de cierre no afectan el saldo teórico total, pero sí ajustan diferencias)
      if (tipo !== 'AJUSTE_FALTANTE' && tipo !== 'AJUSTE_SOBRANTE') {
        const esIngreso = ['INGRESO_VENTA', 'INGRESO_ABONO', 'INGRESO_TRASLADO', 'INGRESO_BASE_INICIAL'].includes(tipo);
        const modificador = esIngreso ? 1 : -1;
        const montoModificado = monto * modificador;

        turno.saldoTeoricoGlobal += montoModificado;
        if (metodoPago === 'EFECTIVO') turno.totalEfectivo += montoModificado;
        if (metodoPago === 'DATAFONO') turno.totalDatafono += montoModificado;
        if (metodoPago === 'TRANSFERENCIA') turno.totalTransferencias += montoModificado;

        turnos[turnoIndex] = turno;
        localDb.save('turnosCaja', turnos);
      }

      return { data: nuevoMovimiento, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Error al registrar el movimiento' };
    }
  }

  // ==========================================
  // TRASLADOS DE DINERO
  // ==========================================

  public getTraslados(): TrasladoDinero[] {
    return localDb.load<TrasladoDinero[]>('trasladosDinero', []);
  }

  public trasladarDinero(
    turnoOrigenId: string,
    cajaDestinoId: string,
    metodoPago: MetodoPago,
    monto: number,
    concepto: string,
    usuarioId: string
  ): ResultadoOperacion<TrasladoDinero> {
    try {
      // 1. Validar turno origen
      const turnos = this.getTurnos();
      const turnoOrigen = turnos.find(t => t.id === turnoOrigenId);
      
      if (!turnoOrigen || turnoOrigen.estado !== 'ABIERTO') {
        return { data: null, error: 'El turno de origen no es válido o no está abierto' };
      }

      // Validar fondos suficientes según el medio de pago
      const saldoDisponible = 
        metodoPago === 'EFECTIVO' ? turnoOrigen.totalEfectivo :
        metodoPago === 'DATAFONO' ? turnoOrigen.totalDatafono :
        turnoOrigen.totalTransferencias;

      if (saldoDisponible < monto) {
        return { data: null, error: `Fondos insuficientes en la caja de origen para realizar el traslado en ${metodoPago}` };
      }

      // 2. Validar turno destino
      const turnoDestino = this.getTurnoActivo(cajaDestinoId);
      if (!turnoDestino) {
        return { data: null, error: 'La caja destino no tiene un turno abierto para recibir el traslado' };
      }

      // 3. Crear registro del traslado
      const nuevoTraslado: TrasladoDinero = {
        id: generateId('tsl'),
        cajaOrigenId: turnoOrigen.cajaId,
        cajaDestinoId,
        metodoPago,
        monto,
        concepto,
        estado: 'COMPLETADO',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: usuarioId
      };

      const traslados = this.getTraslados();
      traslados.push(nuevoTraslado);
      localDb.save('trasladosDinero', traslados);

      // 4. Ejecutar movimientos (Asegurar atomicidad manual)
      // Egreso en caja origen
      this.registrarMovimiento(
        turnoOrigen.id,
        turnoOrigen.cajaId,
        'EGRESO_TRASLADO',
        metodoPago,
        monto,
        `Traslado saliente: ${concepto}`,
        nuevoTraslado.id,
        usuarioId
      );

      // Ingreso en caja destino
      this.registrarMovimiento(
        turnoDestino.id,
        turnoDestino.cajaId,
        'INGRESO_TRASLADO',
        metodoPago,
        monto,
        `Traslado entrante: ${concepto}`,
        nuevoTraslado.id,
        usuarioId
      );

      return { data: nuevoTraslado, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Error al procesar el traslado' };
    }
  }
}

export const cashService = new CashService();
