import React, { useState, useEffect } from 'react';
import { Play, Square, AlertTriangle } from 'lucide-react';
import { cajaService } from '../../../services/cajaService';
import type { SesionActiva } from '../../../types/auth.types';
import type { Turno, Caja } from '../../../types/caja.types';
import { DenominationsCalculator } from './DenominationsCalculator';

interface CajaTurnoPanelProps {
  mode: 'apertura' | 'cierre';
  sesionActiva: SesionActiva;
  turnoActivo?: Turno;
  onTurnoAbierto?: (turno: Turno) => void;
  onTurnoCerrado?: (turno: Turno) => void;
  onCancel?: () => void;
}

export const CajaTurnoPanel: React.FC<CajaTurnoPanelProps> = ({
  mode,
  sesionActiva,
  turnoActivo,
  onTurnoAbierto,
  onTurnoCerrado,
  onCancel
}) => {
  const [caja, setCaja] = useState<Caja | null>(null);
  const [todasCajas, setTodasCajas] = useState<Caja[]>([]);
  const [bodegas, setBodegas] = useState<string[]>([]);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apertura state
  const [desgloseApertura, setDesgloseApertura] = useState<Record<string, number>>({});
  const [calculadoraAperturaConfirmada, setCalculadoraAperturaConfirmada] = useState(false);

  const [desgloseCierre, setDesgloseCierre] = useState<Record<string, number>>({});
  const [calculadoraCierreConfirmada, setCalculadoraCierreConfirmada] = useState(false);
  const [transferenciaStr, setTransferenciaStr] = useState('0');
  const [tarjetaStr, setTarjetaStr] = useState('0');
  const [observaciones, setObservaciones] = useState('');
  const [resumen, setResumen] = useState<any>(null);

  useEffect(() => {
    const cajas = cajaService.getCajas();
    setTodasCajas(cajas);
    
    if (sesionActiva.rol === 'admin') {
      const bodegasUnicas = Array.from(new Set(cajas.map(c => c.bodegaId).filter(Boolean)));
      setBodegas(bodegasUnicas);
      if (bodegasUnicas.length > 0) {
        setBodegaSeleccionada(bodegasUnicas[0]);
      }
    } else {
      const cajaAsignada = cajas.find(c => c.id === sesionActiva.cajaId) || cajas.find(c => c.tipo === 'MENOR'); // fallback
      if (cajaAsignada) setCaja(cajaAsignada);
      else setError('No tienes una caja válida asignada.');
    }
  }, [sesionActiva]);

  // Cambiar caja seleccionada cuando el admin cambia de bodega
  useEffect(() => {
    if (sesionActiva.rol === 'admin' && bodegaSeleccionada) {
      const cajasFiltradas = todasCajas.filter(c => c.bodegaId === bodegaSeleccionada);
      if (cajasFiltradas.length > 0) {
        setCaja(cajasFiltradas[0]);
      } else {
        setCaja(null);
      }
    }
  }, [sesionActiva.rol, bodegaSeleccionada, todasCajas]);

  useEffect(() => {
    if (mode === 'cierre' && turnoActivo) {
      setResumen(cajaService.getResumenTurno(turnoActivo.id));
    }
  }, [mode, turnoActivo]);

  const handleAbrir = async () => {
    if (!caja) return;
    setLoading(true);
    setError(null);
    const saldo = Object.entries(desgloseApertura).reduce((acc, [k, v]) => acc + Number(k) * v, 0);
    
    const res = cajaService.abrirTurno(caja.id, sesionActiva.usuarioId, saldo);
    if (res.error || !res.data) {
      setError(res.error || 'Error al abrir turno');
      setLoading(false);
      return;
    }

    if (onTurnoAbierto) onTurnoAbierto(res.data);
    setLoading(false);
  };

  const handleCerrar = async () => {
    if (!turnoActivo) return;
    setLoading(true);
    setError(null);
    
    const efec = Object.entries(desgloseCierre).reduce((acc, [k, v]) => acc + Number(k) * v, 0);
    const trans = parseFloat(transferenciaStr.replace(/\./g, '').replace(/,/g, '')) || 0;
    const tarj = parseFloat(tarjetaStr.replace(/\./g, '').replace(/,/g, '')) || 0;
    
    const arqueo = { 
      efectivo: efec, 
      transferencia: trans, 
      tarjeta: tarj, 
      desgloseDenominaciones: desgloseCierre 
    };
    
    // Check if observations are needed (calculated inside UI for UX before service call)
    const esperadoEfectivo = turnoActivo.saldoApertura + (resumen?.ventasEfectivo || 0) + (resumen?.otrosIngresos || 0) - (resumen?.egresos || 0);
    const diferencia = (arqueo.efectivo + arqueo.transferencia + arqueo.tarjeta) - (esperadoEfectivo + (resumen?.ventasTransferencia || 0) + (resumen?.ventasTarjeta || 0));
    
    if (diferencia !== 0 && !observaciones.trim()) {
      setError('Debes ingresar una observación para justificar la diferencia de caja.');
      setLoading(false);
      return;
    }

    const res = cajaService.cerrarTurno(turnoActivo.id, arqueo, observaciones);
    if (res.error || !res.data) {
      setError(res.error || 'Error al cerrar turno');
      setLoading(false);
      return;
    }

    if (onTurnoCerrado) onTurnoCerrado(res.data);
    setLoading(false);
  };

  const parseNum = (val: string) => parseFloat(val.replace(/\./g, '').replace(/,/g, '')) || 0;
  
  let diferenciaCalc = 0;
  let esperadoEfectivoCalc = 0;
  if (mode === 'cierre' && turnoActivo && resumen) {
    const efec = Object.entries(desgloseCierre).reduce((acc, [k, v]) => acc + Number(k) * v, 0);
    const trans = parseNum(transferenciaStr);
    const tarj = parseNum(tarjetaStr);
    esperadoEfectivoCalc = turnoActivo.saldoApertura + resumen.ventasEfectivo + resumen.otrosIngresos - resumen.egresos;
    diferenciaCalc = (efec + trans + tarj) - (esperadoEfectivoCalc + resumen.ventasTransferencia + resumen.ventasTarjeta);
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: mode === 'apertura' ? '100vh' : 'auto',
      padding: '24px',
      backgroundColor: mode === 'apertura' ? '#f1f5f9' : 'transparent',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
        
        {mode === 'apertura' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', marginBottom: '16px' }}>
                <Play size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Apertura de Turno</h2>
              {sesionActiva.rol !== 'admin' && (
                <p style={{ color: '#64748b' }}>Caja asignada: {caja?.nombre || 'Buscando...'}</p>
              )}
            </div>

            {sesionActiva.rol === 'admin' && bodegas.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Bodega:</label>
                <select 
                  className="form-input" 
                  value={bodegaSeleccionada} 
                  onChange={e => setBodegaSeleccionada(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  {bodegas.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {sesionActiva.rol === 'admin' && (
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Caja a Abrir:</label>
                <select 
                  className="form-input" 
                  value={caja?.id || ''} 
                  onChange={e => {
                    const c = todasCajas.find(x => x.id === e.target.value);
                    if (c) setCaja(c);
                  }}
                  style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  {todasCajas.filter(c => c.bodegaId === bodegaSeleccionada).map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#475569' }}>
                Saldo Inicial en Gaveta (Efectivo base)
              </label>
              <DenominationsCalculator 
                value={desgloseApertura} 
                onChange={setDesgloseApertura} 
                onConfirm={setCalculadoraAperturaConfirmada} 
              />
            </div>

            {error && <div style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
            {(!caja && sesionActiva.rol === 'admin') && <div style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center' }}>No hay cajas en esta bodega.</div>}

            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: (!caja || !calculadoraAperturaConfirmada) ? 0.6 : 1 }}
              onClick={handleAbrir}
              disabled={loading || !caja || !calculadoraAperturaConfirmada}
            >
              <Play size={18} fill="currentColor" />
              {loading ? 'Abriendo...' : 'Abrir Turno e Iniciar Ventas'}
            </button>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#ef4444', marginBottom: '16px' }}>
                <Square size={32} fill="currentColor" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Cierre y Arqueo de Caja</h2>
            </div>

            {resumen && (
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Ventas Totales del Turno:</span>
                  <span style={{ fontWeight: 'bold' }}>${resumen.totalVentasTurno.toLocaleString('es-CO')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>• Efectivo en ventas:</span>
                  <span>${resumen.ventasEfectivo.toLocaleString('es-CO')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>• Transferencias:</span>
                  <span>${resumen.ventasTransferencia.toLocaleString('es-CO')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ color: '#64748b' }}>• Tarjetas (Datáfono):</span>
                  <span>${resumen.ventasTarjeta.toLocaleString('es-CO')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontWeight: 'bold' }}>Efectivo Total Esperado en Gaveta:</span>
                  <span style={{ fontWeight: 'bold', color: '#334155' }}>${esperadoEfectivoCalc.toLocaleString('es-CO')}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  (Saldo Inicial + Efectivo Ventas + Otros Ingresos - Egresos)
                </div>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Ingresa lo que tienes (Arqueo Físico):</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>Efectivo Físico en Gaveta:</label>
                  <DenominationsCalculator 
                    value={desgloseCierre} 
                    onChange={setDesgloseCierre} 
                    onConfirm={setCalculadoraCierreConfirmada} 
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                  <label style={{ width: '160px', color: '#475569', fontWeight: '500' }}>Vouchers Tarjeta:</label>
                  <input type="text" className="form-input" style={{ flex: 1, textAlign: 'right', fontSize: '16px' }} value={tarjetaStr} onChange={(e) => setTarjetaStr(e.target.value.replace(/[^0-9]/g, ''))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ width: '160px', color: '#475569', fontWeight: '500' }}>Transferencias (App):</label>
                  <input type="text" className="form-input" style={{ flex: 1, textAlign: 'right', fontSize: '16px' }} value={transferenciaStr} onChange={(e) => setTransferenciaStr(e.target.value.replace(/[^0-9]/g, ''))} />
                </div>
              </div>
            </div>

            <div style={{ 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '24px',
              backgroundColor: diferenciaCalc === 0 ? '#dcfce7' : diferenciaCalc > 0 ? '#fef08a' : '#fee2e2',
              color: diferenciaCalc === 0 ? '#166534' : diferenciaCalc > 0 ? '#854d0e' : '#991b1b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 'bold' }}>
                {diferenciaCalc === 0 ? '¡Caja Cuadrada Perfectamente!' : diferenciaCalc > 0 ? 'Sobrante detectado:' : 'Faltante detectado:'}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                ${Math.abs(diferenciaCalc).toLocaleString('es-CO')}
              </span>
            </div>

            {diferenciaCalc !== 0 && (
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', color: '#ef4444' }}>
                  <AlertTriangle size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                  Observaciones Requeridas por Diferencia
                </label>
                <textarea 
                  className="form-input" 
                  style={{ width: '100%', minHeight: '80px', boxSizing: 'border-box' }}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Explica la razón del sobrante o faltante..."
                />
              </div>
            )}

            {error && <div style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '12px' }}>
              {onCancel && (
                <button className="btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={onCancel}>
                  Cancelar
                </button>
              )}
              <button 
                className="btn-primary" 
                style={{ 
                  flex: 2, 
                  padding: '12px',
                  backgroundColor: ((diferenciaCalc !== 0 && !observaciones.trim()) || !calculadoraCierreConfirmada) ? '#94a3b8' : '#ef4444',
                  opacity: (!calculadoraCierreConfirmada) ? 0.6 : 1
                }}
                onClick={handleCerrar}
                disabled={loading || (diferenciaCalc !== 0 && !observaciones.trim()) || !calculadoraCierreConfirmada}
              >
                {loading ? 'Cerrando...' : 'Confirmar Cierre de Caja'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
