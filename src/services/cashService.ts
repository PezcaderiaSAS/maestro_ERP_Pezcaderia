import { 
  Caja, TurnoCaja, MovimientoCaja, TrasladoDinero,
  TipoMovimientoCaja, MetodoPago, DetalleArqueo
} from '../types/cash.types';
import { ResultadoOperacion } from '../types/common.types';
import * as localDb from './localDb';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from './LocalDataService';
import { useWarehouseStore } from '../store/useWarehouseStore';
import { useCashStore } from '../store/useCashStore';

const generateId = (prefix: string) => {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
};

// ── Legacy sync CashService (preservado para compatibilidad) ──
class LegacyCashService {
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

    // Migrar cajas existentes que usen el nombre en lugar del id
    cajas.forEach(c => {
      const bodegaMatched = bodegas.find(b => b.nombre === c.bodegaId);
      if (bodegaMatched) {
        c.bodegaId = bodegaMatched.id;
        modified = true;
      }
    });

    bodegas.forEach(bodega => {
      const tieneCajaMenor = cajas.some(c => c.bodegaId === bodega.id && c.nombre.includes('Caja Menor'));
      if (!tieneCajaMenor) {
        cajas.push({ id: generateId('caja'), bodegaId: bodega.id, nombre: `Caja Menor - ${bodega.nombre}`, activa: true });
        modified = true;
      }

      if (bodega.id === '1' || bodega.nombre === 'Bodega Principal') {
        const tieneCajaMayor = cajas.some(c => c.bodegaId === bodega.id && c.nombre.includes('Caja Mayor'));
        if (!tieneCajaMayor) {
          cajas.push({ id: generateId('caja'), bodegaId: bodega.id, nombre: `Caja Mayor - ${bodega.nombre}`, activa: true });
          modified = true;
        }
      }
    });

