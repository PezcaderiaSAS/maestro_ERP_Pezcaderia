import { useState, useMemo } from 'react';
import { TurnoCaja } from '../../../types/cash.types';
import { cashService } from '../../../services/cashService';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { Lock, Unlock, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import Swal from 'sweetalert2';

interface ArqueoCajaModalProps {
  turnoActivo: TurnoCaja;
  usuarioId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ArqueoCajaModal({ turnoActivo, usuarioId, onClose, onSuccess }: ArqueoCajaModalProps) {
  const { productos } = useInventoryStore();

  // Estados de recaudo. Efectivo inicia vacío/0, los electrónicos se autocompletan.
  const [efectivo, setEfectivo] = useState<string>('');
  const [datafono, setDatafono] = useState<string>(turnoActivo.totalDatafono.toString());
  const [transferencia, setTransferencia] = useState<string>(turnoActivo.totalTransferencias.toString());

  // Estados de "Forzar Edición"
  const [lockDatafono, setLockDatafono] = useState<boolean>(true);
  const [lockTransferencia, setLockTransferencia] = useState<boolean>(true);

  // Justificación obligatoria
  const [justificacion, setJustificacion] = useState('');

  // Cálculos reactivos
  const valEfectivo = efectivo === '' ? 0 : Number(efectivo);
  const valDatafono = datafono === '' ? 0 : Number(datafono);
  const valTransferencia = transferencia === '' ? 0 : Number(transferencia);

  const diffEfectivo = valEfectivo - turnoActivo.totalEfectivo;
  const diffDatafono = valDatafono - turnoActivo.totalDatafono;
  const diffTransferencia = valTransferencia - turnoActivo.totalTransferencias;
  const diffTotal = diffEfectivo + diffDatafono + diffTransferencia;
  
  const requiereJustificacion = diffTotal !== 0;

  // Motor Inteligente de Sugerencias de Inventario (±5%)
  const sugerencias = useMemo(() => {
    if (diffTotal === 0) return [];

    const absDiff = Math.abs(diffTotal);
    const minDiff = absDiff * 0.95;
    const maxDiff = absDiff * 1.05;

    // Se asume que el IVA ya está configurado en el catálogo o que la tienda lo maneja implícitamente
    // Si la tienda requiere calcular IVA adicional sobre el precio base, se haría aquí.
    return productos.filter(p => {
      // Usamos el precio de venta POS o el base si no hay
      const precio = p.precio_venta_pos || p.precio_venta;
      return precio >= minDiff && precio <= maxDiff;
    }).slice(0, 5); // Limitar a las 5 mejores sugerencias
  }, [diffTotal, productos]);

  const handleUnlock = (tipo: 'DATAFONO' | 'TRANSFERENCIA') => {
    Swal.fire({
      title: '¿Forzar edición?',
      text: `El sistema registró $${(tipo === 'DATAFONO' ? turnoActivo.totalDatafono : turnoActivo.totalTransferencias).toLocaleString()} exactos. Solo debe forzar la edición si detecta una factura cruzada.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desbloquear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (tipo === 'DATAFONO') setLockDatafono(false);
        else setLockTransferencia(false);
      }
    });
  };

  const handleCierre = () => {
    if (efectivo === '') {
      Swal.fire('Error', 'Debe ingresar el efectivo físico contado (puede ser 0).', 'error');
      return;
    }

    if (requiereJustificacion && justificacion.trim() === '') {
      Swal.fire('Error', 'Debe justificar detalladamente la diferencia detectada en el cuadre de caja.', 'error');
      return;
    }

    Swal.fire({
      title: '¿Confirmar Arqueo y Cierre?',
      html: `
        <div class="text-left">
          <p><strong>Recaudado Total:</strong> $${(valEfectivo + valDatafono + valTransferencia).toLocaleString()}</p>
          <p><strong>Diferencia Global:</strong> <span class="${diffTotal === 0 ? 'text-green-600' : 'text-red-600 font-bold'}">$${diffTotal.toLocaleString()}</span></p>
          ${requiereJustificacion ? '<p class="text-xs text-red-500 mt-2">Esta diferencia quedará registrada en el sistema bajo su usuario.</p>' : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar caja',
      cancelButtonText: 'Revisar nuevamente'
    }).then((result) => {
      if (result.isConfirmed) {
        const resultado = cashService.cerrarTurno(
          turnoActivo.id, 
          {
            efectivo: valEfectivo,
            datafono: valDatafono,
            transferencia: valTransferencia
          }, 
          justificacion, 
          usuarioId
        );

        if (!resultado.error) {
          Swal.fire('¡Caja Cerrada!', 'El arqueo fue exitoso y el turno ha concluido.', 'success');
          onSuccess();
        } else {
          Swal.fire('Error', resultado.error, 'error');
        }
      }
    });
  };

  // Sanitización de inputs (solo números positivos)
  const handleNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white rounded-2xl p-0 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-blue-700 text-white p-6 rounded-t-2xl flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold">Arqueo y Cierre de Caja</h2>
            <p className="text-blue-100 text-sm mt-1">
              Turno #{turnoActivo.id.substring(0,8).toUpperCase()} | Total Esperado: <span className="font-bold">${turnoActivo.saldoTeoricoGlobal.toLocaleString()}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {/* Tabla de Arqueo */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider w-1/4">Medio de Pago</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider w-1/4">Valor Esperado</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider w-1/4">Valor Físico Real</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider w-1/4 text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Fila: Efectivo */}
                <tr className="bg-white hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-800">Efectivo</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">${turnoActivo.totalEfectivo.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <input 
                      type="number" 
                      className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg p-2 text-lg font-bold text-gray-900 outline-none transition-all"
                      value={efectivo}
                      onKeyDown={handleNumberInput}
                      onChange={(e) => setEfectivo(e.target.value)}
                      placeholder="Contar billetes..."
                      autoFocus
                    />
                  </td>
                  <td className={`px-6 py-4 font-bold text-right ${diffEfectivo === 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {diffEfectivo > 0 ? '+' : ''}${diffEfectivo.toLocaleString()}
                  </td>
                </tr>

                {/* Fila: Datáfono */}
                <tr className="bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-800">Datáfono</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">${turnoActivo.totalDatafono.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="relative flex items-center">
                      <input 
                        type="number" 
                        disabled={lockDatafono}
                        className={`w-full border-2 rounded-lg p-2 text-lg font-bold outline-none transition-all pr-10
                          ${lockDatafono ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white border-blue-200 focus:border-blue-500 text-gray-900'}`}
                        value={datafono}
                        onKeyDown={handleNumberInput}
                        onChange={(e) => setDatafono(e.target.value)}
                      />
                      {lockDatafono && (
                        <button 
                          onClick={() => handleUnlock('DATAFONO')}
                          className="absolute right-3 text-gray-400 hover:text-red-500 transition-colors"
                          title="Forzar Edición"
                        >
                          <Lock size={18} />
                        </button>
                      )}
                      {!lockDatafono && (
                        <Unlock size={18} className="absolute right-3 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-bold text-right ${diffDatafono === 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {diffDatafono > 0 ? '+' : ''}${diffDatafono.toLocaleString()}
                  </td>
                </tr>

                {/* Fila: Transferencia */}
                <tr className="bg-white hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-800">Transferencia</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">${turnoActivo.totalTransferencias.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="relative flex items-center">
                      <input 
                        type="number" 
                        disabled={lockTransferencia}
                        className={`w-full border-2 rounded-lg p-2 text-lg font-bold outline-none transition-all pr-10
                          ${lockTransferencia ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white border-blue-200 focus:border-blue-500 text-gray-900'}`}
                        value={transferencia}
                        onKeyDown={handleNumberInput}
                        onChange={(e) => setTransferencia(e.target.value)}
                      />
                      {lockTransferencia && (
                        <button 
                          onClick={() => handleUnlock('TRANSFERENCIA')}
                          className="absolute right-3 text-gray-400 hover:text-red-500 transition-colors"
                          title="Forzar Edición"
                        >
                          <Lock size={18} />
                        </button>
                      )}
                      {!lockTransferencia && (
                        <Unlock size={18} className="absolute right-3 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-bold text-right ${diffTransferencia === 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {diffTransferencia > 0 ? '+' : ''}${diffTransferencia.toLocaleString()}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-200">
                <tr>
                  <td className="px-6 py-4 font-black text-gray-900 uppercase">Totales</td>
                  <td className="px-6 py-4 font-black text-gray-900">${turnoActivo.saldoTeoricoGlobal.toLocaleString()}</td>
                  <td className="px-6 py-4 font-black text-blue-700">${(valEfectivo + valDatafono + valTransferencia).toLocaleString()}</td>
                  <td className="px-6 py-4 font-black text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${diffTotal === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {diffTotal === 0 ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                      {diffTotal > 0 ? '+' : ''}${diffTotal.toLocaleString()}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Motor de Sugerencias y Justificación */}
          {requiereJustificacion && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
              
              {/* Bloque: Justificación */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-bold text-red-800 mb-2">
                  <AlertTriangle size={18} />
                  Justificación Obligatoria
                </label>
                <p className="text-xs text-red-600 mb-3">
                  Se ha detectado un {diffTotal > 0 ? 'sobrante' : 'faltante'} global de <b>${Math.abs(diffTotal).toLocaleString()}</b>. Por política de seguridad (RN-44), debe justificar detalladamente este evento.
                </p>
                <textarea 
                  className="w-full border border-red-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white text-gray-800 resize-none h-24"
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Ej. Cambio mal entregado, venta no registrada en el sistema..."
                />
              </div>

              {/* Bloque: Sugerencias de Auditoría */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-bold text-orange-800 mb-2">
                  <Search size={18} />
                  Auditoría Inteligente (Tolerancia ±5%)
                </label>
                <p className="text-xs text-orange-700 mb-3">
                  Productos del catálogo cuyo precio coincide con el descuadre. Verifique si olvidó facturar:
                </p>
                
                {sugerencias.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {sugerencias.map(prod => (
                      <div key={prod.id} className="bg-white border border-orange-300 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
                        <span className="font-bold text-orange-800 text-sm">{prod.nombre}</span>
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-bold">
                          ${(prod.precio_venta_pos || prod.precio_venta).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/50 border border-orange-200 border-dashed rounded-lg p-4 text-center">
                    <p className="text-sm text-orange-600 italic">No hay productos con precio cercano a ${Math.abs(diffTotal).toLocaleString()}</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl font-bold transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={handleCierre}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all flex items-center gap-2"
          >
            Confirmar Cierre de Caja
          </button>
        </div>

      </div>
    </div>
  );
}
