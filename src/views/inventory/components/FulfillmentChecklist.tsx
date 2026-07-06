import React, { useState } from 'react';
import { Pedido, LineaPedido } from '../../../types/orders.types';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { CheckCircle2, Circle, Scale, AlertTriangle, PackageCheck } from 'lucide-react';
import { WeighingModal } from './WeighingModal';
import { QuantityModal } from './QuantityModal';
import { useOrderStore } from '../../../store/useOrderStore';
import Swal from 'sweetalert2';

interface FulfillmentChecklistProps {
  pedido: Pedido;
  onComplete: () => void;
  onCancel: () => void;
}

export const FulfillmentChecklist: React.FC<FulfillmentChecklistProps> = ({
  pedido,
  onComplete,
  onCancel
}) => {
  const { getProductoById } = useInventoryStore();
  const { updateVenta } = useOrderStore();
  
  // Local state to track fulfillment progress before saving
  const [lineasAlistadas, setLineasAlistadas] = useState<LineaPedido[]>(pedido.lineas);
  const [weighingModalOpen, setWeighingModalOpen] = useState(false);
  const [quantityModalOpen, setQuantityModalOpen] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);

  const handleToggleCheck = (index: number) => {
    const linea = lineasAlistadas[index];
    const producto = getProductoById(linea.productoId);
    
    if (!producto) return;

    if (producto.unidadMedida?.toUpperCase() === 'KG') {
      // Necesita pesaje
      setSelectedLineIndex(index);
      setWeighingModalOpen(true);
    } else {
      // Abrir modal de cantidad para permitir despacho parcial
      setSelectedLineIndex(index);
      setQuantityModalOpen(true);
    }
  };

  const handleConfirmWeight = (pesoReal: number, loteSeleccionado?: string) => {
    if (selectedLineIndex !== null) {
      const newLineas = [...lineasAlistadas];
      const linea = newLineas[selectedLineIndex];
      
      // Update line with real weight and complete it
      newLineas[selectedLineIndex] = {
        ...linea,
        cantidadAlistada: linea.cantidadSolicitada, // Asumimos que pesó la cantidad solicitada (cajas/unidades estimadas) o simplemente marcamos completo
        pesoReal: pesoReal,
        loteSeleccionado: loteSeleccionado,
        // El precio y total se recalcularán a nivel de servidor o en el checkout final, pero podemos estimarlo:
        totalLinea: pesoReal * linea.precioPactado,
        estadoLinea: 'COMPLETO'
      };
      
      setLineasAlistadas(newLineas);
    }
    setWeighingModalOpen(false);
    setSelectedLineIndex(null);
  };

  const handleConfirmQuantity = (cantidadReal: number, loteSeleccionado?: string) => {
    if (selectedLineIndex !== null) {
      const newLineas = [...lineasAlistadas];
      const linea = newLineas[selectedLineIndex];
      
      let estadoLinea: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO' = 'PENDIENTE';
      if (cantidadReal > 0) {
        estadoLinea = cantidadReal < linea.cantidadSolicitada ? 'PARCIAL' : 'COMPLETO';
      }

      newLineas[selectedLineIndex] = {
        ...linea,
        cantidadAlistada: cantidadReal,
        loteSeleccionado: loteSeleccionado,
        totalLinea: cantidadReal * linea.precioPactado,
        estadoLinea
      };
      
      setLineasAlistadas(newLineas);
    }
    setQuantityModalOpen(false);
    setSelectedLineIndex(null);
  };

  const isAllCompleted = lineasAlistadas.every(l => l.cantidadAlistada > 0);

  const handleFinishFulfillment = () => {
    if (!isAllCompleted) {
      Swal.fire({
        icon: 'warning',
        title: 'Alistamiento Incompleto',
        text: 'Aún hay productos pendientes por alistar. ¿Deseas pausar el alistamiento o continuar?',
        showCancelButton: true,
        confirmButtonText: 'Continuar Alistando',
        cancelButtonText: 'Pausar',
      }).then((result) => {
        if (!result.isConfirmed) {
          saveProgress('CREADO');
        }
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'Alistamiento Completo',
      text: 'Todos los productos han sido verificados. El pedido pasará a estado LISTO.',
      showCancelButton: true,
      confirmButtonText: 'Confirmar y Finalizar',
      cancelButtonText: 'Revisar',
      confirmButtonColor: '#10B981'
    }).then((result) => {
      if (result.isConfirmed) {
        saveProgress('LISTO');
      }
    });
  };

  const saveProgress = (nuevoEstado: Pedido['estado']) => {
    // Recalcular el subtotal con los nuevos totales de línea (por pesos reales)
    const nuevoSubtotal = lineasAlistadas.reduce((acc, curr) => acc + curr.totalLinea, 0);
    const nuevoDescuento = (nuevoSubtotal * pedido.descuentoGlobalPct) / 100;
    const nuevoTotal = nuevoSubtotal - nuevoDescuento;

    const pedidoActualizado: Pedido = {
      ...pedido,
      lineas: lineasAlistadas,
      estado: nuevoEstado,
      subtotal: nuevoSubtotal,
      descuentoGlobalValor: nuevoDescuento,
      totalFinal: nuevoTotal
    };

    updateVenta(pedido.id, pedidoActualizado);
    onComplete();
  };

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-full max-h-[800px]">
      <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PackageCheck className="text-blue-400 w-6 h-6" />
            Checklist de Alistamiento
          </h2>
          <p className="text-slate-400 text-sm mt-1">Pedido #{pedido.numeroPedido}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-400">Progreso</p>
          <p className="text-2xl font-bold text-emerald-400">
            {lineasAlistadas.filter(l => l.cantidadAlistada > 0).length} / {lineasAlistadas.length}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {lineasAlistadas.map((linea, index) => {
          const producto = getProductoById(linea.productoId);
          if (!producto) return null;

          const isByWeight = producto.unidadMedida?.toUpperCase() === 'KG';
          const isCompleted = linea.cantidadAlistada > 0;
          const isPriorityA = producto.categoriaABC === 'A';
          const isPartial = isCompleted && linea.cantidadAlistada < linea.cantidadSolicitada;

          return (
            <div 
              key={linea.productoId}
              onClick={() => handleToggleCheck(index)}
              className={`relative p-4 rounded-xl border transition-all cursor-pointer group flex items-center gap-4
                ${isCompleted 
                  ? (isPartial ? 'bg-amber-900/20 border-amber-500/30' : 'bg-emerald-900/20 border-emerald-500/30') 
                  : isPriorityA 
                    ? 'bg-amber-900/10 border-amber-500/30 hover:border-amber-400'
                    : 'bg-slate-900 border-slate-700 hover:border-blue-500/50'}`}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  isPartial ? (
                    <CheckCircle2 className="w-8 h-8 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  )
                ) : (
                  <Circle className={`w-8 h-8 ${isPriorityA ? 'text-amber-500/50' : 'text-slate-600'} group-hover:text-blue-400 transition-colors`} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold truncate ${isCompleted ? (isPartial ? 'text-amber-100' : 'text-emerald-100') : 'text-white'}`}>
                    {producto.nombre}
                  </h3>
                  {isPriorityA && !isCompleted && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Prioridad A
                    </span>
                  )}
                  {isPartial && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 flex items-center gap-1">
                      PARCIAL
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm">
                  <span className="text-slate-400">SKU: {producto.sku}</span>
                  <span className="font-medium text-blue-400">
                    Solicitado: {linea.cantidadSolicitada} {producto.unidadMedida}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                {isByWeight ? (
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Scale className="w-3 h-3" />
                      Requiere Pesaje
                    </span>
                    {isCompleted && linea.pesoReal && (
                      <span className="text-lg font-bold text-emerald-400">
                        {linea.pesoReal} KG
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    {isCompleted && (
                      <span className={`text-lg font-bold ${isPartial ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {linea.cantidadAlistada} / {linea.cantidadSolicitada}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 border-t border-slate-700 bg-slate-900 flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-slate-600"
        >
          Guardar Progreso
        </button>
        <button
          onClick={handleFinishFulfillment}
          className={`flex-[2] px-6 py-3 rounded-xl font-bold transition-all shadow-lg
            ${isAllCompleted 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/20' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}
        >
          {isAllCompleted ? 'Finalizar Alistamiento' : 'Completar Alistamiento'}
        </button>
      </div>

      {selectedLineIndex !== null && (
        <>
          <WeighingModal
            isOpen={weighingModalOpen}
            onClose={() => {
              setWeighingModalOpen(false);
              setSelectedLineIndex(null);
            }}
            linea={lineasAlistadas[selectedLineIndex]}
            producto={getProductoById(lineasAlistadas[selectedLineIndex].productoId) as any}
            onConfirm={handleConfirmWeight}
          />
          <QuantityModal
            isOpen={quantityModalOpen}
            onClose={() => {
              setQuantityModalOpen(false);
              setSelectedLineIndex(null);
            }}
            linea={lineasAlistadas[selectedLineIndex]}
            producto={getProductoById(lineasAlistadas[selectedLineIndex].productoId) as any}
            onConfirm={handleConfirmQuantity}
          />
        </>
      )}
    </div>
  );
};
