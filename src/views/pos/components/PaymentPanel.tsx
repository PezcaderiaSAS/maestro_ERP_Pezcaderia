import React, { useState } from 'react';
import { Save, CreditCard, Banknote, Landmark, Unlock } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePOSPrinter } from '../../../hooks/usePOSPrinter';
import type { LineaVenta } from '../../../types/pos.types';
import type { ClientePOS } from '../../../hooks/usePOSCart';

export interface PaymentPanelProps {
  totalFinal: number;
  lineas: LineaVenta[];
  cliente: ClientePOS | null;
  stock: Record<string, any[]>;
  onGuardarBorrador: () => void;
  onPagar: (metodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO') => Promise<any> | void;
  onLimpiarCarrito: () => void;
  isDisabled: boolean;
  isTurnoAbierto: boolean;
  onAbrirTurnoClick: () => void;
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({
  totalFinal,
  lineas,
  cliente,
  stock,
  onGuardarBorrador,
  onPagar,
  onLimpiarCarrito,
  isDisabled,
  isTurnoAbierto,
  onAbrirTurnoClick
}) => {
  const { imprimirTicket } = usePOSPrinter();
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO'>('EFECTIVO');

  const handleCobrarClick = async () => {
    // RN-06: Validar totalFinal mayor a 0
    if (totalFinal <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Cobro',
        text: 'El total final debe ser mayor a $0 para procesar el pago.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    // RN-01: Validar stock suficiente
    let stockSuficiente = true;
    const itemsFaltantes: string[] = [];
    lineas.forEach(item => {
      const stockDisponible = stock['Bodega Principal']?.find(s => s.sku === item.sku)?.stock || 0;
      if (stockDisponible < item.cantidad) {
        stockSuficiente = false;
        itemsFaltantes.push(`• ${item.nombre} (Solicitado: ${item.cantidad}, Disp: ${stockDisponible})`);
      }
    });

    if (!stockSuficiente) {
      Swal.fire({
        icon: 'error',
        title: 'Venta Bloqueada: Stock Insuficiente',
        html: `
          <div style="text-align: left; font-size: 14px;">
            <p>No se puede liquidar la venta porque el stock en <strong>Bodega Principal</strong> es insuficiente:</p>
            <ul style="color: #EF4444; font-weight: 600; list-style-type: none; padding-left: 0;">
              ${itemsFaltantes.map(msg => `<li style="margin-bottom: 6px;">${msg}</li>`).join('')}
            </ul>
            <p style="margin-top: 12px; font-size: 13px; color: #64748B;">Ajuste las cantidades en el carrito antes de reintentar.</p>
          </div>
        `,
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    // Validación extra para Crédito
    if (metodoPago === 'CREDITO' && !cliente) {
      Swal.fire({
        icon: 'warning',
        title: 'Cliente Requerido',
        text: 'Debe vincular un cliente registrado para poder procesar una venta a crédito.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    // RN-12: Comando de apertura de gaveta de dinero
    if (metodoPago === 'EFECTIVO' || metodoPago === 'TRANSFERENCIA') {
      console.log('RN-12: Enviando comando ESC/POS para abrir gaveta de dinero...');
      // Aquí se invocaría el driver o API real de la gaveta de dinero conectada.
    }

    try {
      // Ejecutamos la lógica de pago principal en el orquestador (POSView)
      // Nota: Asumimos que la refactorización de onPagar devolverá una promesa con la venta procesada
      const ventaProcesada = await onPagar(metodoPago);
      
      // Si onPagar devuelve la venta (en el futuro de la Fase 4), imprimimos el ticket y limpiamos el carrito
      if (ventaProcesada) {
        await imprimirTicket(ventaProcesada, cliente);
        onLimpiarCarrito();
      }
    } catch (err) {
      console.error('Error durante el cobro:', err);
      // El error probablemente ya fue manejado por el orquestador
    }
  };

  if (!isTurnoAbierto) {
    return (
      <div className="flex flex-col gap-3 mt-4 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl items-center justify-center text-center">
        <div className="bg-white p-3 rounded-full shadow-sm mb-2">
          <Unlock size={32} className="text-slate-400" />
        </div>
        <h4 className="font-bold text-slate-700 text-lg">Caja Cerrada</h4>
        <p className="text-sm text-slate-500 mb-2">Debe abrir un turno de caja para procesar cobros en el POS.</p>
        <button 
          onClick={onAbrirTurnoClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
        >
          Abrir Turno de Caja
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 mt-4">
      {/* Selector de Método de Pago Táctil (Mobile-First) */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setMetodoPago('EFECTIVO')}
          disabled={isDisabled}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-h-[4rem] ${
            metodoPago === 'EFECTIVO' 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Banknote size={24} className="mb-1" />
          <span className="text-xs font-bold uppercase">Efectivo</span>
        </button>
        <button
          onClick={() => setMetodoPago('TRANSFERENCIA')}
          disabled={isDisabled}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-h-[4rem] ${
            metodoPago === 'TRANSFERENCIA' 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Landmark size={24} className="mb-1" />
          <span className="text-xs font-bold uppercase">Transf.</span>
        </button>
        <button
          onClick={() => setMetodoPago('CREDITO')}
          disabled={isDisabled}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-h-[4rem] ${
            metodoPago === 'CREDITO' 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <CreditCard size={24} className="mb-1" />
          <span className="text-xs font-bold uppercase">Crédito</span>
        </button>
      </div>

      {/* Botones de Acción Principales */}
      <div className="flex gap-2">
        <button 
          className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 font-bold rounded-xl border border-slate-300 min-h-[3.5rem] active:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onGuardarBorrador}
          disabled={isDisabled}
        >
          <Save size={20} />
          <span>Borrador</span>
        </button>
        <button 
          className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 text-white font-bold rounded-xl min-h-[3.5rem] active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-lg"
          onClick={handleCobrarClick}
          disabled={isDisabled}
        >
          <span>Cobrar: ${totalFinal.toLocaleString('es-CO')}</span>
        </button>
      </div>
    </div>
  );
};
