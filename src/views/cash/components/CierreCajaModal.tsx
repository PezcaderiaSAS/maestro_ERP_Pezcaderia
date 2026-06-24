import { useState } from 'react';
import { TurnoCaja } from '../../../types/cash.types';
import { cashService } from '../../../services/cashService';
import Swal from 'sweetalert2';

interface CierreCajaModalProps {
  turnoActivo: TurnoCaja;
  usuarioId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CierreCajaModal({ turnoActivo, usuarioId, onClose, onSuccess }: CierreCajaModalProps) {
  const [saldoFisico, setSaldoFisico] = useState<number | ''>('');
  const [justificacion, setJustificacion] = useState('');

  const diferencia = saldoFisico !== '' ? Number(saldoFisico) - turnoActivo.totalEfectivo : 0;
  const requiereJustificacion = diferencia !== 0;

  const handleCierre = () => {
    if (saldoFisico === '') {
      Swal.fire('Error', 'Debe ingresar el saldo físico contado', 'error');
      return;
    }

    if (requiereJustificacion && justificacion.trim() === '') {
      Swal.fire('Error', 'Debe justificar la diferencia detectada', 'error');
      return;
    }

    Swal.fire({
      title: '¿Confirmar cierre de caja?',
      text: `Efectivo Teórico: $${turnoActivo.totalEfectivo.toLocaleString()} | Efectivo Físico: $${Number(saldoFisico).toLocaleString()}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar turno',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const resultado = cashService.cerrarTurno(turnoActivo.id, Number(saldoFisico), justificacion, usuarioId);
        if (!resultado.error) {
          Swal.fire('¡Caja Cerrada!', 'El turno se ha cerrado correctamente', 'success');
          onSuccess();
        } else {
          Swal.fire('Error', resultado.error, 'error');
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Cierre de Caja</h2>
        
        <div className="mb-4 bg-gray-50 p-4 rounded border">
          <p className="text-sm text-gray-600">Total Teórico (Todos los medios): <span className="font-bold text-gray-800">${turnoActivo.saldoTeoricoGlobal.toLocaleString()}</span></p>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-sm font-semibold text-green-700">Total Efectivo Esperado:</p>
            <p className="text-3xl font-extrabold text-green-800">${turnoActivo.totalEfectivo.toLocaleString()}</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Efectivo Físico Contado (Billetes/Monedas) *</label>
          <input 
            type="number" 
            className="w-full border rounded p-2 text-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            value={saldoFisico}
            onChange={(e) => setSaldoFisico(e.target.value !== '' ? Number(e.target.value) : '')}
            placeholder="0"
          />
        </div>

        {saldoFisico !== '' && (
          <div className={`mb-4 p-3 rounded ${diferencia === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="text-sm font-semibold">
              Diferencia: ${diferencia.toLocaleString()}
            </p>
            {diferencia !== 0 && (
              <p className="text-xs mt-1">Requiere justificación obligatoria</p>
            )}
          </div>
        )}

        {requiereJustificacion && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Justificación del Descuadre *</label>
            <textarea 
              className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              placeholder="Explique el motivo del faltante o sobrante..."
            />
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleCierre}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded font-medium transition-colors"
          >
            Confirmar Cierre
          </button>
        </div>
      </div>
    </div>
  );
}
