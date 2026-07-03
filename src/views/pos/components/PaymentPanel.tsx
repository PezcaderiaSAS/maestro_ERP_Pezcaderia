import React, { useState } from 'react';
import { Save, CreditCard, Banknote, Landmark, Unlock, Lock, Calculator, AlertCircle, Phone } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import Swal from 'sweetalert2';
import { usePOSPrinter } from '../../../hooks/usePOSPrinter';
import type { LineaVenta } from '../../../types/pos.types';
import type { ClientePOS } from '../../../hooks/usePOSCart';

export interface PaymentPanelProps {
  totalFinal: number;
  lineas: LineaVenta[];
  cliente: ClientePOS | null;
  stock: Record<string, Record<string, number>>;
  bodegaActivaId: string;
  bodegaActivaNombre: string;
  onGuardarBorrador: () => void;
  onPagar: (pagos: { metodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'DATAFONO' | 'CREDITO'; monto: number }[]) => Promise<any> | void;
  onLimpiarCarrito: () => void;
  isDisabled: boolean;
  isTurnoAbierto: boolean;
  onAbrirTurnoRequest?: () => void;
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({
  totalFinal,
  lineas,
  cliente,
  stock,
  bodegaActivaId,
  bodegaActivaNombre,
  onGuardarBorrador,
  onPagar,
  onLimpiarCarrito,
  isDisabled,
  isTurnoAbierto,
  onAbrirTurnoRequest
}) => {
  const { imprimirTicket } = usePOSPrinter();
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'DATAFONO' | 'CREDITO'>('EFECTIVO');
  
  const [isModoMixto, setIsModoMixto] = useState(false);
  const [pagosMixtos, setPagosMixtos] = useState({
    EFECTIVO: 0,
    TRANSFERENCIA: 0,
    DATAFONO: 0,
    CREDITO: 0
  });

  const totalPagosMixtos = pagosMixtos.EFECTIVO + pagosMixtos.TRANSFERENCIA + pagosMixtos.DATAFONO + pagosMixtos.CREDITO;
  const faltantePagoMixto = totalFinal - totalPagosMixtos;

  const handleUpdatePagoMixto = (metodo: keyof typeof pagosMixtos, value: number) => {
    setPagosMixtos(prev => ({ ...prev, [metodo]: value }));
  };

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
    
    // Usar nombre de bodega si el ID no existe en el registro de stock (legacy fallback)
    const targetWarehouseKey = stock[bodegaActivaId] ? bodegaActivaId : bodegaActivaNombre;

    lineas.forEach(item => {
      const stockDisponible = stock[targetWarehouseKey]?.[item.sku] || 0;
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
            <p>No se puede liquidar la venta porque el stock en <strong>${bodegaActivaNombre}</strong> es insuficiente:</p>
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

    let pagosFinales: { metodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'DATAFONO' | 'CREDITO'; monto: number }[] = [];

    if (isModoMixto) {
      if (faltantePagoMixto !== 0) {
        Swal.fire({
          icon: 'error',
          title: 'Error de Cuadre',
          text: `La suma de pagos debe coincidir exactamente con el total ($${totalFinal.toLocaleString('es-CO')}). ${faltantePagoMixto > 0 ? `Faltan $${faltantePagoMixto.toLocaleString('es-CO')}` : `Sobran $${Math.abs(faltantePagoMixto).toLocaleString('es-CO')}`}`,
          confirmButtonColor: 'var(--primary-color)'
        });
        return;
      }
      
      if (pagosMixtos.CREDITO > 0 && !cliente) {
        Swal.fire({
          icon: 'warning',
          title: 'Cliente Requerido',
          text: 'Debe vincular un cliente registrado para poder procesar la porción a crédito.',
          confirmButtonColor: 'var(--primary-color)'
        });
        return;
      }

      pagosFinales = (Object.entries(pagosMixtos) as ['EFECTIVO' | 'TRANSFERENCIA' | 'DATAFONO' | 'CREDITO', number][])
        .filter(([, monto]) => monto > 0)
        .map(([metodo, monto]) => ({ metodo, monto }));
        
    } else {
      if (metodoPago === 'CREDITO' && !cliente) {
        Swal.fire({
          icon: 'warning',
          title: 'Cliente Requerido',
          text: 'Debe vincular un cliente registrado para poder procesar una venta a crédito.',
          confirmButtonColor: 'var(--primary-color)'
        });
        return;
      }
      pagosFinales = [{ metodo: metodoPago, monto: totalFinal }];
    }

    if (pagosFinales.some(p => p.metodo === 'EFECTIVO' || p.metodo === 'TRANSFERENCIA')) {
      console.log('RN-12: Enviando comando ESC/POS para abrir gaveta de dinero...');
    }

    try {
      const ventaProcesada = await onPagar(pagosFinales);
      
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
      <div className="relative flex flex-col gap-4 mt-4 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl items-center justify-center text-center shadow-xl overflow-hidden group">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner mb-1">
          <Lock size={32} className="text-blue-400 drop-shadow-md" />
        </div>
        
        <div className="relative z-10 mb-2">
          <h4 className="font-extrabold text-white text-xl tracking-tight mb-1">Caja Cerrada</h4>
          <p className="text-sm text-slate-300 font-medium max-w-[220px] mx-auto leading-tight">
            El flujo de ventas está pausado. Abra un turno para reanudar.
          </p>
        </div>

        <button 
          type="button"
          onClick={onAbrirTurnoRequest}
          data-testid="btn-abrir-turno"
          className="relative z-10 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] transition-all duration-300 active:scale-[0.98] border border-blue-400/30"
        >
          <Unlock size={20} />
          Abrir Turno de Caja
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 mt-4">
      {/* Toggle Modo Mixto */}
      <div className="flex justify-between items-center px-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Método de Pago
        </label>
        <button
          onClick={() => {
            setIsModoMixto(!isModoMixto);
            if (!isModoMixto) {
              setPagosMixtos({ EFECTIVO: 0, TRANSFERENCIA: 0, DATAFONO: 0, CREDITO: 0 });
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            isModoMixto 
              ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
          disabled={isDisabled}
        >
          <Calculator size={14} />
          {isModoMixto ? 'Volver a Único' : '+ Pago Mixto'}
        </button>
      </div>

      {!isModoMixto ? (
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setMetodoPago('EFECTIVO')}
            disabled={isDisabled}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all min-h-[4rem] ${
              metodoPago === 'EFECTIVO' 
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Banknote size={20} className="mb-1" />
            <span className="text-[10px] font-bold uppercase text-center leading-tight">Efectivo</span>
          </button>
          <button
            onClick={() => setMetodoPago('TRANSFERENCIA')}
            disabled={isDisabled}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all min-h-[4rem] ${
              metodoPago === 'TRANSFERENCIA' 
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Landmark size={20} className="mb-1" />
            <span className="text-[10px] font-bold uppercase text-center leading-tight">Transf.</span>
          </button>
          <button
            onClick={() => setMetodoPago('DATAFONO')}
            disabled={isDisabled}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all min-h-[4rem] ${
              metodoPago === 'DATAFONO' 
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Phone size={20} className="mb-1" />
            <span className="text-[10px] font-bold uppercase text-center leading-tight">Datáfono</span>
          </button>
          <button
            onClick={() => setMetodoPago('CREDITO')}
            disabled={isDisabled}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all min-h-[4rem] ${
              metodoPago === 'CREDITO' 
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <CreditCard size={20} className="mb-1" />
            <span className="text-[10px] font-bold uppercase text-center leading-tight">Crédito</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex justify-between items-center text-xs font-bold mb-1">
            <span className="text-slate-600">
              Total a repartir: <span className="text-blue-700">${totalFinal.toLocaleString('es-CO')}</span>
            </span>
            <span className={faltantePagoMixto === 0 ? 'text-green-600' : faltantePagoMixto < 0 ? 'text-red-600' : 'text-amber-600'}>
              {faltantePagoMixto === 0 ? (
                <span className="flex items-center gap-1">✓ Cuadrado</span>
              ) : faltantePagoMixto > 0 ? (
                `Faltan: $${faltantePagoMixto.toLocaleString('es-CO')}`
              ) : (
                `Sobran: $${Math.abs(faltantePagoMixto).toLocaleString('es-CO')}`
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'EFECTIVO', icon: Banknote, label: 'Efectivo' },
              { id: 'TRANSFERENCIA', icon: Landmark, label: 'Transf.' },
              { id: 'DATAFONO', icon: Phone, label: 'Datáfono' },
              { id: 'CREDITO', icon: CreditCard, label: 'Crédito' }
            ].map(metodo => (
              <div key={metodo.id} className="flex flex-col gap-1">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase">
                  <metodo.icon size={12} /> {metodo.label}
                </label>
                <NumericFormat
                  value={pagosMixtos[metodo.id as keyof typeof pagosMixtos] || ''}
                  onValueChange={(values) => handleUpdatePagoMixto(metodo.id as keyof typeof pagosMixtos, values.floatValue || 0)}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={0}
                  allowNegative={false}
                  prefix="$ "
                  placeholder="$ 0"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white focus:border-blue-400 text-sm font-bold text-slate-800 outline-none transition-colors"
                  disabled={isDisabled}
                />
              </div>
            ))}
          </div>
          
          {pagosMixtos.CREDITO > 0 && !cliente && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-medium">
              <AlertCircle size={14} className="shrink-0" />
              <span>Debe asignar un cliente para fiar (Crédito).</span>
            </div>
          )}
        </div>
      )}

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
          data-testid="btn-cobrar"
        >
          <span>Cobrar: ${totalFinal.toLocaleString('es-CO')}</span>
        </button>
      </div>
    </div>
  );
};