    if (modified) localDb.save('cajas', cajas);
  }

  public getCajas(): Caja[] { return localDb.load<Caja[]>('cajas', []); }
  public getCajasPorBodega(bodegaId: string): Caja[] { return this.getCajas().filter(c => c.bodegaId === bodegaId && c.activa); }

  public guardarCaja(caja: Caja): ResultadoOperacion<Caja> {
    try {
      const cajas = this.getCajas();
      const index = cajas.findIndex(c => c.id === caja.id);
      if (index >= 0) cajas[index] = caja;
      else cajas.push(caja);
      localDb.save('cajas', cajas);
      return { data: caja, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Error al guardar la caja' };
    }
  }

  public getTurnos(): TurnoCaja[] { return localDb.load<TurnoCaja[]>('turnosCaja', []); }
  public getTurnoActivo(cajaId: string): TurnoCaja | null {
    return this.getTurnos().find(t => t.cajaId === cajaId && t.estado === 'ABIERTO') || null;
  }

  public abrirTurno(cajaId: string, cajeroId: string, baseInicial: number, detalleApertura?: DetalleArqueo, notasApertura?: string): ResultadoOperacion<TurnoCaja> {
    try {
      const turnoActivo = this.getTurnoActivo(cajaId);
      if (turnoActivo) return { data: null, error: 'La caja ya tiene un turno abierto' };

      const nuevoTurno: TurnoCaja = {
        id: generateId('trn'), cajaId, cajeroId,
        fechaApertura: new Date().toISOString(), fechaCierre: null, baseInicial,
        detalleArqueoApertura: detalleApertura, saldoTeoricoGlobal: baseInicial,
        totalEfectivo: baseInicial, totalDatafono: 0, totalTransferencias: 0,
        saldoFisicoEfectivo: null, diferenciaEfectivo: null, estado: 'ABIERTO',
        justificacion: null, notasApertura: notasApertura || null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: cajeroId
      };

      const turnos = this.getTurnos();
      turnos.push(nuevoTurno);
      localDb.save('turnosCaja', turnos);

      if (baseInicial > 0) {
        this.registrarMovimiento(nuevoTurno.id, cajaId, 'INGRESO_BASE_INICIAL', 'EFECTIVO', baseInicial, 'Apertura de caja - Base Inicial', null, cajeroId);
      }

      useCashStore.getState().setTurnoActivo(nuevoTurno);
      return { data: nuevoTurno, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Error al abrir el turno' };
    }
  }

  public cerrarTurno(turnoId: string, recaudoFisico: { efectivo: number; datafono: number; transferencia: number; detalleEfectivo?: DetalleArqueo }, justificacion: string | null, usuarioId: string): ResultadoOperacion<TurnoCaja> {
    try {
      const turnos = this.getTurnos();
      const index = turnos.findIndex(t => t.id === turnoId);
      if (index === -1) return { data: null, error: 'Turno no encontrado' };

      const turno = turnos[index];
      if (turno.estado !== 'ABIERTO') return { data: null, error: 'El turno ya se encuentra cerrado o auditado' };

      const diferenciaEfectivo = recaudoFisico.efectivo - turno.totalEfectivo;
      const diferenciaDatafono = recaudoFisico.datafono - turno.totalDatafono;
      const diferenciaTransferencia = recaudoFisico.transferencia - turno.totalTransferencias;

      if ((diferenciaEfectivo + diferenciaDatafono + diferenciaTransferencia) !== 0 && (!justificacion || justificacion.trim() === '')) {
        return { data: null, error: 'Debe justificar la diferencia detectada en el cuadre de caja' };
      }

      turno.saldoFisicoEfectivo = recaudoFisico.efectivo;
      turno.diferenciaEfectivo = diferenciaEfectivo;
      turno.saldoFisicoDatafono = recaudoFisico.datafono;
      turno.diferenciaDatafono = diferenciaDatafono;
      turno.saldoFisicoTransferencias = recaudoFisico.transferencia;
      turno.diferenciaTransferencias = diferenciaTransferencia;

      if (recaudoFisico.detalleEfectivo) turno.detalleArqueoCierre = recaudoFisico.detalleEfectivo;

      turno.fechaCierre = new Date().toISOString();
      turno.estado = 'CERRADO';
      turno.justificacion = justificacion;
      turno.updatedAt = new Date().toISOString();
      turno.updatedBy = usuarioId;
      turnos[index] = turno;
      localDb.save('turnosCaja', turnos);

      const registrarAjuste = (diferencia: number, metodoPago: MetodoPago) => {
        if (diferencia !== 0) {
          const tipoAjuste: TipoMovimientoCaja = diferencia > 0 ? 'AJUSTE_SOBRANTE' : 'AJUSTE_FALTANTE';
          this.registrarMovimiento(turno.id, turno.cajaId, tipoAjuste, metodoPago, Math.abs(diferencia), `Ajuste automático de cierre: ${justificacion}`, null, usuarioId);
        }
      };
      registrarAjuste(diferenciaEfectivo, 'EFECTIVO');
      registrarAjuste(diferenciaDatafono, 'DATAFONO');
      registrarAjuste(diferenciaTransferencia, 'TRANSFERENCIA');

      useCashStore.getState().clearTurnoActivo();
      return { data: turno, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Error al cerrar el turno' };
    }
  }

  public getMovimientos(turnoId?: string): MovimientoCaja[] {
    const todos = localDb.load<MovimientoCaja[]>('movimientosCaja', []);
    return turnoId ? todos.filter(m => m.turnoId === turnoId) : todos;
  }

  public registrarMovimiento(turnoId: string, cajaId: string, tipo: TipoMovimientoCaja, metodoPago: MetodoPago, monto: number, concepto: string, referenciaId: string | null, usuarioId: string): ResultadoOperacion<MovimientoCaja> {
    try {
      if (monto <= 0) return { data: null, error: 'El monto debe ser mayor a cero' };

      const turnos = this.getTurnos();
      const turnoIndex = turnos.findIndex(t => t.id === turnoId);
      if (turnoIndex === -1) return { data: null, error: 'Turno no encontrado' };

      const turno = turnos[turnoIndex];
      if (turno.estado !== 'ABIERTO' && tipo !== 'AJUSTE_FALTANTE' && tipo !== 'AJUSTE_SOBRANTE') {
        return { data: null, error: 'No se pueden registrar movimientos en un turno cerrado' };
      }

      const nuevoMovimiento: MovimientoCaja = {
        id: generateId('mov'), turnoId, cajaId, tipo, metodoPago, monto, concepto, referenciaId,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: usuarioId
      };

      const movimientos = localDb.load<MovimientoCaja[]>('movimientosCaja', []);
      movimientos.push(nuevoMovimiento);
      localDb.save('movimientosCaja', movimientos);

      if (tipo !== 'AJUSTE_FALTANTE' && tipo !== 'AJUSTE_SOBRANTE') {
        const esIngreso = ['INGRESO_VENTA', 'INGRESO_ABONO', 'INGRESO_TRASLADO', 'INGRESO_BASE_INICIAL'].includes(tipo);
        const montoModificado = monto * (esIngreso ? 1 : -1);
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

  public getTraslados(): TrasladoDinero[] { return localDb.load<TrasladoDinero[]>('trasladosDinero', []); }

  public trasladarDinero(turnoOrigenId: string, cajaDestinoId: string, metodoPago: MetodoPago, monto: number, concepto: string, usuarioId: string): ResultadoOperacion<TrasladoDinero> {
    try {
      const turnos = this.getTurnos();
      const turnoOrigen = turnos.find(t => t.id === turnoOrigenId);
      if (!turnoOrigen || turnoOrigen.estado !== 'ABIERTO') return { data: null, error: 'El turno de origen no es válido o no está abierto' };

      const saldoDisponible = metodoPago === 'EFECTIVO' ? turnoOrigen.totalEfectivo : metodoPago === 'DATAFONO' ? turnoOrigen.totalDatafono : turnoOrigen.totalTransferencias;
      if (saldoDisponible < monto) return { data: null, error: `Fondos insuficientes en la caja de origen para realizar el traslado en ${metodoPago}` };

      const turnoDestino = this.getTurnoActivo(cajaDestinoId);
      if (!turnoDestino) return { data: null, error: 'La caja destino no tiene un turno abierto para recibir el traslado' };

      const nuevoTraslado: TrasladoDinero = {
        id: generateId('tsl'), cajaOrigenId: turnoOrigen.cajaId, cajaDestinoId, metodoPago, monto, concepto,
        estado: 'COMPLETADO', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: usuarioId
      };

      const traslados = this.getTraslados();
      traslados.push(nuevoTraslado);
      localDb.save('trasladosDinero', traslados);

      this.registrarMovimiento(turnoOrigen.id, turnoOrigen.cajaId, 'EGRESO_TRASLADO', metodoPago, monto, `Traslado saliente: ${concepto}`, nuevoTraslado.id, usuarioId);
      this.registrarMovimiento(turnoDestino.id, turnoDestino.cajaId, 'INGRESO_TRASLADO', metodoPago, monto, `Traslado entrante: ${concepto}`, nuevoTraslado.id, usuarioId);

      return { data: nuevoTraslado, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Error al procesar el traslado' };
    }
  }
}

export const cashService = new LegacyCashService();

// ── Nueva API async basada en IDataService ──
export class CashService {
  constructor(private dataService: IDataService = new LocalDataService()) {}

  async getCajas(): Promise<Caja[]> { return this.dataService.getAll<Caja>('cajas'); }
  async getCajasPorBodega(bodegaId: string): Promise<Caja[]> {
    const cajas = await this.getCajas();
    return cajas.filter(c => c.bodegaId === bodegaId && c.activa);
  }

  async guardarCaja(caja: Caja): Promise<ResultadoOperacion<Caja>> {
    try { await this.dataService.create('cajas', caja); return { data: caja, error: null }; }
    catch (e: any) { return { data: null, error: e.message || 'Error al guardar la caja' }; }
  }

  async abrirTurno(cajaId: string, cajeroId: string, baseInicial: number, detalleApertura?: DetalleArqueo, notasApertura?: string): Promise<ResultadoOperacion<TurnoCaja>> {
    try {
      const turnos = await this.dataService.getAll<TurnoCaja>('turnos_caja');
      const activo = turnos.find(t => t.cajaId === cajaId && t.estado === 'ABIERTO');
      if (activo) return { data: null, error: 'La caja ya tiene un turno abierto' };

      const nuevoTurno: TurnoCaja = {
        id: generateId('trn'), cajaId, cajeroId,
        fechaApertura: new Date().toISOString(), fechaCierre: null, baseInicial,
        detalleArqueoApertura: detalleApertura, saldoTeoricoGlobal: baseInicial,
        totalEfectivo: baseInicial, totalDatafono: 0, totalTransferencias: 0,
        saldoFisicoEfectivo: null, diferenciaEfectivo: null, estado: 'ABIERTO',
        justificacion: null, notasApertura: notasApertura || null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: cajeroId,
      };

      await this.dataService.create('turnos_caja', nuevoTurno);
      if (baseInicial > 0) {
        await this.registrarMovimiento(nuevoTurno.id, cajaId, 'INGRESO_BASE_INICIAL', 'EFECTIVO', baseInicial, 'Apertura de caja - Base Inicial', null);
      }

      useCashStore.getState().setTurnoActivo(nuevoTurno);
      return { data: nuevoTurno, error: null };
    } catch (e: any) { return { data: null, error: e.message || 'Error al abrir el turno' }; }
  }

  async cerrarTurno(turnoId: string, recaudoFisico: { efectivo: number; datafono: number; transferencia: number; detalleEfectivo?: DetalleArqueo }, justificacion: string | null): Promise<ResultadoOperacion<TurnoCaja>> {
    try {
      const turno = await this.dataService.getById<TurnoCaja>('turnos_caja', turnoId);
      if (!turno) return { data: null, error: 'Turno no encontrado' };
      if (turno.estado !== 'ABIERTO') return { data: null, error: 'El turno ya se encuentra cerrado o auditado' };

      const diferenciaEfectivo = recaudoFisico.efectivo - turno.totalEfectivo;
      const diferenciaDatafono = recaudoFisico.datafono - turno.totalDatafono;
      const diferenciaTransferencia = recaudoFisico.transferencia - turno.totalTransferencias;

      if ((diferenciaEfectivo + diferenciaDatafono + diferenciaTransferencia) !== 0 && (!justificacion || justificacion.trim() === '')) {
        return { data: null, error: 'Debe justificar la diferencia detectada en el cuadre de caja' };
      }

      const update: Partial<TurnoCaja> = {
        saldoFisicoEfectivo: recaudoFisico.efectivo, diferenciaEfectivo,
        saldoFisicoDatafono: recaudoFisico.datafono, diferenciaDatafono,
        saldoFisicoTransferencias: recaudoFisico.transferencia, diferenciaTransferencias: diferenciaTransferencia,
        detalleArqueoCierre: recaudoFisico.detalleEfectivo ?? turno.detalleArqueoCierre,
        fechaCierre: new Date().toISOString(), estado: 'CERRADO',
        justificacion, updatedAt: new Date().toISOString(),
      };

      await this.dataService.update('turnos_caja', turnoId, update as any);

      const regAjuste = async (dif: number, mp: MetodoPago) => {
        if (dif !== 0) await this.registrarMovimiento(turnoId, turno.cajaId, dif > 0 ? 'AJUSTE_SOBRANTE' : 'AJUSTE_FALTANTE', mp, Math.abs(dif), `Ajuste automático: ${justificacion}`, null);
      };
      await Promise.all([regAjuste(diferenciaEfectivo, 'EFECTIVO'), regAjuste(diferenciaDatafono, 'DATAFONO'), regAjuste(diferenciaTransferencia, 'TRANSFERENCIA')]);

      useCashStore.getState().clearTurnoActivo();
      return { data: { ...turno, ...update }, error: null };
    } catch (e: any) { return { data: null, error: e.message || 'Error al cerrar el turno' }; }
  }

  async getMovimientos(turnoId?: string): Promise<MovimientoCaja[]> {
    const todos = await this.dataService.getAll<MovimientoCaja>('movimientos_caja');
    return turnoId ? todos.filter(m => m.turnoId === turnoId) : todos;
  }

  async registrarMovimiento(turnoId: string, cajaId: string, tipo: TipoMovimientoCaja, metodoPago: MetodoPago, monto: number, concepto: string, referenciaId: string | null): Promise<ResultadoOperacion<MovimientoCaja>> {
    try {
      if (monto <= 0) return { data: null, error: 'El monto debe ser mayor a cero' };

      const turno = await this.dataService.getById<TurnoCaja>('turnos_caja', turnoId);
      if (!turno) return { data: null, error: 'Turno no encontrado' };
      if (turno.estado !== 'ABIERTO' && tipo !== 'AJUSTE_FALTANTE' && tipo !== 'AJUSTE_SOBRANTE') {
        return { data: null, error: 'No se pueden registrar movimientos en un turno cerrado' };
      }

      const nuevoMovimiento: MovimientoCaja = {
        id: generateId('mov'), turnoId, cajaId, tipo, metodoPago, monto, concepto, referenciaId,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: '',
      };

      await this.dataService.create('movimientos_caja', nuevoMovimiento);
      return { data: nuevoMovimiento, error: null };
    } catch (e: any) { return { data: null, error: e.message || 'Error al registrar el movimiento' }; }
  }

  async trasladarDinero(turnoOrigenId: string, cajaDestinoId: string, metodoPago: MetodoPago, monto: number, concepto: string): Promise<ResultadoOperacion<TrasladoDinero>> {
    try {
      const turnoOrigen = await this.dataService.getById<TurnoCaja>('turnos_caja', turnoOrigenId);
      if (!turnoOrigen || turnoOrigen.estado !== 'ABIERTO') return { data: null, error: 'El turno de origen no es válido o no está abierto' };

      const saldoDisponible = metodoPago === 'EFECTIVO' ? turnoOrigen.totalEfectivo : metodoPago === 'DATAFONO' ? turnoOrigen.totalDatafono : turnoOrigen.totalTransferencias;
      if (saldoDisponible < monto) return { data: null, error: `Fondos insuficientes en la caja de origen para realizar el traslado en ${metodoPago}` };

      const turnos = await this.dataService.getAll<TurnoCaja>('turnos_caja');
      const turnoDestino = turnos.find(t => t.cajaId === cajaDestinoId && t.estado === 'ABIERTO');
      if (!turnoDestino) return { data: null, error: 'La caja destino no tiene un turno abierto' };

      const nuevoTraslado: TrasladoDinero = {
        id: generateId('tsl'), cajaOrigenId: turnoOrigen.cajaId, cajaDestinoId, metodoPago, monto, concepto,
        estado: 'COMPLETADO', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: '',
      };

      await this.dataService.create('traslados_dinero', nuevoTraslado);
      return { data: nuevoTraslado, error: null };
    } catch (e: any) { return { data: null, error: e.message || 'Error al procesar el traslado' }; }
  }
}
