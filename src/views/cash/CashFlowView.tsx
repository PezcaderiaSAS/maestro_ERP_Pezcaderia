import { useState, useEffect } from 'react';
import { Wallet, ArrowRightLeft, Upload, Download, Power, AlertTriangle } from 'lucide-react';
import { cashService } from '../../services/cashService';
import { Caja, TurnoCaja, MovimientoCaja } from '../../types/cash.types';
import Swal from 'sweetalert2';
import ArqueoCajaModal from './components/ArqueoCajaModal';
import TrasladoDineroModal from './components/TrasladoDineroModal';
import { AperturaCajaModal } from '../pos/components/AperturaCajaModal';
import { useWarehouseStore } from '../../store/useWarehouseStore';

interface CashFlowViewProps {
  userRole: string;
  usuarioId: string;
}

export default function CashFlowView({ userRole, usuarioId }: CashFlowViewProps) {
  const { bodegas, getPrimaryBodega } = useWarehouseStore();
  const primaryBodega = getPrimaryBodega()?.nombre || 'Bodega Principal';
  
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<string>(primaryBodega); 
  
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [cajaSeleccionada, setCajaSeleccionada] = useState<string>('');
  
  const [turnoActivo, setTurnoActivo] = useState<TurnoCaja | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);

  // Modales
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [showTrasladoModal, setShowTrasladoModal] = useState(false);

  const [showAperturaModal, setShowAperturaModal] = useState(false);

  // Cargar Cajas
  useEffect(() => {
    // Si no existen cajas en la BD, inyectamos unas de prueba por primera vez
    let cajasGuardadas = cashService.getCajas();
    if (cajasGuardadas.length === 0) {
      cashService.guardarCaja({ id: 'CAJA-1', bodegaId: primaryBodega, nombre: 'Caja POS Principal', activa: true });
      cashService.guardarCaja({ id: 'CAJA-2', bodegaId: primaryBodega, nombre: 'Caja Fuerte Administrativa', activa: true });
      cashService.guardarCaja({ id: 'CAJA-3', bodegaId: primaryBodega, nombre: 'Caja POS Secundaria', activa: true });
      cajasGuardadas = cashService.getCajas();
    }
    
    const cajasBodega = cajasGuardadas.filter(c => c.bodegaId === bodegaSeleccionada && c.activa);
    setCajas(cajasBodega);
    
    if (cajasBodega.length > 0) {
      setCajaSeleccionada(cajasBodega[0].id);
    } else {
      setCajaSeleccionada('');
      setTurnoActivo(null);
      setMovimientos([]);
    }
  }, [bodegaSeleccionada, primaryBodega]);

  // Cargar Turno Activo
  const loadData = () => {
    if (cajaSeleccionada) {
      const turno = cashService.getTurnoActivo(cajaSeleccionada);
      setTurnoActivo(turno);
      if (turno) {
        setMovimientos(cashService.getMovimientos(turno.id));
      } else {
        setMovimientos([]);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [cajaSeleccionada]);

  const handleApertura = () => {
    setShowAperturaModal(true);
  };

  const handleEgresoRapido = () => {
    if (!turnoActivo) return;

    Swal.fire({
      title: 'Registrar Egreso',
      html: `
        <select id="swal-metodo" class="swal2-input">
          <option value="EFECTIVO">Efectivo</option>
          <option value="DATAFONO">Datáfono</option>
          <option value="TRANSFERENCIA">Transferencia</option>
        </select>
        <input id="swal-monto" type="number" class="swal2-input" placeholder="Monto">
        <input id="swal-concepto" class="swal2-input" placeholder="Concepto (Ej. Pago proveedor, Gasto menor)">
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const metodoPago = (document.getElementById('swal-metodo') as HTMLSelectElement).value;
        const monto = (document.getElementById('swal-monto') as HTMLInputElement).value;
        const concepto = (document.getElementById('swal-concepto') as HTMLInputElement).value;
        
        if (!monto || Number(monto) <= 0) {
          Swal.showValidationMessage('Ingrese un monto válido');
          return false;
        }
        if (!concepto) {
          Swal.showValidationMessage('Ingrese un concepto');
          return false;
        }
        return { monto: Number(monto), concepto, metodoPago };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const res = cashService.registrarMovimiento(
          turnoActivo.id,
          turnoActivo.cajaId,
          'EGRESO_GASTO',
          result.value.metodoPago as any,
          result.value.monto,
          result.value.concepto,
          null,
          usuarioId
        );
        if (!res.error) {
          Swal.fire('Éxito', 'Movimiento registrado con éxito', 'success');
          loadData();
        } else {
          Swal.fire('Error', res.error, 'error');
        }
      }
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Cajas</h1>
          <p className="text-gray-500 mt-1">Control de flujo de efectivo por bodega</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border">
          <span className="text-sm font-medium text-gray-600">Bodega:</span>
          <select 
            className="border-gray-300 rounded text-sm focus:ring-blue-500 font-semibold"
            value={bodegaSeleccionada}
            onChange={(e) => setBodegaSeleccionada(e.target.value)}
          >
            {bodegas.filter(b => b.activa).map(b => (
              <option key={b.id} value={b.nombre}>{b.nombre}</option>
            ))}
          </select>

          <span className="text-sm font-medium text-gray-600 ml-4">Caja:</span>
          <select 
            className="border-gray-300 rounded text-sm focus:ring-blue-500 font-semibold"
            value={cajaSeleccionada}
            onChange={(e) => setCajaSeleccionada(e.target.value)}
          >
            {cajas.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {!turnoActivo ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center max-w-2xl mx-auto mt-10">
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">La caja está cerrada</h2>
          <p className="text-gray-500 mb-8">Debe abrir un turno para procesar ventas y registrar movimientos de efectivo en esta caja.</p>
          <button 
            data-testid="btn-abrir-turno"
            onClick={handleApertura}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
          >
            <Power size={20} />
            Abrir Turno de Caja
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Izquierdo: Resumen y Acciones */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden mb-6">
              <div className="bg-blue-600 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Wallet size={80} />
                </div>
                <p className="text-blue-100 text-sm font-medium mb-1 relative z-10">Saldo Teórico Global</p>
                <h2 className="text-4xl font-extrabold relative z-10">${turnoActivo.saldoTeoricoGlobal.toLocaleString()}</h2>
                <div className="mt-4 inline-flex items-center gap-1 bg-blue-500/50 px-3 py-1 rounded-full text-xs font-medium relative z-10">
                  <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                  Turno Abierto
                </div>
              </div>
              
              {/* Desglose por Medio de Pago (Control de Cuadre) */}
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
                <div className="p-3 text-center border-r border-gray-200">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Efectivo</p>
                  <p className="text-sm font-bold text-green-700">${turnoActivo.totalEfectivo.toLocaleString()}</p>
                </div>
                <div className="p-3 text-center border-r border-gray-200">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Datáfono</p>
                  <p className="text-sm font-bold text-blue-700">${turnoActivo.totalDatafono.toLocaleString()}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Transf.</p>
                  <p className="text-sm font-bold text-purple-700">${turnoActivo.totalTransferencias.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Base Inicial:</span>
                    <span className="font-semibold text-gray-800">${turnoActivo.baseInicial.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Total Ingresos:</span>
                    <span className="font-semibold text-green-600">
                      +${movimientos.filter(m => m.tipo.startsWith('INGRESO')).reduce((acc, m) => acc + m.monto, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Total Egresos:</span>
                    <span className="font-semibold text-red-600">
                      -${movimientos.filter(m => m.tipo.startsWith('EGRESO')).reduce((acc, m) => acc + m.monto, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-gray-100">
                  <button 
                    data-testid="btn-egreso-rapido"
                    onClick={handleEgresoRapido}
                    className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Upload size={18} className="text-red-500" />
                    Registrar Egreso (Gasto)
                  </button>
                  <button 
                    data-testid="btn-traslado-dinero"
                    onClick={() => setShowTrasladoModal(true)}
                    className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <ArrowRightLeft size={18} className="text-blue-500" />
                    Trasladar Dinero
                  </button>
                  <button 
                    data-testid="btn-cierre-caja"
                    onClick={() => setShowCierreModal(true)}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mt-4 border border-red-200"
                  >
                    <Power size={18} />
                    Hacer Cierre de Caja
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho: Historial de Movimientos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Historial de Movimientos</h3>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-medium">
                  {movimientos.length} transacciones
                </span>
              </div>
              <div className="p-0 flex-1 overflow-auto">
                {movimientos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <AlertTriangle size={32} className="mb-2 opacity-50" />
                    <p>No hay movimientos registrados en este turno.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hora</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Concepto</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {movimientos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(mov => {
                        const esIngreso = mov.tipo.startsWith('INGRESO');
                        return (
                          <tr key={mov.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex flex-col">
                                <span>{new Date(mov.createdAt).toLocaleDateString()}</span>
                                {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${esIngreso ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {esIngreso ? <Download size={12} /> : <Upload size={12} />}
                                {mov.tipo.replace('INGRESO_', '').replace('EGRESO_', '').replace('_', ' ')}
                              </span>
                              <span className="ml-2 text-xs text-gray-400 font-semibold uppercase">
                                {mov.metodoPago}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {mov.concepto}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${esIngreso ? 'text-green-600' : 'text-red-600'}`}>
                              {esIngreso ? '+' : '-'}${mov.monto.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render Modales */}
      {showAperturaModal && (
        <AperturaCajaModal
          userRole={userRole}
          bodegaActiva={bodegaSeleccionada}
          onSuccess={() => {
            setShowAperturaModal(false);
            loadData();
          }}
          onCancel={() => setShowAperturaModal(false)}
        />
      )}

      {showCierreModal && turnoActivo && (
        <ArqueoCajaModal 
          turnoActivo={turnoActivo}
          usuarioId={usuarioId}
          onClose={() => setShowCierreModal(false)}
          onSuccess={() => {
            setShowCierreModal(false);
            loadData(); // Refrescará y ocultará el dashboard porque ya no hay turno
          }}
        />
      )}

      {showTrasladoModal && turnoActivo && (
        <TrasladoDineroModal
          turnoOrigen={turnoActivo}
          usuarioId={usuarioId}
          onClose={() => setShowTrasladoModal(false)}
          onSuccess={() => {
            setShowTrasladoModal(false);
            loadData(); // Refrescará para mostrar el nuevo egreso
          }}
        />
      )}
    </div>
  );
}
