import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  CreditCard,
  Banknote,
  Landmark,
  Calculator,
  AlertCircle,
  Phone,
  QrCode,
  CheckCircle,
  Coins,
} from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { Button } from '../../../components/ui/Button';
import Swal from 'sweetalert2';
import { usePOSPrinter } from '../../../hooks/usePOSPrinter';
import type { LineaVenta } from '../../../types/pos.types';
import type { ClientePOS } from '../../../hooks/usePOSCart';
import {
  calcularCambioEfectivo,
  BILLETES_RAPIDOS_SUGERIDOS,
} from '../../../../packages/validation-schemas/src/posCashEngine.schema';

export type MetodoCobroPos = 'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'QR_BANCOLOMBIA' | 'DATAFONO' | 'CREDITO';

export interface PaymentPanelProps {
  totalFinal: number;
  lineas: LineaVenta[];
  cliente: ClientePOS | null;
  stock: Record<string, Record<string, number>>;
  bodegaActivaId: string;
  bodegaActivaNombre: string;
  onGuardarBorrador: () => void;
  onPagar: (pagos: { metodo: MetodoCobroPos; monto: number }[]) => Promise<any> | void;
  onLimpiarCarrito: () => void;
  isDisabled: boolean;
  isTurnoAbierto: boolean;
  onAbrirTurnoRequest?: () => void;
  onRetiroParcialRequest?: () => void;
  saldoEfectivoGaveta?: number;
  topeMaximoGaveta?: number;
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
  onAbrirTurnoRequest,
  onRetiroParcialRequest,
  saldoEfectivoGaveta = 0,
  topeMaximoGaveta = 1500000,
}) => {
  const { imprimirTicket } = usePOSPrinter();
  const [metodoPago, setMetodoPago] = useState<MetodoCobroPos>('EFECTIVO');
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);

  const [isModoMixto, setIsModoMixto] = useState(false);
  const [pagosMixtos, setPagosMixtos] = useState<Record<MetodoCobroPos, number>>({
    EFECTIVO: 0,
    NEQUI: 0,
    DAVIPLATA: 0,
    QR_BANCOLOMBIA: 0,
    DATAFONO: 0,
    CREDITO: 0,
  });

  const efectivoInputRef = useRef<HTMLInputElement>(null);

  // Al cambiar totalFinal o método a EFECTIVO, sugerir monto exacto si está en cero
  useEffect(() => {
    if (metodoPago === 'EFECTIVO' && efectivoRecibido === 0 && totalFinal > 0) {
      setEfectivoRecibido(totalFinal);
    }
  }, [totalFinal, metodoPago]);

  const calculoCambio = calcularCambioEfectivo(totalFinal, efectivoRecibido);

  const totalPagosMixtos = Object.values(pagosMixtos).reduce((acc, v) => acc + (v || 0), 0);
  const faltantePagoMixto = Math.round((totalFinal - totalPagosMixtos) * 100) / 100;

  const handleUpdatePagoMixto = (metodo: MetodoCobroPos, value: number) => {
    setPagosMixtos((prev) => ({ ...prev, [metodo]: value }));
  };

  // Atajos de teclado físico
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el foco está en un textarea o modal abierto, ignorar
      if (['TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if ((e.key === 'Enter' || e.key === 'F4') && !e.shiftKey && !e.ctrlKey) {
        if (!isDisabled && isTurnoAbierto && totalFinal > 0) {
          e.preventDefault();
          handleCobrarClick();
        }
      } else if (e.code === 'Space' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault();
        setEfectivoRecibido(totalFinal);
      } else if (e.altKey && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const map: Record<string, MetodoCobroPos> = {
          '1': 'EFECTIVO',
          '2': 'NEQUI',
          '3': 'DAVIPLATA',
          '4': 'QR_BANCOLOMBIA',
          '5': 'DATAFONO',
          '6': 'CREDITO',
        };
        if (map[e.key]) setMetodoPago(map[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalFinal, efectivoRecibido, isTurnoAbierto, isDisabled, isModoMixto, pagosMixtos, metodoPago]);

  const handleCobrarClick = async () => {
    if (!isTurnoAbierto) {
      if (onAbrirTurnoRequest) onAbrirTurnoRequest();
      return;
    }

    if (totalFinal <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Cobro',
        text: 'El total final debe ser mayor a $0 para procesar el pago.',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    // RN-01: Validar stock suficiente
    let stockSuficiente = true;
    const itemsFaltantes: string[] = [];
    const targetWarehouseKey = stock[bodegaActivaId] ? bodegaActivaId : bodegaActivaNombre;

    lineas.forEach((item) => {
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
              ${itemsFaltantes.map((msg) => `<li style="margin-bottom: 6px;">${msg}</li>`).join('')}
            </ul>
          </div>
        `,
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    let pagosFinales: { metodo: MetodoCobroPos; monto: number }[] = [];

    if (isModoMixto) {
      if (faltantePagoMixto !== 0) {
        Swal.fire({
          icon: 'error',
          title: 'Error de Cuadre Mixto',
          text: `La suma de pagos debe coincidir exactamente con el total ($${totalFinal.toLocaleString('es-CO')}). ${
            faltantePagoMixto > 0
              ? `Faltan $${faltantePagoMixto.toLocaleString('es-CO')}`
              : `Sobran $${Math.abs(faltantePagoMixto).toLocaleString('es-CO')}`
          }`,
          background: '#0f172a',
          color: '#f8fafc',
        });
        return;
      }

      if (pagosMixtos.CREDITO > 0 && !cliente) {
        Swal.fire({
          icon: 'warning',
          title: 'Cliente Requerido',
          text: 'Debe vincular un cliente registrado para procesar la venta a crédito.',
          background: '#0f172a',
          color: '#f8fafc',
        });
        return;
      }

      pagosFinales = (Object.entries(pagosMixtos) as [MetodoCobroPos, number][])
        .filter(([, monto]) => monto > 0)
        .map(([metodo, monto]) => ({ metodo, monto }));
    } else {
      if (metodoPago === 'CREDITO' && !cliente) {
        Swal.fire({
          icon: 'warning',
          title: 'Cliente Requerido',
          text: 'Debe vincular un cliente registrado para procesar una venta a crédito.',
          background: '#0f172a',
          color: '#f8fafc',
        });
        return;
      }

      if (metodoPago === 'EFECTIVO' && !calculoCambio.valido) {
        Swal.fire({
          icon: 'warning',
          title: 'Efectivo Insuficiente',
          text: `El efectivo recibido ($${efectivoRecibido.toLocaleString('es-CO')}) es menor al total a cobrar ($${totalFinal.toLocaleString('es-CO')}). Faltan $${calculoCambio.faltante.toLocaleString('es-CO')}.`,
          background: '#0f172a',
          color: '#f8fafc',
        });
        return;
      }

      pagosFinales = [{ metodo: metodoPago, monto: totalFinal }];
    }

    try {
      const ventaProcesada = await onPagar(pagosFinales);
      if (ventaProcesada) {
        await imprimirTicket(ventaProcesada, cliente);
        onLimpiarCarrito();
        setEfectivoRecibido(0);
      }
    } catch (err) {
      console.error('Error durante el cobro:', err);
    }
  };

  const superaTopeGaveta = saldoEfectivoGaveta >= topeMaximoGaveta;

  return (
    <div className="flex flex-col gap-3 mt-3">
      {/* Alerta Preventiva de Tope de Gaveta */}
      {superaTopeGaveta && onRetiroParcialRequest && (
        <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-pulse">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-amber-300">
              Efectivo en gaveta: <b>${saldoEfectivoGaveta.toLocaleString('es-CO')}</b> (Tope: ${topeMaximoGaveta.toLocaleString('es-CO')})
            </span>
          </div>
          <button
            onClick={onRetiroParcialRequest}
            className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-colors"
          >
            Alivio de Caja
          </button>
        </div>
      )}

      {/* Selector de Modo: Único vs Mixto */}
      <div className="flex justify-between items-center px-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <span>Medio de Pago</span>
          <kbd className="hidden sm:inline-block px-1 py-0.2 bg-slate-100 border border-slate-300 text-[9px] rounded text-slate-600 font-mono font-bold">F1-F6</kbd>
        </label>
        <button
          onClick={() => {
            setIsModoMixto(!isModoMixto);
            if (!isModoMixto) {
              setPagosMixtos({
                EFECTIVO: 0,
                NEQUI: 0,
                DAVIPLATA: 0,
                QR_BANCOLOMBIA: 0,
                DATAFONO: 0,
                CREDITO: 0,
              });
            }
          }}
          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
            isModoMixto
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-300 shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-sm'
          }`}
          disabled={isDisabled}
        >
          <Calculator size={13} />
          {isModoMixto ? 'Cobro Único' : '+ Split'}
        </button>
      </div>

      {!isModoMixto ? (
        <>
          {/* Fila Horizontal Compacta de Medios de Pago (Estilo Tabs / Pills AntD) */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
            {[
              { id: 'EFECTIVO' as const, label: 'Efectivo', icon: Banknote, keyNum: '1' },
              { id: 'NEQUI' as const, label: 'Nequi', icon: Phone, keyNum: '2' },
              { id: 'DAVIPLATA' as const, label: 'Daviplata', icon: Phone, keyNum: '3' },
              { id: 'QR_BANCOLOMBIA' as const, label: 'QR Banc.', icon: QrCode, keyNum: '4' },
              { id: 'DATAFONO' as const, label: 'Datáfono', icon: CreditCard, keyNum: '5' },
              { id: 'CREDITO' as const, label: 'Crédito', icon: Landmark, keyNum: '6' },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = metodoPago === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMetodoPago(m.id)}
                  title={`Seleccionar ${m.label} (Alt+${m.keyNum})`}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-2 rounded-lg border text-center transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-400 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold'
                  }`}
                >
                  <Icon size={14} className={isSelected ? 'text-indigo-600 shrink-0' : 'text-slate-500 shrink-0'} />
                  <span className="text-[11px] font-bold truncate leading-tight">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Panel de Efectivo y Cambio Compacto para Laptops */}
          {metodoPago === 'EFECTIVO' && (
            <div className="flex flex-col gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Efectivo Recibido
                </span>
                <span className="text-[11px] text-slate-600 font-medium">
                  Cobro: <b className="text-slate-900 font-black">${totalFinal.toLocaleString('es-CO')}</b>
                </span>
              </div>

              {/* Input de Efectivo + Botón Exacto en Línea */}
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <NumericFormat
                    getInputRef={efectivoInputRef}
                    value={efectivoRecibido || ''}
                    onValueChange={(values) => setEfectivoRecibido(values.floatValue || 0)}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    allowNegative={false}
                    prefix="$ "
                    placeholder="$ 0"
                    className="w-full h-10 px-3 rounded-lg border-2 border-slate-300 bg-white text-lg font-black text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all tabular-nums shadow-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setEfectivoRecibido(totalFinal)}
                  className="px-3 h-10 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Pagar con monto exacto (Espacio)"
                >
                  <span>Exacto</span>
                  <kbd className="px-1 py-0.2 bg-white border border-indigo-200 rounded text-[9px] font-mono text-indigo-700 font-bold">Space</kbd>
                </button>
              </div>

              {/* Botones de Denominación Rápida Compactos */}
              <div className="grid grid-cols-4 gap-1">
                {BILLETES_RAPIDOS_SUGERIDOS.map((denom) => (
                  <button
                    key={denom}
                    type="button"
                    onClick={() => setEfectivoRecibido(denom)}
                    className="py-1.5 px-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 transition-colors tabular-nums text-center shadow-sm cursor-pointer"
                  >
                    ${(denom / 1000).toLocaleString('es-CO')}k
                  </button>
                ))}
              </div>

              {/* Visor de Cambio (Vuelto) Compacto en 1 sola franja horizontal */}
              <div
                className={`py-1.5 px-3 rounded-lg border flex items-center justify-between transition-all ${
                  calculoCambio.valido && calculoCambio.cambio > 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-sm'
                    : calculoCambio.valido && calculoCambio.cambio === 0
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-bold shadow-sm'
                    : 'bg-rose-50 border-rose-300 text-rose-800 font-bold shadow-sm'
                }`}
              >
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {calculoCambio.valido
                    ? calculoCambio.cambio === 0
                      ? '✓ Pago Exacto'
                      : 'Cambio / Vuelto:'
                    : '⚠ Faltante:'}
                </span>
                <span
                  className="text-lg font-black tracking-tight tabular-nums"
                >
                  ${(calculoCambio.valido ? calculoCambio.cambio : calculoCambio.faltante).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Modo Mixto / Split Payment */
        <div className="flex flex-col gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-600">
              Total venta: <b className="text-slate-900 font-extrabold">${totalFinal.toLocaleString('es-CO')}</b>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                faltantePagoMixto === 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : faltantePagoMixto > 0
                  ? 'bg-amber-50 text-amber-700 border border-amber-300'
                  : 'bg-rose-50 text-rose-700 border border-rose-300'
              }`}
            >
              {faltantePagoMixto === 0
                ? '✓ Cuadrado Exacto'
                : faltantePagoMixto > 0
                ? `Faltan: $${faltantePagoMixto.toLocaleString('es-CO')}`
                : `Sobran: $${Math.abs(faltantePagoMixto).toLocaleString('es-CO')}`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'EFECTIVO' as const, label: 'Efectivo', icon: Banknote },
              { id: 'NEQUI' as const, label: 'Nequi', icon: Phone },
              { id: 'DAVIPLATA' as const, label: 'Daviplata', icon: Phone },
              { id: 'QR_BANCOLOMBIA' as const, label: 'QR Bancolombia', icon: QrCode },
              { id: 'DATAFONO' as const, label: 'Datáfono', icon: CreditCard },
              { id: 'CREDITO' as const, label: 'Crédito', icon: Landmark },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.id} className="flex flex-col gap-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase">
                    <Icon size={12} className="text-indigo-600" /> {m.label}
                  </label>
                  <NumericFormat
                    value={pagosMixtos[m.id] || ''}
                    onValueChange={(values) => handleUpdatePagoMixto(m.id, values.floatValue || 0)}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    allowNegative={false}
                    prefix="$ "
                    placeholder="$ 0"
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:border-indigo-600 outline-none tabular-nums shadow-sm"
                    disabled={isDisabled}
                  />
                </div>
              );
            })}
          </div>

          {pagosMixtos.CREDITO > 0 && !cliente && (
            <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
              <AlertCircle size={14} className="shrink-0" />
              <span>Debe asignar un cliente para procesar la porción a crédito.</span>
            </div>
          )}
        </div>
      )}

      {/* Botones de Acción Compactos con Hints de Atajos */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onGuardarBorrador}
          disabled={isDisabled}
          leftIcon={<Save size={16} />}
          className="flex-1 h-11 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          title="Guardar pedido como borrador / en espera (Atajo: F6)"
          aria-label="Poner pedido actual en espera (Atajo F6)"
        >
          <span>Borrador</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-600 font-bold">F6</kbd>
        </Button>

        {!isTurnoAbierto ? (
          <Button
            variant="primary"
            onClick={handleCobrarClick}
            className="flex-[2] h-11 text-sm font-black bg-amber-500 hover:bg-amber-600 text-slate-950 border-0 flex items-center justify-center gap-1.5 shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            title="Abrir turno de caja (Atajo: Enter)"
            aria-label="Abrir turno de caja (Atajo Enter)"
          >
            <span>Abrir Turno Caja</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-black/20 rounded text-slate-950 font-bold">Enter</kbd>
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleCobrarClick}
            disabled={isDisabled || (metodoPago === 'EFECTIVO' && !isModoMixto && !calculoCambio.valido)}
            className="flex-[2] h-11 text-sm font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md text-white flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            data-testid="btn-cobrar"
            title="Procesar cobro del pedido (Atajo: F2 o Enter)"
            aria-label={`Cobrar pedido por valor de ${totalFinal.toLocaleString('es-CO')} pesos (Atajo F2 o Enter)`}
          >
            <span>Cobrar: ${totalFinal.toLocaleString('es-CO')}</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-black/30 rounded text-white font-bold">F2 / ↵</kbd>
          </Button>
        )}
      </div>
    </div>
  );
};

