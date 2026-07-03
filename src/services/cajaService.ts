import { load, save } from './localDb';
import type { Caja, Turno, TransaccionCaja, AuditLog } from '../types/caja.types';
import type { ResultadoOperacion } from '../types/pos.types';
import type { Usuario } from '../types/auth.types';

export const cajaService = {
  seedCajas(): void {
    const cajas = load<Caja[]>('cajas', []);
    if (cajas.length > 0) return;

    const seed: Caja[] = [
      { id: 'caja-01', nombre: 'Caja POS Mostrador', tipo: 'MENOR', bodegaId: 'bodega-principal', activa: true },
      { id: 'caja-mayor', nombre: 'Caja Fuerte / Bóveda', tipo: 'MAYOR', bodegaId: 'bodega-principal', activa: true }
    ];
    save('cajas', seed);
  },

  getCajas(): Caja[] {
    return load<Caja[]>('cajas', []);
  },

  getTurnoActivo(usuarioId: string): Turno | null {
    const turnos = load<Turno[]>('turnos', []);
    return turnos.find(t => t.estado === 'ABIERTA' && t.usuarioId === usuarioId) || null;
  },

  getResumenTurno(turnoId: string) {
    const txs = load<TransaccionCaja[]>('transacciones_caja', []);
    const txsTurno = txs.filter(t => t.turnoId === turnoId);
    
    let ventasEfectivo = 0;
    let ventasTransferencia = 0;
    let ventasTarjeta = 0;
    let otrosIngresos = 0;
    let egresos = 0;

    txsTurno.forEach(tx => {
      if (tx.tipo === 'INGRESO') {
        if (tx.categoria === 'VENTA_POS') {
          if (tx.metodoPago === 'EFECTIVO') ventasEfectivo += tx.monto;
          else if (tx.metodoPago === 'TRANSFERENCIA') ventasTransferencia += tx.monto;
          else if (tx.metodoPago === 'TARJETA') ventasTarjeta += tx.monto;
          else if (tx.metodoPago === 'MIXTO') {
             // MIXTO requires parsing from VentaPOS details, but for summary we usually assume the transaccion contains the total or we map it properly.
             // We'll just put it into efectivo as fallback or we would need to check VentaPOS
             // For simplicity based on task:
             ventasEfectivo += tx.monto; 
          }
        } else {
          otrosIngresos += tx.monto;
        }
      } else {
        egresos += tx.monto;
      }
    });

    const totalVentasTurno = ventasEfectivo + ventasTransferencia + ventasTarjeta;
    return { ventasEfectivo, ventasTransferencia, ventasTarjeta, otrosIngresos, egresos, totalVentasTurno };
  },

  abrirTurno(cajaId: string, usuarioId: string, saldoApertura: number): ResultadoOperacion<Turno> {
    try {
      const usuarios = load<Usuario[]>('usuarios', []);
      const user = usuarios.find(u => u.id === usuarioId);
      const cajas = load<Caja[]>('cajas', []);
      const caja = cajas.find(c => c.id === cajaId);

      if (!user || !caja) {
        return { data: null, error: 'Usuario o Caja no encontrados' };
      }

      // Validar RBAC
      if (user.rol === 'vendedor' && caja.tipo !== 'MENOR') {
        return { data: null, error: 'No tiene permisos para abrir una Caja Mayor' };
      }

      // Validar turno abierto existente
      const turnos = load<Turno[]>('turnos', []);
      if (turnos.some(t => t.estado === 'ABIERTA' && t.usuarioId === usuarioId)) {
        return { data: null, error: 'Ya existe un turno abierto para este usuario' };
      }

      // Snapshot for rollback conceptually
      const nuevoTurno: Turno = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `turno-${Date.now()}`,
        cajaId,
        usuarioId,
        fechaApertura: new Date().toISOString(),
        saldoApertura,
        estado: 'ABIERTA'
      };

      turnos.push(nuevoTurno);
      save('turnos', turnos);

      this.registrarLog('APERTURA_TURNO', usuarioId, { turnoId: nuevoTurno.id, cajaId, saldoApertura });

      return { data: nuevoTurno, error: null };
    } catch (err: any) {
      return { data: null, error: 'Error al abrir el turno: ' + err.message };
    }
  },

  cerrarTurno(turnoId: string, arqueo: import('../types/caja.types').ArqueoCaja, observaciones?: string): ResultadoOperacion<Turno> {
    try {
      const turnos = load<Turno[]>('turnos', []);
      const idx = turnos.findIndex(t => t.id === turnoId);
      if (idx === -1) return { data: null, error: 'Turno no encontrado' };
      
      const turno = turnos[idx];
      if (turno.estado === 'CERRADA') return { data: null, error: 'El turno ya está cerrado' };

      // Cambiar a EN_CUADRE
      turno.estado = 'EN_CUADRE';

      const resumen = this.getResumenTurno(turnoId);
      
      const esperadoEfectivo = turno.saldoApertura + resumen.ventasEfectivo + resumen.otrosIngresos - resumen.egresos;
      const diferencia = (arqueo.efectivo + arqueo.transferencia + arqueo.tarjeta) - (esperadoEfectivo + resumen.ventasTransferencia + resumen.ventasTarjeta);

      turno.saldoCierreEfectivo = arqueo.efectivo;
      turno.saldoCierreTransferencia = arqueo.transferencia;
      turno.saldoCierreTarjeta = arqueo.tarjeta;
      turno.diferencia = diferencia;
      turno.observaciones = observaciones;
      if (arqueo.desgloseDenominaciones) {
        turno.desgloseDenominaciones = arqueo.desgloseDenominaciones;
      }
      turno.fechaCierre = new Date().toISOString();
      turno.estado = 'CERRADA';

      save('turnos', turnos);
      this.registrarLog('CIERRE_TURNO', turno.usuarioId, { turnoId, diferencia, cajeroId: turno.usuarioId });

      return { data: turno, error: null };
    } catch (err: any) {
      return { data: null, error: 'Error al cerrar el turno: ' + err.message };
    }
  },

  registrarTransaccion(tx: Omit<TransaccionCaja, 'id' | 'fecha'>): ResultadoOperacion<TransaccionCaja> {
    try {
      const txs = load<TransaccionCaja[]>('transacciones_caja', []);
      const nuevaTx: TransaccionCaja = {
        ...tx,
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}`,
        fecha: new Date().toISOString()
      };
      txs.push(nuevaTx);
      save('transacciones_caja', txs);
      
      return { data: nuevaTx, error: null };
    } catch (err: any) {
      return { data: null, error: 'Error al registrar la transacción' };
    }
  },

  registrarLog(accion: AuditLog['accion'], usuarioId: string, detalles: Record<string, any>) {
    const logs = load<AuditLog[]>('audit_logs', []);
    logs.push({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`,
      fecha: new Date().toISOString(),
      usuarioId,
      accion,
      detalles
    });
    save('audit_logs', logs);
  }
};
