import React, { useState } from 'react';
import { TurnoCaja, Caja } from '../../../types/cash.types';
import { cashService } from '../../../services/cashService';
import Swal from 'sweetalert2';

interface TrasladoDineroModalProps {
  turnoOrigen: TurnoCaja;
  usuarioId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TrasladoDineroModal({ turnoOrigen, usuarioId, onClose, onSuccess }: TrasladoDineroModalProps) {
  const [monto, setMonto] = useState<number | ''>('');
  const [concepto, setConcepto] = useState('');
  const [cajaDestinoId, setCajaDestinoId] = useState('');
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA'>('EFECTIVO');

  // Obtener todas las cajas (excluyendo la de origen)
  const cajasDisponibles = cashService.getCajas().filter(c => c.id !== turnoOrigen.cajaId && c.activa);

  const saldoDisponible = 
    metodoPago === 'EFECTIVO' ? turnoOrigen.totalEfectivo :
    metodoPago === 'DATAFONO' ? turnoOrigen.totalDatafono :
    turnoOrigen.totalTransferencias;

  const handleTraslado = () => {
    if (!cajaDestinoId) {
      Swal.fire('Error', 'Debe seleccionar una caja destino', 'error');
      return;
    }
    if (monto === '' || monto <= 0) {
      Swal.fire('Error', 'El monto debe ser mayor a cero', 'error');
      return;
    }
    if (monto > saldoDisponible) {
      Swal.fire('Error', `Fondos insuficientes en ${metodoPago}`, 'error');
      return;
    }
    if (concepto.trim() === '') {
      Swal.fire('Error', 'Debe ingresar un concepto para el traslado', 'error');
      return;
    }

    Swal.fire({
      title: '¿Confirmar traslado?',
      text: `Se trasladarán $${Number(monto).toLocaleString()} a la caja seleccionada.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, trasladar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const resultado = cashService.trasladarDinero(
          turnoOrigen.id,
          cajaDestinoId,
          metodoPago,
          Number(monto),
          concepto,
          usuarioId
        );
        
        if (!resultado.error) {
          Swal.fire('¡Traslado Exitoso!', 'El traslado se realizó correctamente', 'success');
          onSuccess();
        } else {
          Swal.fire('Error', resultado.error, 'error');
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-2 md:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transition-all flex flex-col max-h-[90vh]">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 shrink-0">Traslado de Dinero</h2>
        
        <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-4">
          <div className="bg-blue-50 p-3 rounded border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>Saldo Disponible en {metodoPago}:</strong> ${saldoDisponible.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medio de Pago a Trasladar *</label>
            <select 
              data-testid="select-metodo-traslado"
              className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value as any)}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="DATAFONO">Datáfono</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caja Destino *</label>
            <select 
              data-testid="select-caja-destino"
              className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={cajaDestinoId}
              onChange={(e) => setCajaDestinoId(e.target.value)}
            >
              <option value="">-- Seleccione una caja destino --</option>
              {cajasDisponibles.map(caja => {
                const turnoDestinoActivo = cashService.getTurnoActivo(caja.id);
                return (
                  <option key={caja.id} value={caja.id} disabled={!turnoDestinoActivo}>
                    {caja.nombre} {turnoDestinoActivo ? '(Abierta)' : '(CERRADA - No recibe)'}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto a Trasladar *</label>
            <input 
              data-testid="input-monto-traslado"
              type="number" 
              className="w-full border rounded p-2 text-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              value={monto}
              onChange={(e) => setMonto(e.target.value !== '' ? Number(e.target.value) : '')}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
            <input 
              data-testid="input-concepto-traslado"
              type="text" 
              className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej: Remesa a caja fuerte principal..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            data-testid="btn-procesar-traslado"
            onClick={handleTraslado}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded font-medium transition-colors"
          >
            Procesar Traslado
          </button>
        </div>
      </div>
    </div>
  );
}
