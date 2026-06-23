import { 
  Caja, 
  TurnoCaja, 
  MovimientoCaja, 
  TrasladoDinero, 
  TipoMovimientoCaja,
  MetodoPago
} from '../types/cash.types';
import { ResultadoOperacion } from '../types/common.types';
import * as localDb from './localDb';
import { generateId } from '../App';

class CashService {
  // ==========================================
  // GESTIÓN DE CAJAS
  // ==========================================

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
      return { exito: true, mensaje: 'Caja guardada con éxito', datos: caja };
    } catch (error: any) {
      return { exito: false, mensaje: error.message || 'Error al guardar la caja' };
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

  public abrirTurno(cajaId: string, cajeroId: string, baseInicial: number): ResultadoOperacion<TurnoCaja> {
    try {
      // Verificar si la caja ya tiene un turno abierto
      const turnoActivo = this.getTurnoActivo(cajaId);
      if (turnoActivo) {
        return { exito: false, mensaje: 'La caja ya tiene un turno abierto' };
      }

      const nuevoTurno: TurnoCaja = {
        id: generateId('trn'),
        cajaId,
        cajeroId,
        fechaApertura: new Date().toISOString(),
        fechaCierre: null,
        baseInicial,
        saldoTeoricoGlobal: baseInicial,
        totalEfectivo: baseInicial,
        totalDatafono: 0,
        totalTransferencias: 0,
        saldoFisicoEfectivo: null,
        diferenciaEfectivo: null,
        estado: 'ABIERTO',
        justificacion: null,
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
        creadoPor: cajeroId
      };

      const turnos = this.getTurnos();
      turnos.push(nuevoTurno);
      localDb.save('turnosCaja', turnos);

      return { exito: true, mensaje: 'Turno de caja abierto correctamente', datos: nuevoTurno };
    } catch (error: any) {
      return { exito: false, mensaje: error.message || 'Error al abrir el turno' };
    }
  }

  public cerrarTurno(turnoId: string, saldoFisicoEfectivo: number, justificacion: string | null, usuarioId: string): ResultadoOperacion<TurnoCaja> {
    try {
      const turnos = this.getTurnos();
      const index = turnos.findIndex(t => t.id === turnoId);
      
      if (index === -1) {
        return { exito: false, mensaje: 'Turno no encontrado' };
      }

      const turno = turnos[index];
      
      if (turno.estado !== 'ABIERTO') {
        return { exito: false, mensaje: 'El turno ya se encuentra cerrado o auditado' };
      }

      const diferencia = saldoFisicoEfectivo - turno.totalEfectivo;

      if (diferencia !== 0 && (!justificacion || justificacion.trim() === '')) {
        return { exito: false, mensaje: 'Debe justificar la diferencia detectada en el cuadre de caja' };
      }

      turno.saldoFisicoEfectivo = saldoFisicoEfectivo;
      turno.diferenciaEfectivo = diferencia;
      turno.fechaCierre = new Date().toISOString();
      turno.estado = 'CERRADO';
      turno.justificacion = justificacion;
      turno.actualizadoEn = new Date().toISOString();
      turno.actualizadoPor = usuarioId;

      turnos[index] = turno;
      localDb.save('turnosCaja', turnos);

      // Registrar movimiento de ajuste automático si hay diferencia
      if (diferencia !== 0) {
        const tipoAjuste: TipoMovimientoCaja = diferencia > 0 ? 'AJUSTE_SOBRANTE' : 'AJUSTE_FALTANTE';
        this.registrarMovimiento(
          turno.id, 
          turno.cajaId, 
          tipoAjuste, 
          'EFECTIVO',
          Math.abs(diferencia), 
          `Ajuste automático de cierre: ${justificacion}`, 
          null, 
          usuarioId
        );
      }

      return { exito: true, mensaje: 'Turno cerrado con éxito', datos: turno };
    } catch (error: any) {
      return { exito: false, mensaje: error.message || 'Error al cerrar el turno' };
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
        return { exito: false, mensaje: 'El monto debe ser mayor a cero' };
      }

      const turnos = this.getTurnos();
      const turnoIndex = turnos.findIndex(t => t.id === turnoId);

      if (turnoIndex === -1) {
        return { exito: false, mensaje: 'Turno no encontrado' };
      }

      const turno = turnos[turnoIndex];
      
      // Permitir ajustes de cierre incluso si está cerrado
      if (turno.estado !== 'ABIERTO' && tipo !== 'AJUSTE_FALTANTE' && tipo !== 'AJUSTE_SOBRANTE') {
        return { exito: false, mensaje: 'No se pueden registrar movimientos en un turno cerrado' };
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
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
        creadoPor: usuarioId
      };

      // Guardar movimiento
      const movimientos = localDb.load<MovimientoCaja[]>('movimientosCaja', []);
      movimientos.push(nuevoMovimiento);
      localDb.save('movimientosCaja', movimientos);

      // Actualizar saldos del turno (Ajustes de cierre no afectan el saldo teórico total, pero sí ajustan diferencias)
      if (tipo !== 'AJUSTE_FALTANTE' && tipo !== 'AJUSTE_SOBRANTE') {
        const esIngreso = ['INGRESO_VENTA', 'INGRESO_ABONO', 'INGRESO_TRASLADO'].includes(tipo);
        const modificador = esIngreso ? 1 : -1;
        const montoModificado = monto * modificador;

        turno.saldoTeoricoGlobal += montoModificado;
        if (metodoPago === 'EFECTIVO') turno.totalEfectivo += montoModificado;
        if (metodoPago === 'DATAFONO') turno.totalDatafono += montoModificado;
        if (metodoPago === 'TRANSFERENCIA') turno.totalTransferencias += montoModificado;

        turnos[turnoIndex] = turno;
        localDb.save('turnosCaja', turnos);
      }

      return { exito: true, mensaje: 'Movimiento registrado con éxito', datos: nuevoMovimiento };
    } catch (error: any) {
      return { exito: false, mensaje: error.message || 'Error al registrar el movimiento' };
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
        return { exito: false, mensaje: 'El turno de origen no es válido o no está abierto' };
      }

      // Validar fondos suficientes según el medio de pago
      const saldoDisponible = 
        metodoPago === 'EFECTIVO' ? turnoOrigen.totalEfectivo :
        metodoPago === 'DATAFONO' ? turnoOrigen.totalDatafono :
        turnoOrigen.totalTransferencias;

      if (saldoDisponible < monto) {
        return { exito: false, mensaje: `Fondos insuficientes en la caja de origen para realizar el traslado en ${metodoPago}` };
      }

      // 2. Validar turno destino
      const turnoDestino = this.getTurnoActivo(cajaDestinoId);
      if (!turnoDestino) {
        return { exito: false, mensaje: 'La caja destino no tiene un turno abierto para recibir el traslado' };
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
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
        creadoPor: usuarioId
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

      return { exito: true, mensaje: 'Traslado completado con éxito', datos: nuevoTraslado };
    } catch (error: any) {
      return { exito: false, mensaje: error.message || 'Error al procesar el traslado' };
    }
  }
}

export const cashService = new CashService();
